import { apiDownload, apiRequest } from './api';
import {
  isMockAdminChangeKos,
  mockChangeKosDetail,
  mockChangeQueueItem,
} from './adminMockData';

const MOCK_KOS_DECISIONS_KEY = 'singgah-sana:admin:mock-kos-decisions';

function shouldUseAdminV1Api() {
  return (
    process.env.NODE_ENV !== 'development' ||
    process.env.NEXT_PUBLIC_ADMIN_V1_API === 'true'
  );
}

function readMockKosDecisions() {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedDecisions = window.sessionStorage.getItem(
    MOCK_KOS_DECISIONS_KEY
  );
  if (!storedDecisions) {
    return [];
  }

  let decisions;
  try {
    decisions = JSON.parse(storedDecisions);
  } catch {
    throw new Error(
      'Data mock moderasi lokal rusak. Tutup tab ini untuk menghapus sesi mock, lalu coba lagi.'
    );
  }

  if (
    !Array.isArray(decisions) ||
    decisions.some(
      (decision) =>
        !decision ||
        typeof decision.kos?._id !== 'string' ||
        decision.kos.status_verifikasi !== 'revision'
    )
  ) {
    throw new Error(
      'Format data mock moderasi lokal tidak valid. Tutup tab ini untuk menghapus sesi mock, lalu coba lagi.'
    );
  }

  return decisions;
}

function saveMockKosDecisions(decisions) {
  if (typeof window === 'undefined') {
    throw new Error('Mock moderasi hanya dapat digunakan di browser.');
  }

  window.sessionStorage.setItem(
    MOCK_KOS_DECISIONS_KEY,
    JSON.stringify(decisions)
  );
}

function matchesKosSearch(kos, query) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLocaleLowerCase('id-ID');
  return [kos.nama, kos.alamat, kos.area_kampus].some((value) =>
    String(value || '')
      .toLocaleLowerCase('id-ID')
      .includes(normalizedQuery)
  );
}

function applyMockDecision(kos, decisions) {
  return decisions.find((decision) => decision.kos._id === kos._id)?.kos || kos;
}

function pageMockResults(kosList, page, limit) {
  const totalData = kosList.length;
  const start = (page - 1) * limit;
  return {
    count: Math.min(limit, Math.max(0, totalData - start)),
    data: kosList.slice(start, start + limit),
    pagination: {
      currentPage: page,
      limit,
      totalData,
      totalPages: Math.ceil(totalData / limit),
    },
  };
}

