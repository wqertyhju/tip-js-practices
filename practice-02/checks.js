import assert from "node:assert/strict";
import { demoTasks, variantTasks } from "./src/data.js";
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
} from "./src/task-service.js";

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

// ===== createTask =====
check("createTask: обычный вызов", () => {
  const r = createTask(20, "Новая задача", "high");
  assert.equal(r.ok, true);
  assert.equal(r.task.id, 20);
  assert.equal(r.task.title, "Новая задача");
  assert.equal(r.task.completed, false);
  assert.equal(r.task.priority, "high");
});

check("createTask: приоритет не передан", () => {
  const r = createTask(20, "Задача");
  assert.equal(r.ok, true);
  assert.equal(r.task.priority, "medium");
});

check("createTask: приоритет undefined", () => {
  const r = createTask(20, "Задача", undefined);
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

check("createTask: два вызова — разные объекты", () => {
  const a = createTask(20, "A").task;
  const b = createTask(20, "A").task;
  assert.notEqual(a, b);
  assert.deepEqual(a, b);
});

// ===== findTaskById =====
check("findTaskById: находит по id=4", () => {
  const t = findTaskById(demoTasks, 4);
  assert.equal(t.id, 4);
  assert.equal(t.title, "Подготовить модель задач");
});

check("findTaskById: не находит", () => {
  assert.equal(findTaskById(demoTasks, 777), undefined);
  assert.equal(findTaskById(demoTasks, "4"), undefined);
  assert.equal(findTaskById([], 4), undefined);
});

// ===== getPendingTasks =====
check("getPendingTasks: демо", () => {
  const ids = getPendingTasks(demoTasks).map((t) => t.id);
  assert.deepEqual(ids, [4, 7]);
});

check("getPendingTasks: пустой и всё выполнено", () => {
  assert.deepEqual(getPendingTasks([]), []);
  const allDone = [{ id: 1, title: "A", completed: true, priority: "low" }];
  assert.deepEqual(getPendingTasks(allDone), []);
});

check("getPendingTasks: ничего не выполнено", () => {
  const allPending = [
    { id: 1, title: "A", completed: false, priority: "low" },
    { id: 2, title: "B", completed: false, priority: "low" },
  ];
  assert.equal(getPendingTasks(allPending).length, 2);
});

// ===== getTaskTitles =====
check("getTaskTitles: демо", () => {
  assert.deepEqual(getTaskTitles(demoTasks), [
    "Изучить функции",
    "Подготовить модель задач",
    "Проверить методы массивов",
    "Оформить README",
  ]);
});

check("getTaskTitles: пустой", () => {
  assert.deepEqual(getTaskTitles([]), []);
});

// ===== getTaskStats =====
check("getTaskStats: демо", () => {
  assert.deepEqual(getTaskStats(demoTasks), {
    total: 4, completed: 2, pending: 2, progress: 50,
  });
});

check("getTaskStats: пустой список", () => {
  assert.deepEqual(getTaskStats([]), {
    total: 0, completed: 0, pending: 0, progress: 0,
  });
});

check("getTaskStats: 4/0 и 4/4", () => {
  const none = [
    { id: 1, title: "A", completed: false, priority: "low" },
    { id: 2, title: "B", completed: false, priority: "low" },
    { id: 3, title: "C", completed: false, priority: "low" },
    { id: 4, title: "D", completed: false, priority: "low" },
  ];
  const all = none.map((t) => ({ ...t, completed: true }));
  assert.equal(getTaskStats(none).progress, 0);
  assert.equal(getTaskStats(all).progress, 100);
});

check("getTaskStats: 3 задачи, 1 выполнена", () => {
  const tasks = [
    { id: 1, title: "A", completed: true, priority: "low" },
    { id: 2, title: "B", completed: false, priority: "low" },
    { id: 3, title: "C", completed: false, priority: "low" },
  ];
  const s = getTaskStats(tasks);
  assert.equal(s.total, 3);
  assert.equal(s.completed, 1);
  assert.equal(s.pending, 2);
  assert.ok(Math.abs(s.progress - 33.3333333333) < 0.001);
});

// ===== addTask =====
check("addTask: успех в демо", () => {
  const original = demoTasks.map((t) => ({ ...t }));
  const r = addTask(demoTasks, 20, "Новая", "high");
  assert.equal(r.ok, true);
  assert.equal(r.tasks.length, 5);
  assert.equal(r.tasks[4].id, 20);
  assert.equal(demoTasks.length, 4);
  assert.deepEqual(demoTasks, original);
});

check("addTask: в пустой массив", () => {
  const r = addTask([], 20, "Первая");
  assert.equal(r.ok, true);
  assert.equal(r.tasks.length, 1);
});

check("addTask: существующий id", () => {
  const r = addTask(demoTasks, 4, "Дубликат");
  assert.equal(r.ok, false);
});

check("addTask: некорректный id", () => {
  assert.equal(addTask(demoTasks, 0, "A").ok, false);
  assert.equal(addTask(demoTasks, "20", "A").ok, false);
});

// ===== setTaskCompleted =====
check("setTaskCompleted: успех и обратно", () => {
  const r1 = setTaskCompleted(demoTasks, 4, true);
  assert.equal(r1.ok, true);
  assert.equal(r1.tasks.find((t) => t.id === 4).completed, true);
  assert.equal(demoTasks.find((t) => t.id === 4).completed, false);

  const r2 = setTaskCompleted(r1.tasks, 4, false);
  assert.equal(r2.ok, true);
  assert.equal(r2.tasks.find((t) => t.id === 4).completed, false);
});

check("setTaskCompleted: не-boolean", () => {
  for (const v of ["false", 0, null, undefined, 1]) {
    assert.equal(setTaskCompleted(demoTasks, 4, v).ok, false, `v=${v}`);
  }
});

check("setTaskCompleted: отсутствующая задача", () => {
  assert.equal(setTaskCompleted(demoTasks, 999, true).ok, false);
});

// ===== renameTask =====
check("renameTask: успех с нормализацией", () => {
  const r = renameTask(demoTasks, 10, "  Подготовить инструкцию  ");
  assert.equal(r.ok, true);
  const task = r.tasks.find((t) => t.id === 10);
  assert.equal(task.title, "Подготовить инструкцию");
  assert.equal(task.completed, true);
  assert.equal(task.priority, "medium");
});

check("renameTask: некорректное название", () => {
  assert.equal(renameTask(demoTasks, 10, "").ok, false);
  assert.equal(renameTask(demoTasks, 10, null).ok, false);
});

check("renameTask: отсутствующая задача", () => {
  assert.equal(renameTask(demoTasks, 999, "Новое").ok, false);
});

// ===== removeTask =====
check("removeTask: успех", () => {
  const r = removeTask(demoTasks, 7);
  assert.equal(r.ok, true);
  assert.deepEqual(r.tasks.map((t) => t.id), [1, 4, 10]);
  assert.equal(demoTasks.length, 4);
});

check("removeTask: единственная задача", () => {
  const one = [{ id: 1, title: "A", completed: false, priority: "low" }];
  const r = removeTask(one, 1);
  assert.equal(r.ok, true);
  assert.deepEqual(r.tasks, []);
});

check("removeTask: отсутствующая задача", () => {
  assert.equal(removeTask(demoTasks, 999).ok, false);
  assert.equal(removeTask([], 1).ok, false);
});

// ===== Отсутствие мутации =====
check("Нет мутации: setTaskCompleted создаёт новый объект", () => {
  const originalTask = demoTasks.find((t) => t.id === 4);
  const r = setTaskCompleted(demoTasks, 4, true);
  const newTask = r.tasks.find((t) => t.id === 4);
  assert.notEqual(newTask, originalTask);
  assert.equal(r.tasks, r.tasks);
  assert.notEqual(r.tasks, demoTasks);
});

check("Нет мутации: renameTask", () => {
  const r = renameTask(demoTasks, 10, "Новое имя");
  assert.notEqual(r.tasks, demoTasks);
  assert.notEqual(r.tasks.find((t) => t.id === 10), demoTasks.find((t) => t.id === 10));
});

// ===== Собственные проверки =====
check("Собственная: добавить после удаления", () => {
  const r1 = removeTask(demoTasks, 7);
  assert.equal(r1.ok, true);
  const r2 = addTask(r1.tasks, 20, "После удаления", "high");
  assert.equal(r2.ok, true);
  assert.deepEqual(r2.tasks.map((t) => t.id), [1, 4, 10, 20]);
});

check("Собственная: изменить первую и последнюю", () => {
  const r1 = setTaskCompleted(demoTasks, 1, false);
  assert.equal(r1.ok, true);
  const r2 = setTaskCompleted(r1.tasks, 10, false);
  assert.equal(r2.ok, true);
  assert.equal(r2.tasks.find((t) => t.id === 1).completed, false);
  assert.equal(r2.tasks.find((t) => t.id === 10).completed, false);
});

check("Собственная: последовательное обновление нескольких задач", () => {
  let cur = demoTasks;
  for (const id of [1, 4, 10]) {
    const r = setTaskCompleted(cur, id, true);
    assert.equal(r.ok, true);
    cur = r.tasks;
  }
  assert.deepEqual(getPendingTasks(cur).map((t) => t.id), [7]);
});

// ===== Вариант =====
check("Вариант: исходное состояние 6 задач", () => {
  assert.equal(variantTasks.length, 6);
  assert.deepEqual(variantTasks.map((t) => t.id), [11, 23, 37, 41, 58, 64]);
  assert.equal(variantTasks.filter((t) => t.completed).length, 2);
});

check("Вариант: полный сценарий", () => {
  let cur = variantTasks;
  const add = addTask(cur, 80, "Новое", "low");
  assert.equal(add.ok, true);
  cur = add.tasks;
  const upd = setTaskCompleted(cur, 11, true);
  assert.equal(upd.ok, true);
  cur = upd.tasks;
  const ren = renameTask(cur, 23, "Переименовано");
  assert.equal(ren.ok, true);
  cur = ren.tasks;
  const del = removeTask(cur, 37);
  assert.equal(del.ok, true);
  cur = del.tasks;
  assert.deepEqual(cur.map((t) => t.id), [11, 23, 41, 58, 64, 80]);
  assert.equal(variantTasks.length, 6);
  assert.deepEqual(variantTasks.map((t) => t.id), [11, 23, 37, 41, 58, 64]);
});

// ===== Итог =====
console.log(`\nПройдено: ${passed}, Провалено: ${failed}`);
if (failed > 0) process.exit(1);
