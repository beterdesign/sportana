// Compact product index for search, filters, cart and wishlist (built once per deploy).
import { getProducts, toIndex } from '../lib/sanity.js';

export async function GET() {
  const products = await getProducts();
  return new Response(JSON.stringify(products.map(toIndex)), {
    headers: { 'Content-Type': 'application/json' },
  });
}
