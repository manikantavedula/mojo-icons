import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

// The one "by Axis Mojo" for every Axis Mojo app, old and new (owner, 9 Nov 2026): axis-mojo/docs/BYLINE.md is the spec and this file
// is the implementation. Apps import it from '@axismojo/icons' and never copy or restyle it. It carries its own animation CSS, so a
// spinning lattu needs nothing from the app. The app loads the two fonts (Anek Latin for "by", Space Grotesk 700 for the name).

/**
 * Where the lattu's dark body ends (y of its 64 grid), worked out from the drawing, not measured: the body's tip is an arc
 * of radius 2.5 on a 4-wide chord at y 57.5 (centre 1.5 above the chord, at y 56, its lowest point 2.5 below that), and the
 * body is then turned -16 degrees about (32,34). The two small orange sparks beneath it are not the body and hang lower
 * (they end at 63.8). The byline sets its words' baseline on this line (BYLINE_LIFT_EM), the same in every Axis Mojo app;
 * the byline test reads the drawn path and fails if the glyph changes without these numbers.
 */
export const LATTU_TURN = { deg: -16, cx: 32, cy: 34 } as const
export const LATTU_TIP = { chordY: 57.5, halfChord: 2, r: 2.5, x: 32 } as const
export const LATTU_BODY_BOTTOM = (() => {
  const a = (LATTU_TURN.deg * Math.PI) / 180
  const dx = LATTU_TIP.x - LATTU_TURN.cx
  const dy = LATTU_TIP.chordY - Math.sqrt(LATTU_TIP.r ** 2 - LATTU_TIP.halfChord ** 2) - LATTU_TURN.cy
  return LATTU_TURN.cy + dx * Math.sin(a) + dy * Math.cos(a) + LATTU_TIP.r
})()
/** How far the lattu hangs below the words' baseline: its box bottom to its body bottom, in em of a 1.5em mark. */
export const BYLINE_LIFT_EM = Math.round(((64 - LATTU_BODY_BOTTOM) / 64) * 1.5 * 1e4) / 1e4

const LATTU_BODY = 'M9 25.5C9 19 19 14 32 14s23 5 23 11.5c0 2-1 3.5-2.5 5L34 57.5a2.5 2.5 0 0 1-4 0L11.5 30.5C10 29 9 27.5 9 25.5z'
/** Where the band's gaps sit in the still lattu: four lines leaning with the cone (64 grid, tilted frame). */
const GAP_LINES = ['M49.31 32.34L45.54 38.46', 'M38.61 34.29L37.17 39.98', 'M25.39 34.29L26.83 39.98', 'M14.69 32.34L18.46 38.46']
/** The middle of the band: the gaps of the spinning top run along it. */
const BAND_MID = 'M12.9 32.6C20 38.9 44 38.9 51.1 32.6'
const BAND_BELT = 'M10.61 29.2 A21.39 5.35 0 0 0 53.39 29.2 L48.73 36.0 A16.73 4.18 0 0 1 15.27 36.0Z'

/**
 * The Axis Mojo mark, the lattu (spinning top), for the "by Axis Mojo" byline: the shaded 3D lattu of the Axis Mojo
 * site (8 Nov 2026): a round body lit from the top left with an edge light, a Saffron band wrapped round it like a belt.
 * The colours are fixed, the same in light and dark. The band's gaps are see-through mask cuts. `spin` makes it spin like
 * a top (CSS only, still under prefers-reduced-motion): the gaps become a dashed run along the band (.lattu-band).
 * `onDark` is kept for callers and no longer changes anything.
 */
