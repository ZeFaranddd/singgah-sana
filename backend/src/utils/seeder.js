require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Kos = require('../models/Kos');
const Favorit = require('../models/Favorit');
const Inquiry = require('../models/Inquiry');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/singgah_sana_db';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Terhubung ke MongoDB...');

    // Hapus data lama
    await User.deleteMany();
    await Kos.deleteMany();
    await Favorit.deleteMany();
    await Inquiry.deleteMany();
    console.log('[Seeder] Data lama berhasil dibersihkan.');

    // 1. Buat Pengguna Bawaan (Menggunakan Nama & Email General)
    const admin = await User.create({
      nama: 'Administrator Portal',
      email: 'admin@gmail.com',
      password: 'AdminPassword123!',
      nomor_telepon: '081234567890',
      role: 'admin',
      foto_profil: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    });

    const pemilik1 = await User.create({
      nama: 'Pemilik Kos Satu',
      email: 'pemilik1@gmail.com',
      password: 'PemilikPassword123!',
      nomor_telepon: '081298765432',
      role: 'pemilik',
      foto_profil: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    });

    const pemilik2 = await User.create({
      nama: 'Pemilik Kos Dua',
      email: 'pemilik2@gmail.com',
      password: 'PemilikPassword123!',
      nomor_telepon: '081311223344',
      role: 'pemilik',
      foto_profil: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    });

    const pencari1 = await User.create({
      nama: 'Pencari Kos Satu',
      email: 'pencari1@gmail.com',
      password: 'PencariPassword123!',
      nomor_telepon: '085712345678',
      role: 'pencari',
      foto_profil: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    });

    const pencari2 = await User.create({
      nama: 'Pencari Kos Dua',
      email: 'pencari2@gmail.com',
      password: 'PencariPassword123!',
      nomor_telepon: '085888999000',
      role: 'pencari',
      foto_profil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    });

    console.log('[Seeder] 5 Akun pengguna bawaan (general) berhasil dibuat.');

    // 2. Buat Kos Contoh Area Sekitar Kampus UGM
    const kosData = [
      {
        nama: 'Kos Singgah Eksklusif Pogung Tipe A',
        deskripsi: 'Kos putra eksklusif dengan fasilitas lengkap, berjarak hanya 5 menit jalan kaki dari Fakultas Teknik UGM. Lingkungan tenang, aman, dan dekat dengan berbagai tempat makan.',
        alamat: 'Jl. Pogung Kidul No. 42B, Sinduadi, Mlati, Sleman',
        area_kampus: 'Pogung UGM',
        koordinat: { latitude: -7.7654, longitude: 110.3725 },
        foto: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
        ],
        harga_per_bulan: 1650000,
        tipe: 'putra',
        fasilitas: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Water Heater', 'Kasur Springbed', 'Lemari Pakaian', 'Meja Belajar', 'Parkir Motor', 'Parkir Mobil', 'CCTV 24 Jam'],
        luas_kamar: '3.5 x 4 meter',
        peraturan: ['Akses 24 Jam', 'Dilarang merokok di dalam kamar', 'Tamu lawan jenis dilarang masuk kamar'],
        jumlah_kamar_total: 10,
        jumlah_kamar_tersedia: 3,
        status_verifikasi: 'approved',
        catatan_verifikasi: 'Data dan izin operasional kos telah diverifikasi oleh Admin.',
        diverifikasi_oleh: admin._id,
        diverifikasi_pada: new Date(),
        pemilik_id: pemilik1._id,
      },
      {
        nama: 'Griya Putri Sekip UGM Asri',
        deskripsi: 'Kos putri nyaman, bersih, dan asri. Berada tepat di sebelah barat RSUP Dr. Sardjito dan Fakultas Kedokteran UGM. Penjaga kos ramah 24 jam.',
        alamat: 'Jl. Sekip Blok T No. 12, Sendowo, Mlati, Sleman',
        area_kampus: 'Sekip UGM',
        koordinat: { latitude: -7.7698, longitude: 110.3741 },
        foto: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
        ],
        harga_per_bulan: 1400000,
        tipe: 'putri',
        fasilitas: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Dapur Bersama', 'Kulkas Bersama', 'Parkir Motor', 'Penjaga Kos 24 Jam'],
        luas_kamar: '3 x 4 meter',
        peraturan: ['Gerbang ditutup pukul 23:00 WIB', 'Khusus mahasiswi / pekerja putri', 'Dilarang membawa hewan peliharaan'],
        jumlah_kamar_total: 12,
        jumlah_kamar_tersedia: 2,
        status_verifikasi: 'approved',
        catatan_verifikasi: 'Disetujui. Lokasi valid sesuai survei titik koordinat.',
        diverifikasi_oleh: admin._id,
        diverifikasi_pada: new Date(),
        pemilik_id: pemilik2._id,
      },
      {
        nama: 'Oemah Jogja Karangmalang Minimalis',
        deskripsi: 'Kos campur hemat dan strategis, berbatasan langsung antara kampus UGM dan UNY. Sangat cocok bagi mahasiswa yang mencari hunian terjangkau dengan akses mudah.',
        alamat: 'Gang Karangmalang Blok A No. 5, Caturtunggal, Depok, Sleman',
        area_kampus: 'Karangmalang UGM/UNY',
        koordinat: { latitude: -7.7725, longitude: 110.3854 },
        foto: [
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        ],
        harga_per_bulan: 850000,
        tipe: 'campur',
        fasilitas: ['WiFi', 'Kamar Mandi Luar', 'Kasur Busa', 'Lemari', 'Parkir Motor', 'Dapur Bersama'],
        luas_kamar: '3 x 3 meter',
        peraturan: ['Akses 24 Jam dengan kunci gerbang masing-masing', 'Iuran listrik include pemakaian normal'],
        jumlah_kamar_total: 8,
        jumlah_kamar_tersedia: 4,
        status_verifikasi: 'approved',
        catatan_verifikasi: 'Disetujui.',
        diverifikasi_oleh: admin._id,
        diverifikasi_pada: new Date(),
        pemilik_id: pemilik1._id,
      },
      {
        nama: 'D Blimbing Residence Pogung Baru',
        deskripsi: 'Kos putra modern fasilitas lengkap, kamar mandi dalam dengan water heater, meja kerja ergonomis, smart lock, dan area rooftop santai.',
        alamat: 'Jl. Pogung Baru Blok F No. 19, Sinduadi, Mlati, Sleman',
        area_kampus: 'Pogung Baru UGM',
        koordinat: { latitude: -7.7612, longitude: 110.3708 },
        foto: [
          'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
        ],
        harga_per_bulan: 2100000,
        tipe: 'putra',
        fasilitas: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Water Heater', 'Smart TV', 'Kulkas Kamar', 'Laundry Gratis', 'Parkir Mobil', 'Parkir Motor'],
        luas_kamar: '4 x 4 meter',
        peraturan: ['Bebas jam malam', 'Dilarang membuat kegaduhan di atas pukul 22:00 WIB'],
        jumlah_kamar_total: 6,
        jumlah_kamar_tersedia: 1,
        status_verifikasi: 'approved',
        catatan_verifikasi: 'Disetujui. Fasilitas premium terkonfirmasi.',
        diverifikasi_oleh: admin._id,
        diverifikasi_pada: new Date(),
        pemilik_id: pemilik1._id,
      },
      {
        nama: 'Wisma Bougenville Kaliurang',
        deskripsi: 'Kos putri asri sejuk di Jalan Kaliurang KM 5. Dekat dengan swalayan Mirota Kampus dan pusat kuliner Jakal.',
        alamat: 'Jl. Kaliurang KM 5.2 Gang Bougenville No. 8, Caturtunggal, Depok, Sleman',
        area_kampus: 'Kaliurang UGM',
        koordinat: { latitude: -7.7633, longitude: 110.3802 },
        foto: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        ],
        harga_per_bulan: 950000,
        tipe: 'putri',
        fasilitas: ['WiFi', 'Kamar Mandi Dalam', 'Kasur', 'Lemari', 'Parkir Motor'],
        luas_kamar: '3 x 3.5 meter',
        peraturan: ['Gerbang ditutup pukul 22:30 WIB'],
        jumlah_kamar_total: 15,
        jumlah_kamar_tersedia: 0, // Kamar penuh untuk uji filter ketersediaan
        status_verifikasi: 'approved',
        catatan_verifikasi: 'Disetujui.',
        diverifikasi_oleh: admin._id,
        diverifikasi_pada: new Date(),
        pemilik_id: pemilik2._id,
      },
      {
        nama: 'Kos Pogung Raya Indah (Menunggu Verifikasi)',
        deskripsi: 'Pendaftaran kos baru oleh pemilik. Memiliki 8 kamar dengan tarif bersaing di Pogung.',
        alamat: 'Jl. Pogung Raya No. 99, Sinduadi, Mlati, Sleman',
        area_kampus: 'Pogung UGM',
        koordinat: { latitude: -7.7645, longitude: 110.3719 },
        foto: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
        ],
        harga_per_bulan: 1250000,
        tipe: 'putra',
        fasilitas: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Parkir Motor'],
        luas_kamar: '3 x 4 meter',
        peraturan: ['Akses 24 Jam'],
        jumlah_kamar_total: 8,
        jumlah_kamar_tersedia: 5,
        status_verifikasi: 'pending', // Menunggu verifikasi admin untuk pengujian
        pemilik_id: pemilik1._id,
      },
      {
        nama: 'Griya Melati Monjali (Pendaftaran Ditolak)',
        deskripsi: 'Kos dekat Monjali.',
        alamat: 'Jl. Monjali Gang Melati No. 3, Sleman',
        area_kampus: 'Monjali',
        koordinat: { latitude: -7.7550, longitude: 110.3680 },
        foto: [
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        ],
        harga_per_bulan: 600000,
        tipe: 'campur',
        fasilitas: ['Kamar Mandi Luar', 'Parkir Motor'],
        luas_kamar: '2.5 x 3 meter',
        peraturan: ['Tertib lingkungan'],
        jumlah_kamar_total: 5,
        jumlah_kamar_tersedia: 2,
        status_verifikasi: 'rejected',
        catatan_verifikasi: 'Ditolak: Foto properti buram dan nomor telepon penanggung jawab tidak dapat dihubungi saat dikonfirmasi.',
        diverifikasi_oleh: admin._id,
        diverifikasi_pada: new Date(),
        pemilik_id: pemilik1._id,
      },
    ];

    const insertedKos = await Kos.insertMany(kosData);
    console.log(`[Seeder] ${insertedKos.length} Data kos berhasil dimasukkan.`);

    // 3. Tambahkan Favorit contoh untuk Pencari 1
    await Favorit.create({
      user_id: pencari1._id,
      kos_id: insertedKos[0]._id, // Kos Singgah Eksklusif Pogung
    });

    // 4. Tambahkan Inquiry contoh dari Pencari 1 ke Kos 1
    await Inquiry.create({
      pencari_id: pencari1._id,
      pemilik_id: pemilik1._id,
      kos_id: insertedKos[0]._id,
      pesan: 'Selamat siang, apakah untuk kamar nomor 3 masih tersedia jika saya ingin survei besok sore?',
      balasan: 'Siang, masih ada. Silakan datang besok jam 16:00 ya.',
      status: 'dibalas',
    });

    console.log('[Seeder] Data favorit dan inquiry contoh berhasil dibuat.');
    console.log('===========================================================');
    console.log('🎉 SEEDING SELESAI DENGAN SUKSES!');
    console.log('Akun Bawaan (General) untuk Pengujian:');
    console.log('1. Admin   : admin@gmail.com    | AdminPassword123!');
    console.log('2. Pemilik : pemilik1@gmail.com | PemilikPassword123!');
    console.log('3. Pencari : pencari1@gmail.com | PencariPassword123!');
    console.log('===========================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedData();
