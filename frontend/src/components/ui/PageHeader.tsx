import type { ReactNode } from 'react';

export function PageHeader({ title, accent, action }: { title: string; accent?: string; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="relative pt-5">
        {accent && <span className="accent-script absolute left-2 top-0 -rotate-2 font-condiment text-3xl normal-case text-accent">{accent}</span>}
        <h1 className="font-grotesk text-4xl leading-none text-primary md:text-[40px]">{title}</h1>
      </div>
      {action}
    </header>
  );
}
