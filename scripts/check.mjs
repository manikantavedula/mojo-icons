#!/usr/bin/env node
// Validates every SVG in svg/ against the Mojo Icons style rules and checks coverage.
// Usage: node scripts/check.mjs [--verbose]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseElements, elementBounds, samplePath } from './lib/svgpath.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SVG_DIR = path.join(ROOT, 'svg')
const verbose = process.argv.includes('--verbose')

const ACCENT_FILL = 'var(--mojo-accent, currentColor)'
const ROOT_ATTRS = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}
const ALLOWED_TAGS = new Set(['path', 'circle', 'rect', 'ellipse', 'line'])
const GEOMETRY_ATTRS = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
}
const LIVE_MIN = 2, LIVE_MAX = 22, TOL = 0.02

// Names the identity, voice, school and brand work asked for on top of the apps' inventory, plus names the
// apps import that inventory-in-use.txt missed (found by running the codemod in --dry-run mode on 2026-10-05).
const REQUIRED_EXTRA = `Key KeyRound Fingerprint Passkey ShieldCheck ShieldAlert ShieldLock Lock Unlock LogIn LogOut
Webhook Terminal Code Braces Copy Eye EyeOff QrCode Smartphone Laptop Monitor
Globe Link Unlink Building Building2 Users UserPlus UserMinus UserCheck UserX UserCog Id Mail MailCheck
MessageCircle ChatBubble Sms Otp Activity AuditLog History Server Database Cloud Plug Puzzle Workflow GitBranch Rocket Gauge Siren
Languages Moon Sun MonitorSmartphone CreditCard Receipt Wallet Coins PieChart TrendingUp TrendingDown
Mic MicOff Phone PhoneCall PhoneIncoming PhoneOutgoing PhoneMissed PhoneOff PhoneForwarded Voicemail
Waveform AudioLines Headphones Volume Volume2 VolumeX Play Pause Square Record Radio
School GraduationCap Backpack Bus BookOpen Library ClipboardList Timetable ReportCard Attendance Exam Classroom Certificate Parent Teacher Student
Lattu AulaArch MintWave MeruYou
ArchiveXIcon Table2 Atom Binary BookA Drama Dumbbell HeartPulse Leaf Microscope Music PenTool Shapes Sigma Sprout Droplets
AppWindow Mails ShieldBan Compass`.split(/\s+/)

const toPascal = (kebab) => kebab.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
const toKebab = (n) => n.replace(/([a-z])([A-Z0-9])/g, '$1-$2').replace(/([0-9])([A-Za-z])/g, '$1-$2').toLowerCase()

const errors = []
const warnings = []
const err = (file, msg) => errors.push(`${file}: ${msg}`)
const warn = (file, msg) => warnings.push(`${file}: ${msg}`)

const files = fs.readdirSync(SVG_DIR).filter((f) => f.endsWith('.svg')).sort()
const names = new Set()
const bodies = new Map()
let withDot = 0

