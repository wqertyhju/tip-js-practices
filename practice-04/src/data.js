// Общий учебный набор (не меняется)
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Индивидуальный вариант
export const variantNumber = 3;

export const variantTasks = [
  { id: 11, title: "Собрать структуру сайта-портфолио", completed: true, priority: "high" },
  { id: 23, title: "Подготовить страницу «О себе»", completed: true, priority: "medium" },
  { id: 37, title: "Собрать галерею проектов", completed: false, priority: "high" },
  { id: 41, title: "Оформить страницу контактов", completed: false, priority: "low" },
  { id: 58, title: "Проверить адаптивность вёрстки", completed: false, priority: "medium" },
  { id: 64, title: "Опубликовать сайт-портфолио", completed: false, priority: "low" },
];

// Параметры новой задачи варианта
export const variantNewTask = {
  id: 80,
  title: "Добавить раздел с отзывами",
  priority: "low",
};
