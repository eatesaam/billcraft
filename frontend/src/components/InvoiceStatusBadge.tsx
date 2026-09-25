import React from 'react';
import styles from './InvoiceStatusBadge.module.css';

export default function InvoiceStatusBadge({ status }: { status: string }) {
  const key = ['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status) ? status : 'draft';
  return (
    <span className={`${styles.badge} ${styles[key]}`} data-testid="status-badge">
      {status}
    </span>
  );
}