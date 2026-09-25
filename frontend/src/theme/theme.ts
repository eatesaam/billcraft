import type { InvoiceStatus } from '../types';

export const themeTokens = {
  colors: {
    primary: '#4F31E5',
    primaryLight: '#EEF2FF',
    accent: '#14B8A6',
    coral: '#F97362',
    warning: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    background: '#F7F8FC',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
  },
  gradients: {
    headerPrimary: 'var(--gradient-header-primary)',
    panelDark: 'var(--gradient-panel-dark)',
    softSurface: 'var(--gradient-soft-surface)',
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h1: { fontSize: '1.5rem', fontWeight: 700 },
    h2: { fontSize: '1.25rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem', fontWeight: 400 },
    label: { fontSize: '0.75rem', fontWeight: 500 },
  },
  radius: { md: '12px', lg: '16px' },
};

export const statusStyles: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Sent', className: 'bg-indigo-50 text-indigo-700' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-amber-50 text-amber-700' },
};

export function formatMoney(value: number | null | undefined, currency = 'USD'): string {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export default themeTokens;
