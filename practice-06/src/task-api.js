import { ApiError } from "./api-client.js";

export function createTaskApi(client) {
  async function getTasks(filters = {}, options = {}) {
    const r = await client.requestJson("/tasks", { query: filters, ...options });
    if (!r || !Array.isArray(r.data) || !r.meta) throw new ApiError("invalid-response", "Неверный ответ задач");
    return { tasks: r.data, meta: r.meta };
  }

  async function getCategories(options = {}) {
    const r = await client.requestJson("/categories", { ...options });
    if (!r || !Array.isArray(r.data)) throw new ApiError("invalid-response", "Неверный ответ категорий");
    return r.data;
  }

  async function loadInitialData(filters = {}, options = {}) {
    const [tasksResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);
    return { tasks: tasksResult.tasks, categories, meta: tasksResult.meta };
  }

  async function getTaskById(id, options = {}) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Некорректный id");
    const r = await client.requestJson(`/tasks/${id}`, { ...options });
    if (!r || !r.data) throw new ApiError("invalid-response", "Неверный ответ задачи");
    return r.data;
  }

  async function createTask(draft, options = {}) {
    const body = { title: draft.title, priority: draft.priority, categoryId: draft.categoryId };
    const r = await client.requestJson("/tasks", { method: "POST", body, ...options });
    if (!r || !r.data) throw new ApiError("invalid-response", "Неверный ответ создания");
    return r.data;
  }

  async function updateTask(id, changes, options = {}) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Некорректный id");
    const r = await client.requestJson(`/tasks/${id}`, { method: "PATCH", body: changes, ...options });
    if (!r || !r.data) throw new ApiError("invalid-response", "Неверный ответ обновления");
    return r.data;
  }

  async function setTaskCompleted(id, completed, options = {}) {
    return updateTask(id, { completed }, options);
  }

  async function deleteTask(id, options = {}) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Некорректный id");
    const r = await client.requestJson(`/tasks/${id}`, { method: "DELETE", ...options });
    if (r !== null) throw new ApiError("invalid-response", "Ожидалось 204 без тела");
    return null;
  }

  async function resetDemoData(options = {}) {
    const r = await client.requestJson("/debug/reset", { method: "POST", ...options });
    if (!r || !r.data) throw new ApiError("invalid-response", "Неверный ответ reset");
    return r.data;
  }

  return {
    getTasks, getCategories, loadInitialData, getTaskById,
    createTask, updateTask, setTaskCompleted, deleteTask, resetDemoData
  };
}
