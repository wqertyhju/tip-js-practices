import { renderTaskList } from "./task-view.js";

export function createDomView(doc) {
  const listEl = doc.querySelector("#task-list");
  const summaryEl = doc.querySelector("#task-summary");
  const emptyEl = doc.querySelector("#empty-state");
  const messageEl = doc.querySelector("#operation-message");
  const filterEl = doc.querySelector("#task-filters");
  const formEl = doc.querySelector("#task-form");
  
  return {
    setLoading(isLoading) {
      listEl.setAttribute("aria-busy", isLoading ? "true" : "false");
      if (isLoading) {
        listEl.innerHTML = "<li>Загрузка...</li>";
        emptyEl.hidden = true;
        summaryEl.hidden = true;
      } else {
        summaryEl.hidden = false;
      }
    },
    renderTasks(tasks, categories) {
      emptyEl.hidden = true;
      renderTaskList(listEl, tasks, categories);
      const total = tasks.length;
      summaryEl.textContent = `Показано задач: ${total}`;
    },
    renderEmpty() {
      listEl.replaceChildren();
      emptyEl.hidden = false;
      emptyEl.textContent = "Задач по выбранному фильтру нет.";
      summaryEl.textContent = "Показано задач: 0";
    },
    renderError(message, retryCb) {
      listEl.replaceChildren();
      emptyEl.hidden = false;
      emptyEl.innerHTML = `<span style="color:red">Ошибка: ${message}</span> `;
      const btn = doc.createElement("button");
      btn.textContent = "Повторить";
      btn.addEventListener("click", retryCb);
      emptyEl.append(btn);
      summaryEl.textContent = "Показано задач: 0";
    },
    notify(message, type) {
      messageEl.textContent = message;
      messageEl.style.color = type === "error" ? "#b00020" : "#2e7d32";
    },
    setMutationPending(isPending) {
      const btns = formEl.querySelectorAll("button");
      for (const b of btns) b.disabled = isPending;
    },
    fillForm(task) {
      formEl.querySelector("#task-title").value = task.title;
      formEl.querySelector("#task-priority").value = task.priority;
      formEl.querySelector("#task-category").value = String(task.categoryId);
      formEl.querySelector("#form-title").textContent = "Редактирование";
    },
    resetForm() {
      formEl.reset();
      formEl.querySelector("#form-title").textContent = "Добавление задачи";
    },
    setCategories(categories) {
      const select = formEl.querySelector("#task-category");
      select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
      
      const filterSelect = filterEl.querySelector("#filter-category");
      if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Все</option>' + 
          categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
      }
    }
  };
}
