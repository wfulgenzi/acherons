#!/usr/bin/env node
/**
 * EC P-256 **private** PKCS#8 PEM → full JWK (includes `d` for Supabase, etc.)
 *
 * Usage: node scripts/pem-ec-private-pkcs8-to-jwk.mjs path/to/ec-private-pkcs8.pem
 *
 * The printed object is secret — do not commit, do not post publicly.
 * Uses Node `createPrivateKey` + `export({ format: "jwk" })` (includes `d`).
 */
import { readFileSync } from "node:fs";
import { createPrivateKey } from "node:crypto";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/pem-ec-private-pkcs8-to-jwk.mjs <private-pkcs8.pem>");
  process.exit(1);
}

const pem = readFileSync(path, "utf8");
const key = createPrivateKey({ key: pem, format: "pem" });
const jwk = key.export({ format: "jwk" });
if (!jwk.d) {
  throw new Error("Expected JWK to include private component `d`.");
}
console.log(JSON.stringify(jwk, null, 2));
