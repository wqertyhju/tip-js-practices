// Чистая валидация черновика формы задачи.
// Не обращается к DOM, не показывает сообщения, не меняет входные значения.

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
  if (value !== "low" && value !== "medium" && value !== "high") {
    return { ok: false, error: "Приоритет должен быть low, medium или high" };
  }
  return { ok: true, priority: value };
}

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;
  let title;
  let priority;

  // === ID ===
  if (editingId !== null) {
    // Режим редактирования: id берётся из editingId, не из формы
    if (!isValidId(editingId)) {
      errors.id = "Некорректный идентификатор редактируемой задачи";
    } else {
      const exists = tasks.some((task) => task.id === editingId);
      if (!exists) {
        errors.id = "Редактируемая задача не найдена";
      } else {
        id = editingId;
      }
    }
  } else {
    // Режим создания: id из черновика
    const rawId = draft.id;
    if (rawId === "" || rawId === null || rawId === undefined) {
      errors.id = "Укажите идентификатор";
    } else {
      const parsed = Number(rawId);
      if (!isValidId(parsed)) {
        errors.id = "id должен быть положительным целым числом";
      } else if (tasks.some((task) => task.id === parsed)) {
        errors.id = "Задача с таким id уже существует";
      } else {
        id = parsed;
      }
    }
  }

  // === TITLE ===
  const titleResult = normalizeTitle(draft.title);
  if (!titleResult.ok) {
    errors.title = titleResult.error;
  } else {
    title = titleResult.title;
  }

  // === PRIORITY ===
  const priorityResult = normalizePriority(draft.priority);
  if (!priorityResult.ok) {
    errors.priority = priorityResult.error;
  } else {
    priority = priorityResult.priority;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { id, title, priority },
  };
}
