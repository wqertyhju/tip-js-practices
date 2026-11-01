import { createServer } from "node:http";
import { tasks, categories } from "./data.js";

const PORT = Number(process.argv[2]) || 5505;
const HOST = "127.0.0.1";

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(text);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const path = url.pathname;

  if (path === "/api/health") {
    sendJson(res, 200, { status: "ok", time: new Date().toISOString() });
    return;
  }

  if (path === "/api/tasks") {
    const completedParam = url.searchParams.get("completed");
    const priorityParam = url.searchParams.get("priority");
    const categoryParam = url.searchParams.get("categoryId");
    const qParam = url.searchParams.get("q");

    let result = [...tasks];
    if (completedParam !== null) {
      const val = completedParam === "true";
      result = result.filter((t) => t.completed === val);
    }
    if (priorityParam !== null) {
      result = result.filter((t) => t.priority === priorityParam);
    }
    if (categoryParam !== null) {
      const catId = Number(categoryParam);
      result = result.filter((t) => t.categoryId === catId);
    }
    if (qParam !== null) {
      const q = qParam.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    sendJson(res, 200, {
      data: result,
      meta: {
        total: result.length,
        filters: {
          completed: completedParam !== null ? completedParam === "true" : null,
          priority: priorityParam,
          categoryId: categoryParam !== null ? Number(categoryParam) : null,
          q: qParam || "",
        },
      },
    });
    return;
  }

  const taskMatch = path.match(/^\/api\/tasks\/(\d+)$/);
  if (taskMatch) {
    const id = Number(taskMatch[1]);
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      sendJson(res, 404, {
        error: {
          code: "TASK_NOT_FOUND",
          message: `Задача с id ${id} не найдена.`,
          details: { id },
        },
      });
      return;
    }
    sendJson(res, 200, { data: task });
    return;
  }

  if (path === "/api/categories") {
    sendJson(res, 200, { data: categories, meta: { total: categories.length } });
    return;
  }

  const catMatch = path.match(/^\/api\/categories\/(\d+)$/);
  if (catMatch) {
    const id = Number(catMatch[1]);
    const cat = categories.find((c) => c.id === id);
    if (!cat) {
      sendJson(res, 404, { error: { code: "CATEGORY_NOT_FOUND", message: "Категория не найдена" } });
      return;
    }
    sendJson(res, 200, { data: cat });
    return;
  }

  if (path === "/api/debug/error") {
    sendJson(res, 503, { error: { code: "SERVICE_UNAVAILABLE", message: "Отладочная ошибка" } });
    return;
  }

  if (path === "/api/debug/invalid-json") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
    res.end("{broken-json");
    return;
  }

  if (path === "/api/debug/text") {
    sendText(res, 200, "Это текст, а не JSON");
    return;
  }

  if (path === "/api/debug/delay") {
    const ms = Number(url.searchParams.get("ms")) || 150;
    await new Promise((r) => setTimeout(r, Math.min(ms, 5000)));
    sendJson(res, 200, { data: { delayed: ms } });
    return;
  }

  sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Маршрут не найден" } });
});

server.listen(PORT, HOST, () => {
  console.log(`API running at http://${HOST}:${PORT}/api`);
});
