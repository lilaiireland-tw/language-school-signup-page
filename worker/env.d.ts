export {};

declare global {
  namespace Cloudflare {
    interface Env {
      TURNSTILE_SECRET?: string;
      TURNSTILE_SITE_KEY?: string;
      TURNSTILE_HOSTNAMES?: string;
    }
  }
}
