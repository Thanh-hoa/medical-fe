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
      <header className="relative overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white px-6 py-5 shadow-[0_14px_32px_-28px_rgba(15,23,42,0.42)] md:flex md:items-end md:justify-between">
        <div className="absolute inset-y-0 left-0 w-1 bg-[#2563EB]" />
        <div className="space-y-2 pl-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2563EB]">MED-OCR workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {description ? <p className="max-w-2xl text-sm text-[#64748B]">{description}</p> : null}
        </div>
        {actions ? <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}
