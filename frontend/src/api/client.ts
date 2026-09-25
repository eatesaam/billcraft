import axios, { AxiosError } from 'axios';
import type {
  ClientDetail, ClientListItem, ClientPayload, Client, CreateInvoicePayload, DashboardStats,
  DeleteResult, InvoiceDetail, InvoiceListItem, InvoiceStatusResult, UpdateInvoicePayload, Invoice,
} from '../types';

// Same-origin: all routes are Next.js API routes under /api.
export const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

export function getErrorMessage(err: unknown): string {
  const e = err as AxiosError<{ error?: string; message?: string }>;
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Something went wrong';
}

export const api = {
  getDashboardStats: () => apiClient.get<DashboardStats>('/api/dashboard/stats').then((r) => r.data),
  listClients: (search?: string) =>
    apiClient.get<ClientListItem[]>('/api/clients', { params: search ? { search } : {} }).then((r) => r.data ?? []),
  getClient: (id: number | string) => apiClient.get<ClientDetail>(`/api/clients/${id}`).then((r) => r.data),
  createClient: (body: ClientPayload) => apiClient.post<Client>('/api/clients', body).then((r) => r.data),
  updateClient: (id: number | string, body: ClientPayload) =>
    apiClient.put<Client>(`/api/clients/${id}`, body).then((r) => r.data),
  deleteClient: (id: number | string) => apiClient.delete<DeleteResult>(`/api/clients/${id}`).then((r) => r.data),
  listInvoices: (params?: { status?: string; clientId?: number | string }) =>
    apiClient.get<InvoiceListItem[]>('/api/invoices', { params: params ?? {} }).then((r) => r.data ?? []),
  getInvoice: (id: number | string) => apiClient.get<InvoiceDetail>(`/api/invoices/${id}`).then((r) => r.data),
  createInvoice: (body: CreateInvoicePayload) => apiClient.post<Invoice>('/api/invoices', body).then((r) => r.data),
  updateInvoice: (id: number | string, body: UpdateInvoicePayload) =>
    apiClient.put<Invoice>(`/api/invoices/${id}`, body).then((r) => r.data),
  updateInvoiceStatus: (id: number | string, status: string) =>
    apiClient.patch<InvoiceStatusResult>(`/api/invoices/${id}/status`, { status }).then((r) => r.data),
  deleteInvoice: (id: number | string) => apiClient.delete<DeleteResult>(`/api/invoices/${id}`).then((r) => r.data),
};

export default apiClient;