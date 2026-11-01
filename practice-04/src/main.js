import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
  findTaskById,
  addTask,
  updateTask,
  setTaskCompleted,
  removeTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import {
  renderTaskList,
  renderSummary,
  renderEmptyState,
} from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import {
  loadTasks,
  saveTasks,
  removeSavedTasks,
} from "./task-storage.js";

// ==== Определяем набор и ключ хранилища ====
const params = new URLSearchParams(window.location.search);
const useVariant = params.get("dataset") === "variant";
const isCheckMode = params.get("mode") === "check";

const initialTasks = useVariant ? variantTasks : demoTasks;

let storageKey;
if (isCheckMode) {
  storageKey = `tip-js-practice-04:checks:${useVariant ? "variant" : "demo"}`;
} else {
  storageKey = `tip-js-practice-04:${useVariant ? "variant" : "demo"}`;
}

// ==== Загрузка из localStorage ====
const loadResult = loadTasks(window.localStorage, storageKey, initialTasks);

let currentTasks = loadResult.tasks;
let currentFilter = "all";
let editingId = null;
let storageAvailable = loadResult.ok || loadResult.source === "initial";

// ==== Ссылки на DOM ====
const listElement = document.querySelector("#task-list");
const summaryElement = document.querySelector("#task-summary");
const emptyElement = document.querySelector("#empty-state");
const messageElement = document.querySelector("#operation-message");
const filtersElement = document.querySelector("#task-filters");
const formElement = document.querySelector("#task-form");
const formTitleElement = document.querySelector("#form-title");
const formSubmitElement = document.querySelector("#form-submit");
const formCancelElement = document.querySelector("#form-cancel");
const formResetElement = document.querySelector("#form-reset-storage");
const formMessageElement = document.querySelector("#form-message");
const idInput = document.querySelector("#task-id");
const titleInput = document.querySelector("#task-title");
const priorityInput = document.querySelector("#task-priority");

// ==== Сообщения ====
function showMessage(text) {
  messageElement.textContent = text;
}
function clearMessage() {
  messageElement.textContent = "";
}
function showFormMessage(text, isError = false) {
  formMessageElement.textContent = text;
  formMessageElement.style.color = isError ? "#b00020" : "#2e7d32";
}
function clearFormMessage() {
  formMessageElement.textContent = "";
}

// ==== Ошибки полей ====
function clearFormErrors() {
  for (const el of document.querySelectorAll("[data-error-for]")) {
    el.textContent = "";
  }
}
function showFormErrors(errors) {
  clearFormErrors();
  for (const [field, msg] of Object.entries(errors)) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = msg;
  }
}
function clearFieldError(field) {
  const el = document.querySelector(`[data-error-for="${field}"]`);
  if (el) el.textContent = "";
}

// ==== Режимы формы ====
function setFormMode(id) {
  clearFormErrors();
  clearFormMessage();

  if (id === null) {
    editingId = null;
    formElement.reset();
    idInput.disabled = false;
    idInput.value = "";
    titleInput.value = "";
    priorityInput.value = "medium";
    formTitleElement.textContent = "Добавление задачи";
    formSubmitElement.textContent = "Добавить задачу";
    formCancelElement.hidden = true;
    idInput.focus();
    return;
  }

  const task = findTaskById(currentTasks, id);
  if (!task) {
    showMessage(`Ошибка: задача с id = ${id} не найдена`);
    return;
  }

  editingId = id;
  idInput.value = String(task.id);
  idInput.disabled = true;
  titleInput.value = task.title;
  priorityInput.value = task.priority;
  formTitleElement.textContent = `Редактирование задачи #${task.id}`;
  formSubmitElement.textContent = "Сохранить изменения";
  formCancelElement.hidden = false;
  titleInput.focus();
}

// ==== Рендер ====
function updateFilterButtons() {
  const buttons = filtersElement.querySelectorAll("button[data-filter]");
  for (const button of buttons) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
}

function renderApp() {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);

  renderTaskList(listElement, visibleTasks);
  renderSummary(summaryElement, currentTasks, visibleTasks.length);
  renderEmptyState(emptyElement, currentTasks.length, visibleTasks.length);
  updateFilterButtons();
}

// ==== Сохранение ====
function persistTasks() {
  const result = saveTasks(window.localStorage, storageKey, currentTasks);
  if (!result.ok) {
    showMessage(`Предупреждение: не удалось сохранить — ${result.error}`);
    storageAvailable = false;
    return false;
  }
  storageAvailable = true;
  return true;
}

