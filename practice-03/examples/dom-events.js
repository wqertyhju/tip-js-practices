// ============ ЭКСПЕРИМЕНТ 1 ============
console.log("=== Эксперимент 1 ===");

const missing = document.querySelector("#missing-element");
const emptyCollection = document.querySelectorAll(".missing-class");

console.log("missing:", missing, "| typeof:", typeof missing);
console.log("emptyCollection:", emptyCollection, "| length:", emptyCollection.length);
console.log("emptyCollection.length === 0:", emptyCollection.length === 0);

try {
  missing.textContent = "попытка";
} catch (error) {
  console.log("Ошибка при обращении к missing:", error.message);
}

// ============ ЭКСПЕРИМЕНТ 2 ============
console.log("\n=== Эксперимент 2 ===");

const datasetButton = document.querySelector("#dataset-button");
const raw = datasetButton.dataset.taskId;
console.log("dataset.taskId =", raw, "| typeof:", typeof raw);

const numeric = Number(raw);
console.log("Number(dataset.taskId) =", numeric, "| typeof:", typeof numeric);
console.log("Number.isSafeInteger:", Number.isSafeInteger(numeric));

// ============ ЭКСПЕРИМЕНТ 3 ============
console.log("\n=== Эксперимент 3 ===");

const itemsContainer = document.querySelector("#items-container");
const initialItems = document.querySelectorAll(".item");
console.log("initialItems.length (сохранённая коллекция):", initialItems.length);

const addButton = document.querySelector("#add-item-button");
let counter = initialItems.length;

addButton.addEventListener("click", () => {
  counter += 1;
  const newItem = document.createElement("div");
  newItem.className = "item";
  newItem.textContent = `Запись ${counter}`;
  itemsContainer.append(newItem);

  const freshItems = document.querySelectorAll(".item");
  console.log(
    `После добавления: initialItems.length = ${initialItems.length}, freshItems.length = ${freshItems.length}`
  );
});

// ============ ЭКСПЕРИМЕНТ 4 ============
console.log("\n=== Эксперимент 4 ===");

const titleTarget = document.createElement("div");
titleTarget.id = "title-target";
titleTarget.textContent = "Старый заголовок";
const changeSection = document.querySelectorAll("section")[3];
changeSection.append(titleTarget);

const changeButton = document.querySelector("#change-title-button");

changeButton.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.id === "click-target") {
    console.log("Нажатие именно на вложенный span #click-target");
  }

  const value = "<strong>Проверка</strong> & \"кавычки\"";
  titleTarget.textContent = value;

  console.log("titleTarget.textContent =", titleTarget.textContent);
  console.log("titleTarget.querySelector('strong') =", titleTarget.querySelector("strong"));
  console.log("Внутри #title-target HTML-элементов:", titleTarget.children.length);
});

// ============ ЭКСПЕРИМЕНТ 5 ============
console.log("\n=== Эксперимент 5 ===");

const bubbleButton = document.querySelector("#bubble-button");
const bubbleTarget = document.querySelector("#bubble-target");

bubbleButton.addEventListener("click", (event) => {
  console.log("--- Обработчик кнопки (bubbling) ---");
  console.log("event.type:", event.type);
  console.log("event.eventPhase:", event.eventPhase);
  console.log("event.target.id:", event.target.id);
  console.log("event.currentTarget.id:", event.currentTarget.id);
});

bubbleButton.addEventListener(
  "click",
  (event) => {
    console.log("--- Захват (capture) на кнопке ---");
    console.log("event.eventPhase:", event.eventPhase);
    console.log("event.target.id:", event.target.id);
    console.log("event.currentTarget.id:", event.currentTarget.id);
  },
  true
);

bubbleTarget.addEventListener("click", (event) => {
  console.log("--- Цель (target) ---");
  console.log("event.eventPhase:", event.eventPhase);
  console.log("event.target.id:", event.target.id);
  console.log("event.currentTarget.id:", event.currentTarget.id);
});

console.log("Открой страницу и нажимай кнопки. Всё выводится в консоль.");
