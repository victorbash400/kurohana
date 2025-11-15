import { pushTerminalEntry } from "@/lib/terminal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type HttpMethod = "GET" | "POST";

type RequestOptions = {
  label?: string;
  logSuccess?: boolean;
};

async function request<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const label = options?.label ?? path;
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    pushTerminalEntry("error", `[network] ${method} ${path} failed: ${message}`);
    throw error;
  }

  if (!response.ok) {
    const message = await safeErrorMessage(response);
    pushTerminalEntry(
      "error",
      `[api] ${method} ${path} -> ${response.status} ${response.statusText}: ${message}`
    );
    throw new Error(message);
  }

  if (options?.logSuccess) {
    pushTerminalEntry(
      "info",
      `[api] ${label} -> ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

async function safeErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (typeof data === "object" && data && "detail" in data) {
      return String((data as { detail: unknown }).detail);
    }
    return JSON.stringify(data);
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

export function getJson<T>(path: string, label?: string) {
  return request<T>(path, "GET", undefined, { label, logSuccess: false });
}

export function postJson<T>(path: string, body: unknown, label?: string) {
  return request<T>(path, "POST", body, { label, logSuccess: true });
}

export { API_BASE };
