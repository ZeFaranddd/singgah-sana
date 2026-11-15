// Membuat backend/.env dari .env.example dan mengisi JWT_SECRET acak bila belum ada.
// Aman dijalankan berulang kali: file .env yang sudah ada tidak ditimpa.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = path.join(__dirname, '..', 'backend');
const target = path.join(dir, '.env');
const example = path.join(dir, '.env.example');

if (fs.existsSync(target)) {
  console.log('[setup] backend/.env sudah ada, dibiarkan apa adanya.');
  process.exit(0);
}

const secret = crypto.randomBytes(48).toString('hex');
const isi = fs.readFileSync(example, 'utf8').replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
fs.writeFileSync(target, isi);
console.log('[setup] backend/.env dibuat dengan JWT_SECRET acak. Sesuaikan MONGO_URI bila perlu.');
