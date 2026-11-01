import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, "..", "api", "server.mjs");

const PORT = 5515;
const BASE = `http://127.0.0.1:${PORT}/api`;

let passed = 0;
let failed = 0;

function check(name, fn) {
  return fn().then(
    () => { console.log(`OK  ${name}`); passed += 1; },
    (error) => { console.log(`FAIL ${name}: ${error.message}`); failed += 1; }
  );
}

async function main() {
  const server = spawn("node", [SERVER_PATH, String(PORT)], { stdio: "inherit" });
  
  // Ждём, пока сервер реально начнёт отвечать (до 5 секунд)
  let isReady = false;
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) { isReady = true; break; }
    } catch { /* сервер ещё не запустился */ }
    await delay(100);
  }
  
  if (!isReady) {
    console.log("❌ Сервер не запустился за 5 секунд");
    server.kill();
    process.exit(1);
  }

  await check("GET /api/health возвращает 200", async () => {
    const res = await fetch(`${BASE}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "ok");
  });

  await check("GET /api/tasks возвращает массив", async () => {
    const res = await fetch(`${BASE}/tasks`);
    const data = await res.json();
    assert.ok(Array.isArray(data.data));
    assert.equal(data.meta.total, data.data.length);
  });

  await check("GET /api/tasks?completed=false&priority=high", async () => {
    const res = await fetch(`${BASE}/tasks?completed=false&priority=high`);
    const data = await res.json();
    assert.deepEqual(data.data.map(t => t.id), [4, 13, 34]);
  });

  await check("GET /api/tasks/25 возвращает задачу", async () => {
    const res = await fetch(`${BASE}/tasks/25`);
    const data = await res.json();
    assert.equal(data.data.id, 25);
  });

  await check("GET /api/tasks/999 возвращает 404", async () => {
    const res = await fetch(`${BASE}/tasks/999`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error.code, "TASK_NOT_FOUND");
  });

  await check("GET /api/categories возвращает массив", async () => {
    const res = await fetch(`${BASE}/categories`);
    const data = await res.json();
    assert.ok(Array.isArray(data.data));
    assert.equal(data.data.length, 3);
  });

  await check("CORS заголовок присутствует", async () => {
    const res = await fetch(`${BASE}/health`);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
  });

  await check("GET /api/debug/error возвращает 503", async () => {
    const res = await fetch(`${BASE}/debug/error`);
    assert.equal(res.status, 503);
  });

  await check("GET /api/debug/invalid-json возвращает битый JSON", async () => {
    const res = await fetch(`${BASE}/debug/invalid-json`);
    const text = await res.text();
    assert.equal(text, "{broken-json");
  });

  await check("GET /api/debug/text возвращает текст", async () => {
    const res = await fetch(`${BASE}/debug/text`);
    assert.ok(res.headers.get("content-type").startsWith("text/plain"));
  });

  server.kill();
  console.log(`\nИтог API: успешно ${passed}, ошибок ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

