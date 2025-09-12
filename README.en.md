<p align="right">
  <a href="./README.md">
    <img src="https://img.shields.io/badge/🇷🇺-Russian%20version-blue?style=for-the-badge">
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


<b>CHAT_TEST</b> - This is a trial project for local deployment on Docker in order to test the API, as well as to create and refine test plans for load testing on JMeter.

---

## 🚀 Run locally

### Requirements
- [Docker](https://www.docker.com/) + Docker Compose
- (optional) [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

### Steps
```bash
git clone https://github.com/<your_name>/finalchat.git
cd chat_test
cp .env.example .env
docker compose up -d --build
```
##### In .env you can change:

- ADMIN_LOGIN / ADMIN_PASSWORD — admin credentials
- MYSQL_* — database config
- JWT_SECRET — secret for tokens

###### Open in browser: [http://localhost:8090](http://localhost:8090)

- `index.html` → register / login  
- `chat.html` → chat  
- `admin.html` → admin panel  

---

## 🗄 Database connection for visual tracking
- Host: `127.0.0.1`  
- Port: `3307`  
- User: `appuser`  
- Password: `appsecret`  
- Database: `messenger`  

---

## 📖 API documentation

### Auth:

- **POST /api/auth/register** — registration 
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
- **POST /api/auth/login** — login
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
- **GET /api/messages** — take all 
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
- **POST /api/messages** — create 
`Authorization: Bearer <JWT>`
##### <i>Body:</i>
```
{ "text": "Message text" }
```
##
- **PATCH /api/messages/:id** — update
`Authorization: Bearer <JWT>`
##### <i>Body:</i>
```
{ "text": "Changed message text" }
```
##
- **DELETE /api/messages/:id** — delete  
`Authorization: Bearer <JWT>`
---

### Admin (for role = admin only)
- **GET /api/admin/users** — list users 
`Authorization: Bearer <JWT>`
##
- **PATCH /api/admin/users/:id** — update  
`Authorization: Bearer <JWT>`
##### <i>Body:</i>
```
{ "role": "admin", "banned": true }
```
##
- **DELETE /api/admin/users/:id** — delete 
`Authorization: Bearer <JWT>`

---


## 📦 Stack
- Node.js + Express  
- MySQL 8  
- JWT  
- Docker Compose  
- HTML / CSS / JS  
