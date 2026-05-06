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

### GET /proposals/:id/chat/messages — история чата с вложениями

```http
GET /proposals/:id/chat/messages
Authorization: Bearer <token>
```

**Ответ `200`:**

```json
{
  "messages": [
    {
      "id": "uuid",
      "chatId": "uuid",
      "role": "user",
      "content": "Check this job",
      "status": "DONE",
      "decision": null,
      "reasoning": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "attachments": [
        {
          "id": "uuid",
          "fileName": "job.pdf",
          "mimeType": "application/pdf",
          "status": "DONE",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "id": "uuid",
      "chatId": "uuid",
      "role": "assistant",
      "content": "Based on the job description...",
      "status": "DONE",
      "decision": null,
      "reasoning": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "attachments": []
    }
  ]
}
```

**Статусы сообщения (`message.status`):**

| Статус | Описание |
|---|---|
| `PREPARING_ATTACHMENTS` | Файлы загружаются и парсятся |
| `PARTIAL_READY` | Часть файлов готова (остальные упали) — AI запущен с тем что есть |
| `READY_FOR_AI` | Все файлы готовы, ожидает запуска AI |
| `AI_PROCESSING` | AI генерирует ответ прямо сейчас |
| `DONE` | AI завершил ответ |
| `FAILED` | Ошибка на каком-либо этапе |

**Статусы вложения (`attachment.status`):**

| Статус | Что показывать |
|---|---|
| `PENDING` | Файл ожидает обработки |
| `PROCESSING` | Обрабатывается... |
| `DONE` | Файл готов, AI видит его содержимое |
| `FAILED` | Ошибка — предложи перезагрузить |

> Если чат ещё не создан (ни одного сообщения) — возвращает `{ "messages": [] }`.

---

### GET /proposals/:id/chat/attachments/:attachmentId/url — получить ссылку на файл

Файлы хранятся в приватном облачном хранилище. Для открытия нужна **подписанная ссылка** — она действует **1 час** и генерируется по запросу.

```http
GET /proposals/:id/chat/attachments/:attachmentId/url
Authorization: Bearer <token>
```

**Ответ `200`:**

```json
{
  "url": "https://f003.backblazeb2.com/file/bucket/path/file.pdf?Authorization=..."
}
```

**Как открыть в новой вкладке:**

```js
const { url } = await fetch(
  `/proposals/${proposalId}/chat/attachments/${attachmentId}/url`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
).then(r => r.json());

window.open(url, '_blank');
```

> `<a href="...">` в новой вкладке **не сработает** — браузер не отправит Authorization-заголовок. Только `window.open()` после предварительного fetch.

`404` если вложение не найдено или не принадлежит этому proposal.

---

### POST /proposals/:id/chat — отправить сообщение (основной endpoint)

Единственная точка входа для отправки сообщения в AI-чат. Принимает `multipart/form-data`. AI-ответ приходит через WebSocket в **proposal room** — подключение и вступление в комнату обязательны до отправки.

```http
POST /proposals/:id/chat
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `content` | string | да | Текст сообщения |
| `files` | file[] | нет | До 10 файлов: `.pdf`, `.docx`, `.txt`, `.md`, `.xlsx`, `.csv`, `.jpg`, `.jpeg`, `.png` |
| `model` | string | нет | `claude-sonnet-4-6` \| `claude-opus-4-6` |

**Ответ `200`:**

```json
{ "status": "processing", "messageId": "uuid" }
```

- `messageId` — ID созданного сообщения, используй для оптимистичного отображения в чате
- HTTP-ответ возвращается немедленно — AI стартует асинхронно через readiness engine

**Гарантии pipeline:**

1. **Без файлов** — AI запускается сразу после сохранения сообщения
2. **С файлами** — файлы парсятся асинхронно воркером; AI стартует только когда все файлы достигли терминального статуса (`DONE`/`FAILED`)
3. Если все файлы упали → `message.status = PREPARING_ATTACHMENTS`, AI не запускается
4. Если часть файлов DONE + часть FAILED → `PARTIAL_READY`, AI запускается с тем что есть
5. Файл парсится до 3 попыток; при неудаче → `FAILED`, не блокирует остальные файлы
6. Зависшие воркеры автоматически очищаются recovery cron'ом (через 5 мин)

**Ограничения:** макс. 10 файлов, 5 МБ каждый. Неподдерживаемые типы → `400`.

**Пример (без файлов):**

```js
const formData = new FormData();
formData.append('content', 'Write a proposal for this vacancy');

