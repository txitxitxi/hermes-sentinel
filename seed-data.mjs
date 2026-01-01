import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('Seeding database...');

// Seed subscription plans
await connection.execute(`
  INSERT INTO subscription_plans (name, description, price, currency, duration_days, features, max_regions, max_products, notification_channels, is_active)
  VALUES 
    ('Free Trial', '7-day free trial with basic features', 0.00, 'USD', 7, '["Basic monitoring", "Email notifications"]', 1, 5, '["email"]', true),
    ('Basic Plan', 'Perfect for casual monitoring', 25.00, 'USD', 30, '["Multi-region monitoring", "Email notifications", "Restock history"]', 3, 10, '["email"]', true),
    ('Premium Plan', 'For serious collectors', 60.00, 'USD', 30, '["All regions", "Priority notifications", "Advanced filtering", "Trend analysis"]', 10, 50, '["email", "push"]', true),
    ('Annual Plan', 'Best value - save 20%', 576.00, 'USD', 365, '["All Premium features", "Annual discount", "Priority support"]', 15, 100, '["email", "push"]', true)
  ON DUPLICATE KEY UPDATE name=name
`);

// Seed regions
await connection.execute(`
  INSERT INTO regions (code, name, url, currency, is_active)
  VALUES 
    ('US', 'United States', 'https://www.hermes.com/us/en/', 'USD', true),
    ('UK', 'United Kingdom', 'https://www.hermes.com/uk/en/', 'GBP', true),
    ('FR', 'France', 'https://www.hermes.com/fr/fr/', 'EUR', true),
    ('DE', 'Germany', 'https://www.hermes.com/de/de/', 'EUR', true),
    ('IT', 'Italy', 'https://www.hermes.com/it/it/', 'EUR', true),
    ('ES', 'Spain', 'https://www.hermes.com/es/es/', 'EUR', true),
    ('JP', 'Japan', 'https://www.hermes.com/jp/ja/', 'JPY', true),
    ('CN', 'China', 'https://www.hermes.com/cn/zh/', 'CNY', true),
    ('HK', 'Hong Kong', 'https://www.hermes.com/hk/en/', 'HKD', true),
    ('SG', 'Singapore', 'https://www.hermes.com/sg/en/', 'SGD', true),
    ('AU', 'Australia', 'https://www.hermes.com/au/en/', 'AUD', true),
    ('CA', 'Canada', 'https://www.hermes.com/ca/en/', 'CAD', true),
    ('KR', 'South Korea', 'https://www.hermes.com/kr/ko/', 'KRW', true),
    ('TW', 'Taiwan', 'https://www.hermes.com/tw/zh/', 'TWD', true),
    ('TH', 'Thailand', 'https://www.hermes.com/th/en/', 'THB', true)
  ON DUPLICATE KEY UPDATE name=name
`);

// Seed product categories
await connection.execute(`
  INSERT INTO product_categories (name, slug, description, is_active)
  VALUES 
    ('Birkin', 'birkin', 'The iconic Birkin bag', true),
    ('Kelly', 'kelly', 'The classic Kelly bag', true),
    ('Constance', 'constance', 'The elegant Constance bag', true),
    ('Evelyne', 'evelyne', 'The casual Evelyne bag', true),
    ('Picotin', 'picotin', 'The versatile Picotin bag', true),
    ('Garden Party', 'garden-party', 'The practical Garden Party tote', true),
    ('Herbag', 'herbag', 'The customizable Herbag', true),
    ('Lindy', 'lindy', 'The modern Lindy bag', true),
    ('Bolide', 'bolide', 'The structured Bolide bag', true),
    ('Jypsiere', 'jypsiere', 'The bohemian Jypsiere bag', true)
  ON DUPLICATE KEY UPDATE name=name
`);

console.log('Database seeded successfully!');
await connection.end();
