// The byline must match axis-mojo/docs/BYLINE.md. Run after a build: node --test scripts/byline.test.mjs (npm test)
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ByAxisMojo, AxisMojoMark, AXIS_MOJO_URL, BYLINE_LIFT_EM, LATTU_BODY_BOTTOM } from '../dist/index.js'

const html = (props) => renderToStaticMarkup(createElement(ByAxisMojo, props))

test('the lift is worked out from the lattu drawing (0.1489em)', () => {
  assert.equal(BYLINE_LIFT_EM, 0.1489)
  assert.ok(Math.abs(LATTU_BODY_BOTTOM - 57.65) < 0.01)
})

test('one baseline row, 1.5em tall, 3 px after "by", Anek Latin 500, 11 px beside the name and 13 px alone', () => {
  const a = html({})
  assert.match(a, /display:inline-flex;align-items:baseline;gap:3px;height:1\.5em;line-height:1;white-space:nowrap;font-size:11px;font-family:&quot;Anek Latin Variable&quot;/)
  assert.match(a, /font-weight:500/)
  assert.match(html({ size: 'alone' }), /font-size:13px/)
})

test('the name is Space Grotesk 700, letter-spacing -0.01em, 0.15em after the lattu', () => {
  const a = html({})
  assert.match(a, /<b style="font-family:&quot;Space Grotesk Variable&quot;[^"]*font-weight:700;letter-spacing:-\.01em;color:#14181f">Axis Mojo<\/b>/)
  assert.match(a, /gap:\.15em/)
})

test('the colours of the spec: light, dark and band', () => {
  assert.match(html({ tone: 'light' }), /color:#64666b/); assert.match(html({ tone: 'light' }), /color:#14181f/)
  assert.match(html({ tone: 'dark' }), /color:#9ea39f/); assert.match(html({ tone: 'dark' }), /color:#f7f4ec/)
  assert.match(html({ tone: 'band' }), /color:#c9d6ce/); assert.match(html({ tone: 'band' }), /color:#f7f4ec/)
})

test('the lattu sits in a 1.5em box 0.1489em short, so the words stand on its tip', () => {
  assert.match(html({}), /width:1\.5em;height:1\.3511em/)
})

test('the lattu and the name are one link to Axis Mojo in a new tab; "by" is plain text', () => {
  const a = html({})
  assert.match(a, new RegExp(`<a href="${AXIS_MOJO_URL}" target="_blank" rel="noopener noreferrer" aria-label="Axis Mojo \\(opens in a new tab\\)">`))
  assert.ok(a.indexOf('>by<') < a.indexOf('<a '))
  assert.ok(!html({ link: false }).includes('<a '))
})

test('the shaded lattu: fixed colours, see-through gaps, spin only on request', () => {
  const still = renderToStaticMarkup(createElement(AxisMojoMark, {}))
  assert.ok(!still.includes('currentColor'))
  assert.match(still, /#F2A31B/)
  assert.equal((still.match(/stroke-width="1\.7"/g) ?? []).length, 4)
  assert.ok(!still.includes('mojo-lattu-band'))
  const spin = renderToStaticMarkup(createElement(AxisMojoMark, { spin: true }))
  assert.match(spin, /class="mojo-lattu-band"[^>]*stroke-dasharray="1\.7 10\.3"/)
  assert.match(spin, /mojo-lattu-spin/)
})
