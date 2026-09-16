import type { NextConfig } from 'next'
import path from 'node:path'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root; otherwise a lockfile in a parent directory can
  // silently become the inferred root.
  turbopack: { root: path.resolve(__dirname) },
}

export default config
