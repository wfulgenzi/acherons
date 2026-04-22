import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

// Emails that are automatically granted isAdmin on first sign-in.
// Configured via ADMIN_EMAILS env var (comma-separated).
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

// BETTER_AUTH_URL is used server-side to construct absolute callback URLs.
// On Vercel, VERCEL_URL is injected automatically per-deployment (no https://).
// Locally, fall back to BETTER_AUTH_URL from .env.local.
function getBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  // VERCEL_PROJECT_PRODUCTION_URL is the stable domain (e.g. hackerons.vercel.app)
  // VERCEL_URL is the per-deployment URL — use it only as a fallback
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const auth = betterAuth({
  baseURL: getBaseURL(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // cannot be set by the user during signup
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => ({
          data: {
            ...userData,
            isAdmin: ADMIN_EMAILS.has(userData.email.toLowerCase()),
          },
        }),
      },
    },
  },
});
