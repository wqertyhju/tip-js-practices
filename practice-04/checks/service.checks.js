import assert from "node:assert/strict";
import { demoTasks, variantTasks } from "../src/data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "../src/task-service.js";

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

check("createTask: обычный вызов", () => {
  const r = createTask(20, "Новая задача", "high");
  assert.equal(r.ok, true);
  assert.equal(r.task.id, 20);
  assert.equal(r.task.completed, false);
  assert.equal(r.task.priority, "high");
});

check("createTask: приоритет по умолчанию", () => {
  const r = createTask(20, "Задача");
  assert.equal(r.ok, true);
  assert.equal(r.task.priority, "medium");
});

check("createTask: нормализация пробелов", () => {
  const r = createTask(20, "  Проверить  данные  ");
  assert.equal(r.ok, true);
  assert.equal(r.task.title, "Проверить  данные");
});

check("createTask: длина 1 и 100", () => {
  assert.equal(createTask(20, "A").ok, true);
  assert.equal(createTask(20, "A".repeat(100)).ok, true);
});

check("createTask: пустая строка/пробелы/101", () => {
  assert.equal(createTask(20, "").ok, false);
  assert.equal(createTask(20, "   ").ok, false);
  assert.equal(createTask(20, "A".repeat(101)).ok, false);
});

check("createTask: не-строка в title", () => {
  assert.equal(createTask(20, 42).ok, false);
  assert.equal(createTask(20, null).ok, false);
  assert.equal(createTask(20, undefined).ok, false);
});

check("createTask: неверные id", () => {
  for (const id of [0, -1, 1.5, "4", NaN, Infinity, null, undefined]) {
    assert.equal(createTask(id, "Задача").ok, false, `id=${id}`);
  }
});

check("createTask: границы id", () => {
  assert.equal(createTask(Number.MAX_SAFE_INTEGER, "A").ok, true);
  assert.equal(createTask(Number.MAX_SAFE_INTEGER + 1, "A").ok, false);
});

check("createTask: неверный priority", () => {
  for (const p of ["urgent", "HIGH", " high ", null, 1]) {
    assert.equal(createTask(20, "Задача", p).ok, false, `priority=${p}`);
  }
});

check("findTaskById: находит и не находит", () => {
  assert.equal(findTaskById(demoTasks, 4).id, 4);
  assert.equal(findTaskById(demoTasks, 777), undefined);
  assert.equal(findTaskById(demoTasks, "4"), undefined);
});

check("getPendingTasks: демо", () => {
  assert.deepEqual(getPendingTasks(demoTasks).map((t) => t.id), [4, 7]);
});

check("getPendingTasks: пустой и всё выполнено", () => {
  assert.deepEqual(getPendingTasks([]), []);
});

check("getTaskTitles: демо и пустой", () => {
  assert.equal(getTaskTitles(demoTasks).length, 4);
  assert.deepEqual(getTaskTitles([]), []);
});

check("getTaskStats: демо", () => {
  assert.deepEqual(getTaskStats(demoTasks), {
    total: 4, completed: 2, pending: 2, progress: 50,
  });
});

check("getTaskStats: пустой", () => {
  assert.deepEqual(getTaskStats([]), {
    total: 0, completed: 0, pending: 0, progress: 0,
  });
});

check("addTask: успех в демо", () => {
  const r = addTask(demoTasks, 20, "Новая", "high");
  assert.equal(r.ok, true);
  assert.equal(r.tasks.length, 5);
  assert.equal(demoTasks.length, 4);
});

check("addTask: дубликат id", () => {
  assert.equal(addTask(demoTasks, 4, "Дубликат").ok, false);
});

check("addTask: в пустой массив", () => {
  const r = addTask([], 20, "Первая");
  assert.equal(r.ok, true);
  assert.equal(r.tasks.length, 1);
});

check("setTaskCompleted: успех и обратно", () => {
  const r1 = setTaskCompleted(demoTasks, 4, true);
  assert.equal(r1.ok, true);
  assert.equal(r1.tasks.find((t) => t.id === 4).completed, true);
  assert.equal(demoTasks.find((t) => t.id === 4).completed, false);
});

