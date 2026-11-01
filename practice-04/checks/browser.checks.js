const resultsEl = document.querySelector("#results");
const summaryEl = document.querySelector("#summary");
const protocolEl = document.querySelector("#protocol");
const frame = document.querySelector("#app-frame");

let passed = 0;
let failed = 0;
const lines = [];

function log(name, ok, message = "") {
  const cls = ok ? "ok" : "fail";
  const mark = ok ? "OK  " : "FAIL";
  const line = `${mark} ${name}${message ? " — " + message : ""}`;
  lines.push(line);
  console.log(line);
  if (ok) passed += 1;
  else failed += 1;

  const p = document.createElement("p");
  p.className = cls;
  p.textContent = line;
  resultsEl.append(p);
}

function check(name, fn) {
  try {
    const result = fn();
    if (result === true) log(name, true);
    else if (typeof result === "string") log(name, false, result);
    else log(name, true);
  } catch (error) {
    log(name, false, error.message);
  }
}

function waitFrame() {
  return new Promise((resolve) => {
    if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
      resolve();
    } else {
      frame.addEventListener("load", () => resolve(), { once: true });
    }
  });
}

async function waitForSelector(selector, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = frame.contentDocument.querySelector(selector);
    if (el) return el;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

(async () => {
  await waitFrame();
  await waitForSelector("#task-list .task-card");

  const doc = () => frame.contentDocument;

  // Очищаем хранилище перед тестами (только для mode=check)
  frame.contentWindow.localStorage.removeItem("tip-js-practice-04:checks:demo");
  frame.contentWindow.location.reload();
  await waitFrame();
  await waitForSelector("#task-list .task-card");

  check("Карточки созданы (4 исходные задачи)", () => {
    const cards = doc().querySelectorAll("#task-list .task-card");
    return cards.length === 4 || `Найдено ${cards.length}`;
  });

  check("Кнопки edit присутствуют", () => {
    const edits = doc().querySelectorAll('button[data-action="edit"]');
    return edits.length === 4 || `Найдено ${edits.length}`;
  });

  // --- Добавление задачи ---
  doc().querySelector("#task-id").value = "20";
  doc().querySelector("#task-title").value = "Изучить localStorage";
  doc().querySelector("#task-priority").value = "high";
  doc().querySelector("#task-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

  check("Добавление: Всего стало 5", () => {
    const total = doc().querySelector('[data-stat="total"]').textContent;
    return total === "5" || `total=${total}`;
  });

  check("Добавление: Прогресс 40.0%", () => {
    const progress = doc().querySelector('[data-stat="progress"]').textContent;
    return progress === "40.0%" || `progress=${progress}`;
  });

  // --- Повторный ID ---
  doc().querySelector("#task-id").value = "4";
  doc().querySelector("#task-title").value = "Дубликат";
  doc().querySelector("#task-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

  check("Повторный id: ошибка у поля", () => {
    const error = doc().querySelector('[data-error-for="id"]').textContent;
    return error.includes("уже существует") || `error="${error}"`;
  });

  check("Повторный id: Всего осталось 5", () => {
    const total = doc().querySelector('[data-stat="total"]').textContent;
    return total === "5" || `total=${total}`;
  });

  // --- Редактирование ---
  const card4 = doc().querySelector('li[data-task-id="4"]');
  card4.querySelector('button[data-action="edit"]').click();

  check("Режим редактирования: id заблокирован", () => {
    return doc().querySelector("#task-id").disabled === true;
  });

  doc().querySelector("#task-title").value = "Подготовить форму";
  doc().querySelector("#task-priority").value = "low";
  doc().querySelector("#task-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

  check("Редактирование: название обновилось", () => {
    const title = doc().querySelector('li[data-task-id="4"] .task-title').textContent;
    return title === "Подготовить форму" || `title="${title}"`;
  });

  check("Редактирование: completed сохранился (false)", () => {
    const card = doc().querySelector('li[data-task-id="4"]');
    return card.classList.contains("is-completed") === false;
  });

  // --- Удаление ---
  doc().querySelector('li[data-task-id="20"] button[data-action="delete"]').click();

  check("Удаление: Всего стало 4", () => {
    const total = doc().querySelector('[data-stat="total"]').textContent;
    return total === "4" || `total=${total}`;
  });

  // --- Проверка localStorage ---
  check("localStorage: запись существует", () => {
    const raw = frame.contentWindow.localStorage.getItem("tip-js-practice-04:checks:demo");
    return raw !== null && raw.includes('"version":1') || `raw=${raw}`;
  });

  // --- Сброс ---
  doc().querySelector("#form-reset-storage").click();

  check("Сброс: вернулось 4 исходные задачи", () => {
    const cards = doc().querySelectorAll("#task-list .task-card");
    const total = doc().querySelector('[data-stat="total"]').textContent;
    return (cards.length === 4 && total === "4") || `cards=${cards.length}, total=${total}`;
  });

  check("Сброс: ключ удалён", () => {
    const raw = frame.contentWindow.localStorage.getItem("tip-js-practice-04:checks:demo");
    return raw === null || `raw=${raw}`;
  });

  summaryEl.textContent = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
  protocolEl.textContent = lines.join("\n");

  // Перезагружаем iframe в исходное состояние после проверок
  frame.contentWindow.localStorage.removeItem("tip-js-practice-04:checks:demo");
  frame.src = frame.src;
})();
