import { getAccessToken } from "@/shared/auth/token";
import { resolveApiErrorPresentation } from "@/shared/utils/api-error-presentation";

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

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5208").replace(/\/+$/, "");
const DEFAULT_API_TIMEOUT_MS = 20000;

type ErrorPayload = { message?: string; title?: string; raw?: string };

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    signal,
    auth = true,
    headers: extraHeaders,
    timeoutMs = DEFAULT_API_TIMEOUT_MS,
  } = opts;

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

  const abortController = new AbortController();
  const externalAbortHandler = () => {
    abortController.abort(signal?.reason);
  };

  if (signal) {
    if (signal.aborted) {
      externalAbortHandler();
    } else {
      signal.addEventListener("abort", externalAbortHandler, { once: true });
    }
  }

  const timeoutId =
    timeoutMs > 0
      ? setTimeout(() => {
          abortController.abort(new DOMException("Request timed out", "TimeoutError"));
        }, timeoutMs)
      : null;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
      signal: abortController.signal,
    });
  } catch (e: unknown) {
    const externalAborted = !!signal?.aborted;
    const timedOut = !externalAborted && abortController.signal.aborted && timeoutMs > 0;

    if (timedOut) {
      throw new ApiError("Час очікування запиту вичерпано. Спробуйте ще раз.", 0, {
        cause: e,
        kind: "timeout",
        timeoutMs,
      });
    }

    if (externalAborted) {
      throw new ApiError("Запит скасовано", 0, { cause: e, kind: "aborted" });
    }

    const message = e instanceof Error ? e.message : "Помилка мережі";
    throw new ApiError(message, 0, { cause: e, kind: "network" });
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (signal) {
      signal.removeEventListener("abort", externalAbortHandler);
    }
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
    const presentation = resolveApiErrorPresentation(data);
    const message =
      presentation.title ||
      details.message ||
      details.title ||
      statusMessage(res.status) ||
      (typeof data === "string" ? data : null) ||
      `Помилка запиту: ${res.status}`;

    throw new ApiError(String(message), res.status, data);
  }

  return data as T;
}

function statusMessage(status: number): string | null {
  switch (status) {
    case 400:
      return "Некоректні дані запиту";
    case 401:
      return "Потрібна авторизація. Увійдіть повторно";
    case 403:
      return "Недостатньо прав для виконання цієї дії";
    case 404:
      return "Запис не знайдено або вже видалено";
    case 409:
      return "Конфлікт даних. Перевірте актуальність інформації";
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
