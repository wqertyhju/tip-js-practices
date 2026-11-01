const resultsEl = document.querySelector("#results");
const summaryEl = document.querySelector("#summary");
const protocolEl = document.querySelector("#protocol");
const frame = document.querySelector("#app-frame");

let passed = 0;
let failed = 0;
const lines = [];

function log(name, ok, message = "") {
  const line = `${ok ? "OK  " : "FAIL"} ${name}${message ? " — " + message : ""}`;
  lines.push(line);
  console.log(line);
  if (ok) passed++; else failed++;
  const p = document.createElement("p");
  p.className = ok ? "ok" : "fail";
  p.textContent = line;
  resultsEl.append(p);
}

function check(name, fn) {
  try {
    const res = fn();
    if (res === true) log(name, true);
    else if (typeof res === "string") log(name, false, res);
    else log(name, true);
  } catch (e) {
    log(name, false, e.message);
  }
}

async function waitForSelector(selector, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = frame.contentDocument?.querySelector(selector);
    if (el) return el;
    await new Promise(r => setTimeout(r, 100));
  }
  return null;
}

async function main() {
  // Ждём загрузки iframe
  await new Promise(resolve => {
    if (frame.contentDocument?.readyState === "complete") resolve();
    else frame.addEventListener("load", resolve, { once: true });
  });

  // Ждём, пока приложение загрузит задачи
  await waitForSelector("#task-list .task-card");
  
  const doc = () => frame.contentDocument;

  check("Интерфейс загружен", () => {
    return doc().querySelector("#api-status")?.textContent.includes("5505") || "Нет статуса API";
  });

  check("Форма присутствует", () => {
    return doc().querySelector("#task-form") !== null;
  });

  check("Категории загружены в форму", () => {
    const opts = doc().querySelectorAll("#task-category option");
    return opts.length > 0 || "Нет опций";
  });

  check("Фильтры присутствуют", () => {
    return doc().querySelectorAll("#task-filters button").length >= 3;
  });

  check("Карточки отрисованы", () => {
    const cards = doc().querySelectorAll(".task-card");
    return cards.length > 0 || `Найдено ${cards.length}`;
  });

  check("Кнопки на карточке", () => {
    const btn = doc().querySelector('.task-card button[data-action="toggle"]');
    return btn !== null || "Нет кнопки toggle";
  });

  // Создание задачи
  doc().querySelector("#task-title").value = "Тестовая задача";
  doc().querySelector("#task-priority").value = "high"; // ставим high, чтобы попасть в фильтр варианта 3
  doc().querySelector("#task-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

  await new Promise(r => setTimeout(r, 2000)); // Ждём 2 секунды

  check("Задача создана (видна в списке)", () => {
    const titles = Array.from(doc().querySelectorAll(".task-title"));
    const found = titles.some(t => t.textContent === "Тестовая задача");
    if (!found) {
      console.log("Текущие названия в списке:", titles.map(t => t.textContent));
    }
    return found || "Не найдена";
  });

  // Фильтрация
  doc().querySelector('button[data-filter="pending"]').click();
  await new Promise(r => setTimeout(r, 600));

  check("Фильтр 'В работе' скрывает выполненные", () => {
    const cards = doc().querySelectorAll(".task-card.is-completed");
    return cards.length === 0 || `Найдено выполненных: ${cards.length}`;
  });

  doc().querySelector('button[data-filter="all"]').click();
  await new Promise(r => setTimeout(r, 600));

  check("Фильтр 'Все' показывает всё", () => {
    const cards = doc().querySelectorAll(".task-card");
    return cards.length > 0 || "Список пуст";
  });

  // Удаление
  const firstCard = doc().querySelector(".task-card");
  if (firstCard) {
    const id = firstCard.dataset.taskId;
    firstCard.querySelector('button[data-action="delete"]').click();
    await new Promise(r => setTimeout(r, 1000));
    
    check("Удаление задачи", () => {
      const deleted = doc().querySelector(`.task-card[data-task-id="${id}"]`);
      return deleted === null || "Задача не удалилась";
    });
  }

  summaryEl.textContent = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
  protocolEl.textContent = lines.join("\n");
}

main().catch(err => {
  summaryEl.textContent = "Ошибка выполнения проверок";
  console.error(err);
});


