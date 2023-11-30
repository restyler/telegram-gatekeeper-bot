// db.js

import knex from 'knex';
import knexConfig from '../knexfile.js'; // Replace with the actual path to your config file

const db = knex(knexConfig);

export default db;
