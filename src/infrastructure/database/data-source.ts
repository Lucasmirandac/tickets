import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

/**
 * TypeORM DataSource for CLI (migrations). Uses same env as the app.
 * Run: npm run migration:run
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USERNAME ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'tickets',
  migrations: [__dirname + '/migrations/*.js'],
  entities: [__dirname + '/../../modules/**/*.entity.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
