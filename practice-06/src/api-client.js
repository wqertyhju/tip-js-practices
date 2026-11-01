export class ApiError extends Error {
  constructor(kind, message, extra = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    Object.assign(this, extra);
  }
}

export function buildUrl(baseUrl, path, query = {}) {
  if (!baseUrl || !baseUrl.startsWith("http")) throw new Error("Неверный baseUrl");
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const url = new URL(`${cleanBase}/${cleanPath}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 5000 }) {
  async function requestJson(path, { method = "GET", query, body, signal, timeoutMs: localTimeout } = {}) {
    const m = String(method).toUpperCase();
    if (!["GET", "POST", "PATCH", "DELETE"].includes(m)) throw new Error(`Метод ${m} не разрешён`);
    if (m === "GET" && body) throw new Error("GET с телом запрещён");

    const url = buildUrl(baseUrl, path, query);
    const timeout = localTimeout ?? timeoutMs;
    const signals = [AbortSignal.timeout(timeout)];
    if (signal) signals.push(signal);
    const combinedSignal = signals.length === 1 ? signals[0] : AbortSignal.any(signals);

    const headers = { Accept: "application/json" };
    let payload = undefined;
    if (body) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetchFn(url, { method: m, headers, body: payload, signal: combinedSignal });
    } catch (error) {
      if (signal && signal.aborted) throw new ApiError("aborted", "Отменено", { cause: error });
      if (error.name === "TimeoutError" || error.name === "AbortError") throw new ApiError("timeout", "Тайм-аут", { cause: error });
      throw new ApiError("network", "Сетевая ошибка", { cause: error });
    }

    if (!(response instanceof Response)) throw new ApiError("invalid-response", "Не Response");

    if (!response.ok) {
      let code, details;
      try {
        const errData = await response.json();
        if (errData?.error) { code = errData.error.code; details = errData.error.details; }
      } catch {}
      throw new ApiError("http", `HTTP ${response.status}`, { status: response.status, code, details, url });
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) throw new ApiError("invalid-response", "Ожидался JSON");

    try { return await response.json(); } catch (error) {
      throw new ApiError("invalid-response", "Ошибка разбора JSON", { cause: error });
    }
  }

  return { requestJson };
}
