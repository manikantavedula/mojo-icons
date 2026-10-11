# Mojo Icons (`@axismojo/icons`)

The Axis Mojo icon set: 383 icons as Lucide-compatible React components, used by Aula Melo, Aural Mint, Access Meru
and Jamun Origin. Every icon has the Mojo accent dot.

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

## Working on the icons

```
svg/            one SVG per icon: the source of truth
src/            the React package, generated from svg/ (npm run generate); committed
aliases.json    extra export names (older Lucide names)
manifest.json   every export name (the codemod reads it)
scripts/        build.mjs (svg → src), check.mjs (style and coverage rules)
preview.html    a contact sheet of every icon
```

1. Add or change a drawing in `svg/` (24×24, stroke 2, round caps and joins, one accent dot).
2. `npm run check` (the style rules) and `npm run build`.
3. `npx changeset`: patch for a fixed drawing, minor for new icons, major for a removed or renamed icon; one line
   on what changed.
4. Open a pull request. CI checks the drawings, the build, that `src/` matches `svg/`, and that a changeset is there.

## Releasing

Nothing is published by hand. When pull requests with changesets reach `main`, the Release workflow opens a
**Version Packages** pull request that raises the version and writes `CHANGELOG.md`. Merging it publishes to npm.
The apps get the new version through Dependabot.

Needs once: the `axismojo` organisation on npmjs.com, and an `NPM_TOKEN` repository secret (a granular token
that can publish `@axismojo/icons`).
