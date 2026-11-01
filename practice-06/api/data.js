export const initialTasks = [
  { id: 1, title: "Изучить fetch", completed: true, priority: "medium", categoryId: 1 },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high", categoryId: 2 },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low", categoryId: 1 },
  { id: 10, title: "Оформить README", completed: true, priority: "medium", categoryId: 3 },
  { id: 13, title: "Проверить API", completed: false, priority: "high", categoryId: 1 },
  { id: 16, title: "Настроить сервер", completed: true, priority: "high", categoryId: 2 },
  { id: 19, title: "Изучить Promise", completed: false, priority: "medium", categoryId: 3 }
];

export const categories = [
  { id: 1, name: "Учебное" },
  { id: 2, name: "Проект" },
  { id: 3, name: "Документация" }
];

export const getFreshTasks = () => initialTasks.map(t => ({ ...t }));
