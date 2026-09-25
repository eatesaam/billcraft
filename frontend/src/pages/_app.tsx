import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout';
import { installErrorReporter } from '../lib/errorReporter';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  useEffect(() => { installErrorReporter(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Billcraft — Invoices made simple</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </QueryClientProvider>
  );
}