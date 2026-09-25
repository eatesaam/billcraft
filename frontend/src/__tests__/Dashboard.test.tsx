import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '@/pages/dashboard';
import apiClient from '@/api/client';

jest.mock('@/api/client', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href, ...p }: any) => <span data-href={href} {...p}>{children}</span> }));

const mockGet = (apiClient as any).get as jest.Mock;

const stats = {
  overdueCount: 2,
  recentInvoices: [
    { clientName: 'Acme Corp', id: 1, invoiceNumber: 'INV-0001', issueDate: '2024-05-01', status: 'paid', total: 1200 },
  ],
  statusCounts: { cancelled: 0, draft: 1, overdue: 2, paid: 3, sent: 4 },
  totalBilled: 5000,
  totalClients: 7,
  totalInvoices: 10,
  totalOutstanding: 1800,
  totalPaid: 3200,
};

describe('Dashboard page', () => {
  beforeEach(() => mockGet.mockReset());

  it('renders stats from the API', async () => {
    mockGet.mockResolvedValueOnce({ data: stats });
    render(<Dashboard />);
    expect(await screen.findByText('INV-0001')).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith('/api/dashboard/stats');
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByTestId('count-sent')).toHaveTextContent('4');
  });

  it('shows error and retries on click', async () => {
    mockGet.mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({ data: stats });
    render(<Dashboard />);
    expect(await screen.findByText('Failed to load dashboard statistics.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByText('INV-0001')).toBeInTheDocument());
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});