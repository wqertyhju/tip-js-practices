# Практическая работа № 3

## Автор и вариант

- Имя: Петренко Владимир
- Группа: ЭФБО-17-25
- Вариант: 3 (тема «Создание сайта-портфолио», 6 задач: 11, 23, 37, 41, 58, 64)

## Окружение

- ОС: Windows
- Node.js: v24.21.0
- npm: 11.19.0
- Git: 2.56.0.windows.2
- Браузер: Chrome

## Команды запуска

Из папки practice-03:

    npm start
    npm run check:service

Альтернатива:

    node tools/serve.mjs
    node checks/service.checks.js

Затем открыть в браузере http://127.0.0.1:5503/

Свой вариант: http://127.0.0.1:5503/index.html?dataset=variant

## Задание 1. Пять экспериментов

| № | Что исследуется | Фактический результат | Объяснение |
|---|-----------------|-----------------------|------------|
| 1 | Отсутствующий элемент и пустая коллекция | `missing: null | typeof: object`; `emptyCollection: NodeList(0) | length: 0`; при попытке `missing.textContent = ...` — `Cannot set properties of null` | `querySelector` возвращает `null` при отсутствии совпадений, `querySelectorAll` — пустой `NodeList`. К `null` нельзя обращаться как к элементу |
| 2 | dataset.taskId | `dataset.taskId = 23 | typeof: string`; `Number(dataset.taskId) = 23 | typeof: number`; `Number.isSafeInteger: true` | `data-*` атрибуты всегда строки. Перед передачей в модель (где id — число) нужно явное преобразование через `Number` и проверка `isSafeInteger` |
| 3 | Добавление записи и статичность сохранённой коллекции | Сохранённая `initialItems.length` остаётся 2, а новый `querySelectorAll` растёт: 3, 4, 5, 6, 7 | `querySelectorAll` возвращает статический `NodeList`. Повторный вызов даёт актуальный снимок, сохранённый — нет |
| 4 | textContent и HTML | `titleTarget.textContent = <strong>Проверка</strong> & "кавычки"`; `querySelector('strong') = null`; `children.length = 0` | `textContent` выводит строку как есть. HTML-элемент `strong` из неё не создаётся. Для названий задач это правильно |
| 5 | Всплытие события и target/currentTarget | Capture: `eventPhase: 1`, `target: bubble-target`, `currentTarget: bubble-button`. Target: `eventPhase: 2`, оба — `bubble-target`. Bubbling: `eventPhase: 3`, `target: bubble-target`, `currentTarget: bubble-button` | Событие идёт по фазам: захват (1) сверху вниз, цель (2), всплытие (3) снизу вверх. `event.target` — где реально произошло нажатие, `event.currentTarget` — где сейчас выполняется обработчик |

Клик по вложенному `<span>` внутри кнопки: обработчик контейнера получает событие потому, что после фазы цели событие всплывает ко всем предкам — включая кнопку.

## Задание 2. Карточка задачи

Структура `createTaskElement`:
- `li.task-card` с `data-task-id`; при `completed` — класс `is-completed`
- `h3.task-title` — название как `textContent`
- `span.task-status` — «Выполнена» или «В работе»
- `span.task-priority` — «Низкий», «Средний», «Высокий»
- `button[data-action="toggle"]` с `aria-pressed` и вложенным `span.action-label` — «Выполнена»
- `button[data-action="delete"]` с вложенным `span.action-label` — «Удалить»

`renderTaskList` собирает карточки через `map` и заменяет содержимое `replaceChildren`. Повторный вызов не дублирует: проверено на 4 карточках.

Проверка с названием `<strong>Проверка</strong> & "кавычки"`: строка отображается как текст, HTML не интерпретируется.

## Задание 3. Делегирование, изменение статуса и удаление

`handleTaskListClick` назначен один раз на `#task-list`. Внутри:
1. Проверка `event.target instanceof Element`.
2. Поиск кнопки через `closest("button[data-action]")`.
3. Проверка `listElement.contains(button)`.
4. Только `toggle` или `delete`.
5. `li[data-task-id]` → `Number` → `Number.isSafeInteger`.
6. `findTaskById` → `setTaskCompleted` или `removeTask`.
7. При успехе — `currentTasks = result.tasks`, `renderApp()`, `restoreTaskFocus`.

