import apiClient, { apiClient as named, api, getErrorMessage } from '../api/client';

describe('api client', () => {
  it('exports same instance with empty baseURL', () => {
    expect(apiClient).toBe(named);
    expect(apiClient.defaults.baseURL).toBe('');
  });

  it('calls dashboard stats endpoint', async () => {
    const spy = jest.spyOn(apiClient, 'get').mockResolvedValue({
      data: { overdueCount: 1, recentInvoices: [], statusCounts: { draft: 0, sent: 0, paid: 0, overdue: 1, cancelled: 0 }, totalBilled: 10, totalClients: 2, totalInvoices: 1, totalOutstanding: 10, totalPaid: 0 },
    } as any);
    const res = await api.getDashboardStats();
    expect(spy).toHaveBeenCalledWith('/api/dashboard/stats');
    expect(res.overdueCount).toBe(1);
    spy.mockRestore();
  });

  it('extracts error messages', () => {
    expect(getErrorMessage({ response: { data: { error: 'Not found' } } })).toBe('Not found');
    expect(getErrorMessage({})).toBe('Something went wrong');
  });
});