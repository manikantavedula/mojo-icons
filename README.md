# Mojo Icons (`@axismojo/icons`)

The Axis Mojo icon set: 400 icons as Lucide-compatible React components, used by Wisenate, Uttarōha, sesameru
and Tatrajam. Every icon has the Mojo accent dot.

```bash
npm install @axismojo/icons
```

```tsx
import { Bell, MapPin } from '@axismojo/icons'

<Bell className="size-5" />
<MapPin size={20} strokeWidth={1.75} title="Location" accent="var(--leaf)" />
```

Props follow Lucide (`size`, `strokeWidth`, `absoluteStrokeWidth`, `color`, `className`) plus `title` (gives the icon
an accessible name; otherwise it is `aria-hidden`) and `accent` (the colour of the accent dot, or set
`--mojo-accent`). Every icon is also exported with an `Icon` suffix (`BellIcon`), and the `LucideIcon` / `LucideProps`
types are exported, so code written for `lucide-react` keeps compiling. The raw drawings are in
`@axismojo/icons/svg/<name>.svg`.

Moving an app from `lucide-react`: `npx mojo-icons-codemod <app dir> --to @axismojo/icons --dry-run`, then without
`--dry-run`.

## The byline: `ByAxisMojo` and `ByAxisMojoAnimated`

"by [lattu] Axis Mojo" is one pair of components for every Axis Mojo app, old and new. Import them; never copy or restyle them.
`ByAxisMojo` is still; `ByAxisMojoAnimated` is the same byline with the lattu spinning like a top (a splash, a loader; still under
reduced motion). They take the same props:

| Prop | Values | |
|---|---|---|
| `size` | `sm` (11 px, default), `md` (13 px), `lg` (15 px) | `sm` beside the app's name in a header, cover or sign-in lockup; `md` alone in a footer or legal line; `lg` for a splash. The row, lattu and gaps scale in em. |
| `theme` | `auto` (default), `light`, `dark`, `band` | `auto` follows the page: `data-theme="dark"`, a `dark` class, or the device's dark setting (`data-theme="light"` or a `light` class force light). `band` is a dark top bar or cover. |
| `link` | `true` (default), `false` | one link to Axis Mojo in a new tab; `false` for a splash |
| `label`, `by` | text | the link's accessible name; the word "by" (translations) |
| `className`, `style` | | layout only (margins, alignment): never fonts, sizes or colours |

```tsx
import { ByAxisMojo, ByAxisMojoAnimated } from '@axismojo/icons'

<ByAxisMojo />                                  // 11 px, follows the page's theme
<ByAxisMojo size="md" theme="dark" />           // a footer on a dark page
<ByAxisMojo theme="band" />                     // on a dark top bar or cover
<ByAxisMojoAnimated size="lg" theme="dark" link={false} />   // the splash
```

The lattu alone: `AxisMojoMark` and `AxisMojoMarkAnimated`. The components carry their own animation and hover CSS. The app loads the
two fonts: Anek Latin (the word "by") and Space Grotesk 700 (the name), e.g. `@fontsource-variable/anek-latin` and
`@fontsource-variable/space-grotesk`. The spec is `axis-mojo/docs/BYLINE.md`; `npm test` pins every number in it.
Emails cannot use them (no React, no web fonts); they follow the same numbers by hand.

## Working on the icons

```
svg/            one SVG per icon: the source of truth
src/            the React package, generated from svg/ (npm run generate); committed
aliases.json    extra export names (older Lucide names)
manifest.json   every export name (the codemod reads it)
scripts/        build.mjs (svg → src), check.mjs (style and coverage rules)
preview.html    a contact sheet of every icon
```

1. Add or change a drawing in `svg/` (24×24, stroke 2, round caps and joins, one accent dot). One exception: `door-enter` draws sesameru's door, so its accent is a filled door shape, and `scripts/check.mjs` lists it in `ACCENT_SHAPE_ICONS`.
2. `npm run check` (the style rules) and `npm run build`.
3. `npx changeset`: patch for a fixed drawing, minor for new icons, major for a removed or renamed icon; one line
   on what changed.
4. Open a pull request. CI checks the drawings, the build, that `src/` matches `svg/`, and that a changeset is there.

## Releasing

Versions come from changesets, never by hand. To release: **Actions → Release → Run workflow** on `main`. With
pending changesets it opens a **Version Packages** pull request that raises the version and writes `CHANGELOG.md`;
merge it, then run the Release workflow again to publish to npm. The apps get the new version through Dependabot
(monthly).

Needs once: the `axismojo` organisation on npmjs.com, and a **trusted publisher** on the package (npmjs.com →
`@axismojo/icons` → Settings → Trusted Publisher → GitHub Actions: user `manikantavedula`, repository `mojo-icons`,
workflow `release.yml`, with direct `npm publish` allowed). No npm token is stored anywhere: the workflow proves to
npm that it is this repository's `release.yml` (OIDC). npm removes publishing with a stored token in January 2027.

## Checks before pushing

GitHub Actions no longer runs on every push, to save the account's minutes. Run every check here first:

```bash
npm run ship
```

The workflows in `.github/workflows` still run by hand from the Actions tab. Releasing to npm is by hand too: see **Releasing** above.
