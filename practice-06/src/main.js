import { createApiClient } from "./api-client.js";
import { createTaskApi } from "./task-api.js";
import { createAppController } from "./app-controller.js";
import { createDomView } from "./dom-app.js";
import { validateTaskDraft } from "./form-validation.js";
import { variantFilters } from "./variant.js";

const API_URL = "http://127.0.0.1:5505/api";

async function init() {
  const apiClient = createApiClient({ baseUrl: API_URL });
  const api = createTaskApi(apiClient);
  const view = createDomView(document);
  const controller = createAppController({ api, view });

  const form = document.querySelector("#task-form");
  const list = document.querySelector("#task-list");
  const filters = document.querySelector("#task-filters");
  const resetBtn = document.querySelector("#form-reset");
  const apiStatus = document.querySelector("#api-status");

  // Проверка API
  try {
    await fetch(`${API_URL}/health`);
    apiStatus.textContent = `API: ${API_URL}`;
    apiStatus.style.color = "green";
  } catch {
    apiStatus.textContent = "API: Ошибка подключения";
    apiStatus.style.color = "red";
  }

  // Загрузка категорий (для селектов) и первичная загрузка задач
  const initial = await api.loadInitialData(variantFilters);
  view.setCategories(initial.categories);
  
  // Подписки на UI
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const draft = {
      title: form.querySelector("#task-title").value,
      priority: form.querySelector("#task-priority").value,
      categoryId: form.querySelector("#task-category").value
    };
    
    // Валидация перед отправкой
    const validation = validateTaskDraft(draft, initial.categories);
    if (!validation.valid) {
      view.notify(Object.values(validation.errors)[0], "error");
      return;
    }
    
    await controller.submit(validation.value);
  });

  filters.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    
    // Визуальное переключение активной кнопки
    filters.querySelectorAll("button").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    const f = btn.dataset.filter;
    const newFilters = {};
    if (f === "pending") newFilters.completed = false;
    if (f === "completed") newFilters.completed = true;
    
    const catVal = document.querySelector("#filter-category").value;
    if (catVal) newFilters.categoryId = Number(catVal);
    
    await controller.applyFilters(newFilters);
  });

  document.querySelector("#filter-category").addEventListener("change", async (e) => {
    const catVal = e.target.value;
    const newFilters = {};
    if (catVal) newFilters.categoryId = Number(catVal);
    await controller.applyFilters(newFilters);
  });

  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const card = btn.closest("li[data-task-id]");
    if (!card) return;
    const id = Number(card.dataset.taskId);
    const action = btn.dataset.action;

    if (action === "edit") await controller.beginEdit(id);
    if (action === "toggle") await controller.toggleTask(id);
    if (action === "delete") await controller.deleteTask(id);
  });

  resetBtn.addEventListener("click", async () => {
    await controller.resetData();
  });

  // Запуск
  view.renderTasks(initial.tasks, initial.categories);
  await controller.start(variantFilters);
  
  // Тестовый крючок для browser.checks.js
  window.practice06 = { controller, api, view, ready: true };
  console.log("ПР6 успешно запущена");
}

init().catch(err => console.error("Критическая ошибка запуска:", err));
