import React, { useState } from 'react';
import { useRouter } from 'next/router';
import apiClient from '@/api/client';
import styles from './InvoiceList.module.css';

export default function NewInvoiceButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setErr(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await apiClient.post('/api/invoices', {
        issueDate: today,
        status: 'draft',
        items: [{ description: 'New item', quantity: 1, unitPrice: 0 }],
      });
      const id = res?.data?.id;
      if (id) router.push(`/invoices/${id}`);
    } catch {
      setErr('Could not create invoice');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.newWrap}>
      <button className={styles.primaryBtn} onClick={create} disabled={busy}>
        {busy ? 'Creating…' : '+ New Invoice'}
      </button>
      {err && <span className={styles.errText}>{err}</span>}
    </div>
  );
}