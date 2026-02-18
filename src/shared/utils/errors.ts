import { ApiError } from "@/shared/api/client";

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
