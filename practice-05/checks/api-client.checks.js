import assert from "node:assert/strict";
import { buildUrl, createApiClient, ApiError } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`OK  ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`FAIL ${name}: ${error.message}`);
    failed += 1;
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    console.log(`OK  ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`FAIL ${name}: ${error.message}`);
    failed += 1;
  }
}

function makeResponse(status, body, contentType = "application/json") {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  });
}

function fakeFetch(handler) {
  return async (url, options) => handler(url, options);
}

async function main() {
  // === buildUrl ===
  check("buildUrl: простой путь", () => {
    const u = buildUrl("http://127.0.0.1:5505/api", "/tasks");
    assert.equal(u, "http://127.0.0.1:5505/api/tasks");
  });

  check("buildUrl: двойные слэши", () => {
    const u = buildUrl("http://127.0.0.1:5505/api/", "/tasks");
    assert.equal(u, "http://127.0.0.1:5505/api/tasks");
  });

  check("buildUrl: query с пробелом и кириллицей", () => {
    const u = buildUrl("http://127.0.0.1:5505/api", "/tasks", { q: "API & ошибки" });
    assert.ok(u.includes("q=API+%26+%D0%BE%D1%88%D0%B8%D0%B1%D0%BA%D0%B8"));
  });

  check("buildUrl: false сохраняется", () => {
    const u = buildUrl("http://127.0.0.1:5505/api", "/tasks", { completed: false });
    assert.ok(u.includes("completed=false"));
  });

  check("buildUrl: undefined и null пропускаются", () => {
    const u = buildUrl("http://127.0.0.1:5505/api", "/tasks", { a: undefined, b: null, c: "" });
    assert.equal(u, "http://127.0.0.1:5505/api/tasks");
  });

  check("buildUrl: не мутирует query", () => {
    const q = { priority: "high" };
    buildUrl("http://127.0.0.1:5505/api", "/tasks", q);
    assert.deepEqual(q, { priority: "high" });
  });

  check("buildUrl: отказ для относительного baseUrl", () => {
    assert.throws(() => buildUrl("/api", "/tasks"));
  });

  // === requestJson ===
  await checkAsync("requestJson: успешный JSON", async () => {
    const client = createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      fetchFn: fakeFetch(() => makeResponse(200, { data: [1, 2] })),
    });
    const result = await client.requestJson("/tasks");
    assert.deepEqual(result, { data: [1, 2] });
  });

  await checkAsync("requestJson: 204 возвращает null", async () => {
    const client = createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      fetchFn: fakeFetch(() => new Response(null, { status: 204 })),
    });
    const result = await client.requestJson("/something");
    assert.equal(result, null);
  });

  await checkAsync("requestJson: HTTP 404 → ApiError http", async () => {
    const client = createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      fetchFn: fakeFetch(() => makeResponse(404, { error: { code: "TASK_NOT_FOUND", message: "Не найдено" } })),
    });
    try {
      await client.requestJson("/tasks/999");
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "http");
      assert.equal(error.status, 404);
      assert.equal(error.code, "TASK_NOT_FOUND");
    }
  });

  await checkAsync("requestJson: network error", async () => {
    const client = createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      fetchFn: fakeFetch(() => { throw new TypeError("fetch failed"); }),
    });
    try {
      await client.requestJson("/tasks");
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "network");
    }
  });

  await checkAsync("requestJson: неверный Content-Type", async () => {
    const client = createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      fetchFn: fakeFetch(() => makeResponse(200, "plain text", "text/plain")),
    });
    try {
      await client.requestJson("/tasks");
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "invalid-response");
    }
  });

  await checkAsync("requestJson: битый JSON", async () => {
    const client = createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      fetchFn: fakeFetch(() => new Response("{broken-json", { status: 200, headers: { "content-type": "application/json" } })),
    });
    try {
      await client.requestJson("/tasks");
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "invalid-response");
    }
  });

  await checkAsync("requestJson: timeout", async () => {
    const client = createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      timeoutMs: 10,
      fetchFn: fakeFetch((url, options) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(makeResponse(200, { ok: true })), 100);
          options.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      }),
    });
    try {
      await client.requestJson("/tasks");
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "timeout");
    }
  });

  await checkAsync("requestJson: внешняя отмена", async () => {
    const controller = new AbortController();
    const client = createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      fetchFn: fakeFetch((url, options) => {
        return new Promise((resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      }),
    });
    const pending = client.requestJson("/tasks", { signal: controller.signal, timeoutMs: 1000 });
    controller.abort();
    try {
      await pending;
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "aborted");
    }
  });

  // === task-api ===
  function makeTaskClient(response) {
    return createApiClient({
      baseUrl: "http://127.0.0.1:5505/api",
      fetchFn: fakeFetch(() => makeResponse(200, response)),
    });
  }

  await checkAsync("getTasks: корректный ответ", async () => {
    const client = makeTaskClient({
      data: [{ id: 4, title: "Task", completed: false, priority: "high", categoryId: 2 }],
      meta: { total: 1 },
    });
    const api = createTaskApi(client);
    const result = await api.getTasks();
    assert.equal(result.tasks.length, 1);
    assert.equal(result.meta.total, 1);
  });

  await checkAsync("getTasks: meta.total не совпадает", async () => {
    const client = makeTaskClient({
      data: [{ id: 4, title: "Task", completed: false, priority: "high", categoryId: 2 }],
      meta: { total: 5 },
    });
    const api = createTaskApi(client);
    try {
      await api.getTasks();
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "invalid-response");
    }
  });

  await checkAsync("getTasks: неверный приоритет в задаче", async () => {
    const client = makeTaskClient({
      data: [{ id: 4, title: "Task", completed: false, priority: "urgent", categoryId: 2 }],
      meta: { total: 1 },
    });
    const api = createTaskApi(client);
    try {
      await api.getTasks();
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "invalid-response");
    }
  });

  await checkAsync("getCategories: некорректный ответ", async () => {
    const client = makeTaskClient({ data: [{ id: -1, name: "" }] });
    const api = createTaskApi(client);
    try {
      await api.getCategories();
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "invalid-response");
    }
  });

  await checkAsync("getTaskById: неверный id", async () => {
    const client = makeTaskClient({ data: {} });
    const api = createTaskApi(client);
    try {
      await api.getTaskById(0);
      throw new Error("не выбросило");
    } catch (error) {
      assert.ok(error.message.includes("id"));
    }
  });

  await checkAsync("getTasks: неизвестный фильтр", async () => {
    const client = makeTaskClient({ data: [], meta: { total: 0 } });
    const api = createTaskApi(client);
    try {
      await api.getTasks({ unknown: 1 });
      throw new Error("не выбросило");
    } catch (error) {
      assert.ok(error.message.includes("фильтр"));
    }
  });

  await checkAsync("loadInitialData: параллельный запуск", async () => {
    const calls = [];
    const client = {
      requestJson: async (path) => {
        calls.push(path);
        if (path === "/tasks") return { data: [], meta: { total: 0 } };
        if (path === "/categories") return { data: [] };
        throw new Error("unexpected");
      },
    };
    const api = createTaskApi(client);
    await api.loadInitialData();
    assert.deepEqual(calls.sort(), ["/categories", "/tasks"]);
  });

  console.log(`\nИтог клиента: успешно ${passed}, ошибок ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
