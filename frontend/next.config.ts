import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Foto kos berasal dari URL luar dan folder /uploads backend,
    // jadi optimasi gambar bawaan dimatikan agar semua sumber dapat tampil.
    unoptimized: true,
  },
};

export default nextConfig;
