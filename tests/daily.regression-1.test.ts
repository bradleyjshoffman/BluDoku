// Regression: ISSUE-005 — Share gave no feedback when it couldn't share or copy
// Found by /qa on 2026-10-20
// Report: .gstack/qa-reports/qa-report-localhost-2026-10-20.md
import { afterEach, describe, expect, it, vi } from "vitest";
import { shareResultText, shareWithFeedback } from "@/lib/daily";

const abort = () => Object.assign(new Error("dismissed"), { name: "AbortError" });

describe("sharing a daily result", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the share sheet when there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, clipboard: { writeText: vi.fn() } });
    expect(await shareResultText("hi")).toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "hi" });
  });

  it("stays quiet when the player closes the share sheet", async () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(abort()), clipboard: { writeText } });
    const toast = vi.fn();
    await shareWithFeedback("hi", toast);
    expect(toast).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies instead when the share sheet errors, and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new Error("NotAllowed")), clipboard: { writeText } });
    const toast = vi.fn();
    await shareWithFeedback("line one\nline two", toast);
    expect(writeText).toHaveBeenCalledWith("line one\nline two");
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Copied!" }));
  });

  it("tells the player when neither sharing nor copying works", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    const toast = vi.fn();
    await shareWithFeedback("BluDoku #1 🐱 ⭐⭐⭐ 0:05\nlink", toast);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Couldn't share from this browser", detail: expect.stringContaining("BluDoku #1") }),
    );
  });
});
