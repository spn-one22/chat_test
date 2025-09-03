# FinalChat AdminPanel — API документация

Эта документация описывает HTTP API сервера (Node.js/Express + MySQL, JWT-аутентификация). Она составлена по коду `server.js` и отражает фактическое поведение эндпоинтов, статусы и полезные детали для интеграции и тестирования.

---

## Базовая информация

- **Базовый URL**: зависит от развертывания (пример: `http://localhost:8080`)
- **Версия API**: не версионируется (префикс `/api`)
- **Формат данных**: `application/json` в запросах и ответах
- **Кодировка дат**: строки формата `YYYY-MM-DD HH:mm` (MySQL `DATE_FORMAT('%Y-%m-%d %H:%i')`)
- **CORS**: включён
- **Статическая выдача UI**: корень `/` раздаёт содержимое папки `public`

---

## Аутентификация и авторизация

- Используется **JWT Bearer** токен.
- Получение токена — через **POST** `/api/auth/login`.
- Токен добавляется в заголовок:  
  `Authorization: Bearer <jwt>`
- Срок жизни токена: **1 день**.
- Роли:
  - `user` — базовая роль,
  - `admin` — права администратора.
- Изменения ролей/банов проверяются на каждый админ‑запрос (запрос идёт в БД при middleware).

### Модель ответа об ошибке (общая)

Большинство ошибок возвращаются в виде:
```json
{ "ok": false, "message": "описание" }
```

### Модель успешного ответа (общая)

Варианты:
```json
{ "ok": true }
```
или
```json
{ "ok": true, "data": { ... } }
```

---

## Переменные окружения

| Переменная            | Назначение                                   | Значение по умолчанию |
|-----------------------|-----------------------------------------------|-----------------------|
| `PORT`                | Порт HTTP‑сервера                             | `8080`                |
| `JWT_SECRET`          | Секрет для подписи JWT                        | `"dev-secret"`        |
| `DB_HOST`             | Хост MySQL                                    | `"mysql"`             |
| `DB_PORT`             | Порт MySQL                                    | `3306`                |
| `DB_USER`             | Пользователь MySQL                            | `"appuser"`           |
| `DB_PASSWORD`         | Пароль MySQL                                  | `"appsecret"`         |
| `DB_NAME`             | База данных                                   | `"messenger"`         |
| `ADMIN_LOGIN`         | Логин авто‑создаваемого администратора        | `admin`               |
| `ADMIN_PASSWORD`      | Пароль авто‑создаваемого администратора       | `admin12345`          |

> Если заданы `ADMIN_LOGIN` и `ADMIN_PASSWORD`, при старте будет создан/повышен пользователь с ролью `admin` и `banned=0`.

---

## Модели данных (ожидаемые структуры в БД)

> Схема БД на уровне кода не мигрируется, поля выведены по использованию.

### User
- `id` (int, PK, auto)
- `login` (varchar, уникальный)
- `password` (varchar, bcrypt hash)
- `role` (`'user' | 'admin'`, default `'user'`)
- `banned` (tinyint/bool, default `0`)
- `createdAt` (datetime, default now)

### Message
- `id` (int, PK, auto)
- `text` (text/varchar)
- `userId` (int, FK → users.id)
- `createdAt` (datetime, default now)

---

## Эндпоинты

### 1) Healthcheck
`GET /api/health` — проверка доступности API.

**Успех 200**
```json
{ "ok": true, "name": "FinalChat AdminPanel" }
```

---

### 2) Регистрация и вход

#### 2.1 Регистрация
`POST /api/auth/register`

**Body**
```json
{
  "login": "string >= 3",
  "password": "string >= 6"
}
```

**Ошибки**
- 400 — `login too short` / `password too short` / `login already taken`
- 500 — `server error`

**Успех 201**
```json
{
  "ok": true,
  "data": {
    "id": 123,
    "login": "alice"
  }
}
```

#### 2.2 Вход
`POST /api/auth/login`

**Body**
```json
{ "login": "alice", "password": "secret" }
```

**Ошибки**
- 400 — `login and password required` / `invalid credentials`
- 403 — `user banned`
- 500 — `server error`

**Успех 200**
```json
{
  "ok": true,
  "data": {
    "token": "<JWT>",
    "role": "user"
  }
}
```

> Используйте полученный `token` как `Authorization: Bearer <JWT>`.

---

### 3) Сообщения

#### 3.1 Список сообщений
`GET /api/messages` — последние 200 сообщений (в порядке от новых к старым).

**Параметры**: —

**Успех 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": 321,
      "text": "Hello world",
      "createdAt": "2025-01-31 16:40",
      "authorId": 7,
      "authorLogin": "alice"
    }
  ]
}
```

**Ошибки**
- 500 — `server error`

#### 3.2 Создать сообщение
`POST /api/messages` — **требует авторизацию**.

**Headers**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Body**
```json
{ "text": "Привет!" }
```

**Ошибки**
- 400 — `text required`
- 403 — `banned` (если пользователь в бане)
- 401 — `Missing token` / `Invalid token`
- 500 — `server error`

**Успех 201**
```json
{
  "ok": true,
  "data": {
    "id": 322,
    "text": "Привет!",
    "createdAt": "2025-01-31 16:42"
  }
}
```

#### 3.3 Редактировать сообщение
`PATCH /api/messages/:id` — **требует авторизацию**. Доступно владельцу сообщения или администратору.

**Особенность:** текст сохраняется **с добавлением** суффикса `"[edited by <login>]"` на стороне сервера.

**Body**
```json
{ "text": "Исправленный текст" }
```

**Ошибки**
- 400 — `id and text required`
- 401 — `Missing token` / `Invalid token`
- 403 — `forbidden` (не владелец и не админ) / `banned` (владелец в бане)
- 404 — `not found`
- 500 — `server error`

**Успех 200**
```json
{ "ok": true }
```

#### 3.4 Удалить сообщение
`DELETE /api/messages/:id` — **требует авторизацию**. Доступно владельцу сообщения или администратору.

**Ошибки**
- 400 — `id required`
- 401 — `Missing token` / `Invalid token`
- 403 — `forbidden`
- 404 — `not found`
- 500 — `server error`

**Успех 204** — пустой ответ.

---

### 4) Администрирование пользователей

Все эндпоинты ниже требуют **авторизации** и **роли `admin`**. Роль проверяется в БД при каждом запросе.

#### 4.1 Список пользователей
`GET /api/admin/users`

**Query**
- `q` — подстрочный поиск по `login` (опц.).

**Успех 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": 10,
      "login": "alice",
      "role": "admin",
      "banned": 0,
      "createdAt": "2025-01-31 13:12",
      "messages": 42
    }
  ]
}
```

