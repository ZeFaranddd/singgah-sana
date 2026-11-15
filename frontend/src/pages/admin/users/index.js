import { useEffect, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import AdminPage from '../../../components/admin/AdminPage';
import { getAdminUsers } from '../../../lib/adminApi';
import { ApiError } from '../../../lib/api';
import { formatAdminDate } from '../../../lib/formatters';

const roles = [
  { label: 'Semua peran', value: '' },
  { label: 'Administrator', value: 'admin' },
  { label: 'Pemilik', value: 'pemilik' },
  { label: 'Pencari', value: 'pencari' },
];

const roleStyles = {
  admin: 'bg-violet-50 text-violet-800',
  pemilik: 'bg-sky-50 text-sky-800',
  pencari: 'bg-indigo-50 text-indigo-800',
};

const roleLabels = {
  admin: 'Administrator',
  pemilik: 'Pemilik',
  pencari: 'Pencari',
};

function isUserListResponse(result) {
  return (
    Array.isArray(result?.data) &&
    Number.isInteger(result.count) &&
    result.count === result.data.length
  );
}

function UserRole({ role }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        roleStyles[role] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {roleLabels[role] || role || 'Peran tidak tersedia'}
    </span>
  );
}

function UserList({ token, expireSession }) {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  function beginLoading() {
    setIsLoading(true);
    setErrorMessage('');
  }

  function handleReload() {
    beginLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadUsers() {
      const params = new URLSearchParams();
      if (roleFilter) {
        params.set('role', roleFilter);
      }
      if (searchQuery) {
        params.set('q', searchQuery);
      }
      const queryString = params.toString();

      try {
        const result = await getAdminUsers(queryString, token);
        if (!isUserListResponse(result)) {
          throw new Error('Format data pengguna dari backend tidak sesuai.');
        }

        if (isCurrent) {
          setUsers(result.data);
          setCount(result.count);
        }
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          expireSession();
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Daftar pengguna tidak dapat dimuat. Silakan coba kembali.'
        );
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isCurrent = false;
    };
  }, [expireSession, reloadKey, roleFilter, searchQuery, token]);

  function handleSearch(event) {
    event.preventDefault();
    const nextSearchQuery = searchInput.trim();
    if (nextSearchQuery !== searchQuery) {
      beginLoading();
    }
    setSearchQuery(nextSearchQuery);
  }

  function handleRoleChange(event) {
    if (roleFilter !== event.target.value) {
      beginLoading();
    }
    setRoleFilter(event.target.value);
  }

  function clearSearch() {
    beginLoading();
    setSearchInput('');
    setSearchQuery('');
  }

  return (
    <>
      <section
        aria-busy={isLoading}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Daftar pengguna</h2>
            <p className="mt-1 text-sm text-slate-500">
              Lihat akun pencari, pemilik, dan administrator.
            </p>
          </div>
          {count !== null && (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {count} pengguna
            </span>
          )}
        </div>

        <form
          className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"
          onSubmit={handleSearch}
        >
          <label className="relative min-w-0">
            <span className="sr-only">
              Cari nama, email, atau nomor telepon
            </span>
            <Search
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama, email, atau nomor telepon"
              type="search"
              value={searchInput}
            />
          </label>
          <label>
            <span className="sr-only">Filter peran pengguna</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              onChange={handleRoleChange}
              value={roleFilter}
            >
              {roles.map((role) => (
                <option key={role.value || 'all'} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              Cari
            </button>
            {searchQuery && (
              <button
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={clearSearch}
                type="button"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          Pencarian mencocokkan nama, email, dan nomor telepon.
        </p>

        {errorMessage && (
          <div
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p>{errorMessage}</p>
            <button
              className="font-semibold underline underline-offset-2"
              onClick={handleReload}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        )}

        <div
          aria-label="Daftar pengguna; gunakan tombol panah untuk menggulir tabel"
          className="mt-5 overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          role="region"
          tabIndex={0}
        >
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <caption className="sr-only">Daftar akun pengguna</caption>
            <thead>
              <tr className="border-y border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold" scope="col">
                  Nama / email
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Peran
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Nomor telepon
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Bergabung
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && users.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-slate-500"
                    colSpan={4}
                    role="status"
                  >
                    Memuat daftar pengguna...
                  </td>
                </tr>
              )}
              {!isLoading && !errorMessage && count === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={4}>
                    <p className="font-medium text-slate-800">
                      {searchQuery
                        ? `Tidak ada hasil pengguna untuk "${searchQuery}".`
                        : 'Tidak ada pengguna dengan filter ini.'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Coba ubah peran atau kata pencarian.
                    </p>
                  </td>
                </tr>
              )}
              {users.map((user) => {
                const initial = user.nama?.trim().charAt(0).toUpperCase();

                return (
                  <tr className="hover:bg-slate-50/70" key={user._id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                          {initial || <UserRound aria-hidden="true" size={18} />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {user.nama || 'Nama tidak tersedia'}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <UserRole role={user.role} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {user.nomor_telepon || 'Tidak tersedia'}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatAdminDate(user.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Status pembatasan akun dan aksi pemulihan belum tersedia di backend.
        Endpoint daftar pengguna juga belum menyediakan pagination.
      </p>
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminPage
      pageDescription="Lihat akun pencari, pemilik, dan administrator."
      pageTitle="Pengguna"
    >
      {({ token, expireSession }) => (
        <UserList expireSession={expireSession} token={token} />
      )}
    </AdminPage>
  );
}
