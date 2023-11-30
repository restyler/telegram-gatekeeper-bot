# Telegram Gatekeeper Bot

This is a simple bot that surveys the visitor with three questions and saves each response to a MySQL database. The bot admin can view the survey results for each user and approve them to join the group. Approved users will receive a message with a unique invite link to the group.

## Screenshots
1. Survey questions:
![Survey](/scrn1.png)

2. Admin decides to approve the user and clicks "Approve":
![Introduction on join](/scrn2.png)

3. Bot welcomes the member on join with his survery results so all members see who they are talking to:
![Introduction on join](/scrn3.png)

I built this bot because the standard approval workflow for Telegram groups is too simplistic. Most text variables are hardcoded; see the `./src/*` files. Pull requests are welcome!

## Installation
1. Clone this repository.
2. Install dependencies: `npm install`.
3. Create a MySQL database and execute `npx knex migrate:up`.
4. Create a Telegram bot via BotFather and enter the token into `.env`.
5. Create a private Telegram group and enter the group ID into `.env`. Set up permissions for the group to prevent members from manually obtaining or sharing invite links. Direct everyone who wants to join the group to your gatekeeper bot.
6. Add the bot to the group as an admin.
7. Run the bot: `npm start prod`.
