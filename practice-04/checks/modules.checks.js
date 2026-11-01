import assert from "node:assert/strict";
import { demoTasks } from "../src/data.js";
import { updateTask } from "../src/task-service.js";
import { validateTaskDraft } from "../src/form-validation.js";
import {
  isValidTaskList,
  loadTasks,
  saveTasks,
  removeSavedTasks,
} from "../src/task-storage.js";

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`OK  ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`FAIL ${name}`);
    console.log(`     ${error.message}`);
    failed += 1;
  }
}

function makeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    _data: data,
  };
}

// ===== updateTask =====

check("updateTask: изменение названия и приоритета невыполненной", () => {
  const r = updateTask(demoTasks, 4, "Подготовить форму задач", "low");
  assert.equal(r.ok, true);
  const task = r.tasks.find((t) => t.id === 4);
  assert.equal(task.title, "Подготовить форму задач");
  assert.equal(task.priority, "low");
  assert.equal(task.completed, false);
});

check("updateTask: сохранение completed для выполненной", () => {
  const r = updateTask(demoTasks, 1, "Изучить localStorage", "high");
  assert.equal(r.ok, true);
  const task = r.tasks.find((t) => t.id === 1);
  assert.equal(task.completed, true);
  assert.equal(task.title, "Изучить localStorage");
});

check("updateTask: удаление краевых пробелов", () => {
  const r = updateTask(demoTasks, 4, "  Новая задача  ", "medium");
  assert.equal(r.ok, true);
  assert.equal(r.tasks.find((t) => t.id === 4).title, "Новая задача");
});

check("updateTask: отсутствующая задача", () => {
  const r = updateTask(demoTasks, 999, "Новое", "low");
  assert.equal(r.ok, false);
});

check("updateTask: некорректный id", () => {
  assert.equal(updateTask(demoTasks, 0, "A", "low").ok, false);
  assert.equal(updateTask(demoTasks, "4", "A", "low").ok, false);
});

check("updateTask: пустое название", () => {
  assert.equal(updateTask(demoTasks, 4, "", "low").ok, false);
  assert.equal(updateTask(demoTasks, 4, "   ", "low").ok, false);
});

check("updateTask: неизвестный приоритет", () => {
  assert.equal(updateTask(demoTasks, 4, "A", "urgent").ok, false);
});

check("updateTask: не мутирует исходный массив", () => {
  const original = demoTasks.map((t) => ({ ...t }));
  const r = updateTask(demoTasks, 4, "Новое", "high");
  assert.notEqual(r.tasks, demoTasks);
  assert.deepEqual(demoTasks, original);
});

// ===== validateTaskDraft =====

check("validateTaskDraft: успех в режиме создания", () => {
  const r = validateTaskDraft({ id: "20", title: "Изучить localStorage", priority: "high" }, demoTasks);
  assert.equal(r.ok, true);
  assert.equal(r.value.id, 20);
  assert.equal(r.value.title, "Изучить localStorage");
  assert.equal(r.value.priority, "high");
});

check("validateTaskDraft: дубликат id", () => {
  const r = validateTaskDraft({ id: "4", title: "A", priority: "low" }, demoTasks);
  assert.equal(r.ok, false);
  assert.ok(r.errors.id);
});

check("validateTaskDraft: пустой id", () => {
  const r = validateTaskDraft({ id: "", title: "A", priority: "low" }, demoTasks);
  assert.equal(r.ok, false);
  assert.ok(r.errors.id);
});

check("validateTaskDraft: дробный id", () => {
  const r = validateTaskDraft({ id: "1.5", title: "A", priority: "low" }, demoTasks);
  assert.equal(r.ok, false);
  assert.ok(r.errors.id);
});

check("validateTaskDraft: пустое название", () => {
  const r = validateTaskDraft({ id: "20", title: "   ", priority: "low" }, demoTasks);
  assert.equal(r.ok, false);
  assert.ok(r.errors.title);
});

check("validateTaskDraft: название 101 символ", () => {
  const r = validateTaskDraft({ id: "20", title: "A".repeat(101), priority: "low" }, demoTasks);
  assert.equal(r.ok, false);
  assert.ok(r.errors.title);
});

check("validateTaskDraft: неверный приоритет", () => {
  const r = validateTaskDraft({ id: "20", title: "A", priority: "urgent" }, demoTasks);
  assert.equal(r.ok, false);
  assert.ok(r.errors.priority);
});

check("validateTaskDraft: несколько ошибок сразу", () => {
  const r = validateTaskDraft({ id: "", title: "", priority: "urgent" }, demoTasks);
  assert.equal(r.ok, false);
  assert.ok(r.errors.id);
  assert.ok(r.errors.title);
  assert.ok(r.errors.priority);
});

check("validateTaskDraft: редактирование использует editingId", () => {
  const r = validateTaskDraft({ id: "999", title: "Обновлено", priority: "high" }, demoTasks, 4);
  assert.equal(r.ok, true);
  assert.equal(r.value.id, 4);
});

check("validateTaskDraft: редактирование несуществующей", () => {
  const r = validateTaskDraft({ id: "1", title: "A", priority: "low" }, demoTasks, 999);
  assert.equal(r.ok, false);
  assert.ok(r.errors.id);
});

check("validateTaskDraft: редактирование не считает свой id дубликатом", () => {
  const r = validateTaskDraft({ id: "4", title: "A", priority: "low" }, demoTasks, 4);
  assert.equal(r.ok, true);
});

// ===== isValidTaskList =====

check("isValidTaskList: корректный массив", () => {
  assert.equal(isValidTaskList(demoTasks), true);
});

check("isValidTaskList: пустой массив", () => {
  assert.equal(isValidTaskList([]), true);
});

check("isValidTaskList: не массив", () => {
  assert.equal(isValidTaskList(null), false);
  assert.equal(isValidTaskList({}), false);
  assert.equal(isValidTaskList("text"), false);
});

check("isValidTaskList: дубликат id", () => {
  const bad = [
    { id: 1, title: "A", completed: false, priority: "low" },
    { id: 1, title: "B", completed: true, priority: "high" },
  ];
  assert.equal(isValidTaskList(bad), false);
});

check("isValidTaskList: неверный title", () => {
  const bad = [{ id: 1, title: "", completed: false, priority: "low" }];
  assert.equal(isValidTaskList(bad), false);
});

check("isValidTaskList: неверный completed", () => {
  const bad = [{ id: 1, title: "A", completed: "true", priority: "low" }];
  assert.equal(isValidTaskList(bad), false);
});

check("isValidTaskList: неверный priority", () => {
  const bad = [{ id: 1, title: "A", completed: false, priority: "urgent" }];
  assert.equal(isValidTaskList(bad), false);
});

// ===== loadTasks / saveTasks / removeSavedTasks =====

check("loadTasks: ключ отсутствует → initial", () => {
  const storage = makeStorage();
  const r = loadTasks(storage, "test-key", demoTasks);
  assert.equal(r.ok, true);
  assert.equal(r.source, "initial");
  assert.deepEqual(r.tasks.map((t) => t.id), [1, 4, 7, 10]);
});

check("loadTasks: корректная запись → storage", () => {
  const storage = makeStorage();
  saveTasks(storage, "test-key", demoTasks);
  const r = loadTasks(storage, "test-key", []);
  assert.equal(r.ok, true);
  assert.equal(r.source, "storage");
  assert.equal(r.tasks.length, 4);
});

check("loadTasks: повреждённый JSON → fallback", () => {
  const storage = makeStorage();
  storage.setItem("test-key", "{broken-json");
  const r = loadTasks(storage, "test-key", demoTasks);
  assert.equal(r.ok, false);
  assert.equal(r.source, "fallback");
  assert.ok(r.error);
  assert.equal(r.tasks.length, 4);
});

check("loadTasks: неверная версия → fallback", () => {
  const storage = makeStorage();
  storage.setItem("test-key", JSON.stringify({ version: 99, tasks: demoTasks }));
  const r = loadTasks(storage, "test-key", demoTasks);
  assert.equal(r.ok, false);
  assert.equal(r.source, "fallback");
});

check("loadTasks: некорректный массив внутри → fallback", () => {
  const storage = makeStorage();
  storage.setItem("test-key", JSON.stringify({ version: 1, tasks: [{ id: -1, title: "A", completed: false, priority: "low" }] }));
  const r = loadTasks(storage, "test-key", demoTasks);
  assert.equal(r.ok, false);
  assert.equal(r.source, "fallback");
});

check("saveTasks: корректные данные", () => {
  const storage = makeStorage();
  const r = saveTasks(storage, "test-key", demoTasks);
  assert.equal(r.ok, true);
  const raw = storage.getItem("test-key");
  const parsed = JSON.parse(raw);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.tasks.length, 4);
});

check("saveTasks: некорректные данные не записываются", () => {
  const storage = makeStorage();
  const r = saveTasks(storage, "test-key", [{ id: -1, title: "A", completed: false, priority: "low" }]);
  assert.equal(r.ok, false);
  assert.equal(storage.getItem("test-key"), null);
});

check("removeSavedTasks: удаляет ключ", () => {
  const storage = makeStorage();
  saveTasks(storage, "test-key", demoTasks);
  assert.ok(storage.getItem("test-key"));
  const r = removeSavedTasks(storage, "test-key");
  assert.equal(r.ok, true);
  assert.equal(storage.getItem("test-key"), null);
});

check("storage: исключение при getItem → fallback", () => {
  const badStorage = {
    getItem: () => { throw new Error("Access denied"); },
    setItem: () => {},
    removeItem: () => {},
  };
  const r = loadTasks(badStorage, "test-key", demoTasks);
  assert.equal(r.ok, false);
  assert.equal(r.source, "fallback");
});

check("storage: исключение при setItem → ok:false", () => {
  const badStorage = {
    getItem: () => null,
    setItem: () => { throw new Error("Quota exceeded"); },
    removeItem: () => {},
  };
  const r = saveTasks(badStorage, "test-key", demoTasks);
  assert.equal(r.ok, false);
});

// ===== Итог =====

console.log(`\nПроверок пройдено: ${passed}; не пройдено: ${failed}.`);
if (failed > 0) process.exit(1);
