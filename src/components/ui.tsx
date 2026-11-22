import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & Record<string, unknown>) {
  return (
    <section className={cn('rounded-2xl border border-line bg-surface p-4', className)} {...rest}>
      {children}
    </section>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'danger' }

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold',
        'disabled:cursor-not-allowed disabled:border-disabled disabled:bg-transparent disabled:text-disabled',
        variant === 'primary' && 'bg-primary text-on-primary',
        variant === 'quiet' && 'border border-primary text-primary',
        variant === 'danger' && 'border border-brick text-brick',
        className,
      )}
      {...rest}
    />
  )
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
        'rounded-xl border bg-surface px-4 py-3 text-sm',
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
    <main className="mx-auto max-w-xl px-4 pt-4 pb-28">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        {action}
      </div>
      {children}
    </main>
  )
}
