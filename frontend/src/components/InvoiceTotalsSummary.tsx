import React from 'react';
import styles from './InvoiceDetail.module.css';

export function formatMoney(value: number, currency: string): string {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

interface Props {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
}

export default function InvoiceTotalsSummary({ subtotal, taxRate, taxAmount, discount, total, currency }: Props) {
  return (
    <div className={styles.totals} data-testid="totals">
      <div className={styles.totalRow}><span>Subtotal</span><span>{formatMoney(subtotal, currency)}</span></div>
      <div className={styles.totalRow}><span>Tax ({Number(taxRate) || 0}%)</span><span>{formatMoney(taxAmount, currency)}</span></div>
      <div className={styles.totalRow}><span>Discount</span><span>-{formatMoney(discount, currency)}</span></div>
      <div className={`${styles.totalRow} ${styles.grand}`}><span>Total</span><span>{formatMoney(total, currency)}</span></div>
    </div>
  );
}