#### 4.2 Обновить пользователя
`PATCH /api/admin/users/:id`

**Body (любой из полей):**
```json
{ "role": "user" }
```
или
```json
{ "banned": true }
```

**Ограничения и ошибки**
- 400 — `id required`  
- 400 — `cannot demote/ban yourself` (если `id` = ваш id и вы пытаетесь выдать `banned=true` или `role='user'`)
- 400 — `invalid role` (если `role` не из `['user','admin']`)
- 400 — `nothing to update` (нет полей в body)
- 401 — `Missing token` / `Invalid token`
- 403 — `admin only` (если не админ)

**Успех 200**
```json
{ "ok": true }
```

#### 4.3 Удалить пользователя
`DELETE /api/admin/users/:id`

**Ошибки**
- 400 — `id required`
- 400 — `cannot delete yourself`
- 401 — `Missing token` / `Invalid token`
- 403 — `admin only`

**Успех 204** — пустой ответ.

---

## Матрица прав

| Действие                                | user (не в бане) | user (в бане) | admin |
|-----------------------------------------|------------------|---------------|-------|
| Регистрация                             | ✅               | ✅            | ✅    |
| Вход                                    | ✅               | ❌            | ✅    |
| Список сообщений                        | ✅               | ✅            | ✅    |
| Создать сообщение                       | ✅               | ❌            | ✅    |
| Редактировать своё сообщение            | ✅               | ❌            | ✅    |
| Удалить своё сообщение                  | ✅               | ✅*           | ✅    |
| Управление пользователями (список/CRUD) | ❌               | ❌            | ✅    |

\*Удаление своего сообщения разрешено даже забаненному, если он уже авторизован и владелец. (На стороне кода бан проверяется при **создании** и **редактировании**, удаление не блокируется.)

---

## Примеры cURL

### Получить токен
```bash
curl -sS -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"alice","password":"secret"}'
```

### Создать сообщение
```bash
TOKEN="..."
curl -sS -X POST http://localhost:8080/api/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Привет!"}'
```

### Отредактировать сообщение
```bash
TOKEN="..."
curl -sS -X PATCH http://localhost:8080/api/messages/322 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Исправленный текст"}'
# => На сервере сохранится: "Исправленный текст [edited by <login>]"
```

### Список пользователей (админ)
```bash
ADMIN_TOKEN="..."
curl -sS "http://localhost:8080/api/admin/users?q=ali" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Коды ответов по эндпоинтам (сводно)

| Эндпоинт                         | 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500 |
|----------------------------------|-----|-----|-----|-----|-----|-----|-----|-----|
| `GET /api/health`                | ✅  |     |     |     |     |     |     |     |
| `POST /api/auth/register`        |     | ✅  |     | ✅  |     |     |     | ✅  |
| `POST /api/auth/login`           | ✅  |     |     | ✅  |     | ✅  |     | ✅  |
| `GET /api/messages`              | ✅  |     |     |     |     |     |     | ✅  |
| `POST /api/messages`             |     | ✅  |     | ✅  | ✅  | ✅  |     | ✅  |
| `PATCH /api/messages/:id`        | ✅  |     |     | ✅  | ✅  | ✅  | ✅  | ✅  |
| `DELETE /api/messages/:id`       |     |     | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  |
| `GET /api/admin/users`           | ✅  |     |     |     | ✅  | ✅  |     |     |
| `PATCH /api/admin/users/:id`     | ✅  |     |     | ✅  | ✅  | ✅  |     |     |
| `DELETE /api/admin/users/:id`    |     |     | ✅  | ✅  | ✅  | ✅  |     |     |

---

## Безопасность и эксплуатационные заметки

- Хеширование паролей: **bcrypt** с cost=10.
- JWT: храните `JWT_SECRET` в секрете, используйте **HTTPS** в проде.
- Админ‑учётка может быть создана автоматически через `ADMIN_LOGIN`/`ADMIN_PASSWORD`.
- В списках нет пагинации (жёсткие лимиты: сообщения — 200, пользователи — 500). При необходимости реализуйте параметры `limit/offset` отдельно.
- Формат времени не содержит таймзону — при распределённом деплое учитывайте TZ MySQL/приложения.
- На редактировании сообщений сервер дописывает маркер `"[edited by <login>]"` — это влияет на точное сравнение текста на клиенте.

---

## Изменения текста на сервере при PATCH сообщения

- Итоговый `text` будет:  
  `"<ваш_text> [edited by <login_редактора>]"`, где `<login_редактора>` — текущий пользователь (владелец или админ).

---

## Готово к использованию

- Запускайте сервис с корректно настроенными переменными окружения.
- Дождитесь готовности MySQL: приложение делает ретраи при старте.
- Пользуйтесь примерами cURL и матрицей прав выше.

