export function validateTaskDraft(draft, categories) {
  const errors = {};
  let title = "";

  if (typeof draft.title !== "string") errors.title = "Название должно быть строкой";
  else {
    title = draft.title.trim();
    if (title.length < 1 || title.length > 100) errors.title = "Название должно быть от 1 до 100 символов";
  }

  if (!["low", "medium", "high"].includes(draft.priority)) {
    errors.priority = "Неверный приоритет";
  }

  const catId = Number(draft.categoryId);
  if (!Number.isSafeInteger(catId) || catId <= 0) errors.categoryId = "Неверный id категории";
  else if (!categories.some(c => c.id === catId)) errors.categoryId = "Категория не найдена";

  return {
    valid: Object.keys(errors).length === 0,
    value: { title, priority: draft.priority, categoryId: catId },
    errors
  };
}
