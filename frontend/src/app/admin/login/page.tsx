import AdminLoginForm from '../../../components/admin/AdminLoginForm';

type AdminLoginPageProps = {
  searchParams: Promise<{
    expired?: string | string[];
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { expired } = await searchParams;

  return <AdminLoginForm expired={expired === '1'} />;
}
