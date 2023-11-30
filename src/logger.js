import db from './db.js'; // Assuming this is your configured Knex instance

export async function logInteraction(userId, message, response, isBot = false) {
    try {
        await db('interaction_logs').insert({
            user_id: userId,
            message: message,
            response: response,
            is_bot: isBot
        });
    } catch (error) {
        console.error('Error logging interaction:', error);
    }
}
