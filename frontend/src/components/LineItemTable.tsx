import React from 'react';
import styles from './InvoiceDetail.module.css';
import { formatMoney } from './InvoiceTotalsSummary';
import type { InvoiceItem } from '@/types';

type Row = Pick<InvoiceItem, 'id' | 'description' | 'quantity' | 'unitPrice' | 'amount' | 'position'>;

export default function LineItemTable({ items, currency }: { items: Row[]; currency: string }) {
  const sorted = [...(items || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Description</th>
            <th className={styles.right}>Qty</th>
            <th className={styles.right}>Unit price</th>
            <th className={styles.right}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={4} className={styles.muted}>No line items</td></tr>
          ) : sorted.map((it) => (
            <tr key={it.id}>
              <td>{it.description}</td>
              <td className={styles.right}>{Number(it.quantity)}</td>
              <td className={styles.right}>{formatMoney(it.unitPrice, currency)}</td>
              <td className={styles.right}><strong>{formatMoney(it.amount, currency)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}