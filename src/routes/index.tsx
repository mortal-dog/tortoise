import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Today,
})

function Today() {
  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-primary">Tortoise</h1>
      <p className="mt-2">Slow and steady, to 99.</p>
    </main>
  )
}
