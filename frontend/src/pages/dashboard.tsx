import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Users, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import apiClient from '@/api/client';
import styles from '@/components/DashboardPage.module.css';

type DashboardStats = {
  overdueCount: number;
  recentInvoices: {
    clientName?: string | null;
    id: number;
    invoiceNumber: string;
    issueDate: string;
    status: string;
    total: number;
  }[];
  statusCounts: { cancelled: number; draft: number; overdue: number; paid: number; sent: number };
  totalBilled: number;
  totalClients: number;
  totalInvoices: number;
  totalOutstanding: number;
  totalPaid: number;
};

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

const STATUSES: (keyof DashboardStats['statusCounts'])[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/dashboard/stats');
      setStats(res?.data ?? null);
    } catch {
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className={styles.state}>Loading dashboard…</div>;
  if (error || !stats)
    return (
      <div className={styles.state}>
        <p>{error || 'No data available.'}</p>
        <button className={styles.retry} onClick={load}>Retry</button>
      </div>
    );

  const counts = stats.statusCounts || { cancelled: 0, draft: 0, overdue: 0, paid: 0, sent: 0 };
  const maxCount = Math.max(1, ...STATUSES.map((s) => counts[s] || 0));
  const kpis = [
    { label: 'Total Billed', value: money(stats.totalBilled), icon: DollarSign, tone: 'primary' },
    { label: 'Total Paid', value: money(stats.totalPaid), icon: CheckCircle, tone: 'success' },
    { label: 'Outstanding', value: money(stats.totalOutstanding), icon: Clock, tone: 'warning' },
    { label: 'Overdue', value: String(stats.overdueCount ?? 0), icon: AlertTriangle, tone: 'danger' },
    { label: 'Invoices', value: String(stats.totalInvoices ?? 0), icon: FileText, tone: 'info' },
    { label: 'Clients', value: String(stats.totalClients ?? 0), icon: Users, tone: 'secondary' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Overview of your billing activity</p>
        </div>
        <Link href="/invoices" className={styles.cta}>View Invoices</Link>
      </div>

      <div className={styles.grid}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${styles.card} ${styles[k.tone]}`}>
              <div>
                <div className={styles.label}>{k.label}</div>
                <div className={styles.value}>{k.value}</div>
              </div>
              <div className={styles.iconWrap}><Icon size={20} /></div>
            </div>
          );
        })}
      </div>

      <div className={styles.split}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Invoices by Status</h2>
          {STATUSES.map((s) => (
            <div key={s} className={styles.barRow}>
              <span className={styles.barLabel}>{s}</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${styles['bar_' + s]}`}
                  style={{ width: `${((counts[s] || 0) / maxCount) * 100}%` }}
                />
              </div>
              <span className={styles.barCount} data-testid={`count-${s}`}>{counts[s] || 0}</span>
            </div>
          ))}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Recent Invoices</h2>
          {(stats.recentInvoices || []).length === 0 ? (
            <p className={styles.muted}>No invoices yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr><th>Invoice</th><th>Client</th><th>Date</th><th>Status</th><th className={styles.right}>Total</th></tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><Link href={`/invoices/${inv.id}`} className={styles.link}>{inv.invoiceNumber}</Link></td>
                    <td>{inv.clientName || <span className={styles.muted}>No client</span>}</td>
                    <td>{inv.issueDate ? String(inv.issueDate).slice(0, 10) : '—'}</td>
                    <td><span className={`${styles.badge} ${styles['bar_' + inv.status]}`}>{inv.status}</span></td>
                    <td className={styles.right}>{money(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}