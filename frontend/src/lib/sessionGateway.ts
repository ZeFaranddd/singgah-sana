import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from './normalizer';

const routes: Array<[RegExp, string[]]> = [
  [/^auth\/(csrf|me)$/, ['GET']],
  [/^auth\/(login|register|logout|forgot-password|reset-password)$/, ['POST']],
  [/^auth\/(profile|password)$/, ['PATCH']],
  [/^auth\/notification-preferences$/, ['GET', 'PUT']],
  [/^notifikasi(?:\/jumlah)?$/, ['GET']],
  [/^notifikasi\/baca-semua$/, ['PATCH']],
  [/^notifikasi\/[a-f\d]{24}\/baca$/, ['PATCH']],
  [/^favorit$/, ['GET']],
  [/^favorit\/[a-f\d]{24}$/, ['PUT', 'DELETE']],
  [/^inquir(?:y|ies)(?:\/(my|owner))?$/, ['GET', 'POST']],
  [/^inquir(?:y|ies)\/[a-f\d]{24}\/reply$/, ['PATCH']],
  [/^pemilik\/kos$/, ['GET', 'POST']],
  [/^pemilik\/kos\/[a-f\d]{24}$/, ['GET', 'PATCH', 'DELETE']],
  [/^pemilik\/kos\/[a-f\d]{24}\/(ajukan|tarik)$/, ['POST']],
  [/^pemilik\/kos\/[a-f\d]{24}\/(ketersediaan|publikasi)$/, ['PATCH']],
  [/^pemilik\/kos\/[a-f\d]{24}\/perubahan$/, ['GET', 'PUT', 'DELETE']],
  [/^pemilik\/kos\/[a-f\d]{24}\/perubahan\/(ajukan|tarik)$/, ['POST']],
  [/^media$/, ['POST']],
  [/^media\/[a-f\d]{24}$/, ['GET', 'DELETE']],
  [/^kos\/owner\/my-kos$/, ['GET']],
  [/^kos\/[a-f\d]{24}$/, ['GET']],
  [/^admin\/(stats|kos|users|antrean|pengajuan|audit-logs)$/, ['GET']],
  [/^admin\/export\/kos$/, ['GET']],
  [/^admin\/(kos|users|pengajuan|audit-logs)\/[a-f\d]{24}$/, ['GET']],
  [/^admin\/(kos|pengajuan)\/[a-f\d]{24}\/(verifikasi|keputusan)$/, ['PATCH']],
];

export async function sessionGateway(request: NextRequest, path: string) {
  if (!routes.some(([pattern, methods]) => pattern.test(path) && methods.includes(request.method))) {
    return NextResponse.json({ success: false, message: 'Endpoint tidak tersedia.' }, { status: 404 });
  }
  const origin = process.env.APP_ORIGIN || (process.env.NODE_ENV !== 'production' ? request.nextUrl.origin : '');
  if (!['GET', 'HEAD'].includes(request.method) && (!origin || request.headers.get('origin') !== origin)) {
    return NextResponse.json({ success: false, message: 'Asal permintaan tidak diizinkan.' }, { status: 403 });
  }
  const timeout = AbortSignal.timeout(15000);
  const signal = AbortSignal.any([timeout, request.signal]);
  try {
    const headers = new Headers({ Accept: 'application/json' });
    const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim())
      .find(value => /^ss\.sid=[\w-]{43}$/.test(value));
    if (cookie) headers.set('Cookie', cookie);
    if (origin) headers.set('Origin', origin);
    const csrf = request.headers.get('x-csrf-token');
    if (csrf) headers.set('X-CSRF-Token', csrf);
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    let body: Uint8Array | undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > 28 * 1024 * 1024) {
            await reader.cancel();
            return NextResponse.json({ success: false, message: 'Unggahan terlalu besar.' }, { status: 413 });
          }
          chunks.push(chunk.value);
        }
      }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    }
    const upstream = await fetch(`${getBackendApiUrl()}/${path}${request.nextUrl.search}`, {
      method: request.method, headers, body: body as BodyInit | undefined, cache: 'no-store', signal,
    });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store', Vary: 'Cookie' });
    for (const name of ['content-type', 'content-disposition']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const value of upstream.headers.getSetCookie()) {
      if (value.startsWith('ss.sid=')) responseHeaders.append('Set-Cookie', value);
    }
    const responseBody = await upstream.arrayBuffer();
    return new NextResponse(responseBody, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ success: false, message: 'Layanan sedang tidak dapat dihubungi. Coba lagi.' }, { status: 503 });
  }
}
