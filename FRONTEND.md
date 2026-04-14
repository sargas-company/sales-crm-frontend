# Инструкция по подключению к API

## Адреса

| Назначение | URL |
|---|---|
| REST API | `http://localhost:3000` |
| WebSocket (Socket.IO) | `http://localhost:3001` |
| Swagger | `http://localhost:3000/swagger` |

> Swagger доступен только при `NODE_ENV=development`. Авторизация через кнопку **Authorize** — вводишь токен один раз, применяется ко всем запросам.

---

## Аутентификация

### POST /auth/login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}
```

**Ответ `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- `accessToken` — живёт **1 час**, используется во всех HTTP-запросах и WebSocket
- `refreshToken` — живёт **30 дней**, используется только для обновления пары токенов

---

### POST /auth/refresh

Обменять refresh token на новую пару. Старый refresh token после этого инвалидируется.

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ответ `200`:**

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

### POST /auth/logout

Инвалидировать refresh token. После этого `/auth/refresh` вернёт `401`.

```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

**Ответ `204`:** пустое тело.

---

### Использование accessToken

Все HTTP-запросы (кроме `/auth/login` и `/auth/refresh`) требуют заголовок:

```http
Authorization: Bearer <accessToken>
```

---

## Proposals

### POST /proposals — создать

```http
POST /proposals
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "React Dashboard — Upwork",
  "vacancy": "Looking for React developer...",
  "comment": "Клиент с рейтингом 4.9, бюджет адекватный",
  "context": "Budget: $3000-5000. Client rating: 4.9"
}
```

> `vacancy`, `comment`, `context` — опциональные. `title` — обязательный.

**Ответ `201`:**

```json
{
  "id": "uuid",
  "title": "React Dashboard — Upwork",
  "vacancy": "Looking for React developer...",
  "comment": "Клиент с рейтингом 4.9, бюджет адекватный",
  "context": "Budget: $3000-5000. Client rating: 4.9",
  "userId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /proposals — список

```http
GET /proposals
Authorization: Bearer <token>
```

**Ответ `200`:** массив proposals текущего пользователя, отсортированных по дате (новые первые).

---

### GET /proposals/:id — один

```http
GET /proposals/:id
Authorization: Bearer <token>
```

**Ответ `200`:** объект proposal. `404` если не найден или принадлежит другому пользователю.

---

### PUT /proposals/:id — обновить

```http
PUT /proposals/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Новое название",
  "vacancy": "Обновлённый текст вакансии",
  "comment": "Новый комментарий",
  "context": "Новый контекст"
}
```

**Ответ `200`:** обновлённый объект proposal.

---

### DELETE /proposals/:id — удалить

```http
DELETE /proposals/:id
Authorization: Bearer <token>
```

**Ответ `204`:** пустое тело.

---

### GET /proposals/:id/chat — история чата

```http
GET /proposals/:id/chat
Authorization: Bearer <token>
```

**Ответ `200`:** массив сообщений, отсортированных по дате (старые первые).

```json
[
  {
    "id": "uuid",
    "proposalId": "uuid",
    "role": "user",
    "content": "Write a proposal",
    "decision": null,
    "reasoning": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "proposalId": "uuid",
    "role": "assistant",
    "content": "...",
    "decision": "bid",
    "reasoning": "Client has strong rating, budget fits, requirements are clear.",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

> `decision` и `reasoning` заполнены только у сообщений с `role: "assistant"`.

---

### POST /proposals/:id/analyze — только анализ

Получить решение AI без генерации текста. Полезно для UI с подтверждением перед генерацией.

```http
POST /proposals/:id/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Should we bid on this?"
}
```

**Ответ `200`:**

```json
{
  "decision": "bid",
  "reasoning": "Client has strong rating (4.9), budget is realistic, requirements are clear."
}
```

---

## Чат (WebSocket — стриминг)

### Подключение с авторизацией

WebSocket требует передачи `accessToken` при подключении:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: accessToken }
});

socket.on('connect', () => console.log('Connected'));
socket.on('error', ({ message }) => console.error('Error:', message));
```

> Без токена или с невалидным токеном соединение будет немедленно разорвано.

---

### Отправка: событие `send_message`

