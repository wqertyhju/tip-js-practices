"use strict";

const totalTasks = 9;
const completedTasks = 9;

if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом");
} else if (totalTasks < 0 || totalTasks > 1000) {
  console.log("Ошибка: totalTasks вне диапазона 0..1000");
} else if (completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: completedTasks вне диапазона 0..totalTasks");
} else if (totalTasks === 0 && completedTasks === 0) {
  console.log("Задач пока нет");
} else {
  const remaining = totalTasks - completedTasks;
  const percent = (completedTasks / totalTasks) * 100;

  let status;
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  } else {
    status = "В работе";
  }

  console.log("Всего задач:", totalTasks);
  console.log("Выполнено:", completedTasks);
  console.log("Осталось:", remaining);
  console.log("Прогресс:", percent.toFixed(1) + "%");
  console.log("Статус:", status);
}