export function loginAdmin({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getAdminSession(token) {
  return apiRequest('/auth/me', { token });
}

export async function getAdminStats(token) {
  const result = await apiRequest('/admin/stats', { token });
  if (shouldUseAdminV1Api()) {
    return result;
  }

  const mockRevisionCount = readMockKosDecisions().length;
  if (!mockRevisionCount || typeof result.data?.kos?.pending !== 'number') {
    return result;
  }

  return {
    ...result,
    data: {
      ...result.data,
      mockRevisionCount,
      kos: {
        ...result.data.kos,
        pending: Math.max(0, result.data.kos.pending - mockRevisionCount),
      },
    },
  };
}

export async function getAdminKos(queryString, token) {
  const result = await apiRequest(
    `/admin/kos${queryString ? `?${queryString}` : ''}`,
    { token }
  );
  if (shouldUseAdminV1Api()) {
    return result;
  }

  const decisions = readMockKosDecisions();
  if (decisions.length === 0) {
    return result;
  }

  const params = new URLSearchParams(queryString);
  const status = params.get('status') || '';
  const query = params.get('q') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = Math.max(1, Number(params.get('limit')) || 15);

  if (status === 'revision') {
    const mockKos = decisions
      .map((decision) => decision.kos)
      .filter((kos) => matchesKosSearch(kos, query))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
      );
    return { ...result, ...pageMockResults(mockKos, page, limit) };
  }

  const data = result.data.map((kos) => applyMockDecision(kos, decisions));
  if (status !== 'pending') {
    return { ...result, count: data.length, data };
  }

  const pendingKos = data.filter((kos) => kos.status_verifikasi === 'pending');
  const removedFromPendingCount = decisions.filter((decision) =>
    matchesKosSearch(decision.kos, query)
  ).length;
  const totalData = Math.max(
    0,
    result.pagination.totalData - removedFromPendingCount
  );

  return {
    ...result,
    count: pendingKos.length,
    data: pendingKos,
    pagination: {
      ...result.pagination,
      totalData,
      totalPages: Math.ceil(totalData / limit),
    },
  };
}

function filterModerationQueue(items, query) {
  if (!query) {
    return items;
  }

  const normalizedQuery = query.toLocaleLowerCase('id-ID');
  return items.filter((item) =>
    [
      item.kos.kode,
      item.kos.nama,
      item.pemilik.kode,
      item.pemilik.nama,
    ].some((value) =>
      String(value || '')
        .toLocaleLowerCase('id-ID')
        .includes(normalizedQuery)
    )
  );
}

function mapPendingKosToQueueItem(kos) {
  const owner =
    kos.pemilik_id && typeof kos.pemilik_id === 'object'
      ? kos.pemilik_id
      : null;

  return {
    jenis: 'listing_baru',
    kos: {
      _id: kos._id,
      ...(kos.kode ? { kode: kos.kode } : {}),
      nama: kos.nama,
    },
    pemilik: {
      _id: owner?._id || (typeof kos.pemilik_id === 'string' ? kos.pemilik_id : ''),
      ...(owner?.kode ? { kode: owner.kode } : {}),
      nama: owner?.nama || 'Pemilik tidak tersedia',
    },
    dikirim_pada: kos.diajukan_pada || kos.createdAt || kos.updatedAt,
  };
}

export function isAdminModerationQueueResponse(result) {
  return (
    Array.isArray(result?.data) &&
    result.data.every(
      (item) =>
        item &&
        ['listing_baru', 'perubahan'].includes(item.jenis) &&
        typeof item.kos?._id === 'string' &&
        typeof item.kos?.nama === 'string' &&
        typeof item.pemilik?.nama === 'string' &&
        typeof item.dikirim_pada === 'string'
    ) &&
    Number.isInteger(result.count) &&
    Number.isInteger(result.pagination?.totalData) &&
    Number.isInteger(result.pagination?.totalPages) &&
    Number.isInteger(result.pagination?.currentPage) &&
    Number.isInteger(result.pagination?.limit)
  );
}

export async function getAdminModerationQueue(queryString, token) {
  const params = new URLSearchParams(queryString);
  if (shouldUseAdminV1Api()) {
    return apiRequest(
      `/admin/antrean${queryString ? `?${queryString}` : ''}`,
      { token }
    );
  }

  const jenis = params.get('jenis') || 'semua';
  if (!['semua', 'listing_baru', 'perubahan'].includes(jenis)) {
    throw new Error('Jenis antrean tidak valid.');
  }
  const query = params.get('q') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.get('limit')) || 15));
  let items = [];

  if (jenis !== 'perubahan') {
    const pendingParams = new URLSearchParams({
      status: 'pending',
      page: '1',
      limit: '50',
    });
    const pendingResult = await getAdminKos(pendingParams.toString(), token);

    if (!Array.isArray(pendingResult.data)) {
      throw new Error('Format data antrean kos dari backend tidak sesuai.');
    }

    items = pendingResult.data
      .filter((kos) => kos.status_verifikasi === 'pending')
      .map(mapPendingKosToQueueItem);
  }

  if (jenis !== 'listing_baru') {
    items.push(mockChangeQueueItem);
  }

  const filteredItems = filterModerationQueue(items, query).sort(
    (left, right) =>
      new Date(left.dikirim_pada).getTime() -
      new Date(right.dikirim_pada).getTime()
  );
  const totalData = filteredItems.length;
  const start = (page - 1) * limit;
  const data = filteredItems.slice(start, start + limit);

  return {
    success: true,
    count: data.length,
    pagination: {
      totalData,
      totalPages: Math.ceil(totalData / limit),
      currentPage: page,
      limit,
    },
    data,
  };
}

export async function getAdminKosDetail(id, token) {
  const useLiveApi = shouldUseAdminV1Api();
  if (!useLiveApi && isMockAdminChangeKos(id)) {
    return { success: true, data: mockChangeKosDetail };
  }

  const detailPath = useLiveApi
    ? `/admin/kos/${encodeURIComponent(id)}`
    : `/kos/${encodeURIComponent(id)}`;
  const result = await apiRequest(detailPath, { token });
  if (useLiveApi) {
    return result;
  }

  const decision = readMockKosDecisions().find(
    (item) => item.kos._id === String(id)
  );

  return decision ? { ...result, data: decision.kos } : result;
}

export async function decideAdminKos(id, decision, token, currentKos) {
  if (
    decision.status_verifikasi === 'revision' &&
    !shouldUseAdminV1Api()
  ) {
    const reason = decision.catatan_verifikasi?.trim();
    if (!reason) {
      throw new Error('Alasan revisi wajib diisi.');
    }
    if (!currentKos || currentKos._id !== id) {
      throw new Error('Data kos untuk mock revisi tidak tersedia.');
    }
    if (currentKos.status_verifikasi !== 'pending') {
      throw new Error('Mock revisi hanya dapat dilakukan pada kos pending.');
    }

    const mockKos = {
      ...currentKos,
      status_verifikasi: 'revision',
      catatan_verifikasi: reason,
      diverifikasi_pada: new Date().toISOString(),
      isMockDecision: true,
    };
    const decisions = readMockKosDecisions().filter(
      (item) => item.kos._id !== id
    );
    decisions.push({ kos: mockKos });
    saveMockKosDecisions(decisions);

    return {
      success: true,
      message: 'Mock revisi tersimpan di sesi browser, belum dikirim ke backend.',
      data: mockKos,
    };
  }

  return apiRequest(`/admin/kos/${encodeURIComponent(id)}/verifikasi`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(decision),
  });
}

export function getAdminUsers(queryString, token) {
  return apiRequest(
    `/admin/users${queryString ? `?${queryString}` : ''}`,
    { token }
  );
}

export function downloadAdminKosCsv(token) {
  return apiDownload('/admin/export/kos', { token });
}
