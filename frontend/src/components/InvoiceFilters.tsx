import React from 'react';
import styles from './InvoiceList.module.css';

export interface InvoiceFilterValues { search: string; status: string; }

const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'];

export default function InvoiceFilters({ value, onChange }: { value: InvoiceFilterValues; onChange: (v: InvoiceFilterValues) => void }) {
  return (
    <div className={styles.toolbar}>
      <input
        className={styles.search}
        placeholder="Search by number or client…"
        aria-label="Search invoices"
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
      />
      <select
        className={styles.select}
        aria-label="Filter by status"
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value })}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
    </div>
  );
}