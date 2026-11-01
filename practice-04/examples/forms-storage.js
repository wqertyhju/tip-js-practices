const KEY = "tip-js-practice-04:experiments";

function log(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = "Журнал: " + text;
  console.log(`[${id}] ${text}`);
}

// ==== Эксперимент 1: пустое обязательное название ====
const formEmpty = document.getElementById("form-empty");
formEmpty.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = formEmpty.querySelector('input[name="title"]');
  log("log-empty", `submit дошёл до обработчика. value="${input.value}", validity.valid=${input.validity.valid}, validationMessage="${input.validationMessage}"`);
});

// ==== Эксперимент 2: только пробелы + setCustomValidity ====
const formSpaces = document.getElementById("form-spaces");
formSpaces.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = formSpaces.querySelector('input[name="title"]');
  const raw = input.value;
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    input.setCustomValidity("Название не может состоять из пробелов");
    input.reportValidity();
    log("log-spaces", `required пропустил строку из пробелов. trim().length=0 → setCustomValidity. valid=${input.validity.valid}`);
    return;
  }
  input.setCustomValidity("");
  log("log-spaces", `Нормализованное название: "${trimmed}". valid=${input.validity.valid}`);
});

// ==== Эксперимент 3: сохранить корректные значения ====
const formSave = document.getElementById("form-save");
formSave.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(formSave);
  const rawId = formData.get("id");
  const rawTitle = formData.get("title");
  const rawPriority = formData.get("priority");
  const id = Number(rawId);
  const title = String(rawTitle).trim();
  const task = { id, title, priority: rawPriority, completed: false };
  localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [task] }));
  log("log-save", `FormData: id="${rawId}" (${typeof rawId}), title="${rawTitle}" (${typeof rawTitle}), priority="${rawPriority}". defaultPrevented=${event.defaultPrevented}. Сохранено: ${JSON.stringify(task)}`);
});

// ==== Эксперимент 4: прочитать сохранённое ====
document.getElementById("btn-read").addEventListener("click", () => {
  const raw = localStorage.getItem(KEY);
  if (raw === null) {
    log("log-read", "Ключ отсутствует, getItem вернул null");
    return;
  }
  const parsed = JSON.parse(raw);
  log("log-read", `getItem вернул строку длиной ${raw.length}. JSON.parse → ${typeof parsed}, version=${parsed.version}, задач: ${parsed.tasks.length}`);
});

// ==== Эксперимент 5: повреждённый JSON ====
document.getElementById("btn-broken").addEventListener("click", () => {
  localStorage.setItem(KEY, "{broken-json");
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    log("log-broken", `Неожиданно разобралось: ${JSON.stringify(parsed)}`);
  } catch (error) {
    log("log-broken", `JSON.parse выбросил: ${error.message}. Нужен try/catch и fallback.`);
  }
});
