export const up = function(knex) {
    return knex.schema
        .createTable('profiles', (table) => {
            table.increments('id').primary();
            table.integer('user_id').notNullable().unique();
            table.string('first_name', 255); // Added first name column
            table.string('last_name', 255);  // Added last name column
            table.string('username', 255);   // Added username column
            table.string('answer1', 255);
            table.string('answer2', 255);
            table.string('answer3', 255);
            table.boolean('is_approved').defaultTo(false);
            table.integer('current_question_index').defaultTo(0);
            table.boolean('is_completed').defaultTo(false);
        })

        .createTable('interaction_logs', (table) => {
            table.increments('id').primary();
            table.integer('user_id').notNullable();
            table.boolean('is_bot').defaultTo(false);
            table.text('message');
            table.text('response');
            table.timestamp('timestamp').defaultTo(knex.fn.now());
        });
};

export const down = function(knex) {
    return knex.schema
        .dropTable('interaction_logs')
        .dropTable('profiles');
};
