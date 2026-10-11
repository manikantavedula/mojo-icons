// Small, dependency-free SVG path toolkit used by check.mjs (bounds) and by the drawing scripts.
// parse -> absolute segments -> (transform) -> serialize / bbox.

const CMD = /[MmLlHhVvCcSsQqTtAaZz]/
const ARGC = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }

/** Tokenise a path string into [{ c, a: number[] }]. Arc flags may be written without separators ("a1 1 0 01.5.5"). */
export function parse(d) {
  const out = []
  let i = 0
  const n = d.length
  const skip = () => {
    while (i < n && /[\s,]/.test(d[i])) i++
  }
  const num = () => {
    skip()
    const m = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(d.slice(i))
    if (!m) throw new Error(`Bad number at ${i} in "${d}"`)
    i += m[0].length
    return parseFloat(m[0])
  }
  const flag = () => {
    skip()
    const ch = d[i]
    if (ch !== '0' && ch !== '1') throw new Error(`Bad arc flag at ${i} in "${d}"`)
    i++
    return ch === '1' ? 1 : 0
  }
  let cmd = null
  while (true) {
    skip()
    if (i >= n) break
    if (CMD.test(d[i])) {
      cmd = d[i++]
    } else if (cmd === null) {
      throw new Error(`Path must start with a command: "${d}"`)
    } else if (cmd === 'M') cmd = 'L'
    else if (cmd === 'm') cmd = 'l'
    const U = cmd.toUpperCase()
    if (U === 'Z') {
      out.push({ c: cmd, a: [] })
      continue
    }
    const a = []
    for (let k = 0; k < ARGC[U]; k++) a.push(U === 'A' && (k === 3 || k === 4) ? flag() : num())
    out.push({ c: cmd, a })
  }
  return out
}

/** Convert to absolute segments using only M L C Q A Z. */
export function absolute(d) {
  const segs = typeof d === 'string' ? parse(d) : d
  const out = []
  let x = 0, y = 0, sx = 0, sy = 0
  let pc = null // previous control point for S/T
  let pt = null // previous command type
  for (const { c, a } of segs) {
    const rel = c === c.toLowerCase() && c !== 'z' && c !== 'Z' ? true : false
    const U = c.toUpperCase()
    const ox = rel ? x : 0, oy = rel ? y : 0
    switch (U) {
      case 'M':
        x = a[0] + ox; y = a[1] + oy; sx = x; sy = y
        out.push({ c: 'M', a: [x, y] }); pc = null; break
      case 'L':
        x = a[0] + ox; y = a[1] + oy
        out.push({ c: 'L', a: [x, y] }); pc = null; break
      case 'H':
        x = a[0] + (rel ? x : 0)
        out.push({ c: 'L', a: [x, y] }); pc = null; break
      case 'V':
        y = a[0] + (rel ? y : 0)
        out.push({ c: 'L', a: [x, y] }); pc = null; break
      case 'C': {
        const s = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy, a[4] + ox, a[5] + oy]
        out.push({ c: 'C', a: s }); pc = [s[2], s[3]]; x = s[4]; y = s[5]; pt = 'C'; continue
      }
      case 'S': {
        const c1 = pt === 'C' && pc ? [2 * x - pc[0], 2 * y - pc[1]] : [x, y]
        const s = [c1[0], c1[1], a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy]
        out.push({ c: 'C', a: s }); pc = [s[2], s[3]]; x = s[4]; y = s[5]; pt = 'C'; continue
      }
      case 'Q': {
        const s = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy]
        out.push({ c: 'Q', a: s }); pc = [s[0], s[1]]; x = s[2]; y = s[3]; pt = 'Q'; continue
      }
      case 'T': {
        const c1 = pt === 'Q' && pc ? [2 * x - pc[0], 2 * y - pc[1]] : [x, y]
        const s = [c1[0], c1[1], a[0] + ox, a[1] + oy]
        out.push({ c: 'Q', a: s }); pc = c1; x = s[2]; y = s[3]; pt = 'Q'; continue
      }
      case 'A': {
        const s = [a[0], a[1], a[2], a[3], a[4], a[5] + ox, a[6] + oy]
        out.push({ c: 'A', a: s, from: [x, y] }); x = s[5]; y = s[6]; pc = null; break
      }
      case 'Z':
        out.push({ c: 'Z', a: [] }); x = sx; y = sy; pc = null; break
    }
    pt = U
  }
  // record start points for every segment (needed for arcs / sampling)
  let cx = 0, cy = 0, msx = 0, msy = 0
  for (const s of out) {
    s.from = [cx, cy]
    if (s.c === 'M') { cx = s.a[0]; cy = s.a[1]; msx = cx; msy = cy }
    else if (s.c === 'Z') { cx = msx; cy = msy }
    else { cx = s.a[s.a.length - 2]; cy = s.a[s.a.length - 1] }
  }
  return out
}

