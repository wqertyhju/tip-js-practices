# Практическая работа № 5

## Автор и вариант

- Имя: Петренко Владимир
- Группа: ЭФБО-17-25
- Вариант: 3 (фильтр `priority: "high"`, ожидаемые id: [4, 13, 16, 25, 34])

## Окружение

- ОС: Windows
- Node.js: v24.21.0
- npm: 11.19.0
- Git: 2.56.0.windows.2

## Команды запуска

Из папки practice-05:

    npm start
    npm run client
    npm run example:order
    npm run example:fetch
    npm test

## Задание 1. Порядок асинхронного выполнения

Код `examples/event-loop.js`:

    console.log("A");
    setTimeout(() => console.log("D"), 0);
    Promise.resolve().then(() => console.log("C"));
    console.log("B");
    Promise.resolve().then(() => console.log("E"));
    setTimeout(() => console.log("F"), 0);

**Прогноз до запуска:** A, B, C, E, D, F.

**Фактический вывод:** A, B, C, E, D, F.

**Объяснение:**
- Синхронный код выполняется первым: A, B.
- Микрозадачи (Promise) выполняются после синхронного кода в порядке регистрации: C, E.
- Макрозадачи (таймеры) выполняются после микрозадач: D, F.

## Задание 2. Исследование учебного API

| Запрос | Статус | Content-Type | response.ok | Форма тела |
|--------|--------|--------------|-------------|------------|
| /api/health | 200 | application/json | true | {status: "ok", time: "..."} |
| /api/tasks | 200 | application/json | true | {data: [...], meta: {...}} |
| /api/tasks?completed=false&priority=high | 200 | application/json | true | {data: [...], meta: {...}} |
| /api/tasks/25 | 200 | application/json | true | {data: {...}} |
| /api/tasks/999 | 404 | application/json | false | {error: {code: "TASK_NOT_FOUND", ...}} |
| /api/categories | 200 | application/json | true | {data: [...]} |

## Задание 3. Формирование URL (buildUrl)

Реализована в `src/api-client.js`. Покрыты случаи:
- двойные слэши (`baseUrl` с `/` и `path` с `/`);
- query с пробелом, `&` и кириллицей (кодируется через `URLSearchParams`);
- сохранение `completed: false`;
- пропуск `undefined`, `null` и `""`;
- отсутствие мутации входного объекта `query`.

Проверки: **7/7** в `api-client.checks.js`.

## Задание 4. Общий JSON-клиент (createApiClient)

Реализован в `src/api-client.js`. Возможности:
- проверка конфигурации фабрики;
- построение URL через `buildUrl`;
- `AbortSignal.timeout()` для тайм-аута;
- объединение сигналов через `AbortSignal.any()`;
- классификация ошибок: `http`, `network`, `timeout`, `aborted`, `invalid-response`;
- проверка `Response.ok`, `Content-Type`, разбор JSON;
- возврат `null` для 204 No Content.

## Задание 5. Предметный API задач (createTaskApi)

Реализован в `src/task-api.js`. Методы:
- `getTasks(filters)` — проверка фильтров, схемы задач, `meta.total`;
- `getTaskById(id)` — проверка схемы задачи;
- `getCategories()` — проверка схемы категорий;
- `loadInitialData(filters)` — параллельная загрузка задач и категорий через `Promise.all`.

## Задание 6. Параллельная загрузка

`loadInitialData` запускает `getTasks` и `getCategories` до общего `await`. Реализовано через `Promise.all`.

**Последовательное ожидание:**
    const tasks = await api.getTasks();
    const categories = await api.getCategories();

**Параллельное ожидание:**
    const tasksPromise = api.getTasks();
    const categoriesPromise = api.getCategories();
    const [tasks, categories] = await Promise.all([tasksPromise, categoriesPromise]);

## Задание 7. Тайм-аут и внешняя отмена

**Тайм-аут:**
    client.requestJson("/debug/delay", { query: { ms: 150 }, timeoutMs: 20 });
Результат: `kind: "timeout"`.

**Внешняя отмена:**
    const controller = new AbortController();
    const pending = client.requestJson("/debug/delay", { signal: controller.signal, timeoutMs: 1000 });
    controller.abort();
Результат: `kind: "aborted"`.

## Задание 8. Контрольный консольный сценарий

Вывод `npm run client`:

    === Вариант 3, фильтры: {"priority":"high"} ===

    --- Проверка варианта ---
    Задачи: [ 4, 13, 16, 25, 34 ]
    meta.total: 5

    --- Загрузка начальных данных (Promise.all) ---
    Задачи: [ 4, 13, 16, 25, 34 ]
    Категории: [ 1, 2, 3 ]
    Всего задач: 5

    --- Задача по id = 25 ---
    id=25, title="Проверить тайм-аут", priority=high

    --- Задача по id = 999 (ожидаем ошибку) ---
    Ошибка: kind=http, status=404, code=TASK_NOT_FOUND, message="HTTP 404"

    --- Тайм-аут (ms=150, timeoutMs=20) ---
    Ошибка: kind=timeout, message="Превышено время ожидания (20 мс)"

    --- Внешняя отмена ---
    Ошибка: kind=aborted, message="Запрос отменён внешним сигналом"

## Задание 9. Индивидуальный вариант 3

Фильтр `priority: "high"`. Ожидаемые id по таблице: [4, 13, 16, 25, 34]. Фактический результат совпал: [4, 13, 16, 25, 34], `meta.total = 5`.

Сформированный URL: `http://127.0.0.1:5505/api/tasks?priority=high`.

## Результаты проверок

### Проверки API (npm run check:api)
Итог API: успешно 10, ошибок 0.

### Проверки клиента (npm run check:client)
Итог клиента: успешно 22, ошибок 0.

### Интеграционные проверки (npm run check:integration)
Итог интеграции: успешно 13, ошибок 0.

## Собственные проверки (3 штуки)

1. **Комбинация query-параметров:** `completed=false&priority=high` → id [4, 13, 34]. Совпало с API.
2. **Дополнительный ошибочный HTTP-сценарий:** `GET /api/tasks/999` → 404, `kind: "http"`, `code: "TASK_NOT_FOUND"`.
3. **Граница тайм-аута:** `timeoutMs: 20` для запроса с задержкой 150 мс → `kind: "timeout"`.

## Вывод

Освоены Promise, async/await, fetch, работа с Response, классификация ошибок, тайм-ауты и отмена через AbortController, параллельное ожидание через Promise.all. Реализован переиспользуемый HTTP-клиент с единым типом ошибки ApiError. Предметный API задач отделён от транспорта. Все проверки пройдены: 10 серверных, 22 модульных, 13 интеграционных.
