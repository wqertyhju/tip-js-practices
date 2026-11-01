import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, "..", "api", "server.mjs");
const PORT = 5517;
const BASE = `http://127.0.0.1:${PORT}/api`;

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try { await fn(); console.log(`OK  ${name}`); passed++; }
  catch (e) { console.log(`FAIL ${name}: ${e.message}`); failed++; }
}

async function main() {
  const server = spawn("node", [SERVER_PATH, String(PORT)], { stdio: "ignore" });
  await delay(1000);

  await check("GET /health", async () => {
    const res = await fetch(`${BASE}/health`);
    assert.equal(res.status, 200);
  });

  await check("GET /tasks", async () => {
    const res = await fetch(`${BASE}/tasks`);
    const data = await res.json();
    assert.ok(Array.isArray(data.data));
  });

  await check("POST /tasks", async () => {
    const res = await fetch(`${BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Новая", priority: "high", categoryId: 2 })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.data.title, "Новая");
  });

  await check("PATCH /tasks/1", async () => {
    const res = await fetch(`${BASE}/tasks/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.data.completed, false);
  });

  await check("DELETE /tasks/1", async () => {
    const res = await fetch(`${BASE}/tasks/1`, { method: "DELETE" });
    assert.equal(res.status, 204);
  });

  server.kill();
  console.log(`\nИтог API: успешно ${passed}, ошибок ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
