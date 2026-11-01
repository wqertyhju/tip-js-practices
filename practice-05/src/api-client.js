// Класс ошибки API с полем kind для классификации
export class ApiError extends Error {
  constructor(kind, message, extra = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    Object.assign(this, extra);
  }
}

// Построение URL с query-параметрами
export function buildUrl(baseUrl, path, query = {}) {
  if (!baseUrl || typeof baseUrl !== "string") {
    throw new Error("baseUrl должен быть непустой строкой");
  }
  if (!path || typeof path !== "string") {
    throw new Error("path должен быть непустой строкой");
  }
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    throw new Error("baseUrl должен начинаться с http:// или https://");
  }
  if (baseUrl.includes("?") || baseUrl.includes("#")) {
    throw new Error("baseUrl не должен содержать query или hash");
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const url = new URL(`${cleanBase}/${cleanPath}`);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

// Фабрика клиента
export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 5000 }) {
  if (!baseUrl) throw new Error("baseUrl обязателен");
  if (typeof fetchFn !== "function") throw new Error("fetchFn должен быть функцией");

  async function requestJson(path, { query, signal, timeoutMs: localTimeout } = {}) {
    const url = buildUrl(baseUrl, path, query);
    const timeout = localTimeout ?? timeoutMs;

    // Сигналы: тайм-аут + внешний
    const signals = [AbortSignal.timeout(timeout)];
    if (signal) signals.push(signal);

    let combinedSignal;
    if (signals.length === 1) {
      combinedSignal = signals[0];
    } else {
      combinedSignal = AbortSignal.any(signals);
    }

    let response;
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: combinedSignal,
      });
    } catch (error) {
      // Проверяем, был ли это тайм-аут или внешняя отмена
      if (signal && signal.aborted) {
        throw new ApiError("aborted", "Запрос отменён внешним сигналом", { cause: error, url });
      }
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        // Если внешний signal не сработал, значит это таймаут
        throw new ApiError("timeout", `Превышено время ожидания (${timeout} мс)`, { cause: error, url });
      }
      throw new ApiError("network", `Сетевая ошибка: ${error.message}`, { cause: error, url });
    }

    if (!(response instanceof Response)) {
      throw new ApiError("invalid-response", "fetchFn вернул не Response", { url });
    }

    // HTTP-ошибка
    if (!response.ok) {
      let code, details;
      try {
        const errPayload = await response.json();
        if (errPayload && errPayload.error) {
          code = errPayload.error.code;
          details = errPayload.error.details;
        }
      } catch { /* тело не JSON — игнорируем */ }

      throw new ApiError("http", `HTTP ${response.status}`, {
        status: response.status,
        code,
        details,
        url,
      });
    }

    // 204 No Content
    if (response.status === 204) return null;

    // Content-Type
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError("invalid-response", `Ожидался JSON, получен "${contentType}"`, { url });
    }

    // Разбор JSON
    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("invalid-response", `Ошибка разбора JSON: ${error.message}`, { cause: error, url });
    }
  }

  return { requestJson };
}