export function AxisMojoMark({ className, spin = false }: { className?: string; spin?: boolean }) {
  const uid = `lat${useId().replace(/:/g, '')}`
  const id = (n: string) => `${uid}-${n}`
  const url = (n: string) => `url(#${id(n)})`
  return (
    <svg viewBox="0 0 64 64" className={className ? `${className} mojo-lattu-svg` : 'mojo-lattu-svg'} aria-hidden>
      <defs>
        <linearGradient id={id('body')} gradientUnits="userSpaceOnUse" x1="14" y1="16" x2="52" y2="54">
          <stop offset="0" stopColor="#93A2C0" />
          <stop offset=".42" stopColor="#5E6F92" />
          <stop offset="1" stopColor="#435274" />
        </linearGradient>
        <linearGradient id={id('side')} gradientUnits="userSpaceOnUse" x1="9" y1="0" x2="55" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset=".7" stopColor="#000" stopOpacity=".06" />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id={id('knob')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9AA9C6" />
          <stop offset=".5" stopColor="#6A7B9E" />
          <stop offset="1" stopColor="#46557A" />
        </linearGradient>
        <linearGradient id={id('band')} gradientUnits="userSpaceOnUse" x1="0" y1="29" x2="0" y2="40">
          <stop offset="0" stopColor="#FFD773" />
          <stop offset=".45" stopColor="#F2A31B" />
          <stop offset="1" stopColor="#C77C0A" />
        </linearGradient>
        <linearGradient id={id('bandshade')} gradientUnits="userSpaceOnUse" x1="9" y1="0" x2="55" y2="0">
          <stop offset="0" stopColor="#5A3300" stopOpacity=".55" />
          <stop offset=".22" stopColor="#5A3300" stopOpacity="0" />
          <stop offset=".72" stopColor="#5A3300" stopOpacity="0" />
          <stop offset="1" stopColor="#5A3300" stopOpacity=".6" />
        </linearGradient>
        <linearGradient id={id('edge')} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".28" stopColor="#fff" stopOpacity=".6" />
          <stop offset=".78" stopColor="#fff" stopOpacity=".42" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={id('clip')}>
          <path d={LATTU_BODY} />
        </clipPath>
        <mask id={id('gaps')}>
          <rect x="0" y="0" width="64" height="64" fill="#fff" />
          {spin ? (
            <path className="mojo-lattu-band" d={BAND_MID} fill="none" stroke="#000" strokeWidth="9" strokeDasharray="1.7 10.3" />
          ) : (
            GAP_LINES.map((d) => <path key={d} d={d} stroke="#000" strokeWidth="1.7" strokeLinecap="butt" />)
          )}
        </mask>
      </defs>
      <g className={spin ? 'mojo-lattu-spin' : undefined}>
        <g transform="rotate(-16 32 34)">
          <rect x="29" y="4" width="6" height="10" rx="3" fill={url('knob')} />
          <path d={LATTU_BODY} fill={url('body')} />
          <path d={LATTU_BODY} fill={url('side')} />
          <g clipPath={url('clip')}>
            <path d="M9 25.5C9 19 19 14 32 14" fill="none" stroke={url('edge')} strokeWidth="3.4" strokeLinecap="butt" />
          </g>
          <g clipPath={url('clip')}>
            <g mask={url('gaps')}>
              <path d={BAND_BELT} fill={url('band')} />
              <path d={BAND_BELT} fill={url('bandshade')} />
            </g>
          </g>
        </g>
      </g>
      <path d="M16 61c3.5 1 7 1.5 11 1.5M40 61.6c2.6-.5 5-1.2 7-2" fill="none" stroke="#f2a31b" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export const AXIS_MOJO_URL = 'https://axismojo.netlify.app'

/** Spin and hover CSS, carried by the component (an app needs no global CSS for it). The gaps race round the band 0.24 s a lap; the lattu precesses about its tip. */
const CSS =
  '@keyframes mojo-lattu-precess{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}' +
  '@keyframes mojo-lattu-band{to{stroke-dashoffset:-24}}' +
  '.mojo-lattu-spin{transform-box:view-box;transform-origin:32px 59px;animation:mojo-lattu-precess .9s ease-in-out infinite}' +
  '.mojo-lattu-band{animation:mojo-lattu-band .24s linear infinite}' +
  '@media (prefers-reduced-motion:reduce){.mojo-lattu-spin,.mojo-lattu-band{animation:none}}' +
  '.mojo-by a{color:inherit;text-decoration:none;border-radius:2px}.mojo-by a:hover b,.mojo-by a:focus-visible b{text-decoration:underline;text-underline-offset:.2em}'

/** The colours of the spec: "by" muted, the name Ink on light and Paper on dark. `band` is a dark top bar or cover (a lighter "by"). */
export type BylineTone = 'light' | 'dark' | 'band'
const TONES: Record<BylineTone, { by: string; name: string }> = {
  light: { by: '#64666b', name: '#14181f' },
  dark: { by: '#9ea39f', name: '#f7f4ec' },
  band: { by: '#c9d6ce', name: '#f7f4ec' },
}
/** The two sizes of the spec: 11 px beside the name (a header, a cover, a sign-in lockup), 13 px alone (a footer, a legal line). No other size. */
export type BylineSize = 'beside' | 'alone'
const SIZES: Record<BylineSize, number> = { beside: 11, alone: 13 }

export interface ByAxisMojoProps {
  /** `beside` (11 px, next to the app's name) or `alone` (13 px). Default `beside`. */
  size?: BylineSize
  /** `light` (a light page), `dark` (a dark page) or `band` (a dark bar or cover). Default `light`. */
  tone?: BylineTone
  /** Spin the lattu like a top (the splash). */
  spin?: boolean
  /** The lattu and the name are one link to Axis Mojo in a new tab. Default true; false for a splash or an email-like still. */
  link?: boolean
  /** Accessible name of the link. Default "Axis Mojo (opens in a new tab)". */
  label?: string
  /** Layout only (margins, alignment): never fonts, sizes or colours. */
  className?: string
  style?: CSSProperties
  /** Replaces the word "by" (translations); default "by". */
  by?: ReactNode
}

const BY_FONT = '"Anek Latin Variable","Anek Latin",system-ui,sans-serif'
const NAME_FONT = '"Space Grotesk Variable","Space Grotesk",Inter,system-ui,sans-serif'

/**
 * "by [lattu] Axis Mojo": one baseline row 1.5em tall, "by" in Anek Latin 500, 3 px, the shaded lattu in a 1.5em box that ends
 * BYLINE_LIFT_EM short of the drawing's bottom (so the words sit on the lattu's tip), 0.15em, then the name in Space Grotesk bold.
 */
export function ByAxisMojo({ size = 'beside', tone = 'light', spin = false, link = true, label = 'Axis Mojo (opens in a new tab)', className, style, by = 'by' }: ByAxisMojoProps) {
  const c = TONES[tone]
  const inner = (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '.15em' }}>
      <span style={{ display: 'inline-block', flex: 'none', width: '1.5em', height: `${1.5 - BYLINE_LIFT_EM}em` }}>
        <AxisMojoMark spin={spin} className="mojo-lattu-block" />
      </span>
      <b style={{ fontFamily: NAME_FONT, fontWeight: 700, letterSpacing: '-.01em', color: c.name }}>Axis Mojo</b>
    </span>
  )
  return (
    <span
      className={className ? `mojo-by ${className}` : 'mojo-by'}
      style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, height: '1.5em', lineHeight: 1, whiteSpace: 'nowrap', fontSize: SIZES[size], fontFamily: BY_FONT, fontWeight: 500, color: c.by, ...style }}
    >
      <style>{CSS + '.mojo-lattu-block{display:block;width:1.5em;height:1.5em}'}</style>
      {by}
      {link ? (
        <a href={AXIS_MOJO_URL} target="_blank" rel="noopener noreferrer" aria-label={label}>
          {inner}
        </a>
      ) : (
        inner
      )}
    </span>
  )
}
