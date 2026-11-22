import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** A glass panel (D-048). `tone` colours its edge: a done card, a danger zone. */
export function Card({
  children,
  className,
  tone,
  ...rest
}: { children: ReactNode; className?: string; tone?: 'primary' | 'brick' } & Record<string, unknown>) {
  return (
    <section
      className={cn(
        'glass rounded-2xl border p-4',
        tone === 'primary' ? 'border-primary' : tone === 'brick' ? 'border-brick' : 'border-edge',
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  )
}

type Variant = 'primary' | 'quiet' | 'danger'
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

/** A button's look, shared with links that act as buttons. */
export function buttonClass(variant: Variant = 'primary', className?: string) {
  return cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold',
    'transition-transform duration-150 active:scale-[0.97]',
    'disabled:cursor-not-allowed disabled:border-disabled disabled:bg-transparent disabled:text-disabled',
    'disabled:shadow-none disabled:active:scale-100',
    variant === 'primary' && 'button-primary bg-primary text-on-primary',
    variant === 'quiet' && 'border border-primary bg-field text-primary',
    variant === 'danger' && 'border border-brick bg-field text-brick',
    className,
  )
}

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />
}

export function Banner({
  tone = 'sky',
  children,
}: {
  tone?: 'sky' | 'shell' | 'brick' | 'primary'
  children: ReactNode
}) {
  return (
    <div
      role="status"
      className={cn(
        'glass-strong rounded-xl border px-4 py-3 text-sm',
        tone === 'sky' && 'border-sky',
        tone === 'shell' && 'border-shell',
        tone === 'brick' && 'border-brick',
        tone === 'primary' && 'border-primary',
      )}
    >
      {children}
    </div>
  )
}

export function Screen({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <main className="animate-rise mx-auto max-w-xl px-4 pt-4 pb-32">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-primary">{title}</h1>
        {action}
      </div>
      {children}
    </main>
  )
}
