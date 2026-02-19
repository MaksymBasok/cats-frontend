import { createElement } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/client";

function extractErrorDetails(error: unknown): string | null {
  if (error instanceof ApiError) {
    if (typeof error.details === "string" && error.details.trim()) {
      return error.details.trim();
    }

    if (error.details && typeof error.details === "object") {
      const plainText = toPlainText(error.details);
      if (plainText) {
        return plainText;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    if (process.env.NODE_ENV !== "production" && error.stack) {
      return error.stack;
    }
    return error.message.trim();
  }

  return null;
}

function toPlainText(value: unknown, prefix = ""): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? `${prefix}${trimmed}` : null;
  }

  if (Array.isArray(value)) {
    const lines = value
      .map((item, index) => toPlainText(item, prefix ? `${prefix}${index + 1}. ` : ""))
      .filter((line): line is string => Boolean(line));
    return lines.length > 0 ? lines.join("\n") : null;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const lines = entries
      .map(([key, entryValue]) => toPlainText(entryValue, `${prefix}${key}: `))
      .filter((line): line is string => Boolean(line));
    return lines.length > 0 ? lines.join("\n") : null;
  }

  return `${prefix}${String(value)}`;
}

function humanizeErrorDetails(error: unknown): string | null {
  if (error instanceof ApiError) {
    const details = error.details;

    if (details && typeof details === "object") {
      const detailValue = (details as { detail?: unknown; message?: unknown; title?: unknown }).detail;
      if (typeof detailValue === "string" && detailValue.trim()) {
        return detailValue.trim();
      }

      const messageValue = (details as { message?: unknown }).message;
      if (typeof messageValue === "string" && messageValue.trim()) {
        return messageValue.trim();
      }

      const titleValue = (details as { title?: unknown }).title;
      if (typeof titleValue === "string" && titleValue.trim()) {
        return titleValue.trim();
      }

      const errors = (details as { errors?: Record<string, string[] | string> }).errors;
      if (errors && typeof errors === "object") {
        const firstError = Object.values(errors)
          .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
          .find((entry) => typeof entry === "string" && entry.trim().length > 0);

        if (typeof firstError === "string") {
          return firstError.trim();
        }
      }
    }
  }

  return null;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const details = error.details as { kind?: string } | undefined;
    if (details?.kind === "timeout") {
      return "Request timed out. Please try again";
    }
    if (details?.kind === "aborted") {
      return "Request cancelled";
    }

    if (error.status === 0) {
      return "Немає з'єднання з сервером. Перевірте мережу або API URL";
    }

    if (error.message?.trim()) return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function showErrorToast(error: unknown, fallbackTitle: string): void {
  const details = extractErrorDetails(error);
  const shortReason = humanizeErrorDetails(error);
  const title = shortReason || getErrorMessage(error, fallbackTitle);

  toast.error(title, {
    description: details
      ? createElement(
          "details",
          { className: "mt-1 cursor-pointer text-sm text-muted-foreground" },
          createElement("summary", { className: "outline-none" }, "Показати деталі"),
          createElement(
            "p",
            {
              className:
                "mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background/90 p-3 text-sm leading-relaxed text-foreground",
            },
            details,
          ),
        )
      : "Спробуйте повторити дію або зверніться до адміністратора, якщо помилка повторюється.",
  });
}
