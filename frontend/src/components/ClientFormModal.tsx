import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Client } from '@/types';
import styles from './ClientFormModal.module.css';

export type ClientFormValues = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
};

interface Props {
  open: boolean;
  initial: Client | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => void;
}

const empty: ClientFormValues = { name: '', email: '', phone: '', company: '', address: '', notes: '' };

export default function ClientFormModal({ open, initial, saving, error, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<ClientFormValues>(empty);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(
        initial
          ? {
              name: initial.name || '',
              email: initial.email || '',
              phone: initial.phone || '',
              company: initial.company || '',
              address: initial.address || '',
              notes: initial.notes || '',
            }
          : empty
      );
      setNameError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const set = (k: keyof ClientFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setNameError('Name is required');
      return;
    }
    onSubmit({ ...values, name: values.name.trim() });
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-label="Client form">
        <div className={styles.head}>
          <h2>{initial ? 'Edit Client' : 'New Client'}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close form"><X size={18} /></button>
        </div>
        <div className={styles.grid}>
          <label className={styles.full}>Name *
            <input value={values.name} onChange={set('name')} maxLength={255} aria-label="Name" />
            {nameError && <span className={styles.err}>{nameError}</span>}
          </label>
          <label>Email<input type="email" value={values.email} onChange={set('email')} maxLength={255} aria-label="Email" /></label>
          <label>Phone<input value={values.phone} onChange={set('phone')} maxLength={50} aria-label="Phone" /></label>
          <label className={styles.full}>Company<input value={values.company} onChange={set('company')} maxLength={255} aria-label="Company" /></label>
          <label className={styles.full}>Address<textarea rows={2} value={values.address} onChange={set('address')} aria-label="Address" /></label>
          <label className={styles.full}>Notes<textarea rows={3} value={values.notes} onChange={set('notes')} aria-label="Notes" /></label>
        </div>
        {error && <div className={styles.err}>{error}</div>}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.primary} disabled={saving}>{saving ? 'Saving...' : 'Save Client'}</button>
        </div>
      </form>
    </div>
  );
}