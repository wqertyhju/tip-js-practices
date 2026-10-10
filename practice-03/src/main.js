import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
  findTaskById,
  setTaskCompleted,
  removeTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import {
  renderTaskList,
  renderSummary,
  renderEmptyState,
} from "./task-view.js";

const params = new URLSearchParams(window.location.search);
const useVariant = params.get("dataset") === "variant";

const initialTasks = useVariant ? variantTasks : demoTasks;

if (useVariant && (!initialTasks || initialTasks.length === 0)) {
  console.warn(`Набор варианта ${variantNumber} пуст.`);
}

let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";

const listElement = document.querySelector("#task-list");
const summaryElement = document.querySelector("#task-summary");
const emptyElement = document.querySelector("#empty-state");
const messageElement = document.querySelector("#operation-message");
const filtersElement = document.querySelector("#task-filters");

function clearMessage() {
  messageElement.textContent = "";
}

function showMessage(text) {
  messageElement.textContent = text;
}

function updateFilterButtons() {
  const buttons = filtersElement.querySelectorAll("button[data-filter]");
  for (const button of buttons) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
}

export function renderApp() {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);

  renderTaskList(listElement, visibleTasks);
  renderSummary(summaryElement, currentTasks, visibleTasks.length);
  renderEmptyState(emptyElement, currentTasks.length, visibleTasks.length);
  updateFilterButtons();
}

export function restoreTaskFocus(id, action) {
  const selector = `li[data-task-id="${id}"] button[data-action="${action}"]`;
  const btn = listElement.querySelector(selector);
  if (btn) {
    btn.focus();
    return;
  }
  const activeFilter = filtersElement.querySelector("button.is-active");
  if (activeFilter) activeFilter.focus();
}

export function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !listElement.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return;

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
  clearMessage();
  renderApp();
  restoreTaskFocus(id, action);
}

export function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-filter]");
  if (!button || !filtersElement.contains(button)) return;

  const filter = button.dataset.filter;
  if (filter !== "all" && filter !== "pending" && filter !== "completed") {
    return;
  }

  currentFilter = filter;
  clearMessage();
  renderApp();
}

if (listElement) {
  listElement.addEventListener("click", handleTaskListClick);
}

if (filtersElement) {
  filtersElement.addEventListener("click", handleFilterClick);
}

renderApp();