/** Apply a similarity transform [a b c d e f] (x' = a x + c y + e, y' = b x + d y + f). */
export function transform(abs, m) {
  const [a, b, c, d, e, f] = m
  const P = (x, y) => [a * x + c * y + e, b * x + d * y + f]
  const scale = Math.sqrt(Math.abs(a * d - b * c))
  const flip = a * d - b * c < 0
  const rot = (Math.atan2(b, a) * 180) / Math.PI
  return abs.map((s) => {
    switch (s.c) {
      case 'M': case 'L': return { c: s.c, a: P(s.a[0], s.a[1]) }
      case 'C': return { c: 'C', a: [...P(s.a[0], s.a[1]), ...P(s.a[2], s.a[3]), ...P(s.a[4], s.a[5])] }
      case 'Q': return { c: 'Q', a: [...P(s.a[0], s.a[1]), ...P(s.a[2], s.a[3])] }
      case 'A': {
        const [rx, ry, xr, la, sw, x, y] = s.a
        return { c: 'A', a: [rx * scale, ry * scale, (xr + rot) % 360, la, flip ? 1 - sw : sw, ...P(x, y)] }
      }
      default: return { c: 'Z', a: [] }
    }
  })
}

export function fmt(v) {
  let s = (Math.round(v * 100) / 100).toFixed(2)
  s = s.replace(/\.?0+$/, '')
  if (s === '-0') s = '0'
  return s.replace(/^(-?)0\./, '$1.')
}

/** Serialise absolute segments to a compact path string (relative where shorter). */
export function serialize(abs) {
  let out = ''
  let x = 0, y = 0, sx = 0, sy = 0
  const pack = (cmd, nums) => {
    // join numbers with minimal separators
    let s = cmd
    let prev = null
    for (const v of nums) {
      const t = typeof v === 'string' ? v : fmt(v)
      if (prev === null) s += t
      else if (t.startsWith('-')) s += t
      else if (t.startsWith('.') && /[.]/.test(prev) && !/e/i.test(prev)) s += t
      else s += ' ' + t
      prev = t
    }
    return s
  }
  for (const seg of abs) {
    const { c, a } = seg
    const R = (v, o) => v - o
    let absStr, relStr
    switch (c) {
      case 'M':
        absStr = pack('M', a); relStr = out ? pack('m', [R(a[0], x), R(a[1], y)]) : absStr
        x = a[0]; y = a[1]; sx = x; sy = y; break
      case 'L': {
        if (Math.abs(a[1] - y) < 1e-9) { absStr = pack('H', [a[0]]); relStr = pack('h', [R(a[0], x)]) }
        else if (Math.abs(a[0] - x) < 1e-9) { absStr = pack('V', [a[1]]); relStr = pack('v', [R(a[1], y)]) }
        else { absStr = pack('L', a); relStr = pack('l', [R(a[0], x), R(a[1], y)]) }
        x = a[0]; y = a[1]; break
      }
      case 'C':
        absStr = pack('C', a)
        relStr = pack('c', [R(a[0], x), R(a[1], y), R(a[2], x), R(a[3], y), R(a[4], x), R(a[5], y)])
        x = a[4]; y = a[5]; break
      case 'Q':
        absStr = pack('Q', a); relStr = pack('q', [R(a[0], x), R(a[1], y), R(a[2], x), R(a[3], y)])
        x = a[2]; y = a[3]; break
      case 'A': {
        const f = (v) => fmt(v)
        absStr = pack('A', [a[0], a[1], f(a[2]), String(a[3]), String(a[4]), a[5], a[6]])
        relStr = pack('a', [a[0], a[1], f(a[2]), String(a[3]), String(a[4]), R(a[5], x), R(a[6], y)])
        x = a[5]; y = a[6]; break
      }
      case 'Z':
        absStr = relStr = 'z'; x = sx; y = sy; break
    }
    out += relStr.length < absStr.length ? relStr : absStr
  }
  return out
}

