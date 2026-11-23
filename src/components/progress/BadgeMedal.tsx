import { Lock } from 'lucide-react'
import { useId } from 'react'
import type { Badge, Tier } from '@/lib/badges'
import { cn } from '@/lib/cn'

/** Each metal: the rim's light and dark, and the face's light and dark (D-058). */
const METAL: Record<Tier, { rim: [string, string]; face: [string, string] }> = {
  bronze: { rim: ['#f3c08a', '#8a4a1c'], face: ['#d98a4e', '#7a3d14'] },
  gold: { rim: ['#fff2a8', '#a8770a'], face: ['#f5c531', '#9a6a05'] },
  jade: { rim: ['#b8f5d2', '#11704a'], face: ['#3fc48a', '#0c5a3a'] },
  sapphire: { rim: ['#c9dcff', '#23408f'], face: ['#5b8cf0', '#1d2f7a'] },
}

/** A hexagon, the shape of a tortoise's shell scute, pointing up. */
function hex(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}

/**
 * A badge medal (D-058): a shell-scute hexagon with a metal rim, a domed face, the milestone's icon and a ribbon with its
 * mark. An earned medal shines: a glint sweeps across it and two sparkles twinkle (still under reduced motion). A
 * locked one is grey with a lock, the one place outside disabled controls where the app uses grey (the owner's ask).
 */
export function BadgeMedal({ badge, size = 84 }: { badge: Badge; size?: number }) {
  const id = useId().replace(/:/g, '')
  const metal = METAL[badge.tier]
  const Icon = badge.icon
  return (
    <span
      className={cn('badge-medal relative inline-block', badge.earned ? 'badge-earned' : 'badge-locked')}
      style={{ width: size, height: size * 1.08 }}
      data-tier={badge.tier}
    >
      <svg viewBox="0 0 100 108" width={size} height={size * 1.08} aria-hidden className="absolute inset-0">
        <defs>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={metal.rim[0]} />
            <stop offset="0.55" stopColor={metal.rim[1]} />
            <stop offset="1" stopColor={metal.rim[0]} />
          </linearGradient>
          <radialGradient id={`${id}-face`} cx="0.38" cy="0.3" r="0.8">
            <stop offset="0" stopColor={metal.face[0]} />
            <stop offset="1" stopColor={metal.face[1]} />
          </radialGradient>
          <clipPath id={`${id}-clip`}>
            <polygon points={hex(50, 50, 46)} />
          </clipPath>
        </defs>
        <polygon points={hex(50, 52, 46)} fill="rgb(0 0 0 / 0.22)" />
        <polygon points={hex(50, 50, 46)} fill={`url(#${id}-rim)`} />
        <polygon points={hex(50, 50, 38)} fill={`url(#${id}-face)`} />
        <polygon points={hex(50, 50, 38)} fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="1.5" />
        <path d="M 22 30 Q 50 14 78 30 L 78 34 Q 50 20 22 34 Z" fill="rgb(255 255 255 / 0.28)" />
        <g clipPath={`url(#${id}-clip)`}>
          <rect
            className="badge-glint"
            x="-60"
            y="-10"
            width="28"
            height="130"
            fill="rgb(255 255 255 / 0.55)"
          />
        </g>
        <rect
          x="24"
          y="80"
          width="52"
          height="17"
          rx="5"
          fill={metal.rim[1]}
          stroke={metal.rim[0]}
          strokeWidth="1.5"
        />
        <text
          x="50"
          y="92.5"
          textAnchor="middle"
          fontSize={badge.mark.length > 6 ? 9 : 11}
          fontWeight="700"
          fill="#fff"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {badge.mark}
        </text>
        <path
          className="badge-sparkle"
          d="M 84 14 l 2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 z"
          fill="#fff"
        />
        <path
          className="badge-sparkle badge-sparkle-late"
          d="M 14 66 l 1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6 z"
          fill="#fff"
        />
      </svg>
      <Icon
        aria-hidden
        strokeWidth={2.4}
        className={cn(
          '-translate-x-1/2 absolute left-1/2 text-white drop-shadow',
          badge.flip && 'rotate-180',
        )}
        style={{ top: size * 0.27, width: size * 0.4, height: size * 0.4 }}
      />
      {!badge.earned && (
        <span className="absolute right-0 bottom-[18%] flex size-6 items-center justify-center rounded-full bg-surface ring-1 ring-edge">
          <Lock aria-hidden className="size-3.5 text-text" strokeWidth={2.5} />
        </span>
      )}
    </span>
  )
}
