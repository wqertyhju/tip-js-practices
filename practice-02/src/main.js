import { demoTasks, variantTasks, variantNumber, variantNewTask } from "./data.js";
import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

function printTasks(label, tasks) {
  console.log(`\n=== ${label} ===`);
  for (const task of tasks) {
    const mark = task.completed ? "[x]" : "[ ]";
    console.log(`${mark} #${task.id} (${task.priority}) ${task.title}`);
  }
}

function printStats(tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

// ===== ОБЩИЙ СЦЕНАРИЙ =====
console.log("########## ОБЩИЙ СЦЕНАРИЙ ##########");

let current = demoTasks;
printTasks("Исходные задачи (demoTasks)", current);

console.log("\nНазвания задач:", getTaskTitles(current));
console.log("Невыполненные id:", getPendingTasks(current).map((t) => t.id));
printStats(current);

console.log("\n--- Добавляем задачу id = 20 ---");
let result = addTask(current, 20, "Добавить проверку", "high");
if (result.ok) {
  current = result.tasks;
  console.log("OK: добавлено");
} else {
  console.log(`Ошибка: ${result.error}`);
}
printStats(current);

console.log("\n--- Ставим completed = true для id = 4 ---");
result = setTaskCompleted(current, 4, true);
if (result.ok) {
  current = result.tasks;
  console.log("OK: статус обновлён");
} else {
  console.log(`Ошибка: ${result.error}`);
}
printStats(current);

console.log("\n--- Переименовываем id = 10 ---");
result = renameTask(current, 10, "Подготовить инструкцию запуска");
if (result.ok) {
  current = result.tasks;
  console.log("OK: переименовано");
} else {
  console.log(`Ошибка: ${result.error}`);
}
printStats(current);

console.log("\n--- Удаляем id = 7 ---");
result = removeTask(current, 7);
if (result.ok) {
  current = result.tasks;
  console.log("OK: удалено");
} else {
  console.log(`Ошибка: ${result.error}`);
}
printStats(current);

console.log("\n--- Пробуем добавить id = 20 ещё раз (ожидаем отказ) ---");
result = addTask(current, 20, "Дубликат", "low");
if (result.ok) {
  console.log("Неожиданно: добавлено");
} else {
  console.log(`Ошибка: ${result.error}`);
}
console.log("Состояние после отказа не изменилось. Всего:", current.length);

console.log("\nИтоговые id:", current.map((t) => t.id));
console.log("demoTasks после всех операций:", demoTasks.map((t) => t.id));

// ===== ИНДИВИДУАЛЬНЫЙ ВАРИАНТ =====
console.log(`\n########## ВАРИАНТ ${variantNumber} ##########`);

let variantCurrent = variantTasks;
printTasks("Исходные задачи варианта", variantCurrent);
printStats(variantCurrent);

console.log(`\n--- Добавляем id = ${variantNewTask.id} ---`);
result = addTask(variantCurrent, variantNewTask.id, variantNewTask.title, variantNewTask.priority);
if (result.ok) {
  variantCurrent = result.tasks;
  console.log("OK: добавлено");
} else {
  console.log(`Ошибка: ${result.error}`);
}
printStats(variantCurrent);

console.log("\n--- Ставим completed = true для id = 11 ---");
result = setTaskCompleted(variantCurrent, 11, true);
if (result.ok) {
  variantCurrent = result.tasks;
  console.log("OK: статус обновлён");
} else {
  console.log(`Ошибка: ${result.error}`);
}
printStats(variantCurrent);

console.log("\n--- Переименовываем id = 23 ---");
result = renameTask(variantCurrent, 23, "Подготовить страницу «О себе» и контакты");
if (result.ok) {
  variantCurrent = result.tasks;
  console.log("OK: переименовано");
} else {
  console.log(`Ошибка: ${result.error}`);
}
printStats(variantCurrent);

console.log("\n--- Удаляем id = 37 ---");
result = removeTask(variantCurrent, 37);
if (result.ok) {
  variantCurrent = result.tasks;
  console.log("OK: удалено");
} else {
  console.log(`Ошибка: ${result.error}`);
}
printStats(variantCurrent);

console.log(`\n--- Повторно добавляем id = ${variantNewTask.id} (ожидаем отказ) ---`);
result = addTask(variantCurrent, variantNewTask.id, "Дубликат", "medium");
if (result.ok) {
  console.log("Неожиданно: добавлено");
} else {
  console.log(`Ошибка: ${result.error}`);
}

console.log("\nИтоговые id варианта:", variantCurrent.map((t) => t.id));
console.log("variantTasks сохранил исходные id:", variantTasks.map((t) => t.id));
