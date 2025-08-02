import './globals.css';

export const metadata = {
  title: '사고 관리 시스템',
  description: '사고 관리 및 보고 시스템',
};

import ClientLayout from '../components/ClientLayout';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ErrorBoundary>
      </body>
    </html>
  );
}
