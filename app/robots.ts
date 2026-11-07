import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/empresa', '/plataforma', '/api', '/ingresar', '/mis-pedidos', '/pedido', '/completar-datos'] }],
  }
}
