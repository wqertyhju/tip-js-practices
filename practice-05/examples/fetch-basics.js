const API = "http://127.0.0.1:5505/api";

async function explore(url) {
  console.log(`\n--- ${url} ---`);
  try {
    const response = await fetch(url);
    console.log("status:", response.status);
    console.log("ok:", response.ok);
    console.log("content-type:", response.headers.get("content-type"));
    
    const text = await response.text();
    console.log("body (первые 100 символов):", text.slice(0, 100));
  } catch (error) {
    console.log("Сетевая ошибка:", error.message);
  }
}

async function main() {
  await explore(`${API}/health`);
  await explore(`${API}/tasks`);
  await explore(`${API}/tasks?completed=false&priority=high`);
  await explore(`${API}/tasks/25`);
  await explore(`${API}/tasks/999`);
  await explore(`${API}/categories`);
}

main();
