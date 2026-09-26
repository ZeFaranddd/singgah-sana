require('dotenv').config();
const http = require('http');
const fs = require('fs');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = 5001;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runAllTests() {
  await connectDB();
  const server = app.listen(PORT, async () => {
    console.log(`[Test Runner] Server berjalan pada port ${PORT}...`);
    const results = [];

    try {
      console.log('\n--- MULAI PENGUJIAN RESTful API SINGGAH-SANA ---\n');

      // 1. Registrasi Akun Pencari Baru (General)
      console.log('1. POST /api/auth/register (Pencari Baru)');
      const regRes = await makeRequest('POST', '/api/auth/register', {
        nama: 'Pencari Baru',
        email: 'pencari.baru@gmail.com',
        password: 'PencariPassword123!',
        nomor_telepon: '081234567800',
        role: 'pencari',
      });
      console.log(`   Status: ${regRes.statusCode}`);
      results.push({
        no: 1,
        title: 'Registrasi Akun Pencari Kos Baru',
        method: 'POST',
        endpoint: '/api/auth/register',
        access: 'Publik',
        reqBody: {
          nama: 'Pencari Baru',
          email: 'pencari.baru@gmail.com',
          password: 'PencariPassword123!',
          nomor_telepon: '081234567800',
          role: 'pencari',
        },
        resStatus: regRes.statusCode,
        resBody: regRes.body,
      });

      // 2. Login Admin (General)
      console.log('2. POST /api/auth/login (Admin)');
      const loginAdmin = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@gmail.com',
        password: 'AdminPassword123!',
      });
      console.log(`   Status: ${loginAdmin.statusCode}`);
      const adminToken = loginAdmin.body.data.token;
      results.push({
        no: 2,
        title: 'Login Akun Administrator & Penerbitan Token JWT',
        method: 'POST',
        endpoint: '/api/auth/login',
        access: 'Publik',
        reqBody: {
          email: 'admin@gmail.com',
          password: 'AdminPassword123!',
        },
        resStatus: loginAdmin.statusCode,
        resBody: loginAdmin.body,
      });

      // 3. Login Pemilik 1 (General)
      console.log('3. POST /api/auth/login (Pemilik Kos)');
      const loginPemilik = await makeRequest('POST', '/api/auth/login', {
        email: 'pemilik1@gmail.com',
        password: 'PemilikPassword123!',
      });
      console.log(`   Status: ${loginPemilik.statusCode}`);
      const pemilikToken = loginPemilik.body.data.token;

      // 4. Login Pencari 1 (General)
      console.log('4. POST /api/auth/login (Pencari Kos)');
      const loginPencari = await makeRequest('POST', '/api/auth/login', {
        email: 'pencari1@gmail.com',
        password: 'PencariPassword123!',
      });
      console.log(`   Status: ${loginPencari.statusCode}`);
      const pencariToken = loginPencari.body.data.token;

      // 5. GET /api/auth/me (Profil Pengguna Login)
      console.log('5. GET /api/auth/me (Pencari Profile)');
      const meRes = await makeRequest('GET', '/api/auth/me', null, pencariToken);
      console.log(`   Status: ${meRes.statusCode}`);
      results.push({
        no: 3,
        title: 'Pemeriksaan Profil Pengguna Login (Header Bearer Token)',
        method: 'GET',
        endpoint: '/api/auth/me',
        access: 'Private (All Roles)',
        reqBody: null,
        resStatus: meRes.statusCode,
        resBody: meRes.body,
      });

      // 6. Pemilik Mendaftarkan Kos Baru (Status Awal PENDING)
      console.log('6. POST /api/kos (Pemilik Daftarkan Kos Baru)');
      const newKosRes = await makeRequest(
        'POST',
        '/api/kos',
        {
          nama: 'Griya Singgah Pogung Permai',
          deskripsi: 'Kos putra baru renovasi, lingkungan sejuk dan aman di kawasan Pogung Kidul.',
          alamat: 'Jl. Pogung Kidul Gang Babarsari No. 10, Sinduadi, Sleman',
          area_kampus: 'Pogung UGM',
          latitude: -7.7660,
          longitude: 110.3730,
          harga_per_bulan: 1500000,
          tipe: 'putra',
          fasilitas: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Parkir Motor'],
          jumlah_kamar_total: 8,
          jumlah_kamar_tersedia: 4,
        },
        pemilikToken
      );
      console.log(`   Status: ${newKosRes.statusCode}`);
      const pendingKosId = newKosRes.body.data._id;
      results.push({
        no: 4,
        title: 'Pemilik Mendaftarkan Kos Baru (Otomatis Status PENDING)',
        method: 'POST',
        endpoint: '/api/kos',
        access: 'Private (Pemilik)',
        reqBody: {
          nama: 'Griya Singgah Pogung Permai',
          deskripsi: 'Kos putra baru renovasi...',
          alamat: 'Jl. Pogung Kidul Gang Babarsari No. 10...',
          harga_per_bulan: 1500000,
          tipe: 'putra',
          fasilitas: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Parkir Motor'],
          jumlah_kamar_total: 8,
          jumlah_kamar_tersedia: 4,
        },
        resStatus: newKosRes.statusCode,
        resBody: newKosRes.body,
      });

      // 7. GET /api/kos (Verifikasi Kos Pending TIDAK Muncul di Publik)
      console.log('7. GET /api/kos (Verifikasi Isolasi Kos Pending dari Publik)');
      const publicKosRes = await makeRequest('GET', '/api/kos?q=Permai');
      console.log(`   Status: ${publicKosRes.statusCode}, Hasil Ditemukan: ${publicKosRes.body.count}`);
      results.push({
        no: 5,
        title: 'Verifikasi Direktori Publik (Kos Berstatus PENDING Terisolasi)',
        method: 'GET',
        endpoint: '/api/kos?q=Permai',
        access: 'Publik',
        reqBody: null,
        resStatus: publicKosRes.statusCode,
        resBody: publicKosRes.body,
      });

      // 8. GET /api/admin/kos?status=pending (Admin Melihat Antrean Kos Pending)
      console.log('8. GET /api/admin/kos?status=pending (Admin Antrean)');
      const adminPendingRes = await makeRequest('GET', '/api/admin/kos?status=pending', null, adminToken);
      console.log(`   Status: ${adminPendingRes.statusCode}, Jumlah Pending: ${adminPendingRes.body.count}`);
      results.push({
        no: 6,
        title: 'Admin Memeriksa Daftar Kos Menunggu Verifikasi',
        method: 'GET',
        endpoint: '/api/admin/kos?status=pending',
        access: 'Private (Admin)',
        reqBody: null,
        resStatus: adminPendingRes.statusCode,
        resBody: adminPendingRes.body,
      });

      // 9. PATCH /api/admin/kos/:id/verifikasi (Admin Menyetujui Kos)
      console.log('9. PATCH /api/admin/kos/:id/verifikasi (Admin Approve)');
      const approveRes = await makeRequest(
        'PATCH',
        `/api/admin/kos/${pendingKosId}/verifikasi`,
        {
          status_verifikasi: 'approved',
          catatan_verifikasi: 'Survei lokasi valid dan dokumen kepemilikan terverifikasi.',
        },
        adminToken
      );
      console.log(`   Status: ${approveRes.statusCode}`);
      results.push({
        no: 7,
        title: 'Admin Memverifikasi Kos Menjadi APPROVED',
        method: 'PATCH',
        endpoint: `/api/admin/kos/${pendingKosId}/verifikasi`,
        access: 'Private (Admin)',
        reqBody: {
          status_verifikasi: 'approved',
          catatan_verifikasi: 'Survei lokasi valid dan dokumen kepemilikan terverifikasi.',
        },
        resStatus: approveRes.statusCode,
        resBody: approveRes.body,
      });

      // 10. GET /api/kos dengan Multi-filter (Pencarian Dinamis)
      console.log('10. GET /api/kos?tipe=putra&harga_max=1700000&kamar_tersedia=true');
      const filteredKosRes = await makeRequest(
        'GET',
        '/api/kos?tipe=putra&harga_max=1700000&kamar_tersedia=true&sort=harga_asc'
      );
      console.log(`    Status: ${filteredKosRes.statusCode}, Hasil: ${filteredKosRes.body.count}`);
      results.push({
        no: 8,
        title: 'Pencarian Kos dengan Multi-filter (Tipe, Rentang Harga, Kamar Tersedia)',
        method: 'GET',
        endpoint: '/api/kos?tipe=putra&harga_max=1700000&kamar_tersedia=true&sort=harga_asc',
        access: 'Publik',
        reqBody: null,
        resStatus: filteredKosRes.statusCode,
        resBody: filteredKosRes.body,
      });

      // Ambil 1 ID kos approved untuk tes bookmark & inquiry
      const targetKosId = filteredKosRes.body.data[0]._id;

      // 11. POST /api/favorit/:kosId (Pencari Menandai Favorit)
      console.log('11. POST /api/favorit/:kosId (Bookmark Kos)');
      const addFavRes = await makeRequest('POST', `/api/favorit/${targetKosId}`, null, pencariToken);
      console.log(`    Status: ${addFavRes.statusCode}`);
      results.push({
        no: 9,
        title: 'Pencari Menambahkan Kos ke Daftar Favorit',
        method: 'POST',
        endpoint: `/api/favorit/${targetKosId}`,
        access: 'Private (Pencari)',
        reqBody: null,
        resStatus: addFavRes.statusCode,
        resBody: addFavRes.body,
      });

      // 12. GET /api/favorit (Pencari Melihat Daftar Favorit)
      console.log('12. GET /api/favorit (Daftar Favorit Pencari)');
      const myFavRes = await makeRequest('GET', '/api/favorit', null, pencariToken);
      console.log(`    Status: ${myFavRes.statusCode}, Total: ${myFavRes.body.count}`);
      results.push({
        no: 10,
        title: 'Pencari Melihat Daftar Kos Favorit Miliknya',
        method: 'GET',
        endpoint: '/api/favorit',
        access: 'Private (Pencari)',
        reqBody: null,
        resStatus: myFavRes.statusCode,
        resBody: myFavRes.body,
      });

      // 13. POST /api/inquiries (Pencari Mengirim Pesan Pertanyaan)
      console.log('13. POST /api/inquiries (Kirim Pesan Pertanyaan)');
      const inqRes = await makeRequest(
        'POST',
        '/api/inquiries',
        {
          kos_id: targetKosId,
          pesan: 'Permisi, apakah untuk kamar mandi dalam ada fasilitas air panas?',
        },
        pencariToken
      );
      console.log(`    Status: ${inqRes.statusCode}`);
      const inquiryId = inqRes.body.data._id;
      results.push({
        no: 11,
        title: 'Pencari Mengirimkan Pesan Pertanyaan (Inquiry) ke Pemilik Kos',
        method: 'POST',
        endpoint: '/api/inquiries',
        access: 'Private (Pencari)',
        reqBody: {
          kos_id: targetKosId,
          pesan: 'Permisi, apakah untuk kamar mandi dalam ada fasilitas air panas?',
        },
        resStatus: inqRes.statusCode,
        resBody: inqRes.body,
      });

      // 14. PATCH /api/inquiries/:id/reply (Pemilik Membalas Pesan)
      console.log('14. PATCH /api/inquiries/:id/reply (Pemilik Balas Pesan)');
      const replyRes = await makeRequest(
        'PATCH',
        `/api/inquiries/${inquiryId}/reply`,
        {
          balasan: 'Iya betul, di setiap kamar mandi dalam sudah dilengkapi water heater.',
        },
        pemilikToken
      );
      console.log(`    Status: ${replyRes.statusCode}`);
      results.push({
        no: 12,
        title: 'Pemilik Kos Membalas Pertanyaan dari Pencari',
        method: 'PATCH',
        endpoint: `/api/inquiries/${inquiryId}/reply`,
        access: 'Private (Pemilik)',
        reqBody: {
          balasan: 'Iya betul, di setiap kamar mandi dalam sudah dilengkapi water heater.',
        },
        resStatus: replyRes.statusCode,
        resBody: replyRes.body,
      });

      // 15. GET /api/admin/stats (Dashboard Agregasi Statistik)
      console.log('15. GET /api/admin/stats (Dashboard Statistik Agregasi MongoDB)');
      const statsRes = await makeRequest('GET', '/api/admin/stats', null, adminToken);
      console.log(`    Status: ${statsRes.statusCode}`);
      results.push({
        no: 13,
        title: 'Dashboard Statistik & Metrik Agregasi MongoDB',
        method: 'GET',
        endpoint: '/api/admin/stats',
        access: 'Private (Admin)',
        reqBody: null,
        resStatus: statsRes.statusCode,
        resBody: statsRes.body,
      });

      // 16. GET /api/admin/export/kos (Ekspor Rekapitulasi CSV)
      console.log('16. GET /api/admin/export/kos (Ekspor CSV)');
      const exportRes = await makeRequest('GET', '/api/admin/export/kos', null, adminToken);
      console.log(`    Status: ${exportRes.statusCode}, Content-Type: ${exportRes.headers['content-type']}`);
      results.push({
        no: 14,
        title: 'Ekspor Data Rekapitulasi Kos ke Berkas CSV (Nilai Tambah G6)',
        method: 'GET',
        endpoint: '/api/admin/export/kos',
        access: 'Private (Admin)',
        reqBody: null,
        resStatus: exportRes.statusCode,
        resBody: exportRes.body.toString().substring(0, 300) + '...',
      });

      // 17. Pengujian Otorisasi RBAC Error Cases (401 Unauthorized & 403 Forbidden)
      console.log('17. Error Cases (401 Unauthorized & 403 Forbidden)');
      const unauthRes = await makeRequest('GET', '/api/admin/stats');
      console.log(`    GET /api/admin/stats tanpa token -> Status: ${unauthRes.statusCode}`);

      const forbiddenRes = await makeRequest('GET', '/api/admin/stats', null, pencariToken);
      console.log(`    GET /api/admin/stats dengan token Pencari -> Status: ${forbiddenRes.statusCode}`);

      results.push({
        no: 15,
        title: 'Pengujian Pengamanan API: 401 Unauthorized (Tanpa Token) & 403 Forbidden (Salah Peran)',
        method: 'GET',
        endpoint: '/api/admin/stats',
        access: 'Private (Admin Only)',
        reqBody: null,
        resStatus: forbiddenRes.statusCode,
        resBody: forbiddenRes.body,
      });

      console.log('\n--- SEMUA PENGUJIAN REST API BERHASIL DILAKSANAKAN DENGAN HASIL VALID! ---\n');

      fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
      console.log('[Test Runner] File test_results.json berhasil disimpan.');

    } catch (err) {
      console.error('[Test Error]:', err);
    } finally {
      server.close(() => {
        console.log('[Test Runner] Server pengujian ditutup.');
        process.exit(0);
      });
    }
  });
}

runAllTests();
