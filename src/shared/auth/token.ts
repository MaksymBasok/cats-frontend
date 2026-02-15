// src/shared/auth/token.ts
const KEY = "cats_access_token";

export function setAccessToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(KEY);
}
