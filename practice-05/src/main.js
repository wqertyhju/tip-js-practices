import { createApiClient } from "./api-client.js";
import { createTaskApi } from "./task-api.js";
import { variantNumber, variantFilters } from "./variant.js";

const API_URL = process.env.API_URL || "http://127.0.0.1:5505/api";

async function main() {
  const client = createApiClient({ baseUrl: API_URL, timeoutMs: 3000 });
  const api = createTaskApi(client);

  console.log(`=== Вариант ${variantNumber}, фильтры: ${JSON.stringify(variantFilters)} ===\n`);

  try {
    console.log("--- Проверка варианта ---");
    const { tasks, meta } = await api.getTasks(variantFilters);
    console.log("Задачи:", tasks.map((t) => t.id));
    console.log("meta.total:", meta.total);
    console.log();

    console.log("--- Загрузка начальных данных (Promise.all) ---");
    const initial = await api.loadInitialData(variantFilters);
    console.log("Задачи:", initial.tasks.map((t) => t.id));
    console.log("Категории:", initial.categories.map((c) => c.id));
    console.log("Всего задач:", initial.meta.total);
    console.log();

    console.log("--- Задача по id = 25 ---");
    const task25 = await api.getTaskById(25);
    console.log(`id=${task25.id}, title="${task25.title}", priority=${task25.priority}`);
    console.log();

    console.log("--- Задача по id = 999 (ожидаем ошибку) ---");
    try {
      await api.getTaskById(999);
    } catch (error) {
      console.log(`Ошибка: kind=${error.kind}, status=${error.status}, code=${error.code}, message="${error.message}"`);
    }
    console.log();

    console.log("--- Тайм-аут (ms=150, timeoutMs=20) ---");
    try {
      await client.requestJson("/debug/delay", { query: { ms: 150 }, timeoutMs: 20 });
    } catch (error) {
      console.log(`Ошибка: kind=${error.kind}, message="${error.message}"`);
    }
    console.log();

    console.log("--- Внешняя отмена ---");
    const controller = new AbortController();
    const pending = client.requestJson("/debug/delay", {
      query: { ms: 150 },
      signal: controller.signal,
      timeoutMs: 1000,
    });
    controller.abort();
    try {
      await pending;
    } catch (error) {
      console.log(`Ошибка: kind=${error.kind}, message="${error.message}"`);
    }
  } catch (error) {
    console.error("Критическая ошибка:", error);
    process.exit(1);
  }
}

main();
