import React from 'react';
import styles from './InvoiceDetail.module.css';
import LineItemTable from './LineItemTable';
import InvoiceTotalsSummary from './InvoiceTotalsSummary';
import type { Invoice, InvoiceItem, Client } from '@/types';

export type InvoiceDetailData = Pick<Invoice,
  'id' | 'invoiceNumber' | 'clientId' | 'issueDate' | 'dueDate' | 'status' | 'currency' |
  'taxRate' | 'discount' | 'subtotal' | 'taxAmount' | 'total' | 'notes' | 'createdAt' | 'updatedAt'> & {
  client?: Pick<Client, 'id' | 'name' | 'email' | 'company' | 'address'> | null;
  items: Pick<InvoiceItem, 'id' | 'description' | 'quantity' | 'unitPrice' | 'amount' | 'position'>[];
};

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(String(d));
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function InvoicePreview({ invoice }: { invoice: InvoiceDetailData }) {
  const c = invoice.client;
  const statusCls = (styles as Record<string, string>)[invoice.status] || styles.draft;
  return (
    <div className={styles.card} data-testid="invoice-preview">
      <div className={styles.previewHead}>
        <div>
          <div className={styles.brand}>Billcraft</div>
          <p className={styles.muted}>Invoice {invoice.invoiceNumber}</p>
          <span className={`${styles.badge} ${statusCls}`}>{invoice.status}</span>
        </div>
        <div>
          <div className={styles.label}>Bill to</div>
          {c ? (
            <>
              <div className={styles.strong}>{c.name}</div>
              {c.company && <p className={styles.muted}>{c.company}</p>}
              {c.email && <p className={styles.muted}>{c.email}</p>}
              {c.address && <p className={styles.muted}>{c.address}</p>}
            </>
          ) : <p className={styles.muted}>No client assigned</p>}
        </div>
      </div>
      <div className={styles.meta}>
        <div><div className={styles.label}>Invoice #</div><div className={styles.strong}>{invoice.invoiceNumber}</div></div>
        <div><div className={styles.label}>Issue date</div><div>{fmtDate(invoice.issueDate as unknown as string)}</div></div>
        <div><div className={styles.label}>Due date</div><div>{fmtDate(invoice.dueDate as unknown as string)}</div></div>
        <div><div className={styles.label}>Currency</div><div>{invoice.currency}</div></div>
      </div>
      <LineItemTable items={invoice.items || []} currency={invoice.currency} />
      <InvoiceTotalsSummary
        subtotal={invoice.subtotal}
        taxRate={invoice.taxRate}
        taxAmount={invoice.taxAmount}
        discount={invoice.discount}
        total={invoice.total}
        currency={invoice.currency}
      />
      {invoice.notes && (
        <div className={styles.notes}>
          <div className={styles.label}>Notes</div>
          <p className={styles.muted}>{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}