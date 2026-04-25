#!/usr/bin/env node
/**
 * Converts an EC (P-256) **public** PEM to JWK for Supabase JWT signing key import.
 * Usage: node scripts/pem-ec-public-to-jwk.mjs path/to/ec-public.pem
 * Never commit private key PEMs; this script is for the public file only.
 * If the provider requires a private JWK (with `d`), use
 * `pem-ec-private-pkcs8-to-jwk.mjs` instead.
 */
import { readFileSync } from "node:fs";
import { importSPKI, exportJWK } from "jose";

const publicPath = process.argv[2];
if (!publicPath) {
  console.error("Usage: node scripts/pem-ec-public-to-jwk.mjs <public.pem>");
  process.exit(1);
}

const pem = readFileSync(publicPath, "utf8");
const key = await importSPKI(pem, "ES256");
const jwk = await exportJWK(key);
console.log(JSON.stringify(jwk, null, 2));