Проверено:
- Нажатие на вложенный `span.action-label` тоже срабатывает — благодаря всплытию.
- Двойное переключение — статус меняется ровно один раз.
- Некорректный id (например, `4abc`) — выводится сообщение, данные не меняются.
- Отсутствующая задача — выводится сообщение, данные сохраняются.

## Задание 4. Фильтры, сводка, пустые состояния

`getVisibleTasks(tasks, filter)`:
- `all` — копия всех задач
- `pending` — только `completed === false`
- `completed` — только `completed === true`

`renderSummary` считает по `getTaskStats(currentTasks)` — по полному массиву, а не по видимой выборке. Показатель «Показано» — это длина видимой выборки.

`renderEmptyState`:
- `total === 0, visibleCount === 0` → «Список задач пуст.»
- `total > 0, visibleCount === 0` → «Нет задач по выбранному фильтру.»
- иначе — скрыть

Проверено: фильтры не теряют записи, активное состояние кнопок согласовано через `classList.toggle` и `aria-pressed`.

## Задание 5. Общий сценарий

| Шаг | Действие | Видимые id | Всего | Выполнено | Осталось | Прогресс |
|-----|----------|------------|-------|-----------|----------|----------|
| 0 | Исходный набор, «Все» | [1, 4, 7, 10] | 4 | 2 | 2 | 50.0% |
| 1 | «В работе» | [4, 7] | 4 | 2 | 2 | 50.0% |
| 2 | Отметить id = 4 | [7] | 4 | 3 | 1 | 75.0% |
| 3 | «Все» | [1, 4, 7, 10] | 4 | 3 | 1 | 75.0% |
| 4 | Удалить id = 7 | [1, 4, 10] | 3 | 3 | 0 | 100.0% |
| 5 | «В работе» | [] | 3 | 3 | 0 | 100.0% |
| 6 | «Все», переключить id = 1 | [1, 4, 10] | 3 | 2 | 1 | 66.7% |
| 7 | Удалить 1, 4, 10 | [] | 0 | 0 | 0 | 0.0% |

## Индивидуальный вариант 3

Открыть http://127.0.0.1:5503/index.html?dataset=variant

Исходный набор: 6 задач `[11, 23, 37, 41, 58, 64]`, первые 2 выполнены.
Сводка: Всего 6, Выполнено 2, Осталось 4, Прогресс 33.3%.

После переключения статуса id = 23, удаления id = 37 и переключения id = 11:
итоговые id `[11, 23, 41, 58, 64]`, прогресс пересчитывается.
`variantTasks` сохраняет исходные значения.

## Отладка

Через DevTools остановился в `handleTaskListClick` на строке чтения `dataset.taskId`. Проверил:
- до `Number()`: значение `"4"`, тип `string`
- после `Number()`: значение `4`, тип `number`, `Number.isSafeInteger(4) === true`
- найденная задача: id = 4, completed = false
- вызов `setTaskCompleted(currentTasks, 4, true)` → `{ ok: true, tasks: [...] }`

## Вывод

Освоены: `querySelector`, `querySelectorAll`, `createElement`, `append`, `replaceChildren`, `textContent`, `classList`, `dataset`, `hidden`, `addEventListener`, `closest`, `contains`, `focus`.

Ключевые выводы:
1. `textContent` — обязателен для пользовательских данных, чтобы не превращать название задачи в HTML.
2. Делегирование событий на общий контейнер решает проблему пересоздаваемых карточек.
3. `event.target` и `event.currentTarget` различаются при клике по вложенному элементу — это и определяет корректную обработку.
4. Хранение полного `currentTasks` отдельно от фильтра — единственный способ не терять скрытые записи.

## Результаты проверок

### Проверки сервиса (node practice-03/checks/service.checks.js)

Всего: 34. Пройдено: 34. Ошибок: 0.

### Браузерные проверки (http://127.0.0.1:5503/checks.html)

Всего: 19. Пройдено: 19. Ошибок: 0.

Примечание: при разработке браузерных проверок были исправлены две ошибки в самом проверочном сценарии (сброс фильтра перед удалением всех карточек и повторный поиск узла в цикле вместо использования сохранённых ссылок). Логика приложения при этом не менялась.
