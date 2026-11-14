import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import AdminPage from '../../../components/admin/AdminPage';
import {
  ADMIN_KOS_PAGE_SIZE,
  isAdminKosListResponse,
} from '../../../lib/adminKos';
import { ApiError, apiRequest } from '../../../lib/api';
import { formatAdminDate } from '../../../lib/formatters';

function ReviewQueue({ token, expireSession }) {
  const [kosList, setKosList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    async function loadQueue() {
      const params = new URLSearchParams({
        status: 'pending',
        page: String(page),
        limit: String(ADMIN_KOS_PAGE_SIZE),
      });
      if (searchQuery) {
        params.set('q', searchQuery);
      }

      try {
        const result = await apiRequest(`/admin/kos?${params.toString()}`, {
          token,
        });
        if (!isAdminKosListResponse(result)) {
          throw new Error('Format data antrean dari backend tidak sesuai.');
        }

        if (isCurrent) {
          setKosList(result.data);
          setPagination(result.pagination);
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
            : 'Antrean tidak dapat dimuat. Silakan coba kembali.'
        );
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadQueue();

    return () => {
      isCurrent = false;
    };
  }, [expireSession, page, reloadKey, searchQuery, token]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Antrean peninjauan</h2>
              {pagination && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  Menunggu ({pagination.totalData})
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Pengajuan kos berstatus pending. Dahulukan pengajuan paling lama.
            </p>
          </div>
        </div>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={handleSearch}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Cari nama kos, alamat, atau area kampus</span>
            <Search
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama kos, alamat, atau area kampus"
              type="search"
              value={searchInput}
            />
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

        {errorMessage && (
          <div
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p>{errorMessage}</p>
            <button
              className="font-semibold underline underline-offset-2"
              onClick={() => setReloadKey((key) => key + 1)}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Kos / pengajuan</th>
                <th className="px-4 py-3 font-semibold">Pemilik</th>
                <th className="px-4 py-3 font-semibold">Tipe</th>
                <th className="px-4 py-3 font-semibold">Dikirim</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && kosList.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-slate-500"
                    colSpan={5}
                    role="status"
                  >
                    Memuat antrean...
                  </td>
                </tr>
              )}
              {!isLoading && !errorMessage && pagination?.totalData === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={5}>
                    <p className="font-medium text-slate-800">
                      Tidak ada pengajuan yang menunggu.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Pengajuan baru akan muncul di antrean ini.
                    </p>
                  </td>
                </tr>
              )}
              {kosList.map((kos) => {
                const owner =
                  kos.pemilik_id && typeof kos.pemilik_id === 'object'
                    ? kos.pemilik_id
                    : null;

                return (
                  <tr className="hover:bg-slate-50/70" key={kos._id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{kos.nama}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        ID {kos._id}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">
                        {owner?.nama || 'Pemilik tidak tersedia'}
                      </p>
                      {owner?.email && (
                        <p className="mt-1 text-xs text-slate-500">
                          {owner.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 capitalize text-slate-700">
                      {kos.tipe}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatAdminDate(kos.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                        href={`/admin/review/${encodeURIComponent(kos._id)}`}
                      >
                        Tinjau
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalData > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Menampilkan {kosList.length} dari {pagination.totalData} pengajuan
            </p>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => current - 1)}
                type="button"
              >
                Sebelumnya
              </button>
              <span className="px-2 text-sm text-slate-600">
                Halaman {pagination.currentPage} dari {pagination.totalPages}
              </span>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page >= pagination.totalPages || isLoading}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Backend saat ini belum membedakan pengajuan listing baru dan perubahan
        listing.
      </p>
    </>
  );
}

export default function ReviewQueuePage() {
  return (
    <AdminPage
      pageDescription="Periksa pengajuan kos yang menunggu keputusan."
      pageTitle="Peninjauan"
    >
      {({ token, expireSession }) => (
        <ReviewQueue expireSession={expireSession} token={token} />
      )}
    </AdminPage>
  );
}
