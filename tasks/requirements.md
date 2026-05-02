# Cross-cutting requirements (webapp, extension, packages)

Update this document when you add rules that apply across apps or packages.

---

## API contracts (`@acherons/contracts`)

**All extension HTTP calls to the webapp backend** (path, query/body arguments, and JSON response shapes) **must be typed using `@acherons/contracts`**.

- Define or extend **Valibot schemas** and exported TypeScript types in `packages/contracts` for each extension-facing route (request bodies, success payloads, shared error envelopes where applicable).
- **Extension client code** must use those types for `fetch` bodies and for validating/parsing JSON responses (e.g. `valibot.safeParse` / `parse` with the shared schema) so compile-time and runtime shapes stay aligned with the server.
- **Webapp route handlers** should construct responses that satisfy the same exported types (and validate inbound bodies with the shared schemas where POST/PATCH bodies exist).

This keeps the Chrome extension, generated OpenAPI-style contracts, and the Next.js API implementation in lockstep and catches drift at build time.

**Related:** product checklist [`extension-clinic-product.md`](./extension-clinic-product.md).
