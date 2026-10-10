"use strict";

const totalTasks = 9;
const completedTasks = 9;
const dailyLimit = 3;

if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом");
} else if (totalTasks < 0 || totalTasks > 1000) {
  console.log("Ошибка: totalTasks вне диапазона 0..1000");
} else if (completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: completedTasks вне диапазона 0..totalTasks");
} else if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: dailyLimit должен быть целым числом 1..1000");
} else {
  let remaining = totalTasks - completedTasks;

  if (remaining === 0) {
    console.log("Все задачи уже выполнены");
    console.log("Потребуется дней: 0");
  } else {
    console.log("Осталось задач:", remaining);
    let day = 0;

    while (remaining > 0) {
      day += 1;
      const today = Math.min(dailyLimit, remaining);
      remaining -= today;
      console.log(`День ${day}: выполнено ${today}, осталось ${remaining}`);
    }

    console.log("Потребуется дней:", day);
  }
}
