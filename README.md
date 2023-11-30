# telegram-gatekeeper-bot

This is a simple bot which surveys the visitor with 3 questions and saves each question to database (MySQL).
The bot admin can see the survey results for each user and can approve the user to join the group.

I've built this bot because stock approval workflow for groups in Telegram is too simple.
Most of text variables are hardcoded, see ./src/* files. PRs welcome!


## Installation
1. Clone this repo
2. Install dependencies: `npm install`
3. Create a MySQL database and run `npx knex migrate:up`
4. Create a Telegram bot via BotFather and put the token into `.env`
5. Create a Telegram group and put the group ID into `.env`
6. Add the bot to the group as admin
7. Run the bot: `npm start prod`