await fetch(`http://localhost:3000/proposals/${proposalId}/chat`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: formData,
});
```

**Пример (с файлами):**

```js
const formData = new FormData();
formData.append('content', 'Analyse this job description');
formData.append('files', pdfFile);
formData.append('files', docxFile);

await fetch(`http://localhost:3000/proposals/${proposalId}/chat`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: formData,
});
```

> **Важно:** `Content-Type: multipart/form-data` НЕ выставляй вручную — браузер/axios сделает это сам с правильным boundary.

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
    "decision": null,
    "reasoning": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

> История сообщений сквозная — включает все сообщения начиная с proposal-этапа. `404` если lead не найден.
>
> Чат для lead-а не имеет отдельного send-endpoint — используй `POST /proposals/:id/chat` по связанному proposal.

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
          "decision": null,
          "reasoning": null,
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

## Чат (WebSocket)

WebSocket используется для получения всех real-time событий чата — lifecycle сообщений, статусов вложений и AI-стриминга. Отправка сообщений — через `POST /proposals/:id/chat`.

**Архитектура:** события приходят в **proposal room** (`proposal:{proposalId}`). Перед отправкой сообщения нужно подключиться к WebSocket и вступить в комнату.

---

### Подключение

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: accessToken },
});

socket.on('connect', () => console.log('Connected, id:', socket.id));
socket.on('disconnect', () => console.log('Disconnected'));
```

> Без токена или с невалидным токеном соединение будет немедленно разорвано.

---

### Вступление в proposal room

Перед отправкой сообщений — emit `join_proposal`. Все события чата приходят только в эту комнату.

```js
socket.emit('join_proposal', { proposalId });

socket.on('joined_proposal', ({ proposalId, room }) => {
  console.log('Joined room:', room); // "proposal:uuid"
});
```

> Если proposal не найден или не принадлежит пользователю — придёт событие `error`.  
> При reconnect — emit `join_proposal` снова, сервер вернёт ACK без лишнего DB-запроса (дедуплицировано).

---

### Входящие события

**Lifecycle сообщения:**

| Событие | Данные | Описание |
|---|---|---|
| `message_updated` | `{ messageId, status }` | Статус сообщения изменился |
| `joined_proposal` | `{ proposalId, room }` | ACK успешного вступления в room |

**Вложения:**

| Событие | Данные | Описание |
|---|---|---|
| `attachment_updated` | `{ attachmentId, messageId, status, error? }` | Статус вложения изменился |

**AI-стриминг:**

| Событие | Данные | Описание |
|---|---|---|
| `thinking` | `{ messageId }` | AI начал генерацию |
| `chunk` | `{ messageId, text }` | Фрагмент ответа |
| `done` | `{ messageId }` | Генерация завершена |
| `error` | `{ messageId, message }` | Ошибка AI pipeline |

> Все AI-события содержат `messageId` — фильтруй по нему если в чате одновременно может идти несколько потоков.

---

### Порядок событий

**Без файлов:**

```
POST /proposals/:id/chat
→ message_updated { messageId, status: 'READY_FOR_AI' }     ← (внутренний переход)
→ message_updated { messageId, status: 'AI_PROCESSING' }
→ thinking        { messageId }
→ chunk           { messageId, text } × N
→ done            { messageId }
→ message_updated { messageId, status: 'DONE' }
```

**С файлами:**

```
POST /proposals/:id/chat
→ attachment_updated { attachmentId, messageId, status: 'PROCESSING' }  × N
→ attachment_updated { attachmentId, messageId, status: 'DONE'/'FAILED' } × N
→ message_updated    { messageId, status: 'READY_FOR_AI'/'PARTIAL_READY' }
→ message_updated    { messageId, status: 'AI_PROCESSING' }
→ thinking           { messageId }
→ chunk              { messageId, text } × N
→ done               { messageId }
→ message_updated    { messageId, status: 'DONE' }
```

