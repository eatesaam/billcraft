import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvoiceDetail from '@/pages/invoices/[id]';
import apiClient from '@/api/client';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ query: { id: '1' }, push }) }));
jest.mock('@/api/client', () => ({ __esModule: true, default: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() } }));

const mocked = apiClient as unknown as { get: jest.Mock; patch: jest.Mock; delete: jest.Mock };

const invoice = {
  client: { address: '1 Main St', company: 'Acme', email: 'a@acme.com', id: 2, name: 'Jane Doe' },
  clientId: 2,
  createdAt: '2024-01-01T00:00:00Z',
  currency: 'USD',
  discount: 10,
  dueDate: '2024-02-01',
  id: 1,
  invoiceNumber: 'INV-0001',
  issueDate: '2024-01-01',
  items: [{ amount: 200, description: 'Design work', id: 5, position: 0, quantity: 2, unitPrice: 100 }],
  notes: 'Thanks!',
  status: 'draft',
  subtotal: 200,
  taxAmount: 20,
  taxRate: 10,
  total: 210,
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => { jest.clearAllMocks(); });

test('renders invoice details', async () => {
  mocked.get.mockResolvedValue({ data: invoice });
  render(<InvoiceDetail />);
  expect(await screen.findByText('Design work')).toBeInTheDocument();
  expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  expect(screen.getByText('$210.00')).toBeInTheDocument();
  expect(mocked.get).toHaveBeenCalledWith('/api/invoices/1');
});

test('shows error when load fails', async () => {
  mocked.get.mockRejectedValue({ response: { status: 404 } });
  render(<InvoiceDetail />);
  expect(await screen.findByText('Invoice not found.')).toBeInTheDocument();
});

test('changes status via PATCH', async () => {
  mocked.get.mockResolvedValue({ data: invoice });
  mocked.patch.mockResolvedValue({ data: { id: 1, status: 'paid', updatedAt: '2024-01-02T00:00:00Z' } });
  render(<InvoiceDetail />);
  const select = await screen.findByLabelText('Invoice status');
  fireEvent.change(select, { target: { value: 'paid' } });
  await waitFor(() => expect(mocked.patch).toHaveBeenCalledWith('/api/invoices/1/status', { status: 'paid' }));
  await waitFor(() => expect((select as HTMLSelectElement).value).toBe('paid'));
});

test('deletes invoice and navigates back', async () => {
  mocked.get.mockResolvedValue({ data: invoice });
  mocked.delete.mockResolvedValue({ data: { id: 1, success: true } });
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<InvoiceDetail />);
  fireEvent.click(await screen.findByText('Delete'));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/invoices'));
});