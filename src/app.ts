import express, { Request, Response } from 'express';
import { estypes } from '@elastic/elasticsearch';
import { Product, ProductAggregationResult } from './types';
import dbClient from './dbClient';
import elasticsearchClient from './elasticsearchClient';

const app = express();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

app.use(express.json());

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await dbClient.ping();
    await elasticsearchClient.cluster.health();
    const count = dbClient.countProducts();
    res.json({
      status: 'healthy',
      mysql: 'connected',
      elasticsearch: 'connected',
      products_count: count
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: (error as Error).message
    });
  }
});

app.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await dbClient.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/categories', async (_req: Request, res: Response) => {
  try {
    const result = await elasticsearchClient.search<Product, { categories: estypes.AggregationsFiltersAggregate }>({
      index: 'products',
      body: {
        size: 0,
        aggs: {
          categories: {
            terms: {
              field: 'category',
              order: { _key: 'asc' } 
            }
          }
        }
      } 
    });
    const buckets = result.aggregations?.categories?.buckets || [];
    const categories = (buckets as estypes.AggregationsFiltersBucket[]).map(({ key }) => key);

    res.json({ items: categories });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/products', async (req: Request, res: Response) => {
  try {
    const { q, category, brand, min_price, max_price, limit, offset } = req.query;

    const must: Array<Record<string, unknown>> = [];
    if (q) {
      must.push({
        multi_match: {
          query: q as string,
          fields: ['title^2', 'description', 'brand', 'category']
        }
      });
    }

    const filter: Array<Record<string, unknown>> = [];
    if (category) {
      filter.push({ term: { category } });
    }
    if (brand) {
      filter.push({ term: { brand } });
    }
    if (min_price || max_price) {
      const range: Record<string, number> = {};
      if (min_price) {
        range.gte = parseFloat(min_price as string);
      }
      if (max_price) {
        range.lte = parseFloat(max_price as string);
      }
      filter.push({ range: { price: range } });
    }

    const size = Math.min(Number(limit ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const from = Number(offset ?? 0);

    const result = await elasticsearchClient.search<Product>({
      index: 'products',
      body: {
        from,
        size,
        query: {
          bool: { must, filter }
        }
      }
    });

    const total = typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value || 0;

    const products = (result.hits.hits || []).map((hit) => {
      const src = hit._source as Product | undefined;
      return {
        ...(src || {}),
        id: src?.id ?? (hit._id ? Number(hit._id) : undefined)
      } as Product;
    });

    return res.json({ total, limit: size, offset: from, products });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }

});

// It is a bad practice to name the route /products/aggs, because it creates ambiguity with the /products/:id endpoint
app.get('/product-aggs', async (req: Request, res: Response) => {
  try {
    const { q, category, brand, min_price, max_price } = req.query;

    const must: Array<Record<string, unknown>> = [];
    if (q) {
      must.push({
        multi_match: {
          query: q as string,
          fields: ['title^2', 'description', 'brand', 'category']
        }
      });
    }

    const filter: Array<Record<string, unknown>> = [];
    if (category) {
      filter.push({ term: { category } });
    }
    if (brand) {
      filter.push({ term: { brand } });
    }
    if (min_price || max_price) {
      const range: Record<string, number> = {};
      if (min_price) {
        range.gte = parseFloat(min_price as string);
      }
      if (max_price) {
        range.lte = parseFloat(max_price as string);
      }
      filter.push({ range: { price: range } });
    }

    const result = await elasticsearchClient.search<Product, ProductAggregationResult>({
      index: 'products',
      body: {
        size: 0,
        query: {
          bool: { must, filter }
        },
        aggs: {
          categories: {
            terms: { field: 'category', order: { _key: 'asc' } }
          },
          brands: {
            terms: { field: 'brand', order: { _key: 'asc' } }
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 500 },
                { from: 500, to: 1000 },
                { from: 1000 }
              ]
            }
          },
          rating_ranges: {
            range: {
              field: 'rating',
              ranges: [
                { to: 2 },
                { from: 2, to: 3 },
                { from: 3, to: 4 },
                { from: 4, to: 5 }
              ]
            }
          }
        }
      }
    });

    const aggs = result.aggregations;
    const categories = (aggs?.categories.buckets as estypes.AggregationsFiltersBucket[] || []).map(({ key, doc_count }) => ({
      key,
      count: doc_count
    }));
    const brands = (aggs?.brands?.buckets as estypes.AggregationsFiltersBucket[] || []).map(({ key, doc_count }) => ({
      key,
      count: doc_count
    }));
    const priceRanges = (aggs?.price_ranges?.buckets as estypes.AggregationsRangeBucket[] || []).map(({ key, from, to, doc_count }) => ({
      key,
      from,
      to,
      count: doc_count
    }));
    const ratingRanges = (aggs?.rating_ranges?.buckets as estypes.AggregationsRangeBucket[] || []).map(({ key, from, to, doc_count }) => ({
      key,
      from,
      to,
      count: doc_count
    }));

    return res.json({
      facets: {
        category: categories,
        brand: brands,
        price: priceRanges,
        rating: ratingRanges
      }
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export { app };