check("setTaskCompleted: не-boolean", () => {
  for (const v of ["false", 0, null, undefined, 1]) {
    assert.equal(setTaskCompleted(demoTasks, 4, v).ok, false);
  }
});

check("setTaskCompleted: отсутствующая", () => {
  assert.equal(setTaskCompleted(demoTasks, 999, true).ok, false);
});

check("renameTask: успех с нормализацией", () => {
  const r = renameTask(demoTasks, 10, "  Подготовить инструкцию  ");
  assert.equal(r.ok, true);
  const task = r.tasks.find((t) => t.id === 10);
  assert.equal(task.title, "Подготовить инструкцию");
  assert.equal(task.completed, true);
});

check("renameTask: некорректное название", () => {
  assert.equal(renameTask(demoTasks, 10, "").ok, false);
  assert.equal(renameTask(demoTasks, 10, null).ok, false);
});

check("renameTask: отсутствующая", () => {
  assert.equal(renameTask(demoTasks, 999, "Новое").ok, false);
});

check("removeTask: успех", () => {
  const r = removeTask(demoTasks, 7);
  assert.equal(r.ok, true);
  assert.deepEqual(r.tasks.map((t) => t.id), [1, 4, 10]);
  assert.equal(demoTasks.length, 4);
});

check("removeTask: единственная", () => {
  const one = [{ id: 1, title: "A", completed: false, priority: "low" }];
  const r = removeTask(one, 1);
  assert.equal(r.ok, true);
  assert.deepEqual(r.tasks, []);
});

check("removeTask: отсутствующая", () => {
  assert.equal(removeTask(demoTasks, 999).ok, false);
  assert.equal(removeTask([], 1).ok, false);
});

check("Нет мутации: setTaskCompleted", () => {
  const orig = demoTasks.find((t) => t.id === 4);
  const r = setTaskCompleted(demoTasks, 4, true);
  assert.notEqual(r.tasks.find((t) => t.id === 4), orig);
  assert.notEqual(r.tasks, demoTasks);
});

check("Нет мутации: renameTask", () => {
  const r = renameTask(demoTasks, 10, "Новое имя");
  assert.notEqual(r.tasks, demoTasks);
});

check("Собственная: добавить после удаления", () => {
  const r1 = removeTask(demoTasks, 7);
  const r2 = addTask(r1.tasks, 20, "После удаления", "high");
  assert.deepEqual(r2.tasks.map((t) => t.id), [1, 4, 10, 20]);
});

check("Собственная: изменить первую и последнюю", () => {
  const r1 = setTaskCompleted(demoTasks, 1, false);
  const r2 = setTaskCompleted(r1.tasks, 10, false);
  assert.equal(r2.tasks.find((t) => t.id === 1).completed, false);
  assert.equal(r2.tasks.find((t) => t.id === 10).completed, false);
});

check("Собственная: последовательное обновление", () => {
  let cur = demoTasks;
  for (const id of [1, 4, 10]) {
    cur = setTaskCompleted(cur, id, true).tasks;
  }
  assert.deepEqual(getPendingTasks(cur).map((t) => t.id), [7]);
});

check("Вариант: исходное состояние", () => {
  assert.equal(variantTasks.length, 6);
  assert.deepEqual(variantTasks.map((t) => t.id), [11, 23, 37, 41, 58, 64]);
  assert.equal(variantTasks.filter((t) => t.completed).length, 2);
});

check("Вариант: полный сценарий", () => {
  let cur = variantTasks;
  cur = addTask(cur, 80, "Новое", "low").tasks;
  cur = setTaskCompleted(cur, 11, true).tasks;
  cur = renameTask(cur, 23, "Переименовано").tasks;
  cur = removeTask(cur, 37).tasks;
  assert.deepEqual(cur.map((t) => t.id), [11, 23, 41, 58, 64, 80]);
  assert.deepEqual(variantTasks.map((t) => t.id), [11, 23, 37, 41, 58, 64]);
});

console.log(`\nВсего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`);
if (failed > 0) process.exit(1);
