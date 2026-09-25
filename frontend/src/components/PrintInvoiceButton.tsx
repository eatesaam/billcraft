import React from 'react';
import { Printer } from 'lucide-react';
import styles from './InvoiceDetail.module.css';

export default function PrintInvoiceButton() {
  return (
    <button
      type="button"
      className={`${styles.btn} ${styles.btnPrimary} ${styles.noPrint}`}
      onClick={() => { if (typeof window !== 'undefined') window.print(); }}
    >
      <Printer size={15} /> Print
    </button>
  );
}