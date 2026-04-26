/**
 * Normalises PEMs from .env: escaped `\\n` and an accidental extra `=` from
 * `KEY==<pem>` dotenv lines so `-----BEGIN` is the first line of the key body.
 */
export function normalizeEnvPem(raw: string): string {
  let s = raw.replace(/\\n/g, "\n").trim();
  if (s.startsWith("=") && s.includes("-----BEGIN")) {
    s = s.slice(1).trim();
  }
  return s;
}
