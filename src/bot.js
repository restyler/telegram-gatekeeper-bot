import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { askNextQuestion, saveAnswerAndContinue } from './questions.js';
import db from './db.js'; // Assuming you have a database.js file for DB connection
import { logInteraction } from './logger.js';

config();


// Middleware function to log messages
async function logMessages(msg, response, isBot = false) {
    await logInteraction(msg.from.id, msg.text, response, isBot);
}

// Create a configuration object for the bot
const botConfig = {
    polling: true
};

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
  
// Add proxy to the bot configuration if the environment variable is set and is a valid URL
if (process.env.TELEGRAM_PROXY_URL && isValidUrl(process.env.TELEGRAM_PROXY_URL)) {
    botConfig.proxy = process.env.TELEGRAM_PROXY_URL;
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, botConfig);

// Global exception handler for unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
// Here you can add logic to perform on these cases, such as logging or sending an alert message
});

// Wrap your bot.sendMessage to automatically log the interactions
const originalSendMessage = bot.sendMessage.bind(bot);
bot.sendMessage = async (chatId, text, options) => {
    await logMessages({from: {id: chatId}, text: text}, text, true); // Log the bot's response
    return originalSendMessage(chatId, text, options);
};



// Handle new user messages
bot.on('message', async (msg) => {
    const userId = msg.from.id;
    const messageText = msg.text;

    // Log the incoming message
    await logInteraction(userId, messageText, '');

    // Check if the message is a command or a regular message
    if (!msg.text) {
        console.log('event message', msg);
    } else if (msg.text.startsWith("/")) {
        

        if (msg.text.startsWith("/start")) {
            bot.sendMessage(userId, "Hey there! 👋 I'm the Gatekeeper Bot for the Sole Founders chat. We're crafting a tight-knit community of tech-savvy business owners, particularly those involved in bootstrapping and scaling 🚀 SaaS businesses. \n\nAt present, we're accepting product owners who already have a stream of recurring revenue (10K to 10M ARR). To join our group, could you please answer the following questions?");


            // Create a new profile for the user. Do no execute if the user already exists. insert user name, first name, last name if they exist in msg
            // await db('profiles').insert({ user_id: userId, current_question_index: 0, is_completed: false });
            if (!await db('profiles').where({ user_id: userId }).first()) {
                await db('profiles').insert({ user_id: userId, current_question_index: 0, is_completed: false, username: msg.from.username, first_name: msg.from.first_name, last_name: msg.from.last_name });
            }
            

            
        }

        // reset db counter
        if (msg.text.startsWith("/reset")) {
            console.log('resetting db counter');
            //bot.sendMessage(userId, "Resetting db counter");
            await db('profiles').where({ user_id: userId }).update({ current_question_index: 0, is_completed: 0 });
        }
        

        await askNextQuestion(bot, userId);

        // Handle commands like /start
    } else {
        // Check if the user is currently in the middle of answering questions
        const user = await db('profiles').where({ user_id: userId }).first();

        if (user && !user.is_completed) {
            // Save the answer and ask the next question
            saveAnswerAndContinue(bot, userId, msg.text);
        } else {
            // If not in the middle of questions, start the process
            askNextQuestion(bot, userId);
        }
    }
});

// Handle callback queries for approvals
bot.on('callback_query', async (callbackQuery) => {
    console.log('CB333####', callbackQuery)
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;

    // Implement the logic to handle approvals
    // if data.startsWith('approve_'), update the user's approval status in the database
    if (data.startsWith('approve_')) {
        //console.log('##APPROVE CALLBACK', data);
        const userId = data.split('_')[1];
        await db('profiles').where({ user_id: userId }).update({ is_approved: true });
        // generate unique invite link
        let groupId = process.env.TELEGRAM_PROTECTED_GROUP_ID;
        let inviteLink = await bot.exportChatInviteLink(groupId)
        
        bot.sendMessage(userId, `You've been approved, welcome! ${inviteLink}`);
        bot.sendMessage(process.env.TELEGRAM_BOT_OWNER_CHAT_ID, `Approved ${userId} with invite link ${inviteLink}`);


        // Edit the original message to reflect the approval status
        // Assuming you have stored the message id of the original message somewhere
        // You will need the chat_id and message_id of the message you want to edit
        if (callbackQuery.message) {
            console.log("callbackQuery.message", callbackQuery.message);
            const originalMessageId = callbackQuery.message.message_id; // Retrieve the original message ID from where you store it
            const chatId = process.env.TELEGRAM_BOT_OWNER_CHAT_ID; // The chat where the original message was sent

            const updatedMessage = `${callbackQuery.message.text}\n\n✅✅✅ Member APPROVED`;
            bot.editMessageText(updatedMessage, {
                chat_id: chatId,
                message_id: originalMessageId
            });
        }
        
    }
});

bot.on('new_chat_members', async (msg) => {
    const newMembers = msg.new_chat_members;
    newMembers.forEach(async (member) => {
      // Ignore the bot's own join event
      if (member.username !== bot.username) {
        const userId = member.id;
        const profile = await db('profiles').where({ user_id: userId }).first();
        //console.log('profile####3433', profile);
        if (profile && profile.is_approved) {
            const displayName = member.username ? `@${member.username}` : member.first_name; // Use username or first name
          const welcomeMessage = `Welcome, ${displayName}! 👋 We're excited to have you join our community. ` +
                                 `Here's a bit about ${member.first_name}: \n<b>Product website:</b> ${profile.answer1}\n<b>About:</b> ${profile.answer2}\n` +
                                 `They're currently at a monthly recurring revenue of <b>${profile.answer3}</b>. ` +
                                 `Let's give them a warm welcome! #intro`;
          bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'HTML' });
        } else {
            bot.sendMessage(process.env.TELEGRAM_BOT_OWNER_CHAT_ID, `New member ${userId} ${displayName} is not approved.`);
            //bot.sendMessage(msg.chat.id, 'Who are you?');
        }
      }
    });
  });
  

bot.on('polling_error', (error) => {
    console.log(error);  // Log errors
});
