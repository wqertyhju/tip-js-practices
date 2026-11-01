function getProgressSummary(totalTasks, completedTasks) {
    if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
        return "Ошибка: значения должны быть целыми числами";
    }
    if (totalTasks < 0 || totalTasks > 1000) {
        return "Ошибка: totalTasks должно быть в диапазоне 0..1000";
    }
    if (completedTasks < 0 || completedTasks > totalTasks) {
        return "Ошибка: completedTasks должно быть в диапазоне 0..totalTasks";
    }
    if (totalTasks === 0 && completedTasks === 0) {
        return "Задач пока нет";
    }
    const remaining = totalTasks - completedTasks;
    const percent = ((completedTasks / totalTasks) * 100).toFixed(1);
    let status;
    if (completedTasks === 0) {
        status = "Не начато";
    } else if (completedTasks === totalTasks) {
        status = "Завершено";
    } else {
        status = "В работе";
    }
    return `Осталось: ${remaining}, Прогресс: ${percent}%, Статус: ${status}`;
}

console.log("(12, 5):", getProgressSummary(12, 5));
console.log("(0, 0):", getProgressSummary(0, 0));
console.log("(5, 6):", getProgressSummary(5, 6));
