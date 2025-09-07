import { dbClient } from './db';

export async function testDatabaseConnection() {
  try {
    const result = await dbClient.execute('SELECT 1 as test');
    console.log('Database connection successful:', result.rows);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}