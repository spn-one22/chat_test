# 📖 chat_test — Полная API документация

**Base URL (локально):** `http://localhost:8090`  
**Формат:** `application/json`  
**Аутентификация:** `Authorization: Bearer <JWT>` для защищённых эндпоинтов  

---

## 📑 Оглавление
- [Healthcheck](#-healthcheck)
- [Auth (регистрация / вход)](#-auth-регистрация--вход)
  - [Регистрация](#регистрация)
  - [Логин](#логин)
- [Messages (работа с сообщениями)](#-messages-работа-с-сообщениями)
  - [Получить все сообщения](#получить-все-сообщения)
  - [Создать сообщение](#создать-сообщение)
  - [Обновить сообщение (владелец или админ)](#обновить-сообщение-владелец-или-админ)
  - [Удалить сообщение (владелец или админ)](#удалить-сообщение-владелец-или-админ)
- [Admin (только роль admin)](#-admin-только-роль-admin)
  - [Получить список пользователей](#получить-список-пользователей)
  - [Изменить пользователя (роль/бан)](#изменить-пользователя-рольбан)
  - [Удалить пользователя](#удалить-пользователя)
  - [Админ: отредактировать любое сообщение](#админ-отредактировать-любое-сообщение)
  - [Админ: удалить любое сообщение](#админ-удалить-любое-сообщение)
- [Примеры с cURL](#-примеры-с-curl)
- [OpenAPI (сводка)](#-openapi-сводка)

---

## 🔹 Healthcheck
```
GET /api/health
```
**200 OK**
```json
{ "ok": true, "name": "FinalChat" }
```

---

## 🔹 Auth (регистрация / вход)

### Регистрация
```
POST /api/auth/register
```
**Body:**
```json
{ "login": "user1", "password": "secret123" }
```
**201 Created**
```json
{ "ok": true, "data": { "id": 12, "login": "user1" } }
```
Ошибки: `400` (валидация/дубликат), `500`

---

### Логин
```
POST /api/auth/login
```
**Body:**
```json
{ "login": "user1", "password": "secret123" }
```
**200 OK**
```json
{ "ok": true, "data": { "token": "JWT_STRING", "role": "user" } }
```
Ошибки: `400` (неверные данные), `403` (user banned), `500`

---

## 🔹 Messages (работа с сообщениями)

### Получить все сообщения
```
GET /api/messages
```
**200 OK**
```json
{
  "ok": true,
  "data": [
    { "id": 1, "text": "Привет!", "createdAt": "2025-08-25 13:40", "authorId": 2, "authorLogin": "alex" }
  ]
}
```

---

### Создать сообщение
```
POST /api/messages
Authorization: Bearer <JWT>
```
**Body:**
```json
{ "text": "Новый текст" }
```
**201 Created**
```json
{ "ok": true, "data": { "id": 5, "text": "Новый текст", "createdAt": "2025-08-25 14:00" } }
```
Ошибки: `401` (нет токена), `403` (banned)

---

### Обновить сообщение (владелец или админ)
```
PATCH /api/messages/:id
Authorization: Bearer <JWT>
```
**Body:**
```json
{ "text": "Исправленный текст" }
```
**200 OK**
```json
{ "ok": true }
```
Ошибки: `403` (нет прав или banned), `404` (не найдено)

---

### Удалить сообщение (владелец или админ)
```
DELETE /api/messages/:id
Authorization: Bearer <JWT>
```
**204 No Content**
Ошибки: `403` (нет прав), `404` (не найдено)

---

## 🔹 Admin (только роль `admin`)

### Получить список пользователей
```
GET /api/admin/users
Authorization: Bearer <JWT>
```
**200 OK**
```json
{
  "ok": true,
  "data": [
    { "id": 1, "login": "admin", "role": "admin", "banned": 0, "createdAt": "2025-08-24 22:10", "messages": 10 }
  ]
}
```
Ошибки: `403` (не admin)

---

### Изменить пользователя (роль/бан)
```
PATCH /api/admin/users/:id
Authorization: Bearer <JWT>
```
**Body:**
```json
{ "role": "admin", "banned": true }
```
**200 OK**
```json
{ "ok": true }
```
Ограничения: нельзя банить/понижать себя (`400`). Ошибки: `401`, `403`

---

### Удалить пользователя
```
DELETE /api/admin/users/:id
Authorization: Bearer <JWT>
```
**204 No Content**
Ограничения: нельзя удалить себя (`400`). Ошибки: `401`, `403`

---

### Админ: отредактировать любое сообщение
```
PATCH /api/admin/messages/:id
Authorization: Bearer <JWT>
```
**Body:**
```json
{ "text": "Исправлено админом" }
```
**200 OK**
```json
{ "ok": true, "data": { "id": 10, "text": "Исправлено админом" } }
```
Ошибки: `403` (не admin), `404` (не найдено)

> Примечание: этот маршрут эквивалентен редактированию через `/api/messages/:id`, но гарантированно доступен только админам и не зависит от владельца сообщения.

---

### Админ: удалить любое сообщение
```
DELETE /api/admin/messages/:id
Authorization: Bearer <JWT>
```
**204 No Content**
Ошибки: `403` (не admin), `404` (не найдено)

---

## 🔹 Примеры с cURL

```bash
# Регистрация
curl -X POST http://localhost:8090/api/auth/register   -H "Content-Type: application/json"   -d '{"login":"user1","password":"secret123"}'

# Логин
curl -X POST http://localhost:8090/api/auth/login   -H "Content-Type: application/json"   -d '{"login":"user1","password":"secret123"}'

# Получить сообщения
curl -X GET http://localhost:8090/api/messages

# Создать сообщение
curl -X POST http://localhost:8090/api/messages   -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json"   -d '{"text":"Hello world"}'

# Владельцу/админу — обновить сообщение
curl -X PATCH http://localhost:8090/api/messages/10   -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json"   -d '{"text":"Edited"}'

# Владельцу/админу — удалить сообщение
curl -X DELETE http://localhost:8090/api/messages/10   -H "Authorization: Bearer <TOKEN)"

# Админ — отредактировать любое сообщение
curl -X PATCH http://localhost:8090/api/admin/messages/10   -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"   -d '{"text":"Moderated content"}'

# Админ — удалить любое сообщение
curl -X DELETE http://localhost:8090/api/admin/messages/10   -H "Authorization: Bearer <ADMIN_TOKEN)"
```

---

## 🔹 OpenAPI (сводка)

```yaml
openapi: 3.0.3
info:
  title: FinalChat API
  version: "1.1"
servers:
  - url: http://localhost:8090
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
paths:
  /api/health:
    get: { summary: Healthcheck }
  /api/auth/register:
    post: { summary: Register new user }
  /api/auth/login:
    post: { summary: Login }
  /api/messages:
    get: { summary: Get all messages }
    post:
      summary: Create message
      security: [ { bearerAuth: [] } ]
  /api/messages/{id}:
    patch:
      summary: Update message (owner or admin)
      security: [ { bearerAuth: [] } ]
    delete:
      summary: Delete message (owner or admin)
      security: [ { bearerAuth: [] } ]
  /api/admin/users:
    get:
      summary: List users
      security: [ { bearerAuth: [] } ]
  /api/admin/users/{id}:
    patch:
      summary: Update user (role/banned)
      security: [ { bearerAuth: [] } ]
    delete:
      summary: Delete user
      security: [ { bearerAuth: [] } ]
  /api/admin/messages/{id}:
    patch:
      summary: Admin edit any message
      security: [ { bearerAuth: [] } ]
    delete:
      summary: Admin delete any message
      security: [ { bearerAuth: [] } ]
```
