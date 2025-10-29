import request from 'supertest';

jest.mock('../elasticsearchClient', () => ({
  __esModule: true,
  default: {
    search: jest.fn()
  }
}));

const elasticsearchClient = require('../elasticsearchClient').default;
import { app } from '../app';

describe('/products pagination', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns default pagination when no params provided', async () => {
    (elasticsearchClient.search as jest.Mock).mockResolvedValue({
      hits: {
        total: 2,
        hits: [
          { _id: '1', _source: { id: 1, title: 'A' } },
          { _id: '2', _source: { id: 2, title: 'B' } }
        ]
      }
    });

    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total', 2);
    expect(res.body).toHaveProperty('limit', 20);
    expect(res.body).toHaveProperty('offset', 0);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  test('respects provided limit and offset', async () => {
    (elasticsearchClient.search as jest.Mock).mockResolvedValue({
      hits: {
        total: 1,
        hits: [
          { _id: '5', _source: { id: 5, title: 'X' } }
        ]
      }
    });

    const res = await request(app).get('/products?limit=10&offset=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total', 1);
    expect(res.body).toHaveProperty('limit', 10);
    expect(res.body).toHaveProperty('offset', 5);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].id).toBe(5);
  });

  test('caps limit at MAX_PAGE_SIZE', async () => {
    (elasticsearchClient.search as jest.Mock).mockResolvedValue({
      hits: {
        total: 500,
        hits: []
      }
    });

    const res = await request(app).get('/products?limit=1000');
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(100);
  });
});
