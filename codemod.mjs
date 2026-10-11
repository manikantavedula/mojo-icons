#!/usr/bin/env node
// Mojo Icons codemod: rewrites `lucide-react` imports in a repository to the vendored Mojo Icons module.
//
//   node codemod.mjs <repo-path> [--to <module>] [--to-dir <path>] [--dry-run] [--force] [--quiet]
//
//   --to <module>    import path to write, e.g. "@/components/icons" or "@axismojo/icons" (default "@axismojo/icons")
//   --to-dir <path>  instead of --to, write a path relative to each file, pointing at this directory
//                    (relative to the repo root), e.g. "src/components/icons"
//   --dry-run        report what would change, write nothing
//   --force          also rewrite statements that import names Mojo Icons does not have (they are still reported)
//
// Names are kept exactly as imported. `LucideBell`-style names become `Bell as LucideBell`.
// Never enters node_modules (or .git, dist, build, coverage, ...) and never follows symlinked directories.
// Exit code: 0 when everything mapped, 1 when some names could not be mapped, 2 on usage errors.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.turbo', '.vercel', '.netlify', '.cache', 'out', '.output', '.svelte-kit'])
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'])
const FROM = 'lucide-react'

// ---------- args ----------
const args = process.argv.slice(2)
const opt = { to: '@axismojo/icons', toDir: null, dry: false, force: false, quiet: false, repo: null }
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--to') opt.to = args[++i]
  else if (a === '--to-dir') opt.toDir = args[++i]
  else if (a === '--dry-run' || a === '--dry') opt.dry = true
  else if (a === '--force') opt.force = true
  else if (a === '--quiet') opt.quiet = true
  else if (a === '-h' || a === '--help') usage(0)
  else if (a.startsWith('--')) { console.error(`Unknown option ${a}`); usage(2) }
  else if (!opt.repo) opt.repo = a
  else { console.error(`Unexpected argument ${a}`); usage(2) }
}
function usage(code) {
  console.log('Usage: node codemod.mjs <repo-path> [--to <module> | --to-dir <dir>] [--dry-run] [--force] [--quiet]')
  process.exit(code)
}
if (!opt.repo || !opt.to) usage(2)
const ROOT = path.resolve(opt.repo)
if (!fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory()) { console.error(`Not a directory: ${ROOT}`); process.exit(2) }

// ---------- what Mojo Icons exports ----------
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, 'manifest.json'), 'utf8'))
const VALUES = new Set(manifest.exports)
const TYPES = new Set(manifest.types)
/** returns { ok, target } where target is the Mojo export to import for this lucide name */
function mapName(name, typeOnly) {
  if (VALUES.has(name)) return { ok: true, target: name }
  if (TYPES.has(name)) return typeOnly || name !== 'Icon' ? { ok: true, target: name } : { ok: false, why: '`Icon` is only a type in Mojo Icons (Lucide\'s <Icon iconNode> component has no equivalent)' }
  if (name.startsWith('Lucide') && VALUES.has(name.slice(6))) return { ok: true, target: name.slice(6) }
  if (name.startsWith('Lucide') && TYPES.has(name.slice(6))) return { ok: true, target: name.slice(6) }
  const known = { icons: 'the `icons` map is not provided (it defeats tree-shaking)', createLucideIcon: 'use createMojoIcon(kebabName, iconNode)', dynamicIconImports: 'dynamic icon imports are not provided', DynamicIcon: 'dynamic icons are not provided' }
  return { ok: false, why: known[name] ?? 'no Mojo icon with this name' }
}

// ---------- walk ----------
function* walk(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue // never follow links (workspaces link packages into node_modules)
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue
      yield* walk(full)
    } else if (e.isFile() && EXTENSIONS.has(path.extname(e.name)) && !e.name.endsWith('.d.ts')) yield full
  }
}

const lineOf = (src, index) => src.slice(0, index).split('\n').length
const posix = (p) => p.split(path.sep).join('/')
function targetFor(file) {
  if (!opt.toDir) return opt.to
  let rel = posix(path.relative(path.dirname(file), path.resolve(ROOT, opt.toDir)))
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel
}

