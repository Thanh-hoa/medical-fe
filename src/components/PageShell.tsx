import type { PropsWithChildren, ReactNode } from 'react'

export default function PageShell({
  title,
  description,
  actions,
  children,
}: PropsWithChildren<{
  title: string
  description?: string
  actions?: ReactNode
}>) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {description ? <p className="max-w-2xl text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}