for (const file of files) {
  const src = fs.readFileSync(path.join(SVG_DIR, file), 'utf8')
  const kebab = file.replace(/\.svg$/, '')
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(kebab)) err(file, 'file name must be kebab-case')
  const name = toPascal(kebab)
  if (toKebab(name) !== kebab) err(file, `name does not round-trip (${name} -> ${toKebab(name)})`)
  names.add(name)

  if (/<\?xml|<!--|<!DOCTYPE|<g[\s>]|<defs|<metadata|<title|<desc|<style|sodipodi|inkscape|data-name|xmlns:/i.test(src))
    err(file, 'contains editor junk or wrapper elements (xml prolog, comments, g, defs, metadata, title, style, namespaces)')

  const rootMatch = /^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(src.trim())
  if (!rootMatch) { err(file, 'not a single <svg> element'); continue }
  const rootAttrs = {}
  for (const m of rootMatch[1].matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) rootAttrs[m[1]] = m[2]
  for (const [k, v] of Object.entries(ROOT_ATTRS)) if (rootAttrs[k] !== v) err(file, `<svg> ${k} must be "${v}" (got ${rootAttrs[k] ?? 'nothing'})`)
  for (const k of Object.keys(rootAttrs)) if (!(k in ROOT_ATTRS)) err(file, `unexpected <svg> attribute ${k}`)

  const inner = rootMatch[2]
  const leftover = inner.replace(/<[a-z]+\b[^>]*\/>/g, '').trim()
  if (leftover) err(file, `unexpected markup: ${leftover.slice(0, 60)}`)
  const els = parseElements(inner)
  if (!els.length) err(file, 'no drawing elements')

  let dots = 0
  const geomPts = []
  const dotList = []
  for (const el of els) {
    const { tag, attrs } = el
    if (!ALLOWED_TAGS.has(tag)) { err(file, `element <${tag}> not allowed`); continue }
    const isDot = tag === 'circle' && attrs.fill !== undefined
    for (const k of Object.keys(attrs)) {
      if (GEOMETRY_ATTRS[tag].includes(k)) continue
      if (isDot && (k === 'fill' || k === 'stroke')) continue
      err(file, `<${tag}> has disallowed attribute ${k}${k === 'fill' ? ' (only the accent dot may be filled)' : ''}`)
    }
    if (isDot) {
      dots++
      if (attrs.fill !== ACCENT_FILL) err(file, `accent dot fill must be "${ACCENT_FILL}"`)
      if (attrs.stroke !== 'none') err(file, 'accent dot must have stroke="none"')
      const r = parseFloat(attrs.r)
      if (!(r >= 1.6 - 1e-9 && r <= 2 + 1e-9)) err(file, `accent dot radius ${r} outside 1.6–2`)
      dotList.push([parseFloat(attrs.cx), parseFloat(attrs.cy), r])
    }
    if (tag === 'path') {
      try {
        geomPts.push(...samplePath(attrs.d, 40))
      } catch (e) {
        err(file, `bad path data: ${e.message}`)
        continue
      }
    } else if (tag === 'circle' && !isDot) {
      const cx = +attrs.cx, cy = +attrs.cy, r = +attrs.r
      for (let k = 0; k < 72; k++) geomPts.push([cx + r * Math.cos((k * Math.PI) / 36), cy + r * Math.sin((k * Math.PI) / 36)])
    } else if (tag === 'rect') {
      const x = +attrs.x, y = +attrs.y, w = +attrs.width, h = +attrs.height
      for (let k = 0; k <= 20; k++) geomPts.push([x + (w * k) / 20, y], [x + (w * k) / 20, y + h], [x, y + (h * k) / 20], [x + w, y + (h * k) / 20])
      if (attrs.rx !== undefined && +attrs.rx > 0 && +attrs.rx < 1.5) warn(file, `rect corner radius ${attrs.rx} is tighter than the family's soft corners`)
    }
    const b = elementBounds(el)
    if (b) {
      const [x0, y0, x1, y1] = b
      if (x0 < LIVE_MIN - TOL || y0 < LIVE_MIN - TOL || x1 > LIVE_MAX + TOL || y1 > LIVE_MAX + TOL)
        err(file, `<${tag}> leaves the 2–22 live area (${[x0, y0, x1, y1].map((v) => v.toFixed(2)).join(', ')})`)
    }
  }
  if (dots > 1) err(file, `${dots} accent dots (max 1)`)
  if (dots === 0) err(file, 'no accent dot (every icon carries exactly one)')
  if (dots) withDot++

  // clearance between the accent dot and the strokes (informational)
  for (const [cx, cy, r] of dotList) {
    let min = Infinity
    for (const [x, y] of geomPts) min = Math.min(min, Math.hypot(x - cx, y - cy))
    const gap = min - r - 1 // stroke half-width at the default weight
    if (gap > -0.6 && gap < 0.35) warn(file, `accent dot nearly touches a stroke (gap ${gap.toFixed(2)})`)
  }

  const body = els.map((e) => `${e.tag}${JSON.stringify(e.attrs)}`).join('|')
  if (bodies.has(body)) err(file, `identical drawing to ${bodies.get(body)} (use an alias instead)`)
  else bodies.set(body, file)
}

// ---------- coverage ----------
const aliases = JSON.parse(fs.readFileSync(path.join(ROOT, 'aliases.json'), 'utf8')).aliases
const exported = new Set(names)
for (const [alias, target] of Object.entries(aliases)) {
  if (alias.startsWith('$')) continue
  if (!names.has(target)) err('aliases.json', `${alias} points to missing icon ${target}`)
  exported.add(alias)
}
for (const n of [...exported]) if (!n.endsWith('Icon')) exported.add(`${n}Icon`)
const inventory = fs.readFileSync(path.join(ROOT, 'inventory-in-use.txt'), 'utf8').split(/\s+/).filter(Boolean)
const missing = inventory.filter((n) => !exported.has(n))
for (const n of missing) err('inventory-in-use.txt', `${n} has no icon or alias`)
const missingExtra = REQUIRED_EXTRA.filter((n) => !exported.has(n))
for (const n of missingExtra) err('required icons', `${n} is missing`)

if (verbose || warnings.length) for (const w of warnings) console.log(`warn  ${w}`)
for (const e of errors) console.log(`ERROR ${e}`)
console.log(
  `\n${files.length} icons, ${withDot} with an accent dot (${Math.round((withDot / files.length) * 100)}%), ` +
    `${inventory.length - missing.length}/${inventory.length} inventory names covered, ` +
    `${REQUIRED_EXTRA.length - missingExtra.length}/${REQUIRED_EXTRA.length} required extras. ` +
    `${errors.length} error(s), ${warnings.length} warning(s).`,
)
process.exit(errors.length ? 1 : 0)
