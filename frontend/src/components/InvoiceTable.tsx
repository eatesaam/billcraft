import React from 'react';
import { useRouter } from 'next/router';
import type { Invoice } from '@/types';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import styles from './InvoiceList.module.css';

export type InvoiceListRow = Pick<Invoice, 'id' | 'invoiceNumber' | 'clientId' | 'issueDate' | 'dueDate' | 'status' | 'currency' | 'total'> & { clientName?: string | null };

export function formatMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(n) || 0);
  } catch {
    return `${currency} ${(Number(n) || 0).toFixed(2)}`;
  }
}

export default function InvoiceTable({ invoices }: { invoices: InvoiceListRow[] }) {
  const router = useRouter();
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Invoice</th><th>Client</th><th>Issued</th><th>Due</th><th>Status</th><th className={styles.right}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className={styles.row} onClick={() => router.push(`/invoices/${inv.id}`)}>
              <td className={styles.bold}>{inv.invoiceNumber}</td>
              <td>{inv.clientName || <span className={styles.muted}>No client</span>}</td>
              <td>{String(inv.issueDate ?? '').slice(0, 10)}</td>
              <td>{inv.dueDate ? String(inv.dueDate).slice(0, 10) : <span className={styles.muted}>—</span>}</td>
              <td><InvoiceStatusBadge status={inv.status} /></td>
              <td className={`${styles.right} ${styles.bold}`}>{formatMoney(inv.total, inv.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}