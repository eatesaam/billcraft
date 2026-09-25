import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Invoices from '@/pages/invoices';
import apiClient from '@/api/client';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/api/client', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));

const mocked = apiClient as unknown as { get: jest.Mock; post: jest.Mock };

const rows = [
  { clientId: 1, clientName: 'Acme Corp', currency: 'USD', dueDate: '2024-02-01', id: 1, invoiceNumber: 'INV-001', issueDate: '2024-01-01', status: 'paid', total: 1200 },
  { clientId: null, clientName: null, currency: 'USD', dueDate: null, id: 2, invoiceNumber: 'INV-002', issueDate: '2024-01-05', status: 'draft', total: 300 },
];

beforeEach(() => { jest.clearAllMocks(); });

test('renders invoices list', async () => {
  mocked.get.mockResolvedValue({ data: rows });
  render(<Invoices />);
  expect(screen.getByText('Loading invoices…')).toBeInTheDocument();
  expect(await screen.findByText('INV-001')).toBeInTheDocument();
  expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  expect(screen.getByText('No client')).toBeInTheDocument();
});

test('filters by search text', async () => {
  mocked.get.mockResolvedValue({ data: rows });
  render(<Invoices />);
  await screen.findByText('INV-001');
  fireEvent.change(screen.getByLabelText('Search invoices'), { target: { value: 'acme' } });
  expect(screen.getByText('INV-001')).toBeInTheDocument();
  expect(screen.queryByText('INV-002')).not.toBeInTheDocument();
});

test('row click navigates to detail', async () => {
  mocked.get.mockResolvedValue({ data: rows });
  render(<Invoices />);
  fireEvent.click(await screen.findByText('INV-002'));
  expect(push).toHaveBeenCalledWith('/invoices/2');
});

test('shows error state', async () => {
  mocked.get.mockRejectedValue(new Error('x'));
  render(<Invoices />);
  expect(await screen.findByText('Failed to load invoices')).toBeInTheDocument();
});

test('new invoice button creates and navigates', async () => {
  mocked.get.mockResolvedValue({ data: [] });
  mocked.post.mockResolvedValue({ data: { id: 9, invoiceNumber: 'INV-009', status: 'draft' } });
  render(<Invoices />);
  await screen.findByText('No invoices found.');
  fireEvent.click(screen.getByText('+ New Invoice'));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/invoices/9'));
  expect(mocked.post).toHaveBeenCalledWith('/api/invoices', expect.objectContaining({ status: 'draft' }));
});