'use client';

import AdminAppPage from '../../components/admin/AdminAppPage';
import AdminDashboardContent from '../../components/admin/AdminDashboardContent';

export default function AdminDashboardPage() {
  return (
    <AdminAppPage
      pageDescription="Pantau antrean peninjauan dan hal yang membutuhkan perhatian."
      pageTitle="Ringkasan admin"
    >
      {({ token, expireSession }) => (
        <AdminDashboardContent
          expireSession={expireSession}
          token={token}
        />
      )}
    </AdminAppPage>
  );
}
