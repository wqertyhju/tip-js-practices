// Модуль хранения задач в localStorage.
// Все операции получают storage аргументом — это упрощает тестирование.

const STORAGE_VERSION = 1;

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const seenIds = new Set();
  for (const task of value) {
    if (!task || typeof task !== "object") return false;
    if (!Number.isSafeInteger(task.id) || task.id <= 0) return false;
    if (seenIds.has(task.id)) return false;
    seenIds.add(task.id);
    if (typeof task.title !== "string") return false;
    const trimmed = task.title.trim();
    if (trimmed.length < 1 || trimmed.length > 100) return false;
    if (typeof task.completed !== "boolean") return false;
    if (task.priority !== "low" && task.priority !== "medium" && task.priority !== "high") {
      return false;
    }
  }
  return true;
}

function cloneTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = cloneTasks(fallbackTasks);

  let raw;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return { ok: false, source: "fallback", tasks: fallback, error: `Ошибка чтения: ${error.message}` };
  }

  if (raw === null) {
    return { ok: true, source: "initial", tasks: fallback };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { ok: false, source: "fallback", tasks: fallback, error: "Сохранённые данные повреждены (некорректный JSON)" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, source: "fallback", tasks: fallback, error: "Неверная структура сохранённых данных" };
  }
  if (parsed.version !== STORAGE_VERSION) {
    return { ok: false, source: "fallback", tasks: fallback, error: `Неизвестная версия данных: ${parsed.version}` };
  }
  if (!isValidTaskList(parsed.tasks)) {
    return { ok: false, source: "fallback", tasks: fallback, error: "Сохранённый список задач некорректен" };
  }

  return { ok: true, source: "storage", tasks: cloneTasks(parsed.tasks) };
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Некорректный список задач: запись отменена" };
  }
  try {
    const payload = JSON.stringify({ version: STORAGE_VERSION, tasks });
    storage.setItem(key, payload);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Ошибка записи: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Ошибка удаления: ${error.message}` };
  }
}
