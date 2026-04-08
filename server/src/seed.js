import bcrypt from 'bcryptjs';
import { pool } from './db.js';

export async function seedDefaultUsers() {
  const defaults = [
    {
      username: 'envyst',
      displayName: 'Envyst',
      password: process.env.DEFAULT_USER_ENVYST_PASSWORD,
    },
    {
      username: 'absol',
      displayName: 'Absol',
      password: process.env.DEFAULT_USER_ABSOL_PASSWORD,
    },
  ];

  for (const user of defaults) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      [user.username, passwordHash, user.displayName],
    );
  }
}
