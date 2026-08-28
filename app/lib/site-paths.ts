export const APP_BASE_PATH = "/language-school-signup";
export const PRODUCTION_LANDING_URL = "https://lilaiireland.com/language-school-signup/";

export function appPath(path: string): string {
  if (!path.startsWith("/")) throw new Error("App paths must start with /");
  return path === "/" ? `${APP_BASE_PATH}/` : `${APP_BASE_PATH}${path}`;
}

export const APPLICATION_API_PATH = appPath("/api/applications");
export const TURNSTILE_CONFIG_API_PATH = appPath("/api/turnstile-config");
