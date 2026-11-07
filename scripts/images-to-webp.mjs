// Convierte las fotos JPG del equipo a WebP livianos (< 200 KB) en public/img.
// Uso: node scripts/images-to-webp.mjs <carpeta-con-jpg>
// sharp viene como dependencia de Next.js, no hace falta instalarlo aparte.
// Nota: tomacorriente.jpg (enchufe estadounidense) y llave-gas.jpg (grabado ilegible) se omiten a propósito
// (pendiente de la sección 13 del CLAUDE.md del equipo).
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OMITIR = new Set(['tomacorriente.jpg', 'llave-gas.jpg'])
const src = process.argv[2]
if (!src) {
  console.error('Uso: node scripts/images-to-webp.mjs <carpeta-con-jpg>')
  process.exit(1)
}
const out = path.join(process.cwd(), 'public', 'img')
const files = (await readdir(src)).filter((f) => /\.(jpe?g|png)$/i.test(f) && !OMITIR.has(f))
for (const file of files) {
  const dest = path.join(out, file.replace(/\.(jpe?g|png)$/i, '.webp'))
  let quality = 80
  for (;;) {
    await sharp(path.join(src, file)).resize({ width: 1400, withoutEnlargement: true }).webp({ quality }).toFile(dest)
    const { size } = await stat(dest)
    if (size < 200 * 1024 || quality <= 40) {
      console.log(`${file} -> ${path.basename(dest)} (${Math.round(size / 1024)} KB, q${quality})`)
      break
    }
    quality -= 8
  }
}
