export function createAppController({ api, view }) {
  let tasks = [];
  let categories = [];
  let filters = {};
  let editingId = null;
  let abortController = null;
  let seq = 0;

  function messageForError(error) {
    if (error.kind === "network") return "Сервер недоступен. Проверьте соединение.";
    if (error.kind === "http") return `Ошибка сервера: ${error.code || error.status}`;
    if (error.kind === "timeout") return "Превышено время ожидания.";
    return "Неизвестная ошибка.";
  }

  async function loadCurrentTasks(isInitial = false) {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const currentSeq = ++seq;
    const signal = abortController.signal;

    view.setLoading(true);
    try {
      let result;
      if (isInitial || categories.length === 0) {
        result = await api.loadInitialData(filters, { signal });
        categories = result.categories;
      } else {
        result = await api.getTasks(filters, { signal });
      }

      if (currentSeq !== seq) return; // Устаревший ответ
      
      tasks = result.tasks;
      view.setLoading(false);
      
      if (tasks.length === 0) view.renderEmpty();
      else view.renderTasks(tasks, categories);
      
    } catch (error) {
      if (error.kind === "aborted") return;
      if (currentSeq !== seq) return;
      view.setLoading(false);
      view.renderError(messageForError(error), () => loadCurrentTasks(isInitial));
    }
  }

  return {
    async start(initialFilters) {
      filters = initialFilters;
      await loadCurrentTasks(true);
    },
    async applyFilters(newFilters) {
      filters = newFilters;
      await loadCurrentTasks(false);
    },
    async refresh() {
      await loadCurrentTasks(false);
    },
    async beginEdit(id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        editingId = id;
        view.fillForm(task);
      }
    },
    cancelEdit() {
      editingId = null;
      view.resetForm();
    },
    async submit(draft) {
      const isEdit = editingId !== null;
      view.setMutationPending(true);
      try {
        if (isEdit) {
          await api.updateTask(editingId, draft);
          view.notify("Изменения сохранены", "success");
        } else {
          await api.createTask(draft);
          view.notify("Задача создана", "success");
        }
        editingId = null;
        view.resetForm();
        await loadCurrentTasks(false);
      } catch (error) {
        view.notify(messageForError(error), "error");
      } finally {
        view.setMutationPending(false);
      }
    },
    async toggleTask(id) {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      view.setMutationPending(true);
      try {
        await api.setTaskCompleted(id, !task.completed);
        view.notify("Статус обновлён", "success");
        await loadCurrentTasks(false);
      } catch (error) {
        view.notify(messageForError(error), "error");
      } finally {
        view.setMutationPending(false);
      }
    },
    async deleteTask(id) {
      view.setMutationPending(true);
      try {
        await api.deleteTask(id);
        view.notify("Задача удалена", "success");
        if (editingId === id) { editingId = null; view.resetForm(); }
        await loadCurrentTasks(false);
      } catch (error) {
        view.notify(messageForError(error), "error");
      } finally {
        view.setMutationPending(false);
      }
    },
    async resetData() {
      view.setMutationPending(true);
      try {
        await api.resetDemoData();
        view.notify("Данные восстановлены", "success");
        filters = {};
        await loadCurrentTasks(true);
      } catch (error) {
        view.notify(messageForError(error), "error");
      } finally {
        view.setMutationPending(false);
      }
    },
    destroy() {
      if (abortController) abortController.abort();
    }
  };
}
