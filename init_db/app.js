import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config(); // Load .env variables

const {
  DB_HOST = process.env.DB_HOST,
  DB_PORT = process.env.DB_PORT,
  DB_USER = process.env.DB_USER,
  DB_PASSWORD = process.env.DB_PASSWORD,
  DB_NAME = process.env.DB_NAME
} = process.env;

async function createDatabaseIfNotExists() {
  console.log('Waiting for MariaDB...');

  for (let i = 0; i < 10; i++) {
    try {
      // Read the SQL file
      const sqlFilePath = path.join(__dirname, 'db.sql');
      const sqlQuery = await fs.readFile(sqlFilePath, 'utf-8');

      const connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
      console.log(`✅ Database '${DB_NAME}' is ready.`);
      // Execute the SQL query to create the table
      await connection.query(sqlQuery);
      console.log('Table "InputRetriever" created (if it did not exist).');

      await connection.end();
      process.exit(0);
    } catch (err) {
      console.log(`⏳ Attempt ${i + 1}: MariaDB not ready yet...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.error('❌ Failed to connect to MariaDB after multiple attempts.');
  process.exit(1);
}

createDatabaseIfNotExists();
