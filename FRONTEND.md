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

## Platforms

Платформа (Upwork, LinkedIn и т.д.). Нужна для создания аккаунтов и proposals. Создаётся один раз, переиспользуется.

### GET /platforms — все платформы

```http
GET /platforms
Authorization: Bearer <token>
```

**Ответ `200`:** массив платформ, отсортированных по `title`.

```json
[
  {
    "id": "uuid",
    "title": "Upwork",
    "slug": "upwork",
    "imageUrl": "https://example.com/upwork.png",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST /platforms — создать

```http
POST /platforms
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Upwork",
  "slug": "upwork",
  "imageUrl": "https://example.com/upwork.png"
}
```

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `title` | string | да | Название платформы |
| `slug` | string | да | Уникальный идентификатор (латиница, без пробелов) |
| `imageUrl` | string | нет | URL логотипа |

**Ответ `201`:** объект платформы. `409` если `slug` уже занят.

---

### GET /platforms/:id — одна платформа

```http
GET /platforms/:id
Authorization: Bearer <token>
```

**Ответ `200`:** объект платформы. `404` если не найдена.

---

### PUT /platforms/:id — обновить

```http
PUT /platforms/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Upwork",
  "slug": "upwork",
  "imageUrl": "https://example.com/new.png"
}
```

**Ответ `200`:** обновлённый объект. `409` если новый `slug` уже занят.

---

### DELETE /platforms/:id — удалить

```http
DELETE /platforms/:id
Authorization: Bearer <token>
```

**Ответ `204`:** пустое тело.

---

## Accounts

Аккаунт менеджера на конкретной платформе (один менеджер — один аккаунт на платформу). Нужен для создания proposals. Привязан к текущему пользователю.

### GET /accounts — все аккаунты текущего пользователя

```http
GET /accounts
Authorization: Bearer <token>
```

**Ответ `200`:** массив аккаунтов, отсортированных по `lastName`, `firstName`. Включает вложенный объект `platform`.

```json
[
  {
    "id": "uuid",
    "firstName": "Dmytro",
    "lastName": "Sarafaniuk",
    "platformId": "uuid",
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "platform": {
      "id": "uuid",
      "title": "Upwork",
      "slug": "upwork",
      "imageUrl": null
    }
  }
]
```

---

### POST /accounts — создать

```http
POST /accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Dmytro",
  "lastName": "Sarafaniuk",
  "platformId": "uuid-of-platform"
}
```

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `firstName` | string | да | Имя на платформе |
| `lastName` | string | да | Фамилия на платформе |
| `platformId` | string (uuid) | да | ID платформы |

**Ответ `201`:** объект аккаунта с вложенным `platform`. `409` если аккаунт для этой платформы уже существует.

---

### GET /accounts/:id — один аккаунт

```http
GET /accounts/:id
Authorization: Bearer <token>
```

**Ответ `200`:** объект аккаунта с `platform`. `404` если не найден (или принадлежит другому пользователю).

---

### PUT /accounts/:id — обновить

```http
PUT /accounts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Dmytro",
  "lastName": "Sarafaniuk",
  "platformId": "uuid-of-platform"
}
```

**Ответ `200`:** обновлённый объект. `409` если новая платформа уже занята.

---

### DELETE /accounts/:id — удалить

```http
DELETE /accounts/:id
Authorization: Bearer <token>
```

**Ответ `204`:** пустое тело.

---

## Proposals

### Поля proposal (input)

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `title` | string | да | Название proposal |
| `accountId` | string (uuid) | да | ID аккаунта (`GET /accounts`) |
| `platformId` | string (uuid) | да | ID платформы (`GET /platforms`) |
| `proposalType` | enum | да | `Bid` \| `Invite` \| `DirectMessage` |
| `jobUrl` | string | нет | Ссылка на вакансию |
| `boosted` | boolean | нет | Буст (только для `Bid`, default: `false`) |
| `connects` | number | нет | Коннекты (только для `Bid`, default: `0`) |
| `boostedConnects` | number | нет | Коннекты за буст (только если `boosted: true`) |
| `coverLetter` | string | нет | Сопроводительное письмо |
| `vacancy` | string | нет | Текст вакансии |

---

### POST /proposals — создать

```http
POST /proposals
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Full Stack Developer — MVP Project",
  "accountId": "uuid-of-account",
  "platformId": "uuid-of-platform",
  "proposalType": "Bid",
  "jobUrl": "https://upwork.com/jobs/~01abc1234567890def",
  "boosted": true,
  "connects": 6,
  "boostedConnects": 14,
  "vacancy": "Looking for React developer to build an admin dashboard."
}
```

**Ответ `201`:**

```json
{
  "id": "uuid",
  "title": "Full Stack Developer — MVP Project",
  "proposalType": "Bid",
  "status": "Draft",
  "jobUrl": "https://upwork.com/jobs/~01abc1234567890def",
  "boosted": true,
  "connects": 6,
  "boostedConnects": 14,
  "coverLetter": null,
  "vacancy": "Looking for React developer...",
  "sentAt": null,
  "accountId": "uuid",
  "platformId": "uuid",
  "userId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "user": { "id": "uuid", "email": "manager@example.com", "firstName": "John", "lastName": "Doe" },
  "account": { "id": "uuid", "firstName": "...", "lastName": "...", "platform": { ... } },
  "platform": { "id": "uuid", "title": "Upwork", "slug": "upwork" },
  "chat": { "id": "uuid", "proposalId": "uuid", "leadId": null, "createdAt": "..." }
}
```

---

### GET /proposals — список с пагинацией

```http
GET /proposals?page=1&limit=10
Authorization: Bearer <token>
```

| Параметр | Тип | По умолчанию |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `10` |

**Ответ `200`:**

```json
{
  "data": [...],
  "total": 42
}
```

> Возвращает все proposals (без фильтра по владельцу), отсортированные по `createdAt desc`.

---

### GET /proposals/:id — один

```http
GET /proposals/:id
Authorization: Bearer <token>
```

**Ответ `200`:** объект proposal. `404` если не найден.

---

### PUT /proposals/:id — обновить

```http
PUT /proposals/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Sent",
  "coverLetter": "Dear client, ...",
  "connects": 8
}
```

> Все поля опциональны. При переводе в статус `Sent` — автоматически проставляется `sentAt`. При переводе в статус `Replied` — автоматически создаётся связанный `Lead`, и чат proposal привязывается к этому lead (история сообщений переходит вместе).

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
    "chatId": "uuid",
    "role": "user",
    "content": "Write a proposal",
    "decision": null,
    "reasoning": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "chatId": "uuid",
    "role": "assistant",
    "content": "...",
    "decision": "bid",
    "reasoning": "Client has strong rating, budget fits, requirements are clear.",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

> `decision` и `reasoning` заполнены только у сообщений с `role: "assistant"`.  
> Сообщения принадлежат объекту `Chat`, который может быть связан и с proposal, и с lead — поэтому поле называется `chatId`, а не `proposalId`.

---

### POST /proposals/:id/analyze — только анализ

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

## Leads

Lead создаётся автоматически при переводе Proposal в статус `Replied`. Ручного создания нет.

### Поля lead

| Поле | Тип | Описание |
|---|---|---|
| `id` | string (uuid) | Уникальный идентификатор |
| `number` | number | Порядковый номер (1, 2, 3...) |
| `proposalId` | string \| null | ID связанного proposal (null если proposal удалён) |
| `leadName` | string \| null | Имя лида |
| `status` | enum | Статус (см. ниже) |
| `clientType` | enum \| null | `individual` \| `company` |
| `rate` | number \| null | Ставка в $ |
| `location` | string \| null | Локация клиента |
| `repliedAt` | datetime | Время получения ответа от клиента |
| `acceptedAt` | datetime \| null | Проставляется при переходе в `accept_contract` |
| `holdAt` | datetime \| null | Проставляется при переходе в `hold` |
| `createdAt` | datetime | — |
| `updatedAt` | datetime | — |

**Статусы `LeadStatus`:** `conversation_ongoing` \| `trial` \| `hold` \| `contract_offer` \| `accept_contract` \| `start_contract` \| `suspended`

---

### GET /leads — список с пагинацией

```http
GET /leads?page=1&limit=10
Authorization: Bearer <token>
```

**Ответ `200`:**

```json
{
  "data": [...],
  "total": 15
}
```

---

### GET /leads/:id — один lead

```http
GET /leads/:id
Authorization: Bearer <token>
```

**Ответ `200`:** объект lead с вложенным `proposal` (или `null` если proposal удалён). `404` если не найден.

```json
{
  "id": "uuid",
  "number": 1,
  "proposalId": "uuid",
  "leadName": "John Doe",
  "status": "conversation_ongoing",
  "clientType": "individual",
  "rate": 50,
  "location": "United States",
  "repliedAt": "2024-01-01T00:00:00.000Z",
  "acceptedAt": null,
  "holdAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "proposal": { ... }
}
```

---

### GET /leads/:id/chat — история чата

```http
GET /leads/:id/chat
Authorization: Bearer <token>
```

**Ответ `200`:** массив сообщений, отсортированных по дате (старые первые). Возвращает `[]` если чат ещё не создан.

```json
[
  {
    "id": "uuid",
    "chatId": "uuid",
    "role": "user",
    "content": "Write a proposal",
    "decision": null,
    "reasoning": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "chatId": "uuid",
    "role": "assistant",
    "content": "...",
    "decision": "bid",
    "reasoning": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

> История сообщений сквозная — включает все сообщения начиная с proposal-этапа. `404` если lead не найден.

---

### PATCH /leads/:id — обновить

```http
PATCH /leads/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "leadName": "John Doe",
  "status": "trial",
  "clientType": "company",
  "rate": 75,
  "location": "Canada"
}
```

> Все поля опциональны. При переходе в `accept_contract` — автоматически проставляется `acceptedAt`. При переходе в `hold` — `holdAt`. Повторный переход в тот же статус не перезаписывает дату.

**Ответ `200`:** обновлённый объект lead.

---

### DELETE /leads/:id — удалить

```http
DELETE /leads/:id
Authorization: Bearer <token>
```

> Удаляет только лид. Связанный proposal остаётся нетронутым. Если у чата нет другой связи (proposalId = null) — чат и вся история сообщений удаляются вместе. Если proposal ещё существует — чат остаётся, только `leadId` обнуляется.

**Ответ `204`:** пустое тело.

---

## Chats

### GET /chats — список всех чатов (cursor-based пагинация)

Возвращает объекты `Chat`. Отсортированы по `createdAt` (новые первые). Для каждого включены: связанный proposal (с автором), связанный lead, количество сообщений, последнее сообщение.

```http
GET /chats?limit=20&type=proposal
Authorization: Bearer <token>
```

| Параметр | Тип | По умолчанию | Ограничения | Описание |
|---|---|---|---|---|
| `limit` | number | `20` | 1–100 | Количество записей |
| `cursor` | string | — | UUID | ID последнего элемента предыдущей страницы |
| `type` | enum | — | `proposal` \| `lead` | Фильтр: `proposal` — только чаты с proposal, `lead` — только чаты с lead, без параметра — все |

**Ответ `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "proposalId": "uuid",
      "leadId": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "proposal": {
        "id": "uuid",
        "title": "React Developer",
        "status": "Replied",
        "user": {
          "id": "uuid",
          "email": "manager@example.com"
        }
      },
      "lead": {
        "id": "uuid",
        "number": 1,
        "status": "conversation_ongoing",
        "leadName": null
      },
      "_count": {
        "messages": 5
      },
      "messages": [
        {
          "id": "uuid",
          "chatId": "uuid",
          "role": "assistant",
          "content": "...",
          "decision": "bid",
          "reasoning": "...",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "nextCursor": "uuid-of-last-item"
}
```

> `nextCursor: null` — страниц больше нет.  
> `proposal` или `lead` могут быть `null`, если соответствующая сущность была удалена.

**Пример итерации по всем страницам:**

```js
let cursor;
const allChats = [];

do {
  const params = new URLSearchParams({ limit: '20' });
  if (cursor) params.set('cursor', cursor);

  const { data, nextCursor } = await fetch(`/chats?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(r => r.json());

  allChats.push(...data);
  cursor = nextCursor;
} while (cursor);
```

---

## Чат (WebSocket — стриминг)

### Подключение с авторизацией

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
| `proposalId` | `string` | ID proposal (обязательный) |
| `content` | `string` | Текст сообщения (обязательный) |

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
const { accessToken } = await fetch('http://localhost:3000/auth/login', {
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
    title: 'Full Stack Developer — MVP Project',
    accountId: 'uuid-of-account',
    platformId: 'uuid-of-platform',
    proposalType: 'Bid',
    vacancy: 'Looking for React developer to build an admin dashboard.',
    connects: 6,
  }),
}).then(r => r.json());

// 3. Подключиться к WebSocket
const socket = io('http://localhost:3001', { auth: { token: accessToken } });

let fullText = '';

socket.on('connect', () => {
  // 4. Отправить сообщение
  socket.emit('send_message', {
    proposalId: proposal.id,
    content: 'Write a proposal',
  });
});

socket.on('analysis', ({ decision, reasoning }) => {
  console.log('Decision:', decision);   // 'bid' | 'decline' | 'clarify'
  console.log('Reasoning:', reasoning);
});

socket.on('chunk', ({ text }) => { fullText += text; });

socket.on('done', () => {
  console.log('Full response:', fullText);
});
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

### GET /base-knowledge — список с пагинацией

```http
GET /base-knowledge?page=1&limit=8
Authorization: Bearer <token>
```

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `page` | number | `1` | Номер страницы |
| `limit` | number | `8` | Записей на странице |

**Ответ `200`:**

```json
{
  "data": [...],
  "total": 25
}
```

> Количество страниц: `Math.ceil(total / limit)`

---

### GET /base-knowledge/search — семантический поиск

```http
GET /base-knowledge/search?q=polite+decline+client
Authorization: Bearer <token>
```

Возвращает до 5 наиболее релевантных записей (дистанция < 1.2).

---

### GET /base-knowledge/:id — одна запись

```http
GET /base-knowledge/:id
Authorization: Bearer <token>
```

---

### PUT /base-knowledge/:id — обновить

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

## Job Posts

Job Posts — посты с вакансиями из Telegram, обработанные AI. Создаются автоматически через Telegram listener. Ручного создания нет.

### GET /job-posts — список с фильтрами и пагинацией

```http
GET /job-posts?decision=approve&sortBy=matchScore&limit=20&offset=0
Authorization: Bearer <token>
```

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `status` | `NEW \| PROCESSING \| PROCESSED \| FAILED` | `PROCESSED` | Статус обработки |
| `decision` | `approve \| maybe \| decline` | — | Решение AI |
| `priority` | `high \| medium \| low` | — | Приоритет |
| `minScore` | `0–100` | — | Минимальный matchScore |
| `maxScore` | `0–100` | — | Максимальный matchScore |
| `createdFrom` | ISO date | — | От даты создания |
| `createdTo` | ISO date | — | До даты создания |
| `sortBy` | `createdAt \| matchScore` | `createdAt` | Сортировка (всегда desc) |
| `limit` | `1–100` | `20` | Количество записей |
| `offset` | `0+` | `0` | Смещение |

**Ответ `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "chatId": "5188602584",
      "messageId": 22863,
      "status": "PROCESSED",
      "decision": "approve",
      "matchScore": 78,
      "priority": "high",
      "createdAt": "2026-04-21T18:11:12.000Z",
      "processedAt": "2026-04-21T18:11:22.000Z",
      "title": "Senior LLM Applications Engineer — Multi-Agent Pipelines",
      "jobUrl": "https://www.upwork.com/jobs/~022046575121448151704",
      "scanner": "web & mobile bases",
      "gigRadarScore": 89,
      "location": "Canada 🇨🇦",
      "budget": "$25/hr - $95/hr",
      "totalSpent": 258740.26,
      "avgRatePaid": 37.01,
      "hireRate": 72.68,
      "hSkillsKeywords": []
    }
  ],
  "meta": {
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

---

### GET /job-posts/stats — статистика

```http
GET /job-posts/stats?from=2026-04-01T00:00:00.000Z&to=2026-04-30T23:59:59.000Z
Authorization: Bearer <token>
```

| Параметр | Тип | Описание |
|---|---|---|
| `from` | ISO date | Начало периода (опционально) |
| `to` | ISO date | Конец периода (опционально) |

**Ответ `200`:**

```json
{
  "period": { "from": "2026-04-01T00:00:00.000Z", "to": "2026-04-30T23:59:59.000Z" },
  "total": 150,
  "byStatus": {
    "NEW": 2,
    "PROCESSING": 1,
    "PROCESSED": 145,
    "FAILED": 2
  },
  "decisions": {
    "approve": 40,
    "maybe": 55,
    "decline": 50
  },
  "priority": {
    "high": 15,
    "medium": 45,
    "low": 35
  },
  "score": {
    "avg": 62,
    "median": 60,
    "min": 12,
    "max": 94
  },
  "scoreRanges": {
    "85_100": 8,
    "70_84": 20,
    "55_69": 45,
    "40_54": 50,
    "0_39": 22
  }
}
```

---

### GET /job-posts/:id — один пост (полный)

```http
GET /job-posts/:id
Authorization: Bearer <token>
```

**Ответ `200`:** полный объект включая `rawText` и `aiResponse`.

```json
{
  "id": "uuid",
  "chatId": "5188602584",
  "messageId": 22863,
  "rawText": "📡 New opportunity detected\nSenior LLM...",
  "rawPayload": {},
  "status": "PROCESSED",
  "decision": "approve",
  "matchScore": 78,
  "priority": "high",
  "aiResponse": {
    "decision": "approve",
    "match_score": 78,
    "priority": "high",
    "hard_stop": false,
    "hard_stop_reason": "",
    "subscores": {
      "core_fit": 28,
      "project_type_complexity": 15,
      "rate_budget_signal": 17,
      "client_money_quality": 15,
      "strategic_upside": 10,
      "risk_friction_penalty": 7
    },
    "reasons": ["..."],
    "red_flags": ["..."],
    "short_summary": "..."
  },
  "createdAt": "2026-04-21T18:11:12.000Z",
  "processedAt": "2026-04-21T18:11:22.000Z",
  "title": "Senior LLM Applications Engineer — Multi-Agent Pipelines",
  "jobUrl": "https://www.upwork.com/jobs/~022046575121448151704",
  "scanner": "web & mobile bases",
  "gigRadarScore": 89,
  "location": "Canada 🇨🇦",
  "budget": "$25/hr - $95/hr",
  "totalSpent": 258740.26,
  "avgRatePaid": 37.01,
  "hireRate": 72.68,
  "hSkillsKeywords": []
}
```

`404` если не найден.

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
| `400` | Неверные данные запроса |
| `401` | Не авторизован / токен истёк / невалидный refresh token |
| `404` | Ресурс не найден |
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
