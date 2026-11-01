import { ApiError } from "./api-client.js";

const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

function normalizeFilters(filters = {}) {
  if (typeof filters !== "object" || filters === null) {
    throw new Error("filters должен быть объектом");
  }
  const result = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw new Error(`Неизвестный фильтр: ${key}`);
    }
    if (value === undefined || value === null || value === "") continue;
    if (key === "priority" && !VALID_PRIORITIES.has(value)) {
      throw new Error(`Недопустимый приоритет: ${value}`);
    }
    result[key] = value;
  }
  return result;
}

function isValidTask(task) {
  return (
    task &&
    typeof task === "object" &&
    Number.isSafeInteger(task.id) && task.id > 0 &&
    typeof task.title === "string" && task.title.trim().length > 0 &&
    typeof task.completed === "boolean" &&
    VALID_PRIORITIES.has(task.priority) &&
    Number.isSafeInteger(task.categoryId) && task.categoryId > 0
  );
}

function isValidCategory(cat) {
  return cat && typeof cat === "object" && Number.isSafeInteger(cat.id) && cat.id > 0 && typeof cat.name === "string" && cat.name.trim().length > 0;
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new Error("client должен содержать requestJson");
  }

  async function getTasks(filters = {}) {
    const normalized = normalizeFilters(filters);
    const response = await client.requestJson("/tasks", { query: normalized });

    if (!response || !Array.isArray(response.data)) {
      throw new ApiError("invalid-response", "Ответ tasks не содержит массива data");
    }
    if (!response.meta || typeof response.meta.total !== "number") {
      throw new ApiError("invalid-response", "Ответ tasks не содержит meta.total");
    }
    if (response.meta.total !== response.data.length) {
      throw new ApiError("invalid-response", `meta.total (${response.meta.total}) не совпадает с длиной (${response.data.length})`);
    }
    for (const task of response.data) {
      if (!isValidTask(task)) {
        throw new ApiError("invalid-response", `Некорректная задача в ответе: ${JSON.stringify(task)}`);
      }
    }

    return { tasks: response.data, meta: response.meta };
  }

  async function getTaskById(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("id должен быть положительным целым числом");
    }
    const response = await client.requestJson(`/tasks/${id}`);
    if (!response || !response.data || !isValidTask(response.data)) {
      throw new ApiError("invalid-response", "Ответ task не соответствует схеме");
    }
    return response.data;
  }

  async function getCategories() {
    const response = await client.requestJson("/categories");
    if (!response || !Array.isArray(response.data)) {
      throw new ApiError("invalid-response", "Ответ categories не содержит массива data");
    }
    for (const cat of response.data) {
      if (!isValidCategory(cat)) {
        throw new ApiError("invalid-response", `Некорректная категория: ${JSON.stringify(cat)}`);
      }
    }
    return response.data;
  }

  async function loadInitialData(filters = {}) {
    const tasksPromise = getTasks(filters);
    const categoriesPromise = getCategories();
    const [tasksResult, categories] = await Promise.all([tasksPromise, categoriesPromise]);
    return {
      tasks: tasksResult.tasks,
      categories,
      meta: tasksResult.meta,
    };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
