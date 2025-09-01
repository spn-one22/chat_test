FinalChat (Admin Panel)
=======================
Stack: Express + MySQL + JWT + Docker

Pages:
- / (index.html): регистрация/вход
- /chat.html: чат
- /admin.html: панель администратора (список пользователей, поиск, бан/разбан, роль admin/user, удаление)

Admin:
- Укажи ADMIN_LOGIN и ADMIN_PASSWORD в .env — админ будет создан или повышен при старте.
- Забаненные пользователи не могут логиниться и писать/редактировать.

Run:
1) copy .env.example .env
2) docker compose down -v --remove-orphans
3) docker compose up -d --build
4) http://localhost:8090

If schema missing:
docker compose exec -T mysql mysql -uappuser -pappsecret messenger < mysql-init/001_schema.sql
