import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { validateTaskDraft } from "../src/form-validation.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, "..", "api", "server.mjs");
const PORT = 5518;
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

  const client = createApiClient({ baseUrl: BASE });
  const api = createTaskApi(client);

  await check("loadInitialData: задачи + категории", async () => {
    const { tasks, categories } = await api.loadInitialData();
    assert.ok(tasks.length > 0);
    assert.ok(categories.length > 0);
  });

  await check("createTask: создание", async () => {
    const newTask = await api.createTask({ title: "Интеграция", priority: "low", categoryId: 1 });
    assert.equal(newTask.title, "Интеграция");
    assert.equal(newTask.completed, false);
  });

  await check("updateTask: изменение", async () => {
    const all = await api.getTasks();
    const first = all.tasks[0];
    const updated = await api.updateTask(first.id, { title: "Обновлено", priority: "high" });
    assert.equal(updated.title, "Обновлено");
    assert.equal(updated.priority, "high");
  });

  await check("deleteTask: удаление", async () => {
    const all = await api.getTasks();
    const last = all.tasks[all.tasks.length - 1];
    await api.deleteTask(last.id);
    const after = await api.getTasks();
    assert.equal(after.tasks.find(t => t.id === last.id), undefined);
  });

  await check("resetDemoData: сброс", async () => {
    const result = await api.resetDemoData();
    assert.equal(result.reset, true);
  });

  await check("Клиентская валидация: корректный драфт", () => {
    const cats = [{ id: 1, name: "A" }];
    const r = validateTaskDraft({ title: "A", priority: "low", categoryId: 1 }, cats);
    assert.equal(r.valid, true);
  });

  await check("Клиентская валидация: пустое имя", () => {
    const cats = [{ id: 1, name: "A" }];
    const r = validateTaskDraft({ title: "", priority: "low", categoryId: 1 }, cats);
    assert.equal(r.valid, false);
  });

  await check("Клиентская валидация: несуществующая категория", () => {
    const cats = [{ id: 1, name: "A" }];
    const r = validateTaskDraft({ title: "A", priority: "low", categoryId: 99 }, cats);
    assert.equal(r.valid, false);
  });

  await check("Фильтр: completed=false", async () => {
    const { tasks } = await api.getTasks({ completed: false });
    assert.ok(tasks.every(t => t.completed === false));
  });

  await check("Фильтр: priority=high", async () => {
    const { tasks } = await api.getTasks({ priority: "high" });
    assert.ok(tasks.every(t => t.priority === "high"));
  });

  await check("Фильтр: categoryId=1", async () => {
    const { tasks } = await api.getTasks({ categoryId: 1 });
    assert.ok(tasks.every(t => t.categoryId === 1));
  });

  await check("Фильтр: q=Провер", async () => {
    const { tasks } = await api.getTasks({ q: "Провер" });
    assert.ok(tasks.every(t => t.title.toLowerCase().includes("провер")));
  });



  await check("Задача по ID: 999 (ошибка)", async () => {
    try {
      await api.getTaskById(999);
      throw new Error("Не выбросило ошибку");
    } catch (e) {
      assert.equal(e.kind, "http");
      assert.equal(e.status, 404);
    }
  });

  server.kill();
  console.log(`\nИтог интеграции: успешно ${passed}, ошибок ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });





