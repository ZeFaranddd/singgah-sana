import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  UserRound,
  X,
} from 'lucide-react';
import { useRouter } from 'next/router';
import AdminPage from '../../../components/admin/AdminPage';
import {
  decideAdminKos,
  getAdminKosDetail,
} from '../../../lib/adminApi';
import { isMockAdminChangeKos } from '../../../lib/adminMockData';
import { ApiError } from '../../../lib/api';

function formatCurrency(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'Harga tidak tersedia';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

function formatChangeValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Tidak ada';
  }
  if (value === null || value === undefined || value === '') {
    return 'Tidak tersedia';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

const verificationStatusLabels = {
  pending: 'Menunggu peninjauan',
  revision: 'Perlu revisi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

const verificationStatusStyles = {
  pending: 'bg-amber-50 text-amber-800',
  revision: 'bg-orange-50 text-orange-800',
  approved: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-red-50 text-red-800',
};

const decisionActionLabels = {
  approved: 'menyetujui',
  revision: 'meminta revisi',
  rejected: 'menolak',
};

const decisionButtonLabels = {
  approved: 'Konfirmasi persetujuan',
  revision: 'Konfirmasi permintaan revisi',
  rejected: 'Konfirmasi penolakan',
};

function KosReviewDetail({ token, expireSession }) {
  const router = useRouter();
  const [kos, setKos] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [decisionIntent, setDecisionIntent] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [decisionSuccess, setDecisionSuccess] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const kosId = Array.isArray(router.query.id)
    ? router.query.id[0]
    : router.query.id;
  const returnToAllKos = router.query.source === 'all-kos';
  const backHref = returnToAllKos ? '/admin/kos' : '/admin/review';
  const backLabel = returnToAllKos ? 'Kembali ke semua kos' : 'Kembali ke antrean';

  async function submitDecision(event) {
    event.preventDefault();
    const reason = decisionNote.trim();
    if (!decisionIntent || !reason || isSubmittingDecision) {
      return;
    }

    setIsSubmittingDecision(true);
    setDecisionError('');
    setDecisionSuccess('');

    try {
      const result = await decideAdminKos(
        kosId,
        {
          status_verifikasi: decisionIntent,
          catatan_verifikasi: reason,
        },
        token,
        kos
      );

      if (result.data?.status_verifikasi !== decisionIntent) {
        setDecisionError(
          'Keputusan mungkin sudah tersimpan, tetapi respons status tidak sesuai. Muat ulang detail untuk memastikan status terbaru.'
        );
        setReloadKey((key) => key + 1);
        return;
      }

      setKos((currentKos) =>
        currentKos
          ? {
              ...currentKos,
              status_verifikasi: result.data.status_verifikasi,
              catatan_verifikasi: result.data.catatan_verifikasi,
              diverifikasi_oleh: result.data.diverifikasi_oleh,
              diverifikasi_pada: result.data.diverifikasi_pada,
              isMockDecision: Boolean(result.data.isMockDecision),
            }
          : currentKos
      );
      setDecisionIntent('');
      setDecisionNote('');
      setDecisionSuccess(result.message || 'Keputusan moderasi berhasil disimpan.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        expireSession();
        return;
      }

      setDecisionError(
        error instanceof Error
          ? error.message
          : 'Keputusan tidak dapat disimpan. Silakan coba kembali.'
      );
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    if (!kosId) {
      setErrorMessage('ID pengajuan tidak tersedia.');
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    async function loadKos() {
      try {
        const result = await getAdminKosDetail(kosId, token);
        if (!result.data || typeof result.data !== 'object') {
          throw new Error('Detail pengajuan dari backend tidak valid.');
        }

        if (isCurrent) {
          setKos(result.data);
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
            : 'Detail pengajuan tidak dapat dimuat.'
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
  }, [expireSession, kosId, reloadKey, router.isReady, token]);

  if (isLoading) {
    return (
      <p
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600"
        role="status"
      >
        Memuat detail pengajuan...
      </p>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href={backHref}
          >
            <ArrowLeft aria-hidden="true" size={16} />
            {backLabel}
          </Link>
          <button
            className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
            onClick={() => setReloadKey((key) => key + 1)}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      </section>
    );
  }

  if (!kos) {
    return null;
  }

  const owner =
    kos.pemilik ||
    (kos.pemilik_id && typeof kos.pemilik_id === 'object'
      ? kos.pemilik_id
      : null);
  const photos = Array.isArray(kos.foto) ? kos.foto : [];
  const amenities = Array.isArray(kos.fasilitas) ? kos.fasilitas : [];
  const rules = Array.isArray(kos.peraturan) ? kos.peraturan : [];
  const roomTypes = Array.isArray(kos.tipe_kamar) ? kos.tipe_kamar : [];
  const changes = Array.isArray(kos.perubahan_tertunda?.daftar_perubahan)
    ? kos.perubahan_tertunda.daftar_perubahan
    : [];
  const isMockChange = isMockAdminChangeKos(kos._id);
  const coordinates = kos.koordinat;

  return (
    <>
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700"
        href={backHref}
      >
        <ArrowLeft aria-hidden="true" size={17} />
        {backLabel}
      </Link>

      <div className="space-y-6">
        {isMockChange && (
          <p
            className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900"
            role="status"
          >
            Detail perubahan ini adalah contoh mock lokal. Data dan keputusan
            perubahan belum terhubung ke backend.
          </p>
        )}
        {kos.isMockDecision && (
          <p
            className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900"
            role="status"
          >
            Status revisi ini hanya tersimpan di sesi browser dan belum dikirim
            ke backend.
          </p>
        )}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-slate-500">
                {kos.kode ? `Kode ${kos.kode}` : `ID ${kos._id}`}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {kos.nama}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <MapPin aria-hidden="true" size={16} />
                {kos.alamat}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                verificationStatusStyles[kos.status_verifikasi] ||
                'bg-slate-100 text-slate-700'
              }`}
            >
              {verificationStatusLabels[kos.status_verifikasi] ||
                kos.status_verifikasi}
            </span>
          </div>
          {kos.status_verifikasi !== 'pending' && kos.catatan_verifikasi && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Alasan keputusan
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
                {kos.catatan_verifikasi}
              </p>
              {kos.diverifikasi_pada && (
                <p className="mt-2 text-xs text-slate-500">
                  Diputuskan pada {formatDate(kos.diverifikasi_pada)}
                </p>
              )}
            </div>
          )}
          <p className="mt-5 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
            {changes.length > 0
              ? 'Versi terbit tetap tampil di publik sampai admin menyetujui perubahan ini.'
              : 'Detail ini menampilkan data kos yang tersimpan saat ini. Backend belum menyediakan versi pembanding atau riwayat perubahan per field.'}
          </p>
        </section>

        {kos.perubahan_tertunda && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Perubahan listing tertunda</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Diajukan pada{' '}
                  {formatDate(kos.perubahan_tertunda.diajukan_pada)}
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                {kos.perubahan_tertunda.status === 'revision'
                  ? 'Perlu revisi'
                  : kos.perubahan_tertunda.status === 'rejected'
                    ? 'Ditolak'
                    : 'Menunggu'}
              </span>
            </div>

            {kos.perubahan_tertunda.catatan_pemilik && (
              <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                <span className="font-semibold">Catatan pemilik: </span>
                {kos.perubahan_tertunda.catatan_pemilik}
              </p>
            )}

            {changes.length > 0 ? (
              <div
                aria-label="Perbandingan perubahan listing; gunakan tombol panah untuk menggulir tabel"
                className="mt-5 overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                role="region"
                tabIndex={0}
              >
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Perbandingan data listing terbit dan perubahan yang diajukan
                  </caption>
                  <thead>
                    <tr className="border-y border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Bagian
                      </th>
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Data terbit
                      </th>
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Perubahan diajukan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {changes.map((change) => (
                      <tr key={change.field}>
                        <th
                          className="px-4 py-4 align-top font-semibold text-slate-800"
                          scope="row"
                        >
                          {change.label || change.field}
                        </th>
                        <td className="whitespace-pre-line px-4 py-4 align-top text-slate-600">
                          {formatChangeValue(change.lama)}
                        </td>
                        <td className="whitespace-pre-line px-4 py-4 align-top font-medium text-slate-800">
                          {formatChangeValue(change.baru)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Detail perbandingan perubahan belum tersedia.
              </p>
            )}

            {kos.perubahan_tertunda.catatan_admin && (
              <p className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-900">
                <span className="font-semibold">Catatan admin: </span>
                {kos.perubahan_tertunda.catatan_admin}
              </p>
            )}
          </section>
        )}

        {decisionSuccess && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            <p>{decisionSuccess}</p>
            <Link
              className="font-semibold underline underline-offset-2"
              href={backHref}
            >
              {backLabel}
            </Link>
          </div>
        )}

        {kos.status_verifikasi === 'pending' && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h3 className="font-semibold">Keputusan moderasi</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Setiap keputusan harus disertai alasan. Alasan akan disimpan
              bersama status verifikasi kos.
            </p>

            {!decisionIntent ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  onClick={() => setDecisionIntent('approved')}
                  type="button"
                >
                  <Check aria-hidden="true" size={17} />
                  Setujui pengajuan
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100"
                  onClick={() => setDecisionIntent('revision')}
                  type="button"
                >
                  Minta revisi
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-100"
                  onClick={() => setDecisionIntent('rejected')}
                  type="button"
                >
                  <X aria-hidden="true" size={17} />
                  Tolak pengajuan
                </button>
              </div>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={submitDecision}>
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    decisionIntent === 'rejected'
                      ? 'bg-red-50 text-red-800'
                      : decisionIntent === 'revision'
                        ? 'bg-orange-50 text-orange-800'
                        : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  Anda akan{' '}
                  {decisionActionLabels[decisionIntent]}{' '}
                  pengajuan <strong>{kos.nama}</strong>. Tulis alasan keputusan
                  sebelum melanjutkan.
                </div>
                {decisionIntent === 'revision' && (
                  <p className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                    Permintaan revisi ini adalah mock lokal untuk pengembangan;
                    status belum dikirim atau disimpan oleh backend.
                  </p>
                )}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Alasan keputusan <span aria-hidden="true">*</span>
                  </span>
                  <textarea
                    aria-required="true"
                    className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                    onChange={(event) => setDecisionNote(event.target.value)}
                    placeholder="Jelaskan alasan keputusan secara spesifik..."
                    required
                    value={decisionNote}
                  />
                </label>

                {decisionError && (
                  <p
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    role="alert"
                  >
                    {decisionError}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                      decisionIntent === 'approved'
                        ? 'bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-100'
                        : decisionIntent === 'revision'
                          ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-100'
                          : 'bg-red-700 hover:bg-red-800 focus:ring-red-100'
                    }`}
                    disabled={!decisionNote.trim() || isSubmittingDecision}
                    type="submit"
                  >
                    {isSubmittingDecision
                      ? 'Menyimpan...'
                      : decisionButtonLabels[decisionIntent]}
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    disabled={isSubmittingDecision}
                    onClick={() => {
                      setDecisionIntent('');
                      setDecisionNote('');
                      setDecisionError('');
                    }}
                    type="button"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h3 className="text-base font-semibold">Informasi kos</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
              {kos.deskripsi}
            </p>

            <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Area kampus
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {kos.area_kampus || 'Tidak tersedia'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Tipe kos
                </dt>
                <dd className="mt-1 text-sm font-medium capitalize text-slate-800">
                  {kos.tipe}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Harga per bulan
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {formatCurrency(kos.harga_mulai ?? kos.harga_per_bulan)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Luas kamar
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {kos.luas_kamar || 'Tidak tersedia'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Kamar tersedia
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {kos.jumlah_kamar_tersedia} dari {kos.jumlah_kamar_total}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Diajukan
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {formatDate(kos.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h4 className="text-sm font-semibold">Fasilitas</h4>
              {amenities.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <li
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                      key={amenity}
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Belum ada fasilitas yang dicatat.
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h4 className="text-sm font-semibold">Aturan kos</h4>
              {rules.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Belum ada aturan yang dicatat.
                </p>
              )}
            </div>

            {roomTypes.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h4 className="text-sm font-semibold">Tipe kamar</h4>
                <div className="mt-3 space-y-3">
                  {roomTypes.map((room) => (
                    <article
                      className="rounded-lg border border-slate-200 p-4"
                      key={room._id || room.nama}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h5 className="font-semibold text-slate-800">
                            {room.nama}
                          </h5>
                          <p className="mt-1 text-xs text-slate-500">
                            {room.ukuran || 'Ukuran tidak tersedia'}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatCurrency(room.harga_per_bulan)}
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-slate-600">
                        Kamar tersedia: {room.jumlah_kamar_tersedia} dari{' '}
                        {room.jumlah_kamar_total}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-semibold">Pemilik kos</h3>
              <div className="mt-4 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                  <UserRound aria-hidden="true" size={19} />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {owner?.nama || 'Informasi pemilik tidak tersedia'}
                  </p>
                  {owner?.email && (
                    <p className="mt-1 break-all text-sm text-slate-600">
                      {owner.email}
                    </p>
                  )}
                  {owner?.nomor_telepon && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Phone aria-hidden="true" size={15} />
                      {owner.nomor_telepon}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-semibold">Lokasi</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {kos.alamat}
              </p>
              {coordinates &&
                typeof coordinates.latitude === 'number' &&
                typeof coordinates.longitude === 'number' && (
                  <p className="mt-3 font-mono text-xs text-slate-500">
                    {coordinates.latitude}, {coordinates.longitude}
                  </p>
                )}
            </section>
          </aside>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Foto properti</h3>
              <p className="mt-1 text-sm text-slate-500">
                {photos.length} foto tercatat pada pengajuan.
              </p>
            </div>
          </div>
          {photos.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, index) => (
                <div
                  className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                  key={`${photo}-${index}`}
                >
                  <Image
                    alt={`Foto ${index + 1} dari ${kos.nama}`}
                    className="h-52 w-full object-cover"
                    height={520}
                    src={photo}
                    unoptimized
                    width={780}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Belum ada foto properti pada data ini.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

export default function ReviewDetailPage() {
  return (
    <AdminPage
      pageDescription="Periksa informasi kos sebelum mengambil keputusan."
      pageTitle="Detail kos"
    >
      {({ token, expireSession }) => (
        <KosReviewDetail expireSession={expireSession} token={token} />
      )}
    </AdminPage>
  );
}
