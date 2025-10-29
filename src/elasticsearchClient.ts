import { Client } from '@elastic/elasticsearch';

export default new Client({
  node: process.env.ELASTICSEARCH_HOST || 'http://elasticsearch:9200'
});


