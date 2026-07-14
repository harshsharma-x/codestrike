/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  transpilePackages: ['@codestrike/core', '@codestrike/ai', '@codestrike/agents', '@codestrike/rag', '@codestrike/git', '@codestrike/terminal', '@codestrike/shared', '@codestrike/mcp'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = nextConfig;
