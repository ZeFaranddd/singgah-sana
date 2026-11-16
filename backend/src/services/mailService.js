const nodemailer = require('nodemailer');

const port = Number(process.env.BREVO_SMTP_PORT || 587);
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port,
  secure: port === 465,
  auth: { user: process.env.BREVO_SMTP_USER, pass: process.env.BREVO_SMTP_KEY },
});

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sendResetPasswordEmail = (to, nama, link) =>
  transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Pemulihan kata sandi Singgah-sana',
    text: `Halo ${nama},\n\nBuka tautan ini untuk membuat kata sandi baru (berlaku 30 menit):\n${link}\n\nAbaikan email ini jika kamu tidak memintanya.`,
    html: `<p>Halo ${escapeHtml(nama)},</p>
      <p>Klik tautan berikut untuk membuat kata sandi baru (berlaku 30 menit):</p>
      <p><a href="${link}">${link}</a></p>
      <p>Abaikan email ini jika kamu tidak memintanya.</p>`,
  });

module.exports = { sendResetPasswordEmail };