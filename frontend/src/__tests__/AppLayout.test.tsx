import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppLayout from '../components/layout/AppLayout';

jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/invoices' }) }));

describe('AppLayout', () => {
  it('renders brand and nav links with active state', () => {
    render(<AppLayout><p>content</p></AppLayout>);
    expect(screen.getAllByText('Billcraft').length).toBeGreaterThan(0);
    expect(screen.getByText('content')).toBeInTheDocument();
    const active = screen.getAllByRole('link', { name: /Invoices/ })[0];
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link', { name: /Clients/ })[0]).toHaveAttribute('href', '/clients');
  });

  it('opens and closes mobile drawer', () => {
    render(<AppLayout><p>x</p></AppLayout>);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByTestId('backdrop')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close menu'));
    expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument();
  });
});