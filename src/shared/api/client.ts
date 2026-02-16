// src/shared/api/client.ts
import { getAccessToken } from "@/shared/auth/token";

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
};

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5208").replace(/\/+$/, "");

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
  } catch (e: any) {
    throw new ApiError(e?.message || "Network error", 0, { cause: e });
  }

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  const data =
    raw.length === 0
      ? null
      : contentType.includes("application/json") || contentType.includes("text/json")
        ? safeJsonParse(raw)
        : { raw };

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && (data as any).message) ||
      (data && typeof data === "object" && "title" in data && (data as any).title) ||
      (typeof data === "string" ? data : null) ||
      `Request failed: ${res.status}`;

    throw new ApiError(String(message), res.status, data);
  }

  return data as T;
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
