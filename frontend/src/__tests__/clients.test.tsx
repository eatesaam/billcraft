import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Clients from '@/pages/clients';
import apiClient from '@/api/client';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mocked = apiClient as unknown as {
  get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock;
};

const listRow = {
  address: '1 Main St', company: 'Acme Corp', createdAt: '2024-01-01T00:00:00Z',
  email: 'jane@acme.com', id: 1, invoiceCount: 3, name: 'Jane Doe', notes: null, phone: '555-1234',
};

describe('Clients page', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders clients from the API', async () => {
    mocked.get.mockResolvedValueOnce({ data: [listRow] });
    render(<Clients />);
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(mocked.get).toHaveBeenCalledWith('/api/clients');
  });

  it('shows error state on failure', async () => {
    mocked.get.mockRejectedValueOnce(new Error('fail'));
    render(<Clients />);
    expect(await screen.findByText(/Failed to load clients/)).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    mocked.get.mockResolvedValueOnce({ data: [] });
    render(<Clients />);
    expect(await screen.findByText(/No clients yet/)).toBeInTheDocument();
  });

  it('filters by search', async () => {
    mocked.get.mockResolvedValueOnce({ data: [listRow, { ...listRow, id: 2, name: 'Bob Smith', company: 'Other', email: 'bob@x.com' }] });
    render(<Clients />);
    await screen.findByText('Jane Doe');
    fireEvent.change(screen.getByLabelText('Search clients'), { target: { value: 'bob' } });
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('creates a client via the modal', async () => {
    mocked.get.mockResolvedValue({ data: [] });
    mocked.post.mockResolvedValueOnce({
      data: { address: null, company: null, createdAt: '2024-01-01T00:00:00Z', email: null, id: 5, name: 'New Co', notes: null, phone: null },
    });
    render(<Clients />);
    await screen.findByText(/No clients yet/);
    fireEvent.click(screen.getByText('Add Client'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Co' } });
    fireEvent.click(screen.getByText('Save Client'));
    await waitFor(() =>
      expect(mocked.post).toHaveBeenCalledWith('/api/clients', expect.objectContaining({ name: 'New Co' }))
    );
  });

  it('validates required name', async () => {
    mocked.get.mockResolvedValue({ data: [] });
    render(<Clients />);
    await screen.findByText(/No clients yet/);
    fireEvent.click(screen.getByText('Add Client'));
    fireEvent.click(screen.getByText('Save Client'));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(mocked.post).not.toHaveBeenCalled();
  });

  it('opens detail drawer with client invoices', async () => {
    mocked.get.mockImplementation((url: string) =>
      url === '/api/clients/1'
        ? Promise.resolve({
            data: {
              address: '1 Main St', company: 'Acme Corp', createdAt: '2024-01-01T00:00:00Z', email: 'jane@acme.com',
              id: 1, name: 'Jane Doe', notes: null, phone: '555-1234',
              invoices: [{ dueDate: '2024-02-01', id: 9, invoiceNumber: 'INV-0009', issueDate: '2024-01-01', status: 'paid', total: 120 }],
            },
          })
        : Promise.resolve({ data: [listRow] })
    );
    render(<Clients />);
    fireEvent.click(await screen.findByText('Jane Doe'));
    expect(await screen.findByText('INV-0009')).toBeInTheDocument();
  });

  it('deletes a client after confirm', async () => {
    mocked.get.mockResolvedValue({ data: [listRow] });
    mocked.delete.mockResolvedValueOnce({ data: { id: 1, success: true } });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Clients />);
    await screen.findByText('Jane Doe');
    fireEvent.click(screen.getByLabelText('Delete Jane Doe'));
    await waitFor(() => expect(mocked.delete).toHaveBeenCalledWith('/api/clients/1'));
  });
});