// ==== Восстановление фокуса ====
function restoreTaskFocus(id, action) {
  const selector = `li[data-task-id="${id}"] button[data-action="${action}"]`;
  const btn = listElement.querySelector(selector);
  if (btn) {
    btn.focus();
    return;
  }
  const activeFilter = filtersElement.querySelector("button.is-active");
  if (activeFilter) activeFilter.focus();
}

// ==== Обработчик формы ====
function handleFormSubmit(event) {
  event.preventDefault();
  clearFormMessage();

  const formData = new FormData(formElement);
  const draft = {
    id: editingId === null ? formData.get("id") : String(editingId),
    title: formData.get("title") || "",
    priority: formData.get("priority") || "medium",
  };

  const validation = validateTaskDraft(draft, currentTasks, editingId);
  if (!validation.ok) {
    showFormErrors(validation.errors);
    showFormMessage("Исправьте ошибки в форме", true);
    return;
  }

  let result;
  if (editingId === null) {
    result = addTask(currentTasks, validation.value.id, validation.value.title, validation.value.priority);
  } else {
    result = updateTask(currentTasks, editingId, validation.value.title, validation.value.priority);
  }

  if (!result.ok) {
    showFormMessage(`Ошибка: ${result.error}`, true);
    return;
  }

  currentTasks = result.tasks;
  setFormMode(null);
  renderApp();
  persistTasks();
  showFormMessage(editingId === null ? "Задача добавлена" : "Изменения сохранены");
}

// ==== Обработчик карточек ====
function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !listElement.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "edit" && action !== "delete") return;

  const card = button.closest("li[data-task-id]");
  if (!card) return;

  const rawId = card.dataset.taskId;
  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    showMessage(`Ошибка: некорректный идентификатор "${rawId}"`);
    return;
  }

  const task = findTaskById(currentTasks, id);
  if (!task) {
    showMessage(`Ошибка: задача с id = ${id} не найдена`);
    return;
  }

  if (action === "edit") {
    clearMessage();
    setFormMode(id);
    return;
  }

  let result;
  if (action === "toggle") {
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else {
    result = removeTask(currentTasks, id);
  }

  if (!result.ok) {
    showMessage(`Ошибка: ${result.error}`);
    return;
  }

  currentTasks = result.tasks;

  if (action === "delete" && editingId === id) {
    setFormMode(null);
  }

  clearMessage();
  renderApp();
  persistTasks();
  restoreTaskFocus(id, action);
}

// ==== Обработчик фильтров ====
function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-filter]");
  if (!button || !filtersElement.contains(button)) return;

  const filter = button.dataset.filter;
  if (filter !== "all" && filter !== "pending" && filter !== "completed") return;

  currentFilter = filter;
  clearMessage();
  renderApp();
}

// ==== Обработчик отмены ====
function handleCancelClick() {
  setFormMode(null);
  clearMessage();
}

// ==== Обработчик сброса хранилища ====
function handleResetStorage() {
  const result = removeSavedTasks(window.localStorage, storageKey);
  if (!result.ok) {
    showMessage(`Ошибка сброса: ${result.error}`);
    return;
  }
  currentTasks = initialTasks.map((t) => ({ ...t }));
  currentFilter = "all";
  setFormMode(null);
  clearMessage();
  renderApp();
  showFormMessage("Сохранённые данные сброшены");
}

// ==== Очистка ошибки при вводе ====
function handleFieldInput(event) {
  if (!(event.target instanceof Element)) return;
  const name = event.target.name;
  if (name === "id" || name === "title" || name === "priority") {
    clearFieldError(name);
    event.target.setCustomValidity("");
  }
}

// ==== Подписки ====
if (listElement) listElement.addEventListener("click", handleTaskListClick);
if (filtersElement) filtersElement.addEventListener("click", handleFilterClick);
if (formElement) {
  formElement.addEventListener("submit", handleFormSubmit);
  formElement.addEventListener("input", handleFieldInput);
}
if (formCancelElement) formCancelElement.addEventListener("click", handleCancelClick);
if (formResetElement) formResetElement.addEventListener("click", handleResetStorage);

// ==== Начальный запуск ====
if (!loadResult.ok) {
  showMessage(`Предупреждение: ${loadResult.error}. Загружен исходный набор.`);
} else if (loadResult.source === "storage") {
  showFormMessage("Данные восстановлены из localStorage");
}

if (useVariant) {
  console.log(`Загружен вариант ${variantNumber}`);
}

setFormMode(null);
renderApp();