```js
socket.emit('send_message', {
  proposalId: 'uuid',
  content: 'Write a proposal',
});
```

| Поле | Тип | Описание |
|---|---|---|
| `proposalId` | `string` | ID существующего proposal (должен принадлежать текущему пользователю) |
| `content` | `string` | Текст сообщения менеджера |

---

### Входящие события

| Событие | Данные | Описание |
|---|---|---|
| `analysis` | `{ decision: string, reasoning: string }` | Решение AI — приходит **первым**, до текста |
| `chunk` | `{ text: string }` | Фрагмент генерируемого текста |
| `done` | — | Генерация завершена |
| `error` | `{ message: string }` | Ошибка |

> Порядок событий всегда: `analysis` → `chunk` × N → `done`

---

### Пример полного подключения

```js
import { io } from 'socket.io-client';

// 1. Логин
const { accessToken, refreshToken } = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' }),
}).then(r => r.json());

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
};

// 2. Создать proposal
const proposal = await fetch('http://localhost:3000/proposals', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: 'React Dashboard — Upwork',
    vacancy: 'Looking for React developer to build an admin dashboard. Budget $3000-5000.',
    comment: 'Клиент с рейтингом 4.9, бюджет адекватный',
    context: 'Budget: $3000-5000. Client rating: 4.9',
  }),
}).then(r => r.json());

// 3. Подключиться к WebSocket с токеном
const socket = io('http://localhost:3001', {
  auth: { token: accessToken }
});

let fullText = '';

socket.on('connect', () => {
  // 4. Отправить сообщение
  socket.emit('send_message', {
    proposalId: proposal.id,
    content: 'Write a proposal',
  });
});

// 5. Получить решение AI
socket.on('analysis', ({ decision, reasoning }) => {
  console.log('Decision:', decision);   // 'bid' | 'decline' | 'clarify'
  console.log('Reasoning:', reasoning);
});

// 6. Собирать текст по чанкам
socket.on('chunk', ({ text }) => {
  fullText += text;
});

socket.on('done', () => {
  console.log('Full response:', fullText);
  // История уже сохранена в БД с decision и reasoning
});

socket.on('error', ({ message }) => console.error('Error:', message));
```

---

## Base Knowledge

### POST /base-knowledge — создать

```http
POST /base-knowledge
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Шаблон вежливого отказа",
  "description": "Используется когда нужно отказать клиенту, сохранив хороший тон и оставив дверь открытой",
  "category": "templates"
}
```

> Векторный эмбеддинг генерируется автоматически на основе `title + description`.

**Ответ `201`:** объект записи без поля `embedding`.

---

### GET /base-knowledge — список

```http
GET /base-knowledge
Authorization: Bearer <token>
```

---

### GET /base-knowledge/search — семантический поиск

Возвращает до 5 наиболее релевантных записей. Записи с дистанцией ≥ 1.2 не возвращаются.

```http
GET /base-knowledge/search?q=polite+decline+client
Authorization: Bearer <token>
```

---

### GET /base-knowledge/:id — одна запись

```http
GET /base-knowledge/:id
Authorization: Bearer <token>
```

---

### PUT /base-knowledge/:id — обновить

Эмбеддинг пересчитывается автоматически при изменении `title` или `description`.

```http
PUT /base-knowledge/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Новое название",
  "description": "Новое описание",
  "category": "updated"
}
```

---

### DELETE /base-knowledge/:id — удалить

```http
DELETE /base-knowledge/:id
Authorization: Bearer <token>
```

**Ответ `204`:** пустое тело.

---

## Settings

### GET /settings

```http
GET /settings
Authorization: Bearer <token>
```

**Ответ `200`:**

```json
{
  "id": "global",
  "systemPrompt": "You are an expert sales manager..."
}
```

### PUT /settings

```http
PUT /settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "systemPrompt": "You are an expert sales manager..."
}
```

---

## Коды ошибок

| Код | Описание |
|---|---|
| `400` | Неверные данные |
| `401` | Не авторизован / токен истёк / невалидный refresh token |
| `404` | Ресурс не найден или принадлежит другому пользователю |
| `500` | Внутренняя ошибка сервера |

**Формат ошибки:**

```json
{
  "statusCode": 404,
  "message": "Proposal not found",
  "path": "/proposals/unknown-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
