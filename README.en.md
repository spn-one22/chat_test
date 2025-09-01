chat_test
[Русская версия](./README.md)

![JMeter](https://img.shields.io/badge/Apache-JMeter-red?logo=apache&style=for-the-badge)
![HTML](https://img.shields.io/badge/HTML-5-orange?logo=html5&style=for-the-badge)
![CSS](https://img.shields.io/badge/CSS-3-blue?logo=css3&style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?logo=javascript&style=for-the-badge)
![Banner](https://img.shields.io/badge/FinalChat-Messenger-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8-orange?style=for-the-badge&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=for-the-badge&logo=docker)

chat_test - This is a trial project for local deployment on Docker in order to test the API as well as to create test plans for load testing on JMeter.

---

🚀 Run locally

Requirements:
- [Docker](https://www.docker.com/) + Docker Compose
- (optional) [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

Steps:

git clone https://github.com/<your_name>/finalchat.git
cd finalchat
cp .env.example .env
docker compose up -d --build
```

Open in browser: [http://localhost:8090](http://localhost:8090)

- `index.html` → register / login  
- `chat.html` → chat  
- `admin.html` → admin panel  

---

## 🗄 Database connection
- Host: `127.0.0.1`  
- Port: `3307`  
- User: `appuser`  
- Password: `appsecret`  
- Database: `messenger`  

---

## 📖 API Documentation

### Auth
- **POST /api/auth/register** — register  
- **POST /api/auth/login** — login  

### Messages
- **GET /api/messages** — get all  
- **POST /api/messages** — create  
- **PATCH /api/messages/:id** — update  
- **DELETE /api/messages/:id** — delete  

### Admin (admin only)
- **GET /api/admin/users** — list users  
- **PATCH /api/admin/users/:id** — update  
- **DELETE /api/admin/users/:id** — delete  

---

## 📦 Stack
- Node.js + Express  
- MySQL 8  
- JWT  
- Docker Compose  
- HTML / CSS / JS  
