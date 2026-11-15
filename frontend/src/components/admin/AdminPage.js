import { useRouter } from 'next/router';
import useAdminSession from '../../hooks/useAdminSession';
import AdminPageView from './AdminPageView';

export default function AdminPage(props) {
  const router = useRouter();
  const session = useAdminSession(router);
  return (
    <AdminPageView
      {...props}
      pathname={router.pathname}
      session={session}
    />
  );
}
