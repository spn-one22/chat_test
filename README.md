<p align="right">
  <a href="./README.en.md">
    <img src="https://img.shields.io/badge/🇬🇧-English%20version-blue?style=for-the-badge">
  </a>
</p>
 

![JMeter](https://img.shields.io/badge/Apache-JMeter-red?logo=apache&style=for-the-badge)
![HTML](https://img.shields.io/badge/HTML-5-orange?logo=html5&style=for-the-badge)
![CSS](https://img.shields.io/badge/CSS-3-blue?logo=css3&style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?logo=javascript&style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8-orange?style=for-the-badge&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=for-the-badge&logo=docker)
![InfluxDB](https://img.shields.io/badge/InfluxDB-22ADF6?logo=influxdb&logoColor=white&style=for-the-badge)
![Telegraf](https://img.shields.io/badge/Telegraf-3B4261?logo=influxdb&logoColor=white&style=for-the-badge)
![Grafana](https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=white&style=for-the-badge)

<b>CHAT_TEST</b> - это пробный проект для локального развертывания на Docker для того чтобы протестировать API а также для создания и отработки тест планов по нагрузочному тестированию на JMeter.

_____________________________

## 🚀 Запуск проекта локально

### Требования
- [Docker](https://www.docker.com/) + Docker Compose
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) (опционально) 

### Шаги запуска
```bash
git clone https://github.com/spn_one22/chat_test.git
cd chat_test
cp .env.example .env
docker compose up -d --build
```
##### В .env можно изменить:

- ADMIN_LOGIN / ADMIN_PASSWORD — учётка администратора
- MYSQL_* — настройки базы
- JWT_SECRET — секрет для токенов


###### Открыть в браузере: [http://localhost:8090](http://localhost:8090)

- `index.html` → регистрация / вход  
- `chat.html` → чат  
- `admin.html` → админка  

---

## 🗄 Подключение к БД для визуального отслеживания
- Host: `127.0.0.1`  
- Port: `3307`  
- User: `appuser`  
- Password: `appsecret`  
- Database: `messenger`  

---

## 📖 API документация

### Auth:

- **POST /api/auth/register** — регистрация  
##### <i>Body:</i>
```
{ "login": "user1", "password": "secret123" }
```
##### <i>Response:</i>
```
{
"ok": true,
"data": { "id": 1, "login": "user1" } 
}
```
##
- **POST /api/auth/login** — логин  
##### <i>Body:</i>
```
{ 
"login": "user1",
"password": "secret123" 
}
```
##### <i>Response:</i>
```
{ 
"ok": true, 
"data": { "token": "...", "role": "user" } 
}
```
---

### Messages:
- **GET /api/messages** — получить все  
##### <i>Response:</i>
```
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "text": "Message text",
      "createdAt": "2025-08-25 12:00",
      "authorId": 1,
      "authorLogin": "user1"
    }
  ]
}
```
##
- **POST /api/messages** — создать  
`Authorization: Bearer <JWT>`
##### <i>Body:</i>
```
{ "text": "Message text" }
```
##
- **PATCH /api/messages/:id** — изменить  
`Authorization: Bearer <JWT>`
##### <i>Body:</i>
```
{ "text": "Changed message text" }
```
##
- **DELETE /api/messages/:id** — удалить  
`Authorization: Bearer <JWT>`
---

### Admin (доступ только для role = admin)
- **GET /api/admin/users** — список пользователей  
`Authorization: Bearer <JWT>`
##
- **PATCH /api/admin/users/:id** — изменить  
`Authorization: Bearer <JWT>`
##### <i>Body:</i>
```
{ "role": "admin", "banned": true }
```
##
- **DELETE /api/admin/users/:id** — удалить  
`Authorization: Bearer <JWT>`

---

## 📦 Стек
- Node.js + Express  
- MySQL 8  
- JWT  
- Docker Compose  
- HTML / CSS / JS  

