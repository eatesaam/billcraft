import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Trash2 } from 'lucide-react';
import apiClient from '@/api/client';
import styles from '@/components/InvoiceDetail.module.css';
import InvoicePreview, { InvoiceDetailData } from '@/components/InvoicePreview';
import InvoiceStatusControl from '@/components/InvoiceStatusControl';
import PrintInvoiceButton from '@/components/PrintInvoiceButton';

export default function InvoiceDetail() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/invoices/${id}`);
      const data = res?.data;
      if (!data || typeof data !== 'object') throw new Error('Invalid response');
      setInvoice({ ...data, items: Array.isArray(data.items) ? data.items : [] });
    } catch (e: any) {
      setError(e?.response?.status === 404 ? 'Invoice not found.' : 'Failed to load invoice.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (status: string) => {
    if (!invoice) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await apiClient.patch(`/api/invoices/${invoice.id}/status`, { status });
      const d = res?.data || {};
      setInvoice({ ...invoice, status: d.status ?? status, updatedAt: d.updatedAt ?? invoice.updatedAt });
    } catch {
      setActionError('Failed to update status.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!invoice) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this invoice?')) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiClient.delete(`/api/invoices/${invoice.id}`);
      router.push('/invoices');
    } catch {
      setActionError('Failed to delete invoice.');
      setBusy(false);
    }
  };

  if (loading) return <div className={styles.state}>Loading invoice…</div>;
  if (error || !invoice) {
    return (
      <div className={styles.state}>
        <p className={styles.error}>{error || 'Invoice not found.'}</p>
        <Link href="/invoices" className={styles.back}>← Back to invoices</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.topRow} ${styles.noPrint}`}>
        <div>
          <Link href="/invoices" className={styles.back}>← Back to invoices</Link>
          <h1 className={styles.title}>Invoice {invoice.invoiceNumber}</h1>
        </div>
        <div className={styles.actions}>
          <InvoiceStatusControl status={invoice.status} disabled={busy} onChange={changeStatus} />
          <PrintInvoiceButton />
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={remove} disabled={busy}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>
      {actionError && <p className={styles.error} role="alert">{actionError}</p>}
      <InvoicePreview invoice={invoice} />
    </div>
  );
}