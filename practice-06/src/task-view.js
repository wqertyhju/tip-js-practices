const PRIORITY_LABELS = { low: "Низкий", medium: "Средний", high: "Высокий" };

export function createTaskElement(task, categories) {
  const li = document.createElement("li");
  li.className = "task-card";
  li.dataset.taskId = String(task.id);
  if (task.completed) li.classList.add("is-completed");

  const h3 = document.createElement("h3");
  h3.className = "task-title";
  h3.textContent = task.title;
  li.append(h3);

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";
  meta.append(status);

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.dataset.priority = task.priority;
  priority.textContent = PRIORITY_LABELS[task.priority] || task.priority;
  meta.append(priority);

  const cat = categories.find(c => c.id === task.categoryId);
  if (cat) {
    const catEl = document.createElement("span");
    catEl.className = "task-category";
    catEl.textContent = cat.name;
    meta.append(catEl);
  }

  li.append(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.dataset.action = "toggle";
  toggleBtn.setAttribute("aria-pressed", task.completed ? "true" : "false");
  toggleBtn.innerHTML = '<span class="action-label">Выполнена</span>';
  actions.append(toggleBtn);

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.dataset.action = "edit";
  editBtn.innerHTML = '<span class="action-label">Изменить</span>';
  actions.append(editBtn);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.dataset.action = "delete";
  delBtn.innerHTML = '<span class="action-label">Удалить</span>';
  actions.append(delBtn);

  li.append(actions);
  return li;
}

export function renderTaskList(container, tasks, categories) {
  const cards = tasks.map(t => createTaskElement(t, categories));
  container.replaceChildren(...cards);
}
