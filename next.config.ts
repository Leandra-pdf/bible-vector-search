
/**
 * Configures Next.js and keeps ChromaDB as a native server-side dependency.
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['chromadb'],
};

export default nextConfig;
