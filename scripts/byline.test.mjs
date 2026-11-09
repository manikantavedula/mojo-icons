// The byline must match axis-mojo/docs/BYLINE.md. Run after a build: node --test scripts/byline.test.mjs (npm test)
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ByAxisMojo, ByAxisMojoAnimated, AxisMojoMark, AxisMojoMarkAnimated, AXIS_MOJO_URL, BYLINE_LIFT_EM, LATTU_BODY_BOTTOM } from '../dist/index.js'

const html = (props, C = ByAxisMojo) => renderToStaticMarkup(createElement(C, props))

test('the lift is worked out from the lattu drawing (0.1489em)', () => {
  assert.equal(BYLINE_LIFT_EM, 0.1489)
  assert.ok(Math.abs(LATTU_BODY_BOTTOM - 57.65) < 0.01)
})

test('one baseline row, 1.5em tall, 3 px after "by", Anek Latin 500', () => {
  assert.match(html({}), /display:inline-flex;align-items:baseline;gap:3px;height:1\.5em;line-height:1;white-space:nowrap;font-size:11px;font-family:&quot;Anek Latin Variable&quot;[^"]*font-weight:500/)
})

test('size: sm 11 px (beside the name), md 13 px (alone), lg 15 px (splash); sm is the default', () => {
  assert.match(html({ size: 'sm' }), /font-size:11px/)
  assert.match(html({ size: 'md' }), /font-size:13px/)
  assert.match(html({ size: 'lg' }), /font-size:15px/)
  assert.match(html({}), /font-size:11px/)
})

test('the name is Space Grotesk 700, letter-spacing -0.01em, 0.15em after the lattu', () => {
  const a = html({})
  assert.match(a, /<b style="font-family:&quot;Space Grotesk Variable&quot;[^"]*font-weight:700;letter-spacing:-\.01em">Axis Mojo<\/b>/)
  assert.match(a, /gap:\.15em/)
})

test('theme: light, dark, band and auto (the default) set the spec colours', () => {
  assert.match(html({ theme: 'light' }), /class="mojo-by mojo-by--light"/)
  assert.match(html({ theme: 'dark' }), /class="mojo-by mojo-by--dark"/)
  assert.match(html({ theme: 'band' }), /class="mojo-by mojo-by--band"/)
  assert.match(html({}), /class="mojo-by mojo-by--auto"/)
  const css = html({}).match(/<style>(.*?)<\/style>/)[1]
  assert.match(css, /\.mojo-by\{--mojo-by:#64666b;--mojo-name:#14181f\}/)
  assert.match(css, /\.mojo-by--dark\{--mojo-by:#9ea39f;--mojo-name:#f7f4ec\}/)
  assert.match(css, /\.mojo-by--band\{--mojo-by:#c9d6ce;--mojo-name:#f7f4ec\}/)
  assert.match(css, /\[data-theme=dark\] \.mojo-by--auto,\.dark \.mojo-by--auto\{--mojo-by:#9ea39f;--mojo-name:#f7f4ec\}/)
  assert.match(css, /prefers-color-scheme:dark\)\{:root:not\(\[data-theme=light\]\):not\(\.light\) \.mojo-by--auto/)
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

test('two components: ByAxisMojo is still, ByAxisMojoAnimated spins the lattu', () => {
  const still = html({})
  assert.ok(!still.includes('class="mojo-lattu-band"') && !still.includes('class="mojo-lattu-spin"'))
  assert.equal((still.match(/stroke-width="1\.7"/g) ?? []).length, 4)
  const anim = html({}, ByAxisMojoAnimated)
  assert.match(anim, /class="mojo-lattu-band"[^>]*stroke-dasharray="1\.7 10\.3"/)
  assert.match(anim, /class="mojo-lattu-spin"/)
  assert.ok(!anim.includes('stroke-width="1.7"'))
  // both share the layout: only the lattu's drawing differs
  assert.equal(still.match(/font-size:\d+px/)[0], anim.match(/font-size:\d+px/)[0])
})

test('the shaded lattu mark: fixed colours, still or animated, and the animation carries its own CSS', () => {
  const still = renderToStaticMarkup(createElement(AxisMojoMark, {}))
  assert.ok(!still.includes('currentColor') && !still.includes('<style>'))
  assert.match(still, /#F2A31B/)
  const anim = renderToStaticMarkup(createElement(AxisMojoMarkAnimated, {}))
  assert.match(anim, /<style>[^<]*mojo-lattu-precess/)
})
