// Эксперимент 1: sum с числами и со строкой
function sum(a, b) {
  return a + b;
}
console.log("1)", sum(2, 3), "| typeof:", typeof sum(2, 3));
console.log("1)", sum("2", 3), "| typeof:", typeof sum("2", 3));

// Эксперимент 2: стрелочная функция с телом и без return (исправлено)
const square = (n) => {
  return n * n;
};
console.log("2)", square(4), "| typeof:", typeof square(4));

// Эксперимент 3: объект и вторая ссылка
const original = { title: "Черновик", published: false };
const alias = original;
alias.published = true;
console.log("3) original.published =", original.published);
console.log("3) original === alias:", original === alias);

// Эксперимент 4: копирование массива объектов через spread
const items = [
  { id: 1, name: "Первый" },
  { id: 2, name: "Второй" },
];
const copyItems = [...items];
copyItems[0].name = "Изменённый";
console.log("4) items[0].name =", items[0].name);
console.log("4) items === copyItems:", items === copyItems);
console.log("4) items[0] === copyItems[0]:", items[0] === copyItems[0]);

// Эксперимент 5: spread объекта и повторное указание свойства
const oldBook = { id: 12, title: "Черновик", available: false };
const newBook = { ...oldBook, available: true };
console.log("5) oldBook.available =", oldBook.available);
console.log("5) newBook.available =", newBook.available);
console.log("5) oldBook === newBook:", oldBook === newBook);

// Эксперимент 6: параметр по умолчанию
function makeCaption(text = "Без названия") {
  return text;
}
console.log("6)", makeCaption());
console.log("6)", makeCaption(undefined));
console.log("6)", makeCaption(null));
console.log("6)", makeCaption(""));
console.log("6)", makeCaption(0));
