import type { ReactNode, SVGAttributes } from 'react'
import { cx } from '../../lib/cx'
import styles from './Icon.module.css'

export type IconName =
  | 'check'
  | 'minus'
  | 'plus'
  | 'close'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevrons-left'
  | 'chevrons-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'search'
  | 'calendar'
  | 'clock'
  | 'upload'
  | 'file'
  | 'image'
  | 'trash'
  | 'alert'
  | 'info'
  | 'eye'
  | 'eye-off'
  | 'loader'
  | 'spark'
  | 'feather'
  | 'scroll'
  | 'flame'
  | 'heart'
  | 'bolt'
  | 'bowl'
  | 'tag'
  | 'house'
  | 'mountain'
  | 'lantern'
  | 'compass'
  | 'axe'
  | 'sun'
  | 'moon'
  | 'snow'
  | 'leaf'
  | 'hourglass'
  | 'sprig'
  | 'shield'
  | 'flag'
  | 'bookmark'
  | 'edit'
  | 'drag'
  | 'filter'
  | 'copy'
  | 'external-link'

const icons: Record<IconName, ReactNode> = {
  check: <path d="m4.6 12.4 4.8 4.8L19.4 6.8" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 4.8v14.4M4.8 12h14.4" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  'chevron-down': <path d="m6 9.5 6 6 6-6" />,
  'chevron-up': <path d="m6 14.5 6-6 6 6" />,
  'chevron-left': <path d="m14.5 6-6 6 6 6" />,
  'chevron-right': <path d="m9.5 6 6 6-6 6" />,
  'chevrons-left': <path d="m12.5 6-6 6 6 6M19 6l-6 6 6 6" />,
  'chevrons-right': <path d="m11.5 6 6 6-6 6M5 6l6 6-6 6" />,
  'arrow-up': <path d="M12 19.2V4.8m0 0-6 6m6-6 6 6" />,
  'arrow-down': <path d="M12 4.8v14.4m0 0-6-6m6 6 6-6" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4.1 4.1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.4" y="5.4" width="17.2" height="15.2" rx="1.6" />
      <path d="M3.4 10h17.2M8 3.4v4M16 3.4v4" />
      <path d="M7.4 14.2h1M11.3 14.2h1M15.2 14.2h1M7.4 17.3h1M11.3 17.3h1" opacity=".55" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.4 2.2" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16.2V4.4m0 0L7.2 9.2M12 4.4l4.8 4.8" />
      <path d="M4.4 15.4v3.2c0 1 .8 1.8 1.8 1.8h11.6c1 0 1.8-.8 1.8-1.8v-3.2" />
    </>
  ),
  file: (
    <>
      <path d="M6 3.4h7.2l4.8 4.8v12.4H6V3.4Z" />
      <path d="M13.2 3.4v4.8H18" opacity=".65" />
      <path d="M9 13h6M9 16.4h4" opacity=".55" />
    </>
  ),
  image: (
    <>
      <rect x="3.4" y="4.4" width="17.2" height="15.2" rx="1.2" />
      <circle cx="9" cy="9.4" r="1.5" />
      <path d="m4.4 17.2 5-5 3.2 3.2 2.2-2.2 4.8 4.8" />
    </>
  ),
  trash: (
    <>
      <path d="M4.2 7h15.6M9.2 7V4.4h5.6V7M6.2 7l.9 13.2h9.8L17.8 7" />
      <path d="M10 10.8v5.6M14 10.8v5.6" opacity=".6" />
    </>
  ),
  alert: (
    <>
      <path d="M10.4 4.2 2.9 17.4a1.9 1.9 0 0 0 1.6 2.8h15a1.9 1.9 0 0 0 1.6-2.8L13.6 4.2a1.9 1.9 0 0 0-3.2 0Z" />
      <path d="M12 8.4v5.2M12 17.2v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 10.8v5.4M12 7.4v.1" />
    </>
  ),
  eye: (
    <>
      <path d="M2.6 12s3.4-6.2 9.4-6.2S21.4 12 21.4 12s-3.4 6.2-9.4 6.2S2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1c.5-.1.9-.1 1.4-.1 6 0 9.4 6 9.4 6a17 17 0 0 1-3.2 3.7M6.4 7.3C3.9 8.9 2.6 12 2.6 12s3.4 6.2 9.4 6.2c1.6 0 3-.4 4.2-1" />
      <path d="M9.8 9.8a3 3 0 0 0 4.4 4.4" />
    </>
  ),
  loader: (
    <>
      <path d="M12 3.4a8.6 8.6 0 0 1 8.6 8.6" strokeWidth="2" />
      <path d="M20.6 12a8.6 8.6 0 0 1-8.6 8.6" opacity=".35" />
    </>
  ),
  spark: (
    <path
      d="M12 1.8c.85 5.1 4.3 8.55 9.4 9.4-5.1.85-8.55 4.3-9.4 9.4-.85-5.1-4.3-8.55-9.4-9.4 5.1-.85 8.55-4.3 9.4-9.4Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  feather: (
    <>
      <path d="M20 4.2C12.8 4.4 7.9 8.3 5.8 14.7L4.2 20l5.3-1.6C15.9 16.4 19.8 11.5 20 4.2Z" />
      <path d="M4.8 19.4 18.2 6" opacity=".8" />
      <path d="M8.4 14.5c2.8 0 5.3-1 7.4-2.8M11 9.6c.4-1.5 1.4-2.7 2.9-3.6" opacity=".65" />
    </>
  ),
  scroll: (
    <>
      <path d="M5 4.5h11.4A2.6 2.6 0 0 1 19 7.1V20H7.8A2.8 2.8 0 0 1 5 17.2V4.5Z" />
      <path d="M5 17.2A2.8 2.8 0 0 1 7.8 14.4H19" />
      <path d="M9 8.2h6.3M9 11.2h4.2" opacity=".6" />
    </>
  ),
  flame: (
    <path
      d="M12.2 2.4c.5 3.8-1.4 5-2.9 7-1.6 2.4-2.2 4.9-.8 7.4 1 1.8 2.4 2.9 3.5 3.4 3.4-.7 5.5-3.2 5.2-6.4-.2-2.5-1.7-4.7-3.6-6.2.2 2.2-1 3.4-1.6 2.7-1-1.3-.6-4.6.2-7.9Z"
      fill="currentColor"
      stroke="none"
      opacity=".9"
    />
  ),
  heart: (
    <path
      d="M12 20.6S3.7 15.4 3.7 9.9A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.3 3.5c0 5.5-8.3 10.7-8.3 10.7Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  bolt: (
    <path
      d="M13.3 2.2 4.6 13.6h6.2l-.9 8.2 9-12.1h-6.5l.9-7.5Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  bowl: (
    <>
      <path d="M3.2 11.2h17.6c0 4.8-3.9 8.2-8.8 8.2s-8.8-3.4-8.8-8.2Z" />
      <path d="M9.2 21.2h5.6M9.2 7.6c-1.2-1.4 1.2-2.2 0-3.8M13.4 6.8c-1.2-1.4 1.2-2.2 0-3.8" opacity=".65" />
    </>
  ),
  tag: (
    <>
      <path d="M3.2 12.4 12 3.6h7.2v7.2l-8.8 8.8a2.2 2.2 0 0 1-3.1 0l-4.1-4.1a2.2 2.2 0 0 1 0-3.1Z" />
      <circle cx="15.9" cy="7.9" r="1.1" />
    </>
  ),
  house: (
    <>
      <path d="M3.3 11.2 12 3.5l8.7 7.7" />
      <path d="M5.4 9.5V21h13.2V9.5" />
      <path d="M9.9 21v-5.8h4.2V21M4 21h16" opacity=".65" />
    </>
  ),
  mountain: (
    <>
      <path d="M2.2 20 8.8 7.4l3.5 6.1 2.4-3.7L22 20H2.2Z" />
      <path d="m6.3 12.4 2.5-4.4 2.1 3.7M13.8 11.7l.9-1.4 1 1.6" opacity=".65" />
    </>
  ),
  lantern: (
    <>
      <path d="M8.7 7.5c0-2.4 1.4-4 3.3-4s3.3 1.6 3.3 4" />
      <path d="M9.4 3.2h5.2M12 2.3v.9M7.9 7.5h8.2v2.1H7.9z" />
      <path d="M8.5 9.6h7l1 9.6c.1.9-.6 1.6-1.5 1.6H9c-.9 0-1.6-.7-1.5-1.6l1-9.6Z" />
      <path d="M7 21.5h10M8.3 13h7.4" opacity=".5" />
      <path d="M12 11.4c1.6 1.4 2.3 2.6 2.3 3.8a2.3 2.3 0 0 1-4.6 0c0-1.2.7-2.4 2.3-3.8Z" fill="currentColor" stroke="none" opacity=".55" />
    </>
  ),
  axe: (
    <>
      <path d="m13.8 11.9-8.3 8.3a2.1 2.1 0 1 1-3-3l8.3-8.3" />
      <path d="M15.1 12.9 9 6.8l4-4 6 6h3a8 8 0 0 1-7 7Z" fill="currentColor" fillOpacity=".09" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" opacity=".5" />
      <circle cx="12" cy="12" r="6.4" strokeDasharray="1 2.2" opacity=".35" />
      <path d="M12 3.8c.7 4.3 3.2 6.8 7.5 7.5-4.3.7-6.8 3.2-7.5 7.5-.7-4.3-3.2-6.8-7.5-7.5 4.3-.7 6.8-3.2 7.5-7.5Z" />
      <path d="M12 7.8c.35 2 1.6 3.25 3.8 3.6-2.2.35-3.45 1.6-3.8 3.8-.35-2.2-1.6-3.45-3.8-3.8 2.2-.35 3.45-1.6 3.8-3.6Z" fill="currentColor" stroke="none" opacity=".7" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.3" />
      <path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
    </>
  ),
  moon: <path d="M20.2 14.4A8.6 8.6 0 0 1 9.6 3.8 8.6 8.6 0 1 0 20.2 14.4Z" />,
  snow: (
    <>
      <path d="M12 2.4v19.2M3.6 7.1l16.8 9.8M20.4 7.1 3.6 16.9" />
      <path d="m9.4 4.1 2.6 2.4 2.6-2.4M9.4 19.9l2.6-2.4 2.6 2.4M4.6 9.2l3.4.5.5-3.4M19.4 14.8l-3.4-.5-.5 3.4M19.4 9.2l-3.4.5-.5-3.4M4.6 14.8l3.4-.5.5 3.4" opacity=".7" />
    </>
  ),
  leaf: (
    <>
      <path d="M20.3 3.7C13.9 3.9 8.9 7.5 6.7 13.5c-.8 2.2-.6 3.9.2 5.1 6.3-.1 11.3-3.6 13.4-9.5.7-2 .6-3.7 0-5.4Z" />
      <path d="M4.2 21c1.6-5 5.4-9.4 10.6-11.7" opacity=".75" />
    </>
  ),
  hourglass: (
    <>
      <path d="M7.2 2.9h9.6M7.2 21.1h9.6" />
      <path d="M8.3 2.9v3.1c0 1.5 1.2 2.8 3.7 5.9 2.5-3.1 3.7-4.4 3.7-5.9V2.9" />
      <path d="M8.3 21.1v-3.1c0-1.5 1.2-2.8 3.7-5.9 2.5 3.1 3.7 4.4 3.7 5.9v3.1" />
    </>
  ),
  sprig: (
    <>
      <path d="M12.4 20.5C12.8 14.9 16.4 9.2 24 3.5" opacity=".9" />
      <path d="M14.9 15.4c6.2-.8 9.8-4.6 10.7-10.9-6.3.8-10 4.6-10.7 10.9Z" fill="currentColor" stroke="none" opacity=".8" />
      <path d="M17.4 11.4c5.1-.8 8.4-3.9 9.4-9.2-5.3.8-8.6 3.9-9.4 9.2Z" fill="currentColor" stroke="none" opacity=".65" />
      <path d="M11.8 17.7C6.1 17 2.8 13.7 2.1 8c5.6.7 8.9 3.8 9.7 9.7Z" fill="currentColor" stroke="none" opacity=".7" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 4.4 5.7v6.1c0 4.6 3.2 8 7.6 9.4 4.4-1.4 7.6-4.8 7.6-9.4V5.7L12 2.8Z" />
      <path d="m8.7 11.6 2.3 2.3 4.3-4.3" opacity=".75" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V3.8" />
      <path d="M6 4.4h10.8l-1.9 3.8 1.9 3.8H6" />
    </>
  ),
  bookmark: <path d="M6.4 3.4h11.2v17.2L12 16.4l-5.6 4.2V3.4Z" />,
  edit: (
    <>
      <path d="M4.2 19.8h3.2L19.6 7.6a2.3 2.3 0 0 0-3.2-3.2L4.2 16.6v3.2Z" />
      <path d="m14.8 6 3.2 3.2" opacity=".7" />
    </>
  ),
  drag: (
    <>
      <circle cx="9" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17.6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  filter: <path d="M3.4 5.2h17.2l-6.7 7.6v5.6l-3.8 2v-7.6L3.4 5.2Z" />,
  copy: (
    <>
      <rect x="8.4" y="8.4" width="12.2" height="12.2" rx="1.4" />
      <path d="M15.6 8.4V4.8c0-.8-.6-1.4-1.4-1.4H4.8c-.8 0-1.4.6-1.4 1.4v9.4c0 .8.6 1.4 1.4 1.4h3.6" opacity=".65" />
    </>
  ),
  'external-link': (
    <>
      <path d="M13.4 4.4h6.2v6.2M19.6 4.4l-8.4 8.4" />
      <path d="M18.2 13.4v5c0 .9-.7 1.6-1.6 1.6H5.6c-.9 0-1.6-.7-1.6-1.6V7.4c0-.9.7-1.6 1.6-1.6h5" opacity=".65" />
    </>
  ),
}

const sizeClass = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
  '2xl': styles.xxl,
} as const

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'name'> {
  name: IconName
  size?: keyof typeof sizeClass
  label?: string
  strokeWidth?: number
}

export function Icon({
  name,
  size = 'md',
  label,
  strokeWidth,
  className,
  ...rest
}: IconProps) {
  const decorative = !label

  return (
    <svg
      viewBox="0 0 24 24"
      className={cx(styles.icon, sizeClass[size], className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={label}
      focusable="false"
      {...rest}
    >
      {label ? <title>{label}</title> : null}
      {icons[name]}
    </svg>
  )
}
