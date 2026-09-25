import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '@/api/client';
import InvoiceFilters, { InvoiceFilterValues } from '@/components/InvoiceFilters';
import InvoiceTable, { InvoiceListRow } from '@/components/InvoiceTable';
import NewInvoiceButton from '@/components/NewInvoiceButton';
import styles from '@/components/InvoiceList.module.css';

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InvoiceFilterValues>({ search: '', status: 'all' });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const params = filters.status !== 'all' ? { status: filters.status } : undefined;
    apiClient
      .get('/api/invoices', { params })
      .then((res) => { if (active) setInvoices(Array.isArray(res?.data) ? res.data : []); })
      .catch(() => { if (active) setError('Failed to load invoices'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters.status]);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (filters.status !== 'all' && i.status !== filters.status) return false;
      if (!q) return true;
      return (i.invoiceNumber || '').toLowerCase().includes(q) || (i.clientName || '').toLowerCase().includes(q);
    });
  }, [invoices, filters]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>Create, track and manage your invoices</p>
        </div>
        <NewInvoiceButton />
      </div>
      <div className={styles.card}>
        <InvoiceFilters value={filters} onChange={setFilters} />
        {loading ? (
          <div className={styles.state}>Loading invoices…</div>
        ) : error ? (
          <div className={`${styles.state} ${styles.errText}`}>{error}</div>
        ) : visible.length === 0 ? (
          <div className={styles.state}>No invoices found.</div>
        ) : (
          <InvoiceTable invoices={visible} />
        )}
      </div>
    </div>
  );
}