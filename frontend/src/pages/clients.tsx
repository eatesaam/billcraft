import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Pencil, Trash2, Mail, Phone, Building2, X, FileText } from 'lucide-react';
import apiClient from '@/api/client';
import type { Client } from '@/types';
import ClientFormModal, { ClientFormValues } from '@/components/ClientFormModal';
import styles from './clients.module.css';

export type ClientListItem = Client & { invoiceCount: number };

type ClientInvoice = {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  status: string;
  total: number;
};
type ClientDetail = Client & { invoices: ClientInvoice[] };

export default function Clients() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/clients');
      setClients(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setError('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.email, c.company, c.phone].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [clients, search]);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (c: ClientListItem) => {
    setEditing(c);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (values: ClientFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await apiClient.put(`/api/clients/${editing.id}`, values);
      else await apiClient.post('/api/clients', values);
      setModalOpen(false);
      await load();
    } catch {
      setFormError('Could not save client.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: ClientListItem) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete ${c.name}? Linked invoices will be kept.`)) return;
    try {
      await apiClient.delete(`/api/clients/${c.id}`);
      if (detail?.id === c.id) setDetail(null);
      await load();
    } catch {
      setError('Failed to delete client.');
    }
  };

  const openDetail = async (c: ClientListItem) => {
    setDetailLoading(true);
    setDetail({ ...c, invoices: [] });
    try {
      const res = await apiClient.get(`/api/clients/${c.id}`);
      if (res?.data) setDetail({ ...res.data, invoices: Array.isArray(res.data.invoices) ? res.data.invoices : [] });
    } catch {
      /* keep basic info */
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>Manage client records linked to your invoices</p>
        </div>
        <button className={styles.primaryBtn} onClick={openCreate}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search clients"
            />
          </div>
          <span className={styles.count}>{filtered.length} clients</span>
        </div>

        {loading ? (
          <div className={styles.state}>Loading clients...</div>
        ) : error ? (
          <div className={styles.stateError}>
            {error}{' '}
            <button className={styles.linkBtn} onClick={load}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>
            <Users size={32} />
            <p>{clients.length === 0 ? 'No clients yet. Add your first client.' : 'No clients match your search.'}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th className={styles.right}>Invoices</th>
                  <th className={styles.right}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => openDetail(c)} className={styles.row}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>{(c.name || '?').charAt(0).toUpperCase()}</div>
                        <div>
                          <div className={styles.name}>{c.name}</div>
                          <div className={styles.muted}>{c.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.company || <span className={styles.muted}>—</span>}</td>
                    <td>{c.phone || <span className={styles.muted}>—</span>}</td>
                    <td className={styles.right}>
                      <span className={styles.pill}>{c.invoiceCount ?? 0}</span>
                    </td>
                    <td className={styles.right} onClick={(e) => e.stopPropagation()}>
                      <button className={styles.iconBtn} aria-label={`Edit ${c.name}`} onClick={() => openEdit(c)}>
                        <Pencil size={15} />
                      </button>
                      <button className={styles.iconBtnDanger} aria-label={`Delete ${c.name}`} onClick={() => handleDelete(c)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <div className={styles.backdrop} onClick={() => setDetail(null)}>
          <aside className={styles.drawer} onClick={(e) => e.stopPropagation()} aria-label="Client details">
            <div className={styles.drawerHeader}>
              <div className={styles.avatarLg}>{detail.name.charAt(0).toUpperCase()}</div>
              <div className={styles.drawerTitleWrap}>
                <h2 className={styles.drawerTitle}>{detail.name}</h2>
                <p className={styles.drawerSub}>{detail.company || 'Individual'}</p>
              </div>
              <button className={styles.closeBtn} aria-label="Close details" onClick={() => setDetail(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.infoRow}><Mail size={15} /> {detail.email || '—'}</div>
              <div className={styles.infoRow}><Phone size={15} /> {detail.phone || '—'}</div>
              <div className={styles.infoRow}><Building2 size={15} /> {detail.address || '—'}</div>
              {detail.notes && <div className={styles.notes}>{detail.notes}</div>}
              <h3 className={styles.sectionTitle}>Invoices</h3>
              {detailLoading ? (
                <p className={styles.muted}>Loading...</p>
              ) : detail.invoices.length === 0 ? (
                <p className={styles.muted}>No invoices for this client.</p>
              ) : (
                <ul className={styles.invList}>
                  {detail.invoices.map((inv) => (
                    <li key={inv.id}>
                      <Link href={`/invoices/${inv.id}`} className={styles.invItem}>
                        <FileText size={15} />
                        <span className={styles.invNum}>{inv.invoiceNumber}</span>
                        <span className={styles.muted}>{inv.issueDate}</span>
                        <span className={`${styles.status} ${styles[`s_${inv.status}`] || ''}`}>{inv.status}</span>
                        <span className={styles.invTotal}>{Number(inv.total || 0).toFixed(2)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      <ClientFormModal
        open={modalOpen}
        initial={editing}
        saving={saving}
        error={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}