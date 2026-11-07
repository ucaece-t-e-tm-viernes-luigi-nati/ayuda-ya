import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    // Las superficies internas no se indexan (además de robots.txt y metadata.robots).
    return [
      { source: '/empresa/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/empresa', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/plataforma/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/plataforma', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ]
  },
}

export default nextConfig
