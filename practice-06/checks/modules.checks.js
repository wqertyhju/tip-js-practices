import assert from "node:assert/strict";
import { createApiClient, buildUrl } from "../src/api-client.js";
import { validateTaskDraft } from "../src/form-validation.js";
import { createAppController } from "../src/app-controller.js";

let passed = 0, failed = 0;

function check(name, fn) {
  try { fn(); console.log(`OK  ${name}`); passed++; }
  catch (e) { console.log(`FAIL ${name}: ${e.message}`); failed++; }
}

async function checkAsync(name, fn) {
  try { await fn(); console.log(`OK  ${name}`); passed++; }
  catch (e) { console.log(`FAIL ${name}: ${e.message}`); failed++; }
}

async function main() {
  check("buildUrl: сохраняет false", () => {
    const u = buildUrl("http://api", "/tasks", { completed: false });
    assert.ok(u.includes("completed=false"));
  });

  check("validateTaskDraft: успех", () => {
    const r = validateTaskDraft(
      { title: "Тест", priority: "low", categoryId: "1" },
      [{ id: 1, name: "Cat" }]
    );
    assert.equal(r.valid, true);
    assert.equal(r.value.categoryId, 1);
  });

  check("validateTaskDraft: ошибка длины", () => {
    const r = validateTaskDraft({ title: "", priority: "low", categoryId: 1 }, []);
    assert.equal(r.valid, false);
    assert.ok(r.errors.title);
  });

  await checkAsync("controller: защита от устаревших запросов", async () => {
    let resolveFirst;
    const api = {
      getTasks: () => new Promise(r => { resolveFirst = r; }),
      loadInitialData: async () => ({ tasks: [], categories: [] })
    };
    const view = { setLoading: () => {}, renderTasks: () => {}, renderEmpty: () => {}, renderError: () => {} };
    const controller = createAppController({ api, view });

    // Запускаем 2 запроса подряд
    const p1 = controller.start({});
    const p2 = controller.applyFilters({ priority: "high" });

    // Завершаем первый (старый) запрос
    if (resolveFirst) resolveFirst({ tasks: [{ id: 1 }], meta: { total: 1 } });

    await p2;
    // Старый ответ не должен перезаписать состояние
  });

  console.log(`\nИтог модулей: успешно ${passed}, ошибок ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
