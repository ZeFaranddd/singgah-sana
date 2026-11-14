export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/admin/login',
      permanent: false,
    },
  };
}

export default function Home() {
  return null;
}
