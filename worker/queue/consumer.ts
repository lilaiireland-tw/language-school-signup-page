import {
  claimIntegrationJob,
  completeIntegrationJob,
  failIntegrationJob,
  getApplication,
  getRunnableIntegrationJobs,
  listDueIntegrationApplicationIds,
  recoverStaleIntegrationJobs,
} from "../repositories/application-repository";
import type { IntegrationJobRow, IntegrationQueueMessage } from "../shared/types";
import { IntegrationError, sanitizedError } from "./integration-error";
import { sendApplicationEmail } from "../gmail/send";
import { syncApplicationToNotion } from "./notion";
import { retryDelaySeconds } from "./retry";

const MAX_ATTEMPTS = 5;

function validMessage(value: unknown): value is IntegrationQueueMessage {
  return typeof value === "object" && value !== null && "applicationId" in value
    && typeof (value as { applicationId?: unknown }).applicationId === "string"
    && /^[0-9a-f-]{36}$/i.test((value as { applicationId: string }).applicationId);
}

async function processJob(job: IntegrationJobRow, env: Cloudflare.Env): Promise<void> {
  const claimedAt = new Date().toISOString();
  if (!await claimIntegrationJob(env.DB, job.id, claimedAt)) return;
  const application = await getApplication(env.DB, job.application_id);
  if (!application) {
    await failIntegrationJob(env.DB, job.id, claimedAt, "Application record not found", null, true);
    return;
  }
  try {
    if (job.job_type === "notion_sync") {
      const notionPageId = await syncApplicationToNotion(application, env);
      await completeIntegrationJob(env.DB, job.id, new Date().toISOString(), { notionPageId });
    } else {
      console.log(JSON.stringify({
        event: "email_send_started",
        submissionId: application.reference_code,
        applicationId: application.id,
        jobId: job.id,
        jobType: job.job_type,
        attempt: job.attempts + 1,
      }));
      const providerMessageId = await sendApplicationEmail(application, job.job_type, env);
      await completeIntegrationJob(env.DB, job.id, new Date().toISOString(), { providerMessageId });
      console.log(JSON.stringify({
        event: "email_send_accepted",
        submissionId: application.reference_code,
        applicationId: application.id,
        jobId: job.id,
        jobType: job.job_type,
        attempt: job.attempts + 1,
        gmailMessageId: providerMessageId,
      }));
    }
  } catch (error) {
    const retryable = error instanceof IntegrationError ? error.retryable : true;
    const attempts = job.attempts + 1;
    const deadLetter = !retryable || attempts >= MAX_ATTEMPTS;
    const delay = retryDelaySeconds(attempts);
    const retryAt = deadLetter ? null : new Date(Date.now() + delay * 1000).toISOString();
    await failIntegrationJob(env.DB, job.id, new Date().toISOString(), sanitizedError(error), retryAt, deadLetter);
    if (job.job_type === "student_email" || job.job_type === "internal_email") {
      const integrationError = error instanceof IntegrationError ? error : null;
      console.error(JSON.stringify({
        event: "email_send_failed",
        submissionId: application.reference_code,
        applicationId: application.id,
        jobId: job.id,
        jobType: job.job_type,
        attempt: attempts,
        errorCode: integrationError?.code ?? "unhandled_error",
        httpStatus: integrationError?.httpStatus ?? null,
        retryable,
        deadLetter,
        nextRetryAt: retryAt,
      }));
    }
    if (!deadLetter) throw new IntegrationError(sanitizedError(error), true);
  }
}

async function processApplication(applicationId: string, env: Cloudflare.Env): Promise<void> {
  const jobs = await getRunnableIntegrationJobs(env.DB, applicationId, new Date().toISOString());
  const results = await Promise.allSettled(jobs.map((job) => processJob(job, env)));
  const retryableFailure = results.some((result) => result.status === "rejected");
  if (retryableFailure) throw new IntegrationError("One or more integration jobs require retry", true);
}

export async function handleIntegrationQueue(batch: MessageBatch<unknown>, env: Cloudflare.Env): Promise<void> {
  for (const message of batch.messages) {
    if (!validMessage(message.body)) {
      console.error(JSON.stringify({ event: "integration_message_invalid", messageId: message.id }));
      message.ack();
      continue;
    }
    try {
      await processApplication(message.body.applicationId, env);
      message.ack();
    } catch (error) {
      const delaySeconds = retryDelaySeconds(message.attempts);
      console.error(JSON.stringify({ event: "integration_processing_retry", applicationId: message.body.applicationId, attempts: message.attempts, error: sanitizedError(error) }));
      message.retry({ delaySeconds });
    }
  }
}

export async function enqueueDueIntegrationJobs(env: Cloudflare.Env): Promise<void> {
  const now = new Date();
  const recovered = await recoverStaleIntegrationJobs(env.DB, new Date(now.getTime() - 15 * 60 * 1000).toISOString(), now.toISOString());
  const applicationIds = await listDueIntegrationApplicationIds(env.DB, now.toISOString());
  if (applicationIds.length === 0) return;
  await env.INTEGRATION_QUEUE.sendBatch(applicationIds.map((applicationId) => ({ body: { applicationId } })));
  console.log(JSON.stringify({ event: "integration_reconciliation_enqueued", count: applicationIds.length, recovered }));
}
