import { createElement } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/client";
import { resolveApiErrorPresentation } from "@/shared/utils/api-error-presentation";

function renderIssueList(items: string[]) {
  return createElement(
    "ul",
    {
      className:
        "mt-1 max-h-52 list-disc space-y-1 overflow-auto pl-4 text-sm leading-relaxed text-muted-foreground",
    },
    ...items.map((item, index) => createElement("li", { key: `${item}-${index}` }, item)),
  );
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

function extractErrorDetails(error: unknown): string | null {
  if (error instanceof ApiError) {
    const presentation = resolveApiErrorPresentation(error.details);
    if (presentation.details.length > 0) {
      return presentation.details.join("\n");
    }

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

function humanizeErrorDetails(error: unknown): string | null {
  if (error instanceof ApiError) {
    const presentation = resolveApiErrorPresentation(error.details);
    if (presentation.title) {
      return presentation.title;
    }
  }

  return null;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const details = error.details as { kind?: string } | undefined;
    if (details?.kind === "timeout") {
      return "Час очікування запиту вичерпано. Спробуйте ще раз";
    }
    if (details?.kind === "aborted") {
      return "Запит скасовано";
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

export function showValidationToast(
  issues: string[],
  fallbackTitle = "Перевірте дані форми.",
): void {
  const uniqueIssues = Array.from(new Set(issues.map((issue) => issue.trim()).filter(Boolean)));
  if (uniqueIssues.length === 0) {
    toast.error(fallbackTitle);
    return;
  }

  const title = uniqueIssues.length === 1 ? uniqueIssues[0] : fallbackTitle;

  toast.error(title, {
    description:
      uniqueIssues.length > 1
        ? renderIssueList(uniqueIssues)
        : "Виправте дані у формі та повторіть дію.",
  });
}

export function showErrorToast(error: unknown, fallbackTitle: string): void {
  const details = extractErrorDetails(error);
  const shortReason = humanizeErrorDetails(error);
  const title = shortReason || getErrorMessage(error, fallbackTitle);
  const detailItems = details
    ? details
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  toast.error(title, {
    description:
      detailItems.length > 0
        ? renderIssueList(detailItems)
        : "Спробуйте повторити дію або зверніться до адміністратора, якщо проблема повторюється.",
  });
}
