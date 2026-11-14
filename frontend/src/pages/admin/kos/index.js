import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import AdminPage from '../../../components/admin/AdminPage';
import {
  ADMIN_KOS_PAGE_SIZE,
  isAdminKosListResponse,
} from '../../../lib/adminKos';
import { ApiError, apiDownload, apiRequest } from '../../../lib/api';
import { formatAdminDate } from '../../../lib/formatters';

const verificationStatuses = [
  { label: 'Semua status', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Terbit', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' },
];

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800',
  approved: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-rose-50 text-rose-800',
};

const statusLabels = {
  pending: 'Menunggu',
  approved: 'Terbit',
  rejected: 'Ditolak',
};

function KosStatus({ status }) {
  const label = statusLabels[status] || `Status: ${status || 'tidak diketahui'}`;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        statusStyles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {label}
    </span>
  );
}

function AllKosList({ token, expireSession }) {
  const [kosList, setKosList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    async function loadKos() {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ADMIN_KOS_PAGE_SIZE),
      });
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      if (searchQuery) {
        params.set('q', searchQuery);
      }

      try {
        const result = await apiRequest(`/admin/kos?${params.toString()}`, {
          token,
        });
        if (!isAdminKosListResponse(result)) {
          throw new Error('Format data daftar kos dari backend tidak sesuai.');
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
            : 'Daftar kos tidak dapat dimuat. Silakan coba kembali.'
        );
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadKos();

    return () => {
      isCurrent = false;
    };
  }, [expireSession, page, reloadKey, searchQuery, statusFilter, token]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  }

  function handleStatusChange(event) {
    setPage(1);
    setStatusFilter(event.target.value);
  }

  function clearSearch() {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  }

  async function handleExport() {
    setIsExporting(true);
    setExportError('');
    setExportMessage('');

    try {
      const { blob, filename } = await apiDownload('/admin/export/kos', {
        token,
      });
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = objectUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setExportMessage(`File ${filename} berhasil diunduh.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        expireSession();
        return;
      }

      setExportError(
        error instanceof Error
          ? error.message
          : 'File CSV tidak dapat diunduh. Silakan coba kembali.'
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Semua kos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Lihat listing berdasarkan status verifikasi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {pagination && (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {pagination.totalData} kos
            </span>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isExporting}
            onClick={handleExport}
            type="button"
          >
            <Download aria-hidden="true" size={17} />
            {isExporting ? 'Mengunduh...' : 'Ekspor semua CSV'}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Ekspor mencakup semua listing, tidak hanya hasil filter pada halaman ini.
      </p>

      {(exportError || exportMessage) && (
        <p
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            exportError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
          role={exportError ? 'alert' : 'status'}
        >
          {exportError || exportMessage}
        </p>
      )}

      <form
        className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"
        onSubmit={handleSearch}
      >
        <label className="relative min-w-0">
          <span className="sr-only">Cari nama kos, alamat, atau area kampus</span>
          <Search
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama, alamat, atau area kampus"
            type="search"
            value={searchInput}
          />
        </label>
        <label>
          <span className="sr-only">Filter status verifikasi</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
            onChange={handleStatusChange}
            value={statusFilter}
          >
            {verificationStatuses.map((status) => (
              <option key={status.value || 'all'} value={status.value}>
                {status.label}
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
        Pencarian mencocokkan nama kos, alamat, dan area kampus.
      </p>

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
              <th className="px-4 py-3 font-semibold">Kos</th>
              <th className="px-4 py-3 font-semibold">Pemilik</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Diperbarui</th>
              <th className="px-4 py-3 text-right font-semibold">Detail</th>
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
                  Memuat daftar kos...
                </td>
              </tr>
            )}
            {!isLoading && !errorMessage && pagination?.totalData === 0 && (
              <tr>
                <td className="px-4 py-12 text-center" colSpan={5}>
                  <p className="font-medium text-slate-800">
                    Tidak ada kos dengan filter ini.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Coba ubah status atau kata pencarian.
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
                    <p className="mt-1 text-xs text-slate-500">
                      {kos.area_kampus || kos.alamat}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
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
                  <td className="px-4 py-4">
                    <KosStatus status={kos.status_verifikasi} />
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatAdminDate(kos.updatedAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                      href={{
                        pathname: `/admin/review/${encodeURIComponent(kos._id)}`,
                        query: { source: 'all-kos' },
                      }}
                    >
                      Lihat
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
            Menampilkan {kosList.length} dari {pagination.totalData} kos
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
  );
}

export default function AllKosPage() {
  return (
    <AdminPage
      pageDescription="Lihat listing berdasarkan status verifikasi."
      pageTitle="Semua kos"
    >
      {({ token, expireSession }) => (
        <AllKosList expireSession={expireSession} token={token} />
      )}
    </AdminPage>
  );
}