**Все файлы упали (AI не запускается):**

```
→ attachment_updated { ..., status: 'FAILED' } × N
(message остаётся в PREPARING_ATTACHMENTS, AI не стартует)
```

---

### Статусы файла в тексте сообщений

| attachment.status | Что видит AI | Что показывать |
|---|---|---|
| `DONE` + текст | Полный текст файла | — |
| `DONE` + нет текста | "Image file — text extraction not supported." | Изображение, текст не извлечён |
| `FAILED` | "File processing failed." | Ошибка, предложить перезагрузить |

---

### Полный пример

```js
import { io } from 'socket.io-client';

// 1. Логин
const { accessToken } = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' }),
}).then(r => r.json());

// 2. Подключиться к WebSocket
const socket = io('http://localhost:3001', { auth: { token: accessToken } });
await new Promise(resolve => socket.on('connect', resolve));

// 3. Вступить в proposal room
socket.emit('join_proposal', { proposalId });
await new Promise(resolve => socket.once('joined_proposal', resolve));

// 4. Подписаться на события
let streamBuffer = '';
const currentMessageId = null;

socket.on('message_updated', ({ messageId, status }) => {
  console.log(`message ${messageId} → ${status}`);
});

socket.on('attachment_updated', ({ attachmentId, messageId, status, error }) => {
  console.log(`attachment ${attachmentId} → ${status}`, error ?? '');
});

socket.on('thinking', ({ messageId }) => {
  console.log(`AI thinking for ${messageId}...`);
  streamBuffer = '';
});

socket.on('chunk', ({ messageId, text }) => {
  streamBuffer += text;
  // обновить UI в реальном времени
});

socket.on('done', ({ messageId }) => {
  console.log(`AI done for ${messageId}:`, streamBuffer);
  // перезагрузить историю для получения сохранённого assistant message
});

socket.on('error', ({ messageId, message }) => {
  console.error(`Error for ${messageId}:`, message);
});

// 5. Отправить сообщение
const formData = new FormData();
formData.append('content', 'Write a proposal for this job');
// formData.append('files', file); // опционально

const { messageId } = await fetch(
  `http://localhost:3000/proposals/${proposalId}/chat`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  },
).then(r => r.json());

console.log('Message created:', messageId);
// Все дальнейшие события придут через WebSocket
```

---

### React-хук (пример)

```tsx
// ─── Типы ─────────────────────────────────────────────────────────────────────

type MessageStatus =
  | 'PREPARING_ATTACHMENTS'
  | 'PARTIAL_READY'
  | 'READY_FOR_AI'
  | 'AI_PROCESSING'
  | 'DONE'
  | 'FAILED';

type AttachmentStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

interface MessageAttachment {
  id: string;
  fileName: string;
  mimeType: string | null;
  status: AttachmentStatus;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  attachments: MessageAttachment[];
  createdAt: string;
}

// ─── Хук ──────────────────────────────────────────────────────────────────────

