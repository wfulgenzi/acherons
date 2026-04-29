import { describe, it, expect, afterEach } from "vitest";
import {
  getIntegrationDbUrls,
  resetIntegrationDatabase,
  truncateAllPublicTables,
} from "../helpers/test-db";

describe("integration DB harness", () => {
  afterEach(async () => {
    await resetIntegrationDatabase();
  });

  it("connects with admin URL and truncates safely", async () => {
    const { adminUrl } = getIntegrationDbUrls();
    await expect(truncateAllPublicTables(adminUrl)).resolves.toBeUndefined();
  });
});
