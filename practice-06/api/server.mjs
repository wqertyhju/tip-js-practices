import { createServer } from "node:http";
import { getFreshTasks, categories } from "./data.js";

let tasks = getFreshTasks();
const PORT = Number(process.argv[2]) || 5505;

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept" });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept" });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;

  if (path === "/api/health") return sendJson(res, 200, { data: { status: "ok" } });
  if (path === "/api/categories") return sendJson(res, 200, { data: categories, meta: { total: categories.length } });

  if (path === "/api/tasks" && req.method === "GET") {
    let result = [...tasks];
    const cp = url.searchParams.get("completed");
    const pp = url.searchParams.get("priority");
    const catp = url.searchParams.get("categoryId");
    const qp = url.searchParams.get("q");

    if (cp !== null) result = result.filter(t => t.completed === (cp === "true"));
    if (pp !== null) result = result.filter(t => t.priority === pp);
    if (catp !== null) result = result.filter(t => t.categoryId === Number(catp));
    if (qp !== null) result = result.filter(t => t.title.toLowerCase().includes(qp.toLowerCase()));

    return sendJson(res, 200, { data: result, meta: { total: result.length } });
  }

  if (path === "/api/tasks" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const draft = JSON.parse(body);
      const newTask = { id: Date.now(), title: draft.title, completed: false, priority: draft.priority, categoryId: draft.categoryId };
      tasks.push(newTask);
      sendJson(res, 201, { data: newTask });
    });
    return;
  }

  const matchId = path.match(/^\/api\/tasks\/(\d+)$/);
  if (matchId) {
    const id = Number(matchId[1]);
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Задача не найдена" } });

    if (req.method === "PATCH") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", () => {
        const changes = JSON.parse(body);
        tasks[idx] = { ...tasks[idx], ...changes };
        sendJson(res, 200, { data: tasks[idx] });
      });
      return;
    }

    if (req.method === "DELETE") {
      tasks.splice(idx, 1);
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      res.end();
      return;
    }
  }

  if (path === "/api/debug/reset" && req.method === "POST") {
    tasks = getFreshTasks();
    return sendJson(res, 200, { data: { reset: true, total: tasks.length } });
  }

  sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Маршрут не найден" } });
});

server.listen(PORT, "127.0.0.1", () => console.log(`API running at http://127.0.0.1:${PORT}/api`));
