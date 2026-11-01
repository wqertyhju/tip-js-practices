import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, "..", "api", "server.mjs");

const PORT = 5516;
const BASE = `http://127.0.0.1:${PORT}/api`;

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`OK  ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`FAIL ${name}: ${error.message}`);
    failed += 1;
  }
}

async function main() {
  const server = spawn("node", [SERVER_PATH, String(PORT)], { stdio: "inherit" });

  let isReady = false;
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) { isReady = true; break; }
    } catch { /* */ }
    await delay(100);
  }
  if (!isReady) {
    console.log("❌ Сервер не запустился за 5 секунд");
    server.kill();
    process.exit(1);
  }

  const client = createApiClient({ baseUrl: BASE, timeoutMs: 3000 });
  const api = createTaskApi(client);

  await check("getTasks: все задачи", async () => {
    const { tasks } = await api.getTasks();
    assert.equal(tasks.length, 12);
  });

  await check("getTasks: completed=false", async () => {
    const { tasks } = await api.getTasks({ completed: false });
    assert.equal(tasks.length, 7);
  });

  await check("getTasks: priority=high", async () => {
    const { tasks } = await api.getTasks({ priority: "high" });
    assert.deepEqual(tasks.map(t => t.id), [4, 13, 16, 25, 34]);
  });

  await check("getTasks: categoryId=1", async () => {
    const { tasks } = await api.getTasks({ categoryId: 1 });
    assert.deepEqual(tasks.map(t => t.id), [1, 7, 13]);
  });

  await check("getTasks: q=провер", async () => {
    const { tasks } = await api.getTasks({ q: "провер" });
    assert.deepEqual(tasks.map(t => t.id), [7, 13, 25]);
  });

  await check("getTaskById: 25", async () => {
    const task = await api.getTaskById(25);
    assert.equal(task.id, 25);
  });

  await check("getTaskById: 999 → 404", async () => {
    try {
      await api.getTaskById(999);
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "http");
      assert.equal(error.status, 404);
    }
  });

  await check("getCategories: 3 категории", async () => {
    const cats = await api.getCategories();
    assert.equal(cats.length, 3);
  });

  await check("loadInitialData: задачи и категории", async () => {
    const result = await api.loadInitialData({ priority: "high" });
    assert.equal(result.tasks.length, 5);
    assert.equal(result.categories.length, 3);
    assert.equal(result.meta.total, 5);
  });

  await check("timeout: debug/delay ms=150, timeout=20", async () => {
    try {
      await client.requestJson("/debug/delay", { query: { ms: 150 }, timeoutMs: 20 });
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "timeout");
    }
  });

  await check("abort: внешняя отмена", async () => {
    const controller = new AbortController();
    const pending = client.requestJson("/debug/delay", { query: { ms: 150 }, signal: controller.signal, timeoutMs: 1000 });
    controller.abort();
    try {
      await pending;
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "aborted");
    }
  });

  await check("debug/text: invalid-response", async () => {
    try {
      await client.requestJson("/debug/text");
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "invalid-response");
    }
  });

  await check("debug/invalid-json: invalid-response", async () => {
    try {
      await client.requestJson("/debug/invalid-json");
      throw new Error("не выбросило");
    } catch (error) {
      assert.equal(error.kind, "invalid-response");
    }
  });

  server.kill();
  console.log(`\nИтог интеграции: успешно ${passed}, ошибок ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