// import/export ... from 'lucide-react'   (clause cannot contain quotes or semicolons, so it never spans statements)
const STATIC_RE = /\b(import|export)(\s+type)?(\s+[^;'"`]*?\s*)from\s*(['"])lucide-react(\/[^'"]*)?\4/g
const BARE_RE = /\bimport\s*(['"])lucide-react\1/g
const CALL_RE = /\b(import|require|(?:vi|jest)\s*\.\s*(?:mock|doMock|unmock|importActual|requireActual))\s*\(\s*(['"])lucide-react(\/[^'"]*)?\2/g

const report = { files: 0, statements: 0, unmapped: [], notes: [], used: new Map() }
const note = (file, line, msg) => report.notes.push(`${posix(path.relative(ROOT, file))}:${line}  ${msg}`)
const miss = (file, line, name, why) => report.unmapped.push({ where: `${posix(path.relative(ROOT, file))}:${line}`, name, why })

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8')
  if (!src.includes(FROM)) continue
  const target = targetFor(file)
  let changed = false
  let out = src

  out = out.replace(STATIC_RE, (whole, kw, typeKw, clause, q, deep, index) => {
    const line = lineOf(src, index)
    if (deep) {
      miss(file, line, `lucide-react${deep}`, 'deep imports from lucide-react cannot be mapped; import the icon by name instead')
      return whole
    }
    const typeOnly = Boolean(typeKw)
    const body = clause.trim()
    const problems = []
    let newClause = clause
    const ns = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(body)
    if (ns) {
      // namespace import: check every `NS.Name` used in the file
      const used = new Set([...src.matchAll(new RegExp(`\\b${ns[1]}\\.([A-Za-z_$][\\w$]*)`, 'g'))].map((m) => m[1]))
      for (const n of used) {
        report.used.set(n, (report.used.get(n) ?? 0) + 1)
        const m = mapName(n, typeOnly)
        if (!m.ok || m.target !== n) problems.push([n, m.ok ? `use ${m.target}` : m.why])
      }
      note(file, line, `namespace import * as ${ns[1]}: checked ${used.size} member(s)`)
    } else {
      const braces = /\{([\s\S]*)\}/.exec(body)
      const outside = body.replace(/\{[\s\S]*\}/, '').replace(/,/g, ' ').trim()
      if (outside && kw === 'import') problems.push([outside, 'lucide-react has no default export'])
      if (braces) {
        const specs = braces[1].split(',').map((s) => s.trim()).filter(Boolean)
        const rewritten = specs.map((spec) => {
          const m = /^(type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(spec.replace(/\s+/g, ' '))
          if (!m) { problems.push([spec, 'could not parse this specifier']); return spec }
          const [, t, name, local] = m
          report.used.set(name, (report.used.get(name) ?? 0) + 1)
          const r = mapName(name, typeOnly || Boolean(t))
          if (!r.ok) { problems.push([name, r.why]); return spec }
          if (r.target === name) return spec
          return `${t ?? ''}${r.target} as ${local ?? name}`
        })
        if (rewritten.some((s, i) => s !== specs[i])) {
          // keep the original layout: replace each specifier in place
          let inner = braces[1]
          specs.forEach((s, i) => { if (s !== rewritten[i]) inner = inner.replace(s, rewritten[i]) })
          newClause = clause.replace(braces[1], inner)
        }
      }
    }
    for (const [n, why] of problems) miss(file, line, n, why)
    if (problems.length && !opt.force) return whole
    report.statements++
    changed = true
    return `${kw}${typeKw ?? ''}${newClause}from ${q}${target}${q}`
  })

  out = out.replace(BARE_RE, (whole, q, index) => {
    note(file, lineOf(src, index), 'side-effect import of lucide-react rewritten')
    report.statements++
    changed = true
    return `import ${q}${target}${q}`
  })

  out = out.replace(CALL_RE, (whole, fn, q, deep, index) => {
    const line = lineOf(src, index)
    if (deep) { miss(file, line, `lucide-react${deep}`, 'deep imports from lucide-react cannot be mapped'); return whole }
    note(file, line, `${fn.replace(/\s/g, '')}('lucide-react') rewritten; check any names it relies on`)
    report.statements++
    changed = true
    return whole.replace(/(['"])lucide-react\1/, `${q}${target}${q}`)
  })

  if (changed) {
    report.files++
    if (!opt.dry) fs.writeFileSync(file, out)
    if (!opt.quiet) console.log(`${opt.dry ? 'would rewrite' : 'rewrote'}  ${posix(path.relative(ROOT, file))}`)
  }
  if (out.includes(`'${FROM}'`) || out.includes(`"${FROM}"`)) {
    const left = [...out.matchAll(/(['"])lucide-react\1/g)].length
    if (left) note(file, lineOf(out, out.indexOf(FROM)), `${left} reference(s) to lucide-react left in this file`)
  }
}

// ---------- summary ----------
console.log(`\n${opt.dry ? '[dry run] ' : ''}${report.files} file(s), ${report.statements} statement(s) ${opt.dry ? 'to rewrite' : 'rewritten'} -> '${opt.toDir ? `<relative>/${opt.toDir}` : opt.to}'`)
console.log(`${report.used.size} distinct lucide names imported.`)
if (report.notes.length) {
  console.log('\nNotes:')
  for (const n of report.notes) console.log(`  ${n}`)
}
if (report.unmapped.length) {
  const byName = new Map()
  for (const u of report.unmapped) byName.set(u.name, [...(byName.get(u.name) ?? []), u])
  console.log(`\nCould not map ${byName.size} name(s)${opt.force ? ' (rewritten anyway because of --force)' : ' (those statements were left unchanged)'}:`)
  for (const [name, list] of byName) console.log(`  ${name}: ${list[0].why}\n    ${list.map((u) => u.where).join('\n    ')}`)
  process.exit(1)
}
console.log('All names mapped.')
