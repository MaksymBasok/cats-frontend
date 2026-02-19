import { getAccessToken } from "@/shared/auth/token";

export const AUTH_EXPIRED_EVENT = "cats:auth-expired";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ValidationErrorShape = {
  errors?: Record<string, string[] | undefined>;
  detail?: string;
  title?: string;
  message?: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
  headers?: Record<string, string>;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5208").replace(/\/+$/, "");

type ErrorPayload = { message?: string; title?: string; raw?: string };

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, auth = true, headers: extraHeaders } = opts;

  const headers: Record<string, string> = { ...(extraHeaders ?? {}) };

  if (body !== undefined && body !== null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Network error";
    throw new ApiError(message, 0, { cause: e });
  }

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  const data: unknown =
    raw.length === 0
      ? null
      : contentType.includes("application/json") || contentType.includes("text/json")
        ? safeJsonParse(raw)
        : { raw };

  if (!res.ok) {
    if (res.status === 401 && auth && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    const details = (data ?? {}) as ErrorPayload;
    const message =
      extractValidationMessage(data) ||
      details.message ||
      details.title ||
      statusMessage(res.status) ||
      (typeof data === "string" ? data : null) ||
      `Request failed: ${res.status}`;

    throw new ApiError(String(message), res.status, data);
  }

  return data as T;
}

function extractValidationMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const typed = payload as ValidationErrorShape;
  const errors = typed.errors;
  if (!errors || typeof errors !== "object") return null;

  const firstMessage = Object.values(errors)
    .flatMap((arr) => (Array.isArray(arr) ? arr : []))
    .find((value) => typeof value === "string" && value.trim().length > 0);

  return firstMessage?.trim() ?? null;
}

function statusMessage(status: number): string | null {
  switch (status) {
    case 400:
      return "Некоректні дані запиту";
    case 401:
      return "Потрібно авторизуватися повторно";
    case 403:
      return "Недостатньо прав для цієї дії";
    case 404:
      return "Запис не знайдено або вже видалено";
    case 409:
      return "Конфлікт даних. Може містити додаткові дані";
    case 422:
      return "Помилка валідації даних";
    case 429:
      return "Забагато запитів. Спробуйте трохи пізніше";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Сервер тимчасово недоступний. Спробуйте пізніше";
    default:
      return null;
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
