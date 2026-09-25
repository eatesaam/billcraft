import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, FileText, Users, Menu, X, Receipt } from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Clients', href: '/clients', icon: Users },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const path = router?.pathname || '';

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'var(--gradient-header-primary)' }}>
          <Receipt size={18} />
        </span>
        <span className="text-lg font-bold text-ink">Billcraft</span>
      </div>
      <ul className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-primary-light text-primary' : 'text-muted hover:bg-canvas hover:text-ink'
                }`}
              >
                <Icon size={18} /> {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="m-3 flex items-center gap-3 rounded-lg border border-line p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">BC</span>
        <div className="text-xs"><div className="font-semibold text-ink">Billing Team</div><div className="text-muted">Owner</div></div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-white lg:block">{nav}</aside>
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <span className="font-bold text-ink">Billcraft</span>
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-canvas"><Menu size={20} /></button>
      </header>
      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} data-testid="backdrop" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded p-1 hover:bg-canvas"><X size={18} /></button>
            {nav}
          </aside>
        </div>
      )}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}