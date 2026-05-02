/** Thrown when a clinic API returns **401** so callers can clear session + cache. */
export class ClinicUnauthorizedError extends Error {
  constructor(message = "Session expired.") {
    super(message);
    this.name = "ClinicUnauthorizedError";
  }
}
