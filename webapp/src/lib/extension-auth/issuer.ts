import "server-only";

/**
 * Issuer URL for extension access JWTs (`iss` claim). Prefer `EXTENSION_JWT_ISSUER`
 * in production; otherwise same resolution as Better Auth `baseURL`.
 */
export function getExtensionJwtIssuer(): string {
  const fromEnv = process.env.EXTENSION_JWT_ISSUER?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(
      /\/$/,
      "",
    );
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
