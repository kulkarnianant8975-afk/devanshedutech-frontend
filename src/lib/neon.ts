import { neon } from '@neondatabase/serverless';

const getSql = () => {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not set or is empty. Please add it to your environment variables.');
  }
  return neon(url);
};

// Proxy to lazy-load neon connection
const sql = new Proxy(() => {}, {
  apply: (target, thisArg, args) => {
    const fn = getSql() as any;
    return fn(...args);
  },
  get: (target, prop) => {
    return (getSql() as any)[prop];
  }
}) as any;

export default sql;