function useProposalChat(proposalId: string, accessToken: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamBufferRef = useRef<Record<string, string>>({});

  const loadHistory = async () => {
    const { messages } = await fetch(
      `/proposals/${proposalId}/chat/messages`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ).then(r => r.json());
    setMessages(messages ?? []);
  };

  useEffect(() => {
    loadHistory();

    const socket = io('http://localhost:3001', { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Вступить в комнату при каждом (ре)подключении
      socket.emit('join_proposal', { proposalId });
    });

    // Lifecycle сообщения — обновить статус в списке
    socket.on('message_updated', ({ messageId, status }: { messageId: string; status: MessageStatus }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, status } : m),
      );
      if (status === 'DONE' || status === 'FAILED') {
        setStreamingMessageId(null);
        // Перезагрузить историю чтобы получить assistant message с ID
        void loadHistory();
      }
    });

    // Статус вложения — обновить attachment card
    socket.on('attachment_updated', ({
      attachmentId,
      messageId,
      status,
    }: {
      attachmentId: string;
      messageId: string;
      status: AttachmentStatus;
    }) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            attachments: m.attachments.map(a =>
              a.id === attachmentId ? { ...a, status } : a,
            ),
          };
        }),
      );
    });

    // AI стриминг
    socket.on('thinking', ({ messageId }: { messageId: string }) => {
      setStreamingMessageId(messageId);
      streamBufferRef.current[messageId] = '';
    });

    socket.on('chunk', ({ messageId, text }: { messageId: string; text: string }) => {
      streamBufferRef.current[messageId] =
        (streamBufferRef.current[messageId] ?? '') + text;
      // Добавить/обновить временный assistant bubble
      setMessages(prev => {
        const hasStreaming = prev.some(m => m.id === `streaming-${messageId}`);
        const streamingMessage: Message = {
          id: `streaming-${messageId}`,
          role: 'assistant',
          content: streamBufferRef.current[messageId],
          status: 'AI_PROCESSING',
          attachments: [],
          createdAt: new Date().toISOString(),
        };
        if (hasStreaming) {
          return prev.map(m =>
            m.id === `streaming-${messageId}` ? streamingMessage : m,
          );
        }
        return [...prev, streamingMessage];
      });
    });

    socket.on('done', ({ messageId }: { messageId: string }) => {
      // Убрать временный bubble — message_updated DONE + loadHistory уже обработают
      setMessages(prev => prev.filter(m => m.id !== `streaming-${messageId}`));
      delete streamBufferRef.current[messageId];
    });

    socket.on('error', ({ messageId, message }: { messageId: string; message: string }) => {
      console.error(`AI error for message ${messageId}:`, message);
      setStreamingMessageId(null);
      setMessages(prev => prev.filter(m => m.id !== `streaming-${messageId}`));
    });

    return () => { socket.disconnect(); };
  }, [accessToken, proposalId]);

  const send = async (content: string, files?: File[]) => {
    // Оптимистично добавить сообщение с временным ID
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: tempId,
        role: 'user',
        content,
        status: files?.length ? 'PREPARING_ATTACHMENTS' : 'READY_FOR_AI',
        attachments: [],
        createdAt: new Date().toISOString(),
      },
    ]);

    const fd = new FormData();
    fd.append('content', content);
    files?.forEach(f => fd.append('files', f));

    const { messageId } = await fetch(`/proposals/${proposalId}/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: fd,
    }).then(r => r.json());

    // Заменить temp ID на реальный
    setMessages(prev =>
      prev.map(m => m.id === tempId ? { ...m, id: messageId } : m),
    );

    return messageId;
  };

  const openAttachment = async (attachmentId: string) => {
    const { url } = await fetch(
      `/proposals/${proposalId}/chat/attachments/${attachmentId}/url`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ).then(r => r.json());
    window.open(url, '_blank');
  };

  return { messages, streamingMessageId, send, openAttachment };
}
```

**Рендер вложений:**

```tsx
function AttachmentChip({
  attachment,
  onOpen,
}: {
  attachment: MessageAttachment;
  onOpen: (id: string) => void;
}) {
  const label: Record<AttachmentStatus, string> = {
    PENDING:    '⏳ Ожидает',
    PROCESSING: '⚙️ Обрабатывается',
    DONE:       '📎',
    FAILED:     '❌ Ошибка',
  };

  return (
    <button
      onClick={() => attachment.status === 'DONE' && onOpen(attachment.id)}
      disabled={attachment.status !== 'DONE'}
      title={attachment.fileName}
    >
      {label[attachment.status]} {attachment.fileName}
    </button>
  );
}

{message.attachments.map(a => (
  <AttachmentChip key={a.id} attachment={a} onOpen={openAttachment} />
))}
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

## Telegram Auth

Управление авторизацией Telegram-клиента. Все эндпоинты требуют JWT.  
Сессия хранится в Settings (`job_scanner.telegram.session`), нигде в файловой системе.

### POST /telegram/auth/start — отправить код на номер

Отправляет код авторизации на номер `TG_PHONE` из ENV.

```http
POST /telegram/auth/start
Authorization: Bearer <token>
```

**Ответ `204`:** пустое тело. После этого Telegram пришлёт код на указанный номер.

---

### POST /telegram/auth/verify — подтвердить код

```http
POST /telegram/auth/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "12345"
}
```

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `code` | string | да | Код из Telegram (5–6 символов) |

**Ответ `204`:** пустое тело. Сессия сохранена, listener запущен.  
**`400`:** если код неверный или `start` не был вызван.

---

### POST /telegram/auth/logout — выйти из Telegram

```http
POST /telegram/auth/logout
Authorization: Bearer <token>
```

**Ответ `204`:** пустое тело. Сессия очищена, listener остановлен.

---

### Типичный flow авторизации

```js
// 1. Запросить код
await fetch('/telegram/auth/start', { method: 'POST', headers });

