const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, { token, ...options } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    }

    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Server mengirim respons yang tidak dapat dibaca.');
  }

  if (!response.ok || result.success === false) {
    throw new ApiError(
      result.message || 'Permintaan tidak dapat diproses.',
      response.status
    );
  }

  return result;
}

export async function apiDownload(path, { token } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    }

    throw error;
  }

  if (!response.ok) {
    let result;
    try {
      result = await response.json();
    } catch {
      throw new ApiError(
        'File tidak dapat diunduh. Server mengirim respons yang tidak dapat dibaca.',
        response.status
      );
    }

    throw new ApiError(
      result.message || 'File tidak dapat diunduh.',
      response.status
    );
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType && !contentType.toLowerCase().includes('text/csv')) {
    throw new Error('Server tidak mengembalikan file CSV.');
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = /filename="?([^";]+)"?/i.exec(disposition);

  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] || 'rekap_kos_singgah_sana.csv',
  };
}
