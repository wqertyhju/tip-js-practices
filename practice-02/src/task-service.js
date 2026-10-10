// Внутренние помощники
function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function normalizeTitle(value) {
  if (typeof value !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const title = value.trim();
  if (title.length < 1 || title.length > 100) {
    return { ok: false, error: "Название должно быть от 1 до 100 символов" };
  }
  return { ok: true, title };
}

function normalizePriority(value) {
  if (value === undefined) {
    return { ok: true, priority: "medium" };
  }
  if (value !== "low" && value !== "medium" && value !== "high") {
    return { ok: false, error: "Приоритет должен быть low, medium или high" };
  }
  return { ok: true, priority: value };
}

// 1. Создание задачи
export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным целым числом" };
  }
  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) return titleResult;
  const priorityResult = normalizePriority(priority);
  if (!priorityResult.ok) return priorityResult;

  return {
    ok: true,
    task: {
      id,
      title: titleResult.title,
      completed: false,
      priority: priorityResult.priority,
    },
  };
}

// 2. Поиск задачи по id
export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

// 3. Невыполненные задачи
export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

// 4. Названия всех задач
export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

// 5. Сводка по задачам
export function getTaskStats(tasks) {
  const total = tasks.length;
  let completed = 0;
  for (const task of tasks) {
    if (task.completed === true) completed += 1;
  }
  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  return { total, completed, pending, progress };
}

// 6. Добавление задачи
export function addTask(tasks, id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным целым числом" };
  }
  if (tasks.some((task) => task.id === id)) {
    return { ok: false, error: "Задача с таким id уже существует" };
  }
  const created = createTask(id, title, priority);
  if (!created.ok) return created;
  return { ok: true, tasks: [...tasks, created.task] };
}

// 7. Изменение статуса выполнения
export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным целым числом" };
  }
  if (completed !== true && completed !== false) {
    return { ok: false, error: "completed должен быть true или false" };
  }
  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: "Задача с таким id не найдена" };
  }
  return {
    ok: true,
    tasks: tasks.map((task) =>
      task.id === id ? { ...task, completed } : task
    ),
  };
}

// 8. Переименование задачи
export function renameTask(tasks, id, title) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным целым числом" };
  }
  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) return titleResult;
  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: "Задача с таким id не найдена" };
  }
  return {
    ok: true,
    tasks: tasks.map((task) =>
      task.id === id ? { ...task, title: titleResult.title } : task
    ),
  };
}

// 9. Удаление задачи
export function removeTask(tasks, id) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным целым числом" };
  }
  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: "Задача с таким id не найдена" };
  }
  return {
    ok: true,
    tasks: tasks.filter((task) => task.id !== id),
  };
}
