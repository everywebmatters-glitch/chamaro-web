/* =========================================================
   FASTIFY API CLIENT
   Single fetch utility for the Chamaro backend. Every backend
   response is { success, data, meta? } or { success: false, error }.
========================================================= */

export type ApiPageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiSuccess<T> = { success: true; data: T; meta?: ApiPageMeta };
type ApiFailure = { success: false; error: { code: string; message: string } };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly url: string,
    options?: ErrorOptions
  ) {
    super(`${message} (${status} ${code}) — ${url}`, options);
    this.name = "ApiError";
  }
}

export function apiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set; add it to .env.local (see .env.example)");
  }
  return base.replace(/\/+$/, "");
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T; meta?: ApiPageMeta }> {
  const url = `${apiBaseUrl()}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch (cause) {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the Chamaro API", url, { cause });
  }

  const body = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !body || body.success !== true) {
    const error = body && body.success === false ? body.error : undefined;
    throw new ApiError(
      response.status,
      error?.code ?? "HTTP_ERROR",
      error?.message ?? response.statusText ?? "Request failed",
      url
    );
  }

  return { data: body.data, meta: body.meta };
}
