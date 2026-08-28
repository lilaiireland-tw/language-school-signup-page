import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWranglerConfig() {
  const source = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const withoutComments = source.replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(withoutComments.replace(/,\s*([}\]])/g, "$1"));
}

test("staging uses isolated D1 and Queue bindings", async () => {
  const config = await readWranglerConfig();
  const staging = config.env.staging;

  assert.equal(staging.name, "site-creator-vinext-starter-staging");
  assert.equal(staging.d1_databases[0].binding, "DB");
  assert.equal(staging.d1_databases[0].database_name, "lilai-applications-staging");
  assert.notEqual(staging.d1_databases[0].database_id, config.d1_databases[0].database_id);
  assert.equal(staging.queues.producers[0].binding, "INTEGRATION_QUEUE");
  assert.equal(staging.queues.producers[0].queue, "lilai-application-integrations-staging");
  assert.deepEqual(staging.queues.consumers, []);
  assert.deepEqual(staging.triggers.crons, []);
  assert.deepEqual(staging.secrets.required, []);
  assert.equal(staging.vars.NEXT_PUBLIC_NOINDEX, "true");
  assert.equal(config.ratelimits[0].name, "APPLICATION_RATE_LIMITER");
  assert.equal(staging.ratelimits[0].name, "APPLICATION_RATE_LIMITER");
  assert.notEqual(staging.ratelimits[0].namespace_id, config.ratelimits[0].namespace_id);
});
