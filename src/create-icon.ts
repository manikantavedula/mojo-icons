import { createElement, forwardRef } from 'react'
import type { CSSProperties, ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react'

/** One child element of an icon: [tag, attributes]. */
export type IconNode = ReadonlyArray<readonly [tag: string, attrs: Readonly<Record<string, string>>]>

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height. Default 24. */
  size?: number | string
  /** Stroke width in viewBox units. Default 2. */
  strokeWidth?: number | string
  /** Keep the stroke at `strokeWidth` px whatever the size (Lucide-compatible). */
  absoluteStrokeWidth?: boolean
  /** Stroke colour. Default `currentColor`. The accent dot follows it unless `--mojo-accent` is set. */
  color?: string
  /** Accessible name. When set, the icon renders `<title>` and `role="img"`; otherwise it is `aria-hidden`. */
  title?: string
  /** Colour for the accent dot of this icon only (sets `--mojo-accent`). */
  accent?: string
}

export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>
/** Alias so existing `import type { LucideIcon }` code keeps compiling. */
export type LucideIcon = Icon
/** Alias so existing `LucideProps` code keeps compiling. */
export type LucideProps = IconProps

const ACCESSIBLE_PROPS = ['aria-label', 'aria-labelledby', 'aria-hidden', 'role'] as const

/** Build a Mojo icon component from its kebab name and node list. */
export function createMojoIcon(kebabName: string, iconNode: IconNode): Icon {
  const Component = forwardRef<SVGSVGElement, IconProps>(function MojoIcon(
    {
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth = false,
      color = 'currentColor',
      title,
      accent,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const stroke =
      absoluteStrokeWidth && Number(size) > 0 ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth
    const custom = rest as Record<string, unknown>
    const labelled = ACCESSIBLE_PROPS.some((key) => custom[key] !== undefined)
    let mergedStyle: CSSProperties | undefined = style
    if (color !== 'currentColor' || accent) {
      mergedStyle = { ...style }
      // Drive stroke and dot from CSS `color`, so the dot's currentColor fallback matches the stroke.
      if (color !== 'currentColor' && mergedStyle.color === undefined) mergedStyle.color = color
      if (accent) (mergedStyle as Record<string, string>)['--mojo-accent'] = accent
    }
    return createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: stroke,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className: ['mojo-icon', `mojo-icon-${kebabName}`, 'lucide', `lucide-${kebabName}`, className]
          .filter(Boolean)
          .join(' '),
        style: mergedStyle,
        ...(title ? { role: 'img' } : labelled ? {} : { 'aria-hidden': true }),
        ...rest,
      },
      title ? createElement('title', null, title) : null,
      ...iconNode.map(([tag, attrs], index) => createElement(tag, { key: index, ...attrs })),
      children,
    )
  })
  Component.displayName = kebabName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return Component
}
