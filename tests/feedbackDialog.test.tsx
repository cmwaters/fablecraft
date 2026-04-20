import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackDialog } from "../src/components/FeedbackDialog";

function fillTextarea(container: HTMLElement, value: string) {
  const textarea = container.querySelector("textarea") as HTMLTextAreaElement | null;

  if (!textarea) {
    throw new Error("textarea missing from feedback dialog");
  }

  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function clickSubmit(container: HTMLElement) {
  const submitButton = Array.from(container.querySelectorAll("button")).find(
    (button) => /submit/i.test(button.textContent ?? ""),
  ) as HTMLButtonElement | undefined;

  if (!submitButton) {
    throw new Error("submit button missing from feedback dialog");
  }

  submitButton.click();
}

describe("FeedbackDialog", () => {
  const originalActEnvironment = (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    globalThis.fetch = originalFetch;
    document.body.innerHTML = "";
  });

  it("disables the submit button until the user provides a description", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<FeedbackDialog mode="bug" onClose={() => {}} />);
    });

    const submit = Array.from(container.querySelectorAll("button")).find((button) =>
      /submit/i.test(button.textContent ?? ""),
    ) as HTMLButtonElement | undefined;

    expect(submit?.disabled).toBe(true);

    act(() => {
      fillTextarea(container, "   ");
    });

    expect(submit?.disabled).toBe(true);

    act(() => {
      fillTextarea(container, "The app crashed on launch.");
    });

    expect(submit?.disabled).toBe(false);

    act(() => {
      root.unmount();
    });
  });

  it("shows a success screen when the backend accepts the submission", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<FeedbackDialog mode="feature" onClose={() => {}} />);
    });

    await act(async () => {
      fillTextarea(container, "Add outline export to Markdown.");
    });

    await act(async () => {
      clickSubmit(container);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(
      (requestInit as RequestInit).body as string,
    ) as { description: string; type: string };

    expect(body.type).toBe("feature");
    expect(body.description).toBe("Add outline export to Markdown.");
    expect(container.textContent).toContain("Your feature request has been submitted");

    await act(async () => {
      root.unmount();
    });
  });

  it("reports a server error to the user when the backend returns a non-2xx status", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<FeedbackDialog mode="bug" onClose={() => {}} />);
    });

    await act(async () => {
      fillTextarea(container, "The save dialog flashes and dismisses itself.");
    });

    await act(async () => {
      clickSubmit(container);
    });

    expect(container.textContent).toContain("Server responded with 503");
    expect(container.textContent).not.toContain("Your bug report has been submitted");

    const submit = Array.from(container.querySelectorAll("button")).find((button) =>
      /submit/i.test(button.textContent ?? ""),
    ) as HTMLButtonElement | undefined;

    expect(submit?.disabled).toBe(false);

    await act(async () => {
      root.unmount();
    });
  });

  it("falls back to a generic message when fetch throws a non-Error value", async () => {
    fetchMock.mockRejectedValue("network down");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<FeedbackDialog mode="bug" onClose={() => {}} />);
    });

    await act(async () => {
      fillTextarea(container, "Dark mode flashes on launch.");
    });

    await act(async () => {
      clickSubmit(container);
    });

    expect(container.textContent).toContain("Something went wrong");

    await act(async () => {
      root.unmount();
    });
  });
});
