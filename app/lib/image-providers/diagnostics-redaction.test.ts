import { describe, expect, it } from "vitest";
import { sanitizeDiagnosticMetadata } from "@/lib/image-generation-diagnostics";

describe("image provider diagnostic redaction", () => {
  it("fully redacts credentials and known or unknown signed URLs", () => {
    const sanitized = sanitizeDiagnosticMetadata({
      apiKey: "secret-key",
      pollingUrl: "https://api.eu.bfl.ai/v1/get_result?id=secret",
      deliveryUrl: "https://delivery.bfl.ai/image.jpg?token=secret",
      unknownUrl: "https://cdn.example.com/image.jpg?signature=secret",
      requestId: "request-123",
    });

    expect(sanitized).toEqual({
      apiKey: "[redacted]",
      pollingUrl: "[redacted]",
      deliveryUrl: "[redacted]",
      unknownUrl: "[redacted-url]",
      requestId: "request-123",
    });
  });
});
