export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

export interface Client {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface InvoiceItem {
  id: number;
  invoiceId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  position: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  clientId?: number | null;
  issueDate: string;
  dueDate?: string | null;
  status: InvoiceStatus | string;
  currency: string;
  taxRate: number;
  discount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

export interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  clientName?: string | null;
  issueDate: string;
  status: string;
  total: number;
}

export interface DashboardStats {
  overdueCount: number;
  recentInvoices: RecentInvoice[];
  statusCounts: Record<InvoiceStatus, number>;
  totalBilled: number;
  totalClients: number;
  totalInvoices: number;
  totalOutstanding: number;
  totalPaid: number;
}

export interface ClientListItem extends Client { invoiceCount: number; }

export interface ClientInvoiceSummary {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  status: string;
  total: number;
}

export interface ClientDetail extends Client { invoices: ClientInvoiceSummary[]; }

export interface ClientPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string;
  clientId?: number | null;
  clientName?: string | null;
  currency: string;
  issueDate: string;
  dueDate?: string | null;
  status: string;
  total: number;
}

export interface InvoiceItemInput { description: string; quantity: number; unitPrice: number; }

export interface CreateInvoicePayload {
  clientId?: number | null;
  currency?: string;
  discount?: number;
  dueDate?: string | null;
  invoiceNumber?: string;
  issueDate: string;
  items: InvoiceItemInput[];
  notes?: string | null;
  status?: string;
  taxRate?: number;
}

export interface UpdateInvoicePayload {
  clientId?: number | null;
  currency: string;
  discount: number;
  dueDate?: string | null;
  invoiceNumber: string;
  issueDate: string;
  items: InvoiceItemInput[];
  notes?: string | null;
  status: string;
  taxRate: number;
}

export interface InvoiceClientSummary {
  id: number;
  name: string;
  email?: string | null;
  company?: string | null;
  address?: string | null;
}

export interface InvoiceDetail extends Invoice {
  client?: InvoiceClientSummary | null;
  items: InvoiceItem[];
}

export interface InvoiceStatusResult { id: number; status: string; updatedAt: string; }
export interface DeleteResult { id: number; success: boolean; }