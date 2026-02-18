import { createElement } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/client";

function extractErrorDetails(error: unknown): string | null {
  if (error instanceof ApiError) {
    if (typeof error.details === "string" && error.details.trim()) {
      return error.details.trim();
    }

    if (error.details && typeof error.details === "object") {
      try {
        return JSON.stringify(error.details, null, 2);
      } catch {
        return String(error.details);
      }
    }
  }

  if (error instanceof Error && error.stack) {
    return error.stack;
  }

  return null;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
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
  const title = getErrorMessage(error, fallbackTitle);
  const details = extractErrorDetails(error);

  toast.error(title, {
    description: details
      ? createElement(
          "details",
          { className: "mt-1 cursor-pointer text-xs text-muted-foreground" },
          createElement("summary", { className: "outline-none" }, "Показати більше"),
          createElement(
            "pre",
            {
              className:
                "mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border/80 bg-muted/40 p-2 text-[11px] leading-relaxed",
            },
            details,
          ),
        )
      : "Спробуйте повторити дію або зверніться до адміністратора, якщо помилка повторюється.",
  });
}
