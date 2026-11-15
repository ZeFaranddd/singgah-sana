export type Role = 'pencari' | 'pemilik' | 'admin';

export type SessionUser = {
  _id: string;
  nama: string;
  email: string;
  nomor_telepon: string;
  role: Role;
  foto_profil?: string;
};

export type Session = {
  token: string;
  user: SessionUser;
};
