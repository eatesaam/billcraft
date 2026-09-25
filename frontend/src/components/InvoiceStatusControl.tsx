import React from 'react';
import styles from './InvoiceDetail.module.css';

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

interface Props {
  status: string;
  disabled?: boolean;
  onChange: (status: string) => void;
}

export default function InvoiceStatusControl({ status, disabled, onChange }: Props) {
  return (
    <label className={styles.noPrint} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
      Status
      <select
        aria-label="Invoice status"
        className={styles.select}
        value={status}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {INVOICE_STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
    </label>
  );
}