// Test untuk fitur yang ditambahkan saat integrasi frontend:
// ganti sandi, preferensi, notifikasi, laporan pengguna, aktivitas admin, statistik area.

const { app, request, createUser, createKos, auth, DEFAULT_PASSWORD } = require('./helpers');
const Notifikasi = require('../src/models/Notifikasi');
const Laporan = require('../src/models/Laporan');
const Aktivitas = require('../src/models/Aktivitas');

describe('PUT /api/auth/password', () => {
  it('mengganti sandi bila sandi lama benar, lalu login dengan sandi baru', async () => {
    const { user, token } = await createUser('pencari');
    const res = await request(app)
      .put('/api/auth/password')
      .set(auth(token))
      .send({ password_lama: DEFAULT_PASSWORD, password_baru: 'SandiBaru123!' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeTruthy();

    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'SandiBaru123!' });
    expect(login.statusCode).toBe(200);
  });

  it('menolak sandi lama yang salah dengan 400 (bukan 401)', async () => {
    const { token } = await createUser('pencari');
    const res = await request(app)
      .put('/api/auth/password')
      .set(auth(token))
      .send({ password_lama: 'salah-salah', password_baru: 'SandiBaru123!' });
    expect(res.statusCode).toBe(400);
  });

  it('menolak sandi baru yang terlalu pendek', async () => {
    const { token } = await createUser('pencari');
    const res = await request(app)
      .put('/api/auth/password')
      .set(auth(token))
      .send({ password_lama: DEFAULT_PASSWORD, password_baru: '123' });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/auth/profile (preferensi)', () => {
  it('menyimpan preferensi pencarian', async () => {
    const { token } = await createUser('pencari');
    const res = await request(app)
      .put('/api/auth/profile')
      .set(auth(token))
      .send({ preferensi: { area_kampus: 'Pogung UGM', tipe: 'putri', harga_maks: 1500000, fasilitas: ['AC', 'WiFi'] } });
    expect(res.statusCode).toBe(200);

    const me = await request(app).get('/api/auth/me').set(auth(token));
    expect(me.body.data.preferensi.area_kampus).toBe('Pogung UGM');
    expect(me.body.data.preferensi.tipe).toBe('putri');
    expect(me.body.data.preferensi.harga_maks).toBe(1500000);
    expect(me.body.data.preferensi.fasilitas).toEqual(['AC', 'WiFi']);
  });
});

describe('Notifikasi', () => {
  it('pemilik dinotifikasi saat ada pertanyaan, pencari saat dibalas', async () => {
    const { user: pemilik, token: tokenPemilik } = await createUser('pemilik');
    const { token: tokenPencari } = await createUser('pencari');
    const kos = await createKos(pemilik);

    const kirim = await request(app).post('/api/inquiries').set(auth(tokenPencari)).send({ kos_id: kos._id, pesan: 'Masih ada kamar?' });
    expect(kirim.statusCode).toBe(201);

    const notifPemilik = await request(app).get('/api/notifikasi').set(auth(tokenPemilik));
    expect(notifPemilik.body.belum_dibaca).toBe(1);
    expect(notifPemilik.body.data[0].tipe).toBe('pesan_baru');

    await request(app).patch(`/api/inquiries/${kirim.body.data._id}/reply`).set(auth(tokenPemilik)).send({ balasan: 'Masih ada.' });

    const notifPencari = await request(app).get('/api/notifikasi').set(auth(tokenPencari));
    expect(notifPencari.body.data.some((n) => n.tipe === 'balasan_pesan')).toBe(true);
  });

  it('menandai dibaca hanya untuk milik sendiri', async () => {
    const { user: pemilik } = await createUser('pemilik');
    const { token: tokenLain } = await createUser('pencari');
    const notif = await Notifikasi.create({ user_id: pemilik._id, tipe: 'info', judul: 'Tes' });

    const res = await request(app).patch(`/api/notifikasi/${notif._id}/baca`).set(auth(tokenLain));
    expect(res.statusCode).toBe(404);
  });

  it('tandai semua dibaca dan hitung jumlah belum dibaca', async () => {
    const { user, token } = await createUser('pencari');
    await Notifikasi.create([
      { user_id: user._id, judul: 'A' },
      { user_id: user._id, judul: 'B' },
    ]);
    const jumlah = await request(app).get('/api/notifikasi/jumlah').set(auth(token));
    expect(jumlah.body.data.belum_dibaca).toBe(2);

    await request(app).patch('/api/notifikasi/baca-semua').set(auth(token));
    const lagi = await request(app).get('/api/notifikasi/jumlah').set(auth(token));
    expect(lagi.body.data.belum_dibaca).toBe(0);
  });

  it('butuh login', async () => {
    const res = await request(app).get('/api/notifikasi');
    expect(res.statusCode).toBe(401);
  });
});

describe('Laporan pengguna', () => {
  it('pencari melapor, admin diberi notifikasi, admin menindaklanjuti', async () => {
    const { user: pemilik } = await createUser('pemilik');
    const { token: tokenPencari, user: pencari } = await createUser('pencari');
    const { token: tokenAdmin, user: admin } = await createUser('admin');
    const kos = await createKos(pemilik);

    const lapor = await request(app)
      .post('/api/laporan')
      .set(auth(tokenPencari))
      .send({ kos_id: kos._id, alasan: 'kamar_sudah_penuh', deskripsi: 'Kamar ternyata sudah penuh semua.' });
    expect(lapor.statusCode).toBe(201);
    expect(await Notifikasi.countDocuments({ user_id: admin._id, tipe: 'laporan_baru' })).toBe(1);

    const dobel = await request(app)
      .post('/api/laporan')
      .set(auth(tokenPencari))
      .send({ kos_id: kos._id, alasan: 'lainnya', deskripsi: 'Laporan kedua untuk kos yang sama.' });
    expect(dobel.statusCode).toBe(409);

    const daftar = await request(app).get('/api/admin/laporan?status=terbuka').set(auth(tokenAdmin));
    expect(daftar.statusCode).toBe(200);
    expect(daftar.body.data).toHaveLength(1);

    const tangani = await request(app)
      .patch(`/api/admin/laporan/${lapor.body.data._id}`)
      .set(auth(tokenAdmin))
      .send({ status: 'selesai', catatan_admin: 'Sudah dikonfirmasi ke pemilik.' });
    expect(tangani.statusCode).toBe(200);
    expect(tangani.body.data.status).toBe('selesai');
    expect(await Notifikasi.countDocuments({ user_id: pencari._id, tipe: 'laporan_ditangani' })).toBe(1);
  });

  it('menolak deskripsi terlalu pendek, kos belum approved, dan role selain pencari', async () => {
    const { user: pemilik, token: tokenPemilik } = await createUser('pemilik');
    const { token: tokenPencari } = await createUser('pencari');
    const kos = await createKos(pemilik);
    const pending = await createKos(pemilik, { status_verifikasi: 'pending' });

    const pendek = await request(app).post('/api/laporan').set(auth(tokenPencari)).send({ kos_id: kos._id, alasan: 'lainnya', deskripsi: 'pendek' });
    expect(pendek.statusCode).toBe(400);

    const belumTayang = await request(app).post('/api/laporan').set(auth(tokenPencari)).send({ kos_id: pending._id, alasan: 'lainnya', deskripsi: 'Kos ini mencurigakan sekali.' });
    expect(belumTayang.statusCode).toBe(400);

    const bukanPencari = await request(app).post('/api/laporan').set(auth(tokenPemilik)).send({ kos_id: kos._id, alasan: 'lainnya', deskripsi: 'Pemilik tidak boleh melapor.' });
    expect(bukanPencari.statusCode).toBe(403);
  });

  it('laporan tetap terbaca setelah kos dihapus (nama tersalin)', async () => {
    const { user: pemilik, token: tokenPemilik } = await createUser('pemilik');
    const { token: tokenPencari } = await createUser('pencari');
    const { token: tokenAdmin } = await createUser('admin');
    const kos = await createKos(pemilik);
    await request(app).post('/api/laporan').set(auth(tokenPencari)).send({ kos_id: kos._id, alasan: 'lainnya', deskripsi: 'Laporan sebelum kos dihapus.' });
    await request(app).delete(`/api/kos/${kos._id}`).set(auth(tokenPemilik));

    const daftar = await request(app).get('/api/admin/laporan').set(auth(tokenAdmin));
    expect(daftar.body.data[0].kos_nama).toBe(kos.nama);
    expect(daftar.body.data[0].kos_id).toBeNull();
  });
});

describe('Aktivitas & statistik admin', () => {
  it('verifikasi kos tercatat sebagai aktivitas dan memberi notifikasi ke pemilik', async () => {
    const { user: pemilik } = await createUser('pemilik');
    const { token: tokenAdmin } = await createUser('admin');
    const kos = await createKos(pemilik, { status_verifikasi: 'pending' });

    const res = await request(app).patch(`/api/admin/kos/${kos._id}/verifikasi`).set(auth(tokenAdmin)).send({ status_verifikasi: 'approved' });
    expect(res.statusCode).toBe(200);
    expect(await Aktivitas.countDocuments({ aksi: 'kos_disetujui' })).toBe(1);
    expect(await Notifikasi.countDocuments({ user_id: pemilik._id, tipe: 'kos_disetujui' })).toBe(1);

    const aktivitas = await request(app).get('/api/admin/aktivitas').set(auth(tokenAdmin));
    expect(aktivitas.statusCode).toBe(200);
    expect(aktivitas.body.data.length).toBeGreaterThan(0);

    const stats = await request(app).get('/api/admin/stats').set(auth(tokenAdmin));
    expect(stats.body.data.laporan).toBeDefined();
  });

  it('endpoint admin menolak non-admin', async () => {
    const { token } = await createUser('pencari');
    expect((await request(app).get('/api/admin/aktivitas').set(auth(token))).statusCode).toBe(403);
    expect((await request(app).get('/api/admin/laporan').set(auth(token))).statusCode).toBe(403);
  });
});

describe('GET /api/kos/meta/area', () => {
  it('mengelompokkan kos approved per area kampus', async () => {
    const { user: pemilik } = await createUser('pemilik');
    await createKos(pemilik, { area_kampus: 'Pogung UGM', harga_per_bulan: 1200000 });
    await createKos(pemilik, { area_kampus: 'Pogung UGM', harga_per_bulan: 900000 });
    await createKos(pemilik, { area_kampus: 'Sekip UGM' });
    await createKos(pemilik, { area_kampus: 'Rahasia', status_verifikasi: 'pending' });

    const res = await request(app).get('/api/kos/meta/area');
    expect(res.statusCode).toBe(200);
    const pogung = res.body.data.find((a) => a.area_kampus === 'Pogung UGM');
    expect(pogung.jumlah_kos).toBe(2);
    expect(pogung.harga_mulai).toBe(900000);
    expect(res.body.data.some((a) => a.area_kampus === 'Rahasia')).toBe(false);
  });
});

describe('PUT /api/kos/:id (kuota & foto)', () => {
  it('menolak kamar tersedia melebihi total', async () => {
    const { user: pemilik, token } = await createUser('pemilik');
    const kos = await createKos(pemilik, { jumlah_kamar_total: 10, jumlah_kamar_tersedia: 5 });
    const res = await request(app).put(`/api/kos/${kos._id}`).set(auth(token)).send({ jumlah_kamar_total: 3 });
    expect(res.statusCode).toBe(400);
  });

  it('memperbarui kamar tersedia tanpa memicu verifikasi ulang', async () => {
    const { user: pemilik, token } = await createUser('pemilik');
    const kos = await createKos(pemilik);
    const res = await request(app).put(`/api/kos/${kos._id}`).set(auth(token)).send({ jumlah_kamar_tersedia: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status_verifikasi).toBe('approved');
  });
});
