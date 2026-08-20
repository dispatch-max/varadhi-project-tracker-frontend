/**
 * PWA icon generator — placeholder artwork, zero dependencies.
 *
 * Writes valid PNGs using only Node's built-in zlib: raw RGBA scanlines ->
 * deflate -> IHDR/IDAT/IEND chunks. No canvas, no sharp, no image library.
 *
 * These are PLACEHOLDERS. Real brand artwork should replace the files at the
 * same paths; nothing else needs to change, since the manifest and layout
 * reference them by path only.
 *
 *   node scripts/generate-icons.mjs
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')

/* -------------------------------------------------------------------------- */
/* Minimal PNG writer                                                         */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

/** @param {Uint8Array} rgba length = w*h*4 */
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace

  // Each scanline is prefixed with its filter byte (0 = None).
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw, y * (stride + 1) + 1
    )
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* -------------------------------------------------------------------------- */
/* Drawing                                                                    */
/* -------------------------------------------------------------------------- */

// Brand violet — matches the violet-600 the UI already uses throughout
// (notification-bell.jsx, sidebar active state, etc.).
const BRAND = [124, 58, 237]
const BRAND_DARK = [91, 33, 182]
const WHITE = [255, 255, 255]

const lerp = (a, b, t) => a + (b - a) * t

/**
 * Signed distance from point (px,py) to the line segment (ax,ay)-(bx,by).
 * Used to draw the "V" as two thick strokes with antialiased edges.
 */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

/**
 * @param {number} size
 * @param {object} opts
 * @param {boolean} opts.maskable  Android maskable: keep all content inside the
 *   safe zone (a circle of radius 40% of the size, i.e. >=20% padding on every
 *   edge) because launchers crop to arbitrary shapes.
 * @param {boolean} opts.rounded   rounded-rect background for non-maskable
 */
function drawIcon(size, { maskable = false, rounded = true } = {}) {
  const rgba = new Uint8Array(size * size * 4)

  // Maskable icons must fill the entire canvas edge-to-edge — the launcher
  // crops, so any transparency at the edge shows as a clipped corner.
  const radius = maskable ? 0 : rounded ? size * 0.22 : 0

  // The V is scaled down inside the safe zone for maskable variants. 0.50
  // keeps the mark's furthest pixel comfortably inside BOTH readings of the
  // maskable safe zone: the spec's 40%-radius circle, and the stricter
  // "at least 20% padding on every edge" bounding box.
  const contentScale = maskable ? 0.5 : 0.78
  const cx = size / 2
  const cy = size / 2
  const half = (size * contentScale) / 2

  // V geometry: two strokes meeting at the bottom centre.
  const topY = cy - half * 0.72
  const botY = cy + half * 0.78
  const leftX = cx - half * 0.66
  const rightX = cx + half * 0.66
  const strokeW = size * (maskable ? 0.075 : 0.1)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4

      // --- background: vertical brand gradient, rounded corners
      let inside = true
      if (radius > 0) {
        const rx = Math.min(x, size - 1 - x)
        const ry = Math.min(y, size - 1 - y)
        if (rx < radius && ry < radius) {
          const d = Math.hypot(radius - rx, radius - ry)
          inside = d <= radius
          if (d > radius && d < radius + 1) inside = true // 1px feather
        }
      }

      if (!inside) {
        rgba[i] = 0; rgba[i + 1] = 0; rgba[i + 2] = 0; rgba[i + 3] = 0
        continue
      }

      const t = y / (size - 1)
      rgba[i] = lerp(BRAND[0], BRAND_DARK[0], t)
      rgba[i + 1] = lerp(BRAND[1], BRAND_DARK[1], t)
      rgba[i + 2] = lerp(BRAND[2], BRAND_DARK[2], t)
      rgba[i + 3] = 255

      // --- the V mark, antialiased over ~1.5px
      const d = Math.min(
        distToSegment(x + 0.5, y + 0.5, leftX, topY, cx, botY),
        distToSegment(x + 0.5, y + 0.5, rightX, topY, cx, botY)
      )
      const edge = strokeW / 2
      let alpha = 0
      if (d <= edge - 0.75) alpha = 1
      else if (d < edge + 0.75) alpha = 1 - (d - (edge - 0.75)) / 1.5

      if (alpha > 0) {
        rgba[i] = lerp(rgba[i], WHITE[0], alpha)
        rgba[i + 1] = lerp(rgba[i + 1], WHITE[1], alpha)
        rgba[i + 2] = lerp(rgba[i + 2], WHITE[2], alpha)
      }
    }
  }

  return encodePng(size, size, rgba)
}

/**
 * Monochrome badge for the Android status bar. Android renders `badge` as a
 * silhouette from the alpha channel only, so this is a white-on-transparent V.
 */
function drawBadge(size) {
  const rgba = new Uint8Array(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const half = size * 0.34
  const topY = cy - half * 0.8
  const botY = cy + half * 0.85
  const strokeW = size * 0.14

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const d = Math.min(
        distToSegment(x + 0.5, y + 0.5, cx - half * 0.62, topY, cx, botY),
        distToSegment(x + 0.5, y + 0.5, cx + half * 0.62, topY, cx, botY)
      )
      const edge = strokeW / 2
      let alpha = 0
      if (d <= edge - 0.75) alpha = 1
      else if (d < edge + 0.75) alpha = 1 - (d - (edge - 0.75)) / 1.5

      rgba[i] = 255; rgba[i + 1] = 255; rgba[i + 2] = 255
      rgba[i + 3] = Math.round(alpha * 255)
    }
  }
  return encodePng(size, size, rgba)
}

/* -------------------------------------------------------------------------- */

mkdirSync(join(PUBLIC, 'icons'), { recursive: true })

const outputs = [
  ['icons/icon-192.png', drawIcon(192, { maskable: false })],
  ['icons/icon-512.png', drawIcon(512, { maskable: false })],
  ['icons/icon-192-maskable.png', drawIcon(192, { maskable: true })],
  ['icons/icon-512-maskable.png', drawIcon(512, { maskable: true })],
  ['icons/badge-72.png', drawBadge(72)],
  ['apple-touch-icon.png', drawIcon(180, { maskable: false, rounded: false })],
]

for (const [rel, buf] of outputs) {
  const dest = join(PUBLIC, rel)
  writeFileSync(dest, buf)
  console.log(`  ${rel.padEnd(32)} ${String(buf.length).padStart(7)} bytes`)
}
console.log(`\nWrote ${outputs.length} icons to public/`)