// 2. Пользователь получает код в Telegram → вводит в интерфейсе
await fetch('/telegram/auth/verify', {
  method: 'POST',
  headers,
  body: JSON.stringify({ code: '54321' }),
});

// 3. Готово — listener активен, job posts начинают поступать автоматически

// 4. При необходимости — разлогиниться
await fetch('/telegram/auth/logout', { method: 'POST', headers });
```

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

### DELETE /job-posts/:id — удалить

```http
DELETE /job-posts/:id
Authorization: Bearer <token>
```

**Ответ `204`:** пустое тело. `404` если не найден.

---

### POST /job-posts/:id/to-proposal — конвертировать в proposal

Создаёт новый Proposal на основе данных JobPost и связывает их. Платформа подставляется автоматически (Upwork), `accountId` не заполняется.

```http
POST /job-posts/:id/to-proposal
Authorization: Bearer <token>
Content-Type: application/json

{
  "proposalType": "Bid",
  "boosted": false,
  "connects": 6,
  "boostedConnects": 0
}
```

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `proposalType` | enum | да | `Bid` \| `Invite` \| `DirectMessage` |
| `boosted` | boolean | нет | Буст (только для `Bid`, default: `false`) |
| `connects` | number | нет | Коннекты (только для `Bid`, default: `0`) |
| `boostedConnects` | number | нет | Коннекты за буст (только если `boosted: true`) |

**Маппинг полей из JobPost:**

| JobPost | Proposal | Примечание |
|---|---|---|
| `title` | `title` | если `null` — берётся первые 100 символов `rawText` |
| `jobUrl` | `jobUrl` | |
| `rawText` | `vacancy` | полный текст поста |
| `id` | `jobPostId` | связь между сущностями |
| — | `source` | всегда `telegram` |
| — | `platformId` | всегда Upwork |
| — | `accountId` | всегда `null` |

**Ответ `201`:** объект созданного Proposal.

```json
{
  "id": "uuid",
  "title": "Senior LLM Applications Engineer — Multi-Agent Pipelines",
  "jobUrl": "https://www.upwork.com/jobs/~022046575121448151704",
  "vacancy": "📡 New opportunity detected\nSenior LLM...",
  "proposalType": "Bid",
  "status": "Draft",
  "source": "telegram",
  "boosted": false,
  "connects": 6,
  "boostedConnects": 0,
  "coverLetter": null,
  "sentAt": null,
  "accountId": null,
  "platformId": "uuid-of-upwork",
  "jobPostId": "uuid-of-job-post",
  "userId": "uuid",
  "createdAt": "2026-04-22T10:00:00.000Z",
  "updatedAt": "2026-04-22T10:00:00.000Z",
  "chat": { "id": "uuid", "proposalId": "uuid", "leadId": null, "createdAt": "..." }
}
```

`404` если JobPost не найден.  
`409` если для этого JobPost уже существует Proposal.

---

## Prompts

Управление AI-промптами. Промпты хранятся в БД, AI-сервисы загружают их динамически. При отсутствии активного промпта используется встроенный хардкод.

**Типы промптов (`PromptType`):** `JOB_GATEKEEPER` · `JOB_EVALUATION` · `CHAT_SYSTEM` · `CHAT_FALLBACK`

**Объект Prompt:**

```json
{
  "id": "uuid",
  "type": "CHAT_SYSTEM",
  "title": "Chat System",
  "content": "You are an assistant...",
  "isActive": true,
  "version": 2,
  "createdBy": "seed",
  "updatedBy": null,
  "createdAt": "2026-04-23T10:00:00.000Z",
  "updatedAt": "2026-04-23T10:00:00.000Z"
}
```

---

### GET /prompts — список с пагинацией

```http
GET /prompts?type=CHAT_SYSTEM&isActive=true&page=1&limit=10
Authorization: Bearer <token>
```

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `type` | `PromptType` | — | Фильтр по типу |
| `isActive` | `boolean` | — | Фильтр по активности |
| `page` | number | `1` | Номер страницы |
| `limit` | number | `10` | Записей на странице |

**Ответ `200`:**

```json
{
  "data": [...],
  "total": 12
}
```

> Количество страниц: `Math.ceil(total / limit)`

---

### GET /prompts/:id — один промпт

```http
GET /prompts/:id
Authorization: Bearer <token>
```

**Ответ `200`:** объект промпта. `404` если не найден.

---

### POST /prompts — создать

Новый промпт всегда создаётся с `isActive: false` и `version: 1`.

```http
POST /prompts
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "CHAT_SYSTEM",
  "title": "Chat System v2",
  "content": "You are an expert sales manager..."
}
```

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `type` | `PromptType` | да | Тип промпта |
| `title` | string | да | Название промпта |
| `content` | string | да | Текст промпта |

**Ответ `201`:** объект созданного промпта. `400` если `content` пустой.

---

### PATCH /prompts/:id — редактировать

Создаёт **новую версию** промпта на основе существующего (старая запись остаётся нетронутой):
- Если оригинал был `isActive: true` → новый промпт становится активным, оригинал деактивируется
- Если оригинал был `isActive: false` → новый промпт создаётся неактивным

```http
PATCH /prompts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "You are an expert sales manager..."
}
```

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `content` | string | да | Новый текст промпта |

**Ответ `200`:** объект нового промпта. `400` если `content` пустой. `404` если промпт не найден.

---

### PATCH /prompts/:id/activate — активировать

Активирует промпт. Все остальные промпты того же типа автоматически деактивируются.

```http
PATCH /prompts/:id/activate
Authorization: Bearer <token>
```

**Ответ `200`:** обновлённый объект промпта. `404` если не найден.

---

### DELETE /prompts/:id — удалить

```http
DELETE /prompts/:id
Authorization: Bearer <token>
```

**Ответ `204`:** пустое тело. `400` если промпт активен. `404` если не найден.

---

## Client Requests

Входящие заявки с контактной формы сайта. Создаются публично (без авторизации), управляются через JWT.

### POST /client-requests — создать заявку (публичный)

```http
POST /client-requests
Content-Type: multipart/form-data
```

| Поле | Тип | Обязательный | Описание |
|---|---|---|---|
| `name` | string | да | Имя отправителя |
| `email` | string | да | Email |
| `company` | string | нет | Компания |
| `phone` | string | нет | Телефон |
| `phoneCountry` | string | нет | Код страны (например: `us`) |
| `message` | string | нет | Сообщение |
| `services` | JSON string array | нет | Список услуг, например `["Web Development","MVP"]` |
| `files` | file[] | нет | До 20 файлов, суммарно до 100 МБ |

**Ответ `201`:** созданный объект заявки.

> При создании автоматически отправляется уведомление в Discord.

---

### GET /client-requests — список с пагинацией

```http
GET /client-requests?page=1&limit=10
Authorization: Bearer <token>
```

**Ответ `200`:**

```json
{
  "data": [...],
  "total": 12
}
```

---

### GET /client-requests/:id — одна заявка

```http
GET /client-requests/:id
Authorization: Bearer <token>
```

**Ответ `200`:** объект заявки. `404` если не найдена.

---

### PATCH /client-requests/:id — обновить

```http
PATCH /client-requests/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "conversation_ongoing"
}
```

**Статусы (`ClientRequestStatus`):** `on_review` · `conversation_ongoing` · `archived`

**Ответ `200`:** обновлённый объект.

---

### DELETE /client-requests/:id — удалить

```http
DELETE /client-requests/:id
Authorization: Bearer <token>
```

> Удаляет заявку и все прикреплённые файлы с диска.

**Ответ `204`:** пустое тело.

---

## Settings

Управление настройками приложения. Структура (секции и ключи) задаётся через seed и не меняется через API — только значения.

### Объект Setting

```json
{
  "key": "job_scanner.enabled",
  "title": "Enable Job Scanner",
  "description": "Enable real-time processing of new job posts",
  "type": "boolean",
  "uiType": "toggle",
  "isSecret": false,
  "isRequired": false,
  "order": 0,
  "options": null,
  "validationSchema": null,
  "defaultValue": true,
  "value": true
}
```

| Поле | Описание |
|---|---|
| `key` | Уникальный ключ настройки |
| `type` | Тип значения: `string` · `number` · `boolean` · `json` |
| `uiType` | Подсказка для UI: `input` · `textarea` · `select` · `toggle` · `password` |
| `isSecret` | Если `true` — `value` возвращается как `"***"`, `defaultValue` скрыт |
| `isRequired` | Признак обязательности |
| `options` | Массив вариантов для `select`, иначе `null` |
| `validationSchema` | Объект с ограничениями, например `{ "min": 0, "max": 100 }` для `number` |
| `value` | Текущее сохранённое значение или `defaultValue` если не задано |

---

### GET /settings — все секции с настройками

```http
GET /settings
Authorization: Bearer <token>
```

**Ответ `200`:** массив секций, отсортированных по `order`. Каждая содержит `settings` — настройки отсортированы по `order`.

```json
[
  {
    "key": "job_scanner",
    "title": "Job Scanner",
    "order": 2,
    "settings": [ ... ]
  }
]
```

---

### GET /settings/:key — одна настройка

```http
GET /settings/job_scanner.enabled
Authorization: Bearer <token>
```

**Ответ `200`:** объект настройки. `404` если не найдена.

---

### PATCH /settings/:key — обновить значение

```http
PATCH /settings/job_scanner.notifications.min_score
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": 80
}
```

Валидация типов:

| `type` | Допустимый `value` |
|---|---|
| `string` | строка |
| `number` | число или числовая строка; проверяется `validationSchema.min` / `max` |
| `boolean` | `true` / `false` или строки `"true"` / `"false"` |
| `json` | объект или JSON-строка |

**Ответ `204`:** пустое тело. `400` если тип или диапазон не совпадает. `404` если настройка не найдена.

---

### Секции и настройки

**Порядок секций:**

| order | key | title |
|---|---|---|
| 0 | `general` | General |
| 1 | `ai` | AI Settings |
| 2 | `job_scanner` | Job Scanner |
| 3 | `integrations` | Integrations |
| 4 | `notifications` | Notifications |
| 5 | `api_keys` | API Keys |
| 6 | `invoice` | Invoice |

**job_scanner:**

| Ключ | uiType | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `job_scanner.enabled` | toggle | boolean | `true` | Включить обработку постов из Telegram |
| `job_scanner.backfill.enabled` | toggle | boolean | `false` | Включить backfill исторических постов |
| `job_scanner.backfill.limit` | input | number | `50` | Кол-во постов за один backfill-запуск (1–1000) |
| `job_scanner.notifications.min_score` | input | number | `70` | Минимальный score для отправки в Discord (0–100) |
| `job_scanner.telegram.session` | password | string | `""` | Сессия gramjs (только запись через POST /telegram/auth/verify, `isSecret: true`) |
| `job_scanner.telegram.connected` | toggle | boolean | `false` | Статус подключения Telegram-клиента (read-only индикатор) |

**invoice:**

| Ключ | uiType | Тип | Описание |
|---|---|---|---|
| `invoice.client.details` | textarea | json | Реквизиты клиента по умолчанию |
| `invoice.contractor.details` | textarea | json | Реквизиты контрагента по умолчанию |

---

## Коды ошибок

| Код | Описание |
|---|---|
| `400` | Неверные данные запроса |
| `401` | Не авторизован / токен истёк / невалидный refresh token |
| `404` | Ресурс не найден |
| `409` | Конфликт (например, proposal для этого JobPost уже существует) |
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
