import assert from "node:assert/strict";
import test from "node:test";
import { verifyTurnstile } from "../worker/security/turnstile.ts";

const env = {
  TURNSTILE_SECRET: "secret",
  TURNSTILE_HOSTNAMES: "site-creator-vinext-starter.lilaiireland.workers.dev,lilaiireland.com,www.lilaiireland.com",
} as Cloudflare.Env;

function request() {
  return new Request("https://lilaiireland.com/language-school-signup/api/applications", { headers: { "CF-Connecting-IP": "203.0.113.10" } });
}

function siteverify(payload: object, status = 200): typeof fetch {
  return (async (_input, init) => {
    const body = init?.body as URLSearchParams;
    assert.equal(body.get("secret"), "secret");
    assert.equal(body.get("response"), "valid-token");
    assert.equal(body.get("remoteip"), "203.0.113.10");
    return Response.json(payload, { status });
  }) as typeof fetch;
}

test("accepts verified workers.dev and production hostnames", async () => {
  for (const hostname of ["site-creator-vinext-starter.lilaiireland.workers.dev", "lilaiireland.com", "www.lilaiireland.com"]) {
    await verifyTurnstile(request(), env, "valid-token", siteverify({ success: true, action: "application_submit", hostname }));
  }
});

test("rejects missing tokens, wrong actions, and unapproved hostnames", async () => {
  await assert.rejects(() => verifyTurnstile(request(), env, "", siteverify({})), /安全驗證失敗/);
  await assert.rejects(() => verifyTurnstile(request(), env, "valid-token", siteverify({ success: true, action: "other", hostname: "lilaiireland.com" })), /安全驗證失敗/);
  await assert.rejects(() => verifyTurnstile(request(), env, "valid-token", siteverify({ success: true, action: "application_submit", hostname: "attacker.example" })), /安全驗證失敗/);
});

test("fails closed when Siteverify is unavailable", async () => {
  const failingFetch = (async () => { throw new Error("network down"); }) as typeof fetch;
  await assert.rejects(() => verifyTurnstile(request(), env, "valid-token", failingFetch), /安全驗證暫時無法完成/);
});
