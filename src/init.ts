import dbClient from './dbClient';
import elasticsearchClient from './elasticsearchClient';
import { DummyJSONResponse, Product } from './types';

async function fetchProductsFromAPI(): Promise<Product[]> {
  try {
    const pageSize = 100;
    let allProducts: Product[] = [];
    let skip = 0;
    let total = Infinity;
    while (skip < total) {
      const response = await fetch(`https://dummyjson.com/products?limit=${pageSize}&skip=${skip}`);
      const data = await response.json() as DummyJSONResponse;
      allProducts = allProducts.concat(data.products);
      total = data.total || allProducts.length;
      skip += pageSize;
    }
    return allProducts;
  } catch (error) {
    console.error('Error fetching products from API:', (error as Error).message);
    return [];
  }
}

async function loadProductsFromAPI(): Promise<void> {
  try {
    const existing = await dbClient.countProducts();
    if (existing > 0) {
      console.log('Products already loaded');
      return;
    }

    console.log('Fetching products from DummyJSON API...');
    const products = await fetchProductsFromAPI();
    
    if (products.length === 0) {
      console.log('No products fetched');
      return;
    }

    console.log(`Loading ${products.length} products...`);

    const batchSize = 20;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      await dbClient.bulkUpsertProducts(batch);

      const operations = [];
      for (const p of batch) {
        operations.push({ index: { _index: 'products', _id: p.id.toString() } });
        operations.push({
          title: p.title,
          description: p.description,
          category: p.category,
          price: p.price,
          discount_percentage: p.discountPercentage,
          rating: p.rating,
          stock: p.stock,
          brand: p.brand || null,
          sku: p.sku,
          thumbnail: p.thumbnail,
          tags: p.tags || [],
          images: p.images || [],
          weight: p.weight ?? null,
          dimensions: p.dimensions || null,
          warrantyInformation: p.warrantyInformation || null,
          shippingInformation: p.shippingInformation || null,
          availabilityStatus: p.availabilityStatus || null,
          returnPolicy: p.returnPolicy || null,
          minimumOrderQuantity: p.minimumOrderQuantity ?? null,
          meta: p.meta || null,
          reviews: p.reviews || []
        });
      }

      const bulkRes = await elasticsearchClient.bulk({ refresh: true, operations });
      if (bulkRes.errors) {
        const firstError = (bulkRes.items as any[])?.find((it: any) => (it.index && it.index.error));
        console.error('Elasticsearch bulk indexing had errors', firstError?.index?.error || '');
      }
    }

    console.log(`Successfully loaded ${products.length} products`);
  } catch (error) {
    console.error('Error loading products:', (error as Error).message);
  }
}

export async function initializeApp(): Promise<void> {
  try {
    await dbClient.ensureProductsTable();
    console.log('Products table ready');

    const health = await elasticsearchClient.cluster.health();
    console.log('Connected to Elasticsearch:', health.cluster_name);

    const indexExists = await elasticsearchClient.indices.exists({ index: 'products' });
    if (!indexExists) {
      await elasticsearchClient.indices.create({
        index: 'products',
        body: {
          mappings: {
            properties: {
              title: { type: 'text' },
              description: { type: 'text' },
              category: { type: 'keyword' },
              price: { type: 'float' },
              discount_percentage: { type: 'float' },
              rating: { type: 'float' },
              stock: { type: 'integer' },
              brand: { type: 'keyword' },
              sku: { type: 'keyword' },
              thumbnail: { type: 'keyword' },
              tags: { type: 'keyword' },
              images: { type: 'keyword' },
              weight: { type: 'integer' },
              dimensions: {
                properties: {
                  width: { type: 'float' },
                  height: { type: 'float' },
                  depth: { type: 'float' }
                }
              },
              warrantyInformation: { type: 'keyword' },
              shippingInformation: { type: 'keyword' },
              availabilityStatus: { type: 'keyword' },
              returnPolicy: { type: 'keyword' },
              minimumOrderQuantity: { type: 'integer' },
              meta: {
                properties: {
                  createdAt: { type: 'date' },
                  updatedAt: { type: 'date' },
                  barcode: { type: 'keyword' },
                  qrCode: { type: 'keyword' }
                }
              },
              reviews_count: { type: 'integer' }
            }
          }
        }
      });
      console.log('Elasticsearch products index created');
    }

    await loadProductsFromAPI();
  } catch (error) {
    console.error('Initialization error:', (error as Error).message);
    setTimeout(() => initializeApp(), 5000);
  }
}
