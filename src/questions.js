import TelegramBot from 'node-telegram-bot-api';
import db from './db.js'; // Assuming you have a database.js file for DB connection



// Function to notify the owner for approval
function notifyOwnerForApproval(bot, userId, answers) {
    const message = `New user application:\nUserID: ${userId}\nAnswers:\n1. ${answers[0]}\n2. ${answers[1]}\n3. ${answers[2]}\nApprove this user?`;
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: 'Approve', callback_data: `approve_${userId}` }]]
        })
    };
    bot.sendMessage(process.env.TELEGRAM_BOT_OWNER_CHAT_ID, message, options);
}


export async function askNextQuestion(bot, userId) {
    const questions = [
        "What is your product's website?",
        "Could you tell me about yourself? For example, provide a link to your Reddit/Linkedin profile, where you're from, and what you're currently focusing on in your business development.",
        "What is your current monthly recurring revenue? 💰"
    ];

    // Retrieve the current state from the database
    const user = await db('profiles').where({ user_id: userId }).first();

    if (user) {
        if (user.is_completed) {
            // The user has already completed the questions
            bot.sendMessage(userId, "You have already completed your profile. Send /reset to start over.");
        } else {
            // Ask the next question
            const currentQuestionIndex = user.current_question_index;
            if (currentQuestionIndex < questions.length) {
                bot.sendMessage(userId, `[${currentQuestionIndex+1} OF ${questions.length}] <b>` + questions[currentQuestionIndex] + `</b>`, {parse_mode : "HTML"});
            } else {
                bot.sendMessage(userId, "Thank you for completing your profile! We will review your application and get back to you shortly.");
                // Mark as completed
                await db('profiles')
                    .where({ user_id: userId })
                    .update({ is_completed: true });
                notifyOwnerForApproval(bot, userId, [user.answer1, user.answer2, user.answer3]);
            }
        }
    } else {
        // No profile found, start a new one
        await db('profiles').insert({ user_id: userId, current_question_index: 0, is_completed: false });
        bot.sendMessage(userId, questions[0]);
    }
}

// Function to save user's answer and ask the next question
export async function saveAnswerAndContinue(bot, userId, answer) {
    // Retrieve the current state from the database
    const user = await db('profiles').where({ user_id: userId }).first();

    if (user && !user.is_completed) {
        // Save the current answer
        const answerField = `answer${user.current_question_index + 1}`;
        await db('profiles')
            .where({ user_id: userId })
            .update({ [answerField]: answer, current_question_index: user.current_question_index + 1 });

        // Ask the next question
        askNextQuestion(bot, userId);
    }
}