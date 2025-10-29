import mysql, { OkPacket, RowDataPacket } from 'mysql2/promise';
import { Product } from './types';

type DbDefaults = RowDataPacket[] | RowDataPacket[][] | OkPacket[] | OkPacket;

type DbQueryResult<T> = T & DbDefaults;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'appdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function ping(): Promise<void> {
  await pool.query('SELECT 1');
}

async function ensureProductsTable(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(10, 2),
        discount_percentage DECIMAL(5, 2),
        rating DECIMAL(3, 2),
        stock INT,
        brand VARCHAR(100),
        sku VARCHAR(100),
        thumbnail TEXT,
        tags JSON NULL,
        images JSON NULL,
        weight INT NULL,
        dim_width DECIMAL(10,2) NULL,
        dim_height DECIMAL(10,2) NULL,
        dim_depth DECIMAL(10,2) NULL,
        warranty_information VARCHAR(255) NULL,
        shipping_information VARCHAR(255) NULL,
        availability_status VARCHAR(100) NULL,
        return_policy VARCHAR(255) NULL,
        minimum_order_quantity INT NULL,
        meta JSON NULL,
        reviews JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_brand (brand),
        INDEX idx_price (price)
      )
    `);
  } finally {
    connection.release();
  }
}

async function countProducts(): Promise<number> {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM products');
  const result = rows as Array<{ count: number }>;
  return result[0]?.count ?? 0;
}

async function bulkUpsertProducts(batch: Product[]): Promise<void> {
  if (batch.length === 0) return;
  const valuesSql = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
  const params: Array<string | number | null> = [];
  for (const p of batch) {
    params.push(
      p.id,
      p.title,
      p.description,
      p.category,
      p.price,
      p.discountPercentage,
      p.rating,
      p.stock,
      p.brand || null,
      p.sku,
      p.thumbnail,
      p.tags ? JSON.stringify(p.tags) : null,
      p.images ? JSON.stringify(p.images) : null,
      p.weight ?? null,
      p.dimensions?.width ?? null,
      p.dimensions?.height ?? null,
      p.dimensions?.depth ?? null,
      p.warrantyInformation || null,
      p.shippingInformation || null,
      p.availabilityStatus || null,
      p.returnPolicy || null,
      p.minimumOrderQuantity ?? null,
      p.meta ? JSON.stringify(p.meta) : null,
      p.reviews ? JSON.stringify(p.reviews) : 0
    );
  }
  await pool.query(
    `INSERT INTO products (id, title, description, category, price, discount_percentage, rating, stock, brand, sku, thumbnail,
     tags, images, weight, dim_width, dim_height, dim_depth, warranty_information, shipping_information, availability_status, return_policy,
     minimum_order_quantity, meta, reviews)
     VALUES ${valuesSql}
     ON DUPLICATE KEY UPDATE
     title = VALUES(title),
     description = VALUES(description),
     category = VALUES(category),
     price = VALUES(price),
     discount_percentage = VALUES(discount_percentage),
     rating = VALUES(rating),
     stock = VALUES(stock),
     brand = VALUES(brand),
     sku = VALUES(sku),
     thumbnail = VALUES(thumbnail),
     tags = VALUES(tags),
     images = VALUES(images),
     weight = VALUES(weight),
     dim_width = VALUES(dim_width),
     dim_height = VALUES(dim_height),
     dim_depth = VALUES(dim_depth),
     warranty_information = VALUES(warranty_information),
     shipping_information = VALUES(shipping_information),
     availability_status = VALUES(availability_status),
     return_policy = VALUES(return_policy),
     minimum_order_quantity = VALUES(minimum_order_quantity),
     meta = VALUES(meta),
     reviews = VALUES(reviews)`,
    params
  );
}

export interface ProductQueryFilters {
  category?: string;
  brand?: string;
  min_price?: string;
  max_price?: string;
  limit?: string;
  offset?: string;
}

async function getProductById(id: string): Promise<Product | null> {
  const [rows] = await pool.query<DbQueryResult<Product[]>>('SELECT * FROM products WHERE id = ?', [id]);
  const list = rows;
  return list[0] ?? null;
}
export default { bulkUpsertProducts, countProducts, ensureProductsTable, ping, getProductById};