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

  check("Карточки созданы (4 задачи общего набора)", () => {
    const cards = doc().querySelectorAll("#task-list .task-card");
    return cards.length === 4 || `Найдено ${cards.length} карточек`;
  });

  check("data-task-id корректные", () => {
    const ids = Array.from(doc().querySelectorAll("#task-list .task-card"))
      .map((c) => c.dataset.taskId);
    return JSON.stringify(ids) === JSON.stringify(["1", "4", "7", "10"]) || `ids = ${ids}`;
  });

  check("Сводка: total = 4", () => {
    const v = doc().querySelector('[data-stat="total"]').textContent;
    return v === "4" || `total = ${v}`;
  });

  check("Сводка: progress = 50.0%", () => {
    const v = doc().querySelector('[data-stat="progress"]').textContent;
    return v === "50.0%" || `progress = ${v}`;
  });

  check("Сводка: visible = 4", () => {
    const v = doc().querySelector('[data-stat="visible"]').textContent;
    return v === "4" || `visible = ${v}`;
  });

  check("Кнопка фильтра «Все» активна", () => {
    const btn = doc().querySelector('button[data-filter="all"]');
    return btn.classList.contains("is-active") || "кнопка не активна";
  });

  check("Названия как текст (не HTML)", () => {
    const title = doc().querySelector("#task-list .task-title");
    return (title && title.children.length === 0) || "внутри заголовка есть HTML-элемент";
  });

  check("Кнопки toggle и delete присутствуют", () => {
    const toggle = doc().querySelectorAll('button[data-action="toggle"]');
    const del = doc().querySelectorAll('button[data-action="delete"]');
    return (toggle.length === 4 && del.length === 4) || `toggle=${toggle.length}, delete=${del.length}`;
  });

  check("Клик по фильтру «В работе» → 2 карточки", () => {
    doc().querySelector('button[data-filter="pending"]').click();
    const cards = doc().querySelectorAll("#task-list .task-card");
    return cards.length === 2 || `карточек ${cards.length}`;
  });

  check("Сводка не изменилась при фильтре", () => {
    const total = doc().querySelector('[data-stat="total"]').textContent;
    return total === "4" || `total = ${total}`;
  });

  check("Фильтр «Выполненные» → 2 карточки", () => {
    doc().querySelector('button[data-filter="completed"]').click();
    const cards = doc().querySelectorAll("#task-list .task-card");
    return cards.length === 2 || `карточек ${cards.length}`;
  });

  check("Фильтр «Все» → снова 4 карточки", () => {
    doc().querySelector('button[data-filter="all"]').click();
    const cards = doc().querySelectorAll("#task-list .task-card");
    return cards.length === 4 || `карточек ${cards.length}`;
  });

  check("Клик по toggle id=4 → сводка 75.0%", () => {
    const card = doc().querySelector('li[data-task-id="4"]');
    card.querySelector('button[data-action="toggle"]').click();
    const progress = doc().querySelector('[data-stat="progress"]').textContent;
    return progress === "75.0%" || `progress = ${progress}`;
  });

  check("Клик по delete id=7 → 3 карточки, total=3", () => {
    const card = doc().querySelector('li[data-task-id="7"]');
    card.querySelector('button[data-action="delete"]').click();
    const cards = doc().querySelectorAll("#task-list .task-card");
    const total = doc().querySelector('[data-stat="total"]').textContent;
    return (cards.length === 3 && total === "3") || `cards=${cards.length}, total=${total}`;
  });

  check("Повторный рендер не дублирует", () => {
    doc().querySelector('button[data-filter="all"]').click();
    doc().querySelector('button[data-filter="pending"]').click();
    doc().querySelector('button[data-filter="all"]').click();
    const cards = doc().querySelectorAll("#task-list .task-card");
    return cards.length === 3 || `карточек ${cards.length}`;
  });

  check("Пустое состояние: удаляем все карточки", () => {
    const cards = Array.from(doc().querySelectorAll("#task-list .task-card"));
    for (const card of cards) {
      card.querySelector('button[data-action="delete"]').click();
    }
    const remaining = doc().querySelectorAll("#task-list .task-card");
    return remaining.length === 0 || `осталось ${remaining.length}`;
  });

  check("Пустое состояние: показано «Список задач пуст.»", () => {
    const empty = doc().querySelector("#empty-state");
    return (empty.hidden === false && empty.textContent.includes("пуст")) || `hidden=${empty.hidden}, text="${empty.textContent}"`;
  });

  check("Сводка пустого списка: total=0, progress=0.0%", () => {
    const total = doc().querySelector('[data-stat="total"]').textContent;
    const progress = doc().querySelector('[data-stat="progress"]').textContent;
    return (total === "0" && progress === "0.0%") || `total=${total}, progress=${progress}`;
  });

  summaryEl.textContent = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
  protocolEl.textContent = lines.join("\n");

  frame.src = frame.src;
})();