/** Centre parameterisation of an endpoint arc (SVG spec F.6.5). Returns a sampler t∈[0,1] -> [x,y]. */
export function arcSampler(x1, y1, rx, ry, phiDeg, fa, fs, x2, y2) {
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return (t) => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]
  const phi = (phiDeg * Math.PI) / 180
  const cos = Math.cos(phi), sin = Math.sin(phi)
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy
  rx = Math.abs(rx); ry = Math.abs(ry)
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam) }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  let co = Math.sqrt(Math.max(0, num / den))
  if (fa === fs) co = -co
  const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const ang = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    return a
  }
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!fs && dt > 0) dt -= 2 * Math.PI
  if (fs && dt < 0) dt += 2 * Math.PI
  return (t) => {
    const th = t1 + dt * t
    const px = rx * Math.cos(th), py = ry * Math.sin(th)
    return [cos * px - sin * py + cx, sin * px + cos * py + cy]
  }
}

/** Sample every drawn point of a path (endpoints + curve samples). */
export function samplePath(d, steps = 24) {
  const abs = absolute(d)
  const pts = []
  for (const s of abs) {
    const [fx, fy] = s.from
    switch (s.c) {
      case 'M': case 'L': pts.push([s.a[0], s.a[1]]); if (s.c === 'L') pts.push([fx, fy]); break
      case 'C':
        for (let k = 0; k <= steps; k++) {
          const t = k / steps, u = 1 - t
          pts.push([
            u * u * u * fx + 3 * u * u * t * s.a[0] + 3 * u * t * t * s.a[2] + t * t * t * s.a[4],
            u * u * u * fy + 3 * u * u * t * s.a[1] + 3 * u * t * t * s.a[3] + t * t * t * s.a[5],
          ])
        }
        break
      case 'Q':
        for (let k = 0; k <= steps; k++) {
          const t = k / steps, u = 1 - t
          pts.push([u * u * fx + 2 * u * t * s.a[0] + t * t * s.a[2], u * u * fy + 2 * u * t * s.a[1] + t * t * s.a[3]])
        }
        break
      case 'A': {
        const f = arcSampler(fx, fy, s.a[0], s.a[1], s.a[2], s.a[3], s.a[4], s.a[5], s.a[6])
        for (let k = 0; k <= steps * 2; k++) pts.push(f(k / (steps * 2)))
        break
      }
    }
  }
  return pts
}

export function bboxOfPoints(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of pts) {
    if (x < x0) x0 = x
    if (y < y0) y0 = y
    if (x > x1) x1 = x
    if (y > y1) y1 = y
  }
  return [x0, y0, x1, y1]
}

/** Parse the simple element markup used by the icon set into [{ tag, attrs }]. */
export function parseElements(svgInner) {
  const els = []
  const re = /<([a-z]+)\b([^>]*?)\/>/g
  let m
  while ((m = re.exec(svgInner))) {
    const attrs = {}
    const ar = /([a-zA-Z:-]+)="([^"]*)"/g
    let a
    while ((a = ar.exec(m[2]))) attrs[a[1]] = a[2]
    els.push({ tag: m[1], attrs })
  }
  return els
}

/** Geometric bounds of an element (stroke excluded); for accent dots the full disc. */
export function elementBounds(el) {
  const A = el.attrs
  const n = (k, def = 0) => (A[k] === undefined ? def : parseFloat(A[k]))
  switch (el.tag) {
    case 'path': return bboxOfPoints(samplePath(A.d))
    case 'circle': return [n('cx') - n('r'), n('cy') - n('r'), n('cx') + n('r'), n('cy') + n('r')]
    case 'ellipse': return [n('cx') - n('rx'), n('cy') - n('ry'), n('cx') + n('rx'), n('cy') + n('ry')]
    case 'rect': return [n('x'), n('y'), n('x') + n('width'), n('y') + n('height')]
    case 'line': return bboxOfPoints([[n('x1'), n('y1')], [n('x2'), n('y2')]])
    default: return null
  }
}
