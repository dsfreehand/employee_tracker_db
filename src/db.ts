import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,          // E.g., localhost
  port: parseInt(process.env.DB_PORT || '5432'),  // Default PostgreSQL port
  database: process.env.DB_NAME,      // The name of your database (employee_tracker_db)
  user: process.env.DB_USER,          // PostgreSQL username
  password: process.env.DB_PASSWORD,  // PostgreSQL password
});

client.connect()
  .then(() => console.log('Connected to the database!'))
  .catch((err: Error) => console.error('Connection error', err.stack));  // Typed `err` as `Error`

export default client;
