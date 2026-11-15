import { useEffect, useState } from 'react';
import {
  Activity,
  Building2,
  ClipboardCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { getAdminStats } from '../../lib/adminApi';
import { ApiError } from '../../lib/api';

type DashboardStats = {
  kos: {
    approved: number;
    pending: number;
    totalKamarTersedia: number;
    totalKamarTotal: number;
    totalKos: number;
  };
  mockRevisionCount?: number | null;
  users: {
    totalUsers: number;
  };
};

type DashboardContentProps = {
  expireSession: () => void;
  token: string;
};

type StatCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  tone: string;
  value: number | undefined;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDashboardStats(data: unknown): data is DashboardStats {
  if (!isRecord(data) || !isRecord(data.kos) || !isRecord(data.users)) {
    return false;
  }

  const { kos, users } = data;
  return (
    typeof kos.totalKos === 'number' &&
    typeof kos.pending === 'number' &&
    typeof kos.approved === 'number' &&
    typeof kos.totalKamarTersedia === 'number' &&
    typeof kos.totalKamarTotal === 'number' &&
    typeof users.totalUsers === 'number' &&
    (data.mockRevisionCount === undefined ||
      data.mockRevisionCount === null ||
      typeof data.mockRevisionCount === 'number')
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: StatCardProps) {
  const displayValue =
    typeof value === 'number'
      ? new Intl.NumberFormat('id-ID').format(value)
      : '—';

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {displayValue}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
    </article>
  );
}

export default function AdminDashboardContent({
  token,
  expireSession,
}: DashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  function handleReload() {
    setIsLoading(true);
    setErrorMessage('');
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadStats() {
      try {
        const result = await getAdminStats(token);
        const data: unknown = result.data;
        if (!isDashboardStats(data)) {
          throw new Error('Format data statistik dari backend tidak sesuai.');
        }

        if (isCurrent) {
          setStats(data);
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
            : 'Dashboard tidak dapat dimuat. Silakan coba kembali.'
        );
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      isCurrent = false;
    };
  }, [expireSession, reloadKey, token]);

  const availableRooms = stats?.kos.totalKamarTersedia;
  const totalRooms = stats?.kos.totalKamarTotal;
  const roomAvailability =
    typeof availableRooms === 'number' &&
    typeof totalRooms === 'number' &&
    totalRooms > 0
      ? Math.min(100, (availableRooms / totalRooms) * 100)
      : 0;

  return (
    <>
      {errorMessage && (
        <div
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <p>{errorMessage}</p>
          <button
            className="font-semibold underline underline-offset-2"
            onClick={handleReload}
            type="button"
          >
            Coba muat ulang
          </button>
        </div>
      )}

      <section
        aria-label="Statistik portal"
        aria-busy={isLoading}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          description="Pengajuan menunggu keputusan"
          icon={ClipboardCheck}
          label="Menunggu tinjauan"
          tone="bg-amber-50 text-amber-700"
          value={stats?.kos.pending}
        />
        <StatCard
          description="Tampil pada pencarian"
          icon={Building2}
          label="Kos terbit"
          tone="bg-emerald-50 text-emerald-700"
          value={stats?.kos.approved}
        />
        <StatCard
          description="Pencari dan pemilik terdaftar"
          icon={Users}
          label="Pengguna"
          tone="bg-indigo-50 text-indigo-700"
          value={stats?.users.totalUsers}
        />
        <StatCard
          description={
            stats
              ? `${new Intl.NumberFormat('id-ID').format(stats.kos.totalKamarTersedia)} kamar tersedia`
              : 'Statistik belum tersedia'
          }
          icon={Building2}
          label="Total kos"
          tone="bg-sky-50 text-sky-700"
          value={stats?.kos.totalKos}
        />
      </section>

      {typeof stats?.mockRevisionCount === 'number' &&
        stats.mockRevisionCount > 0 && (
          <p
            className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900"
            role="status"
          >
            Jumlah pending dikurangi {stats.mockRevisionCount} permintaan revisi
            mock dari sesi browser ini; perubahan belum dikirim ke backend.
          </p>
        )}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Ketersediaan kamar</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ringkasan jumlah kamar dari seluruh listing.
              </p>
            </div>
            <Building2 aria-hidden="true" className="text-slate-400" size={20} />
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            {stats ? (
              <>
                <span className="text-3xl font-bold">
                  {new Intl.NumberFormat('id-ID').format(
                    stats.kos.totalKamarTersedia
                  )}
                </span>
                <span className="text-sm text-slate-500">
                  dari{' '}
                  {new Intl.NumberFormat('id-ID').format(
                    stats.kos.totalKamarTotal
                  )}{' '}
                  kamar
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500" role="status">
                {isLoading ? 'Memuat statistik...' : 'Statistik belum tersedia'}
              </span>
            )}
          </div>
          {stats && (
            <div
              aria-label="Proporsi kamar tersedia"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={roomAvailability}
              className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: `${roomAvailability}%` }}
              />
            </div>
          )}
          {isLoading && stats && (
            <p className="mt-3 text-xs text-slate-500" role="status">
              Memperbarui statistik...
            </p>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Activity aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="font-semibold">Aktivitas terbaru</h2>
              <p className="mt-1 text-sm text-slate-500">
                Riwayat keputusan admin
              </p>
            </div>
          </div>
          <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            Riwayat aktivitas belum tersedia dari API backend.
          </p>
        </article>
      </section>

      <p className="mt-6 text-xs leading-5 text-slate-500">
        Ringkasan laporan belum ditampilkan karena backend belum menyediakan API
        pengelolaan laporan.
      </p>
    </>
  );
}
