"use client";

import { useEffect, useRef, useState } from "react";
import { AccountLayout } from "../../components/layout/AccountLayout";
import { Button } from "../../components/ui/Button";
import { Avatar, Badge, Card, PageHeading } from "../../components/ui/Display";
import { Dialog } from "../../components/ui/Dialog";
import { Alert } from "../../components/ui/Feedback";
import { Field } from "../../components/ui/Field";
import { Link } from "../../components/ui/Link";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../lib/api/client";
import { limits } from "../../lib/config";
import { useForm } from "../../lib/hooks/useForm";
import { navigate, setNavigationGuard } from "../../lib/router";
import { phone, required, validateImage, type Schema } from "../../lib/validation/rules";
import { useAuth } from "../auth/AuthContext";
import { accountApi } from "./api";

interface V extends Record<string, string> { nama: string; telepon: string }
const schema: Schema<V> = {
  nama: [required("Nama lengkap wajib diisi.")],
  telepon: [required("Nomor kontak wajib diisi."), phone()],
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const form = useForm<V>({ nama: user!.nama, telepon: user!.telepon }, schema);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  dirtyRef.current = form.dirty;

  // Perubahan belum disimpan: tahan perpindahan di dalam aplikasi dan penutupan tab.
  useEffect(() => {
    setNavigationGuard((to) => {
      if (!dirtyRef.current) return true;
      setPendingNav(to);
      return false;
    });
    const beforeUnload = (e: BeforeUnloadEvent) => { if (dirtyRef.current) e.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { setNavigationGuard(null); window.removeEventListener("beforeunload", beforeUnload); };
  }, []);

  const save = async (v: V) => {
    const u = await accountApi.updateProfile({ nama: v.nama.trim(), telepon: v.telepon.replace(/[\s-]/g, "") });
    setUser(u);
    form.reset({ nama: u.nama, telepon: u.telepon });
    toast.show({ tone: "success", message: "Perubahan profil berhasil disimpan." });
  };
  const onSubmit = form.submit(save);

  const saveAndLeave = async () => {
    const target = pendingNav!;
    let saved = false;
    await form.submit(async (v) => { await save(v); saved = true; })({ preventDefault() {} });
    setPendingNav(null); // gagal: tutup dialog, kesalahan tampil di formulir
    if (saved) { dirtyRef.current = false; navigate(target, { force: true }); }
  };
  const discard = () => {
    const target = pendingNav!;
    dirtyRef.current = false;
    setPendingNav(null);
    navigate(target, { force: true });
  };

  if (!user) return null;
  return (
    <AccountLayout>
      <PageHeading title="Profil pribadi" description="Kelola identitas dan informasi kontakmu." />
      <Card className="profile-card">
        <div className="photo-row">
          <Avatar nama={user.nama} fotoUrl={user.fotoUrl} size={64} />
          <div>
            <h2 className="h4">Foto profil</h2>
            <p className="muted small">JPG atau PNG, maksimal {limits.avatarMaxBytes / 1024 / 1024} MB. Gunakan foto yang jelas.</p>
            <Button variant="secondary" onClick={() => setPhotoOpen(true)}>Ubah foto</Button>
          </div>
        </div>
        <form onSubmit={onSubmit} noValidate ref={form.formRef} className="stack-lg">
          {form.formError && <Alert tone="error">{form.formError}</Alert>}
          <div className="form-grid">
            <Field label="Nama lengkap" autoComplete="name" {...form.field("nama")} required />
            <Field label="Nomor kontak" type="tel" inputMode="tel" autoComplete="tel" {...form.field("telepon")} required />
          </div>
          <div className="email-status">
            <span>{user.email}</span>
            {user.emailTerverifikasi ? <Badge tone="success">Email terverifikasi</Badge> : <Badge tone="danger">Email belum terverifikasi</Badge>}
          </div>
          <p className="muted small">Alamat email dan kata sandi dikelola melalui menu Keamanan. Nomor kontakmu tidak ditampilkan pada profil publik pencari.</p>
          <Link to="/akun/keamanan" className="link">Kelola keamanan akun</Link>
          <div><Button type="submit" loading={form.submitting} disabled={!form.dirty && !form.submitting}>Simpan perubahan</Button></div>
        </form>
      </Card>
      <Card className="action-card">
        <h2 className="h3">Informasi yang dapat dilihat orang lain</h2>
        <p className="muted">Nama dan foto profil dapat terlihat oleh pemilik saat kamu mengirim pesan. Email dan nomor kontak tidak ditampilkan pada halaman publik.</p>
      </Card>

      {photoOpen && <PhotoDialog onClose={() => setPhotoOpen(false)} />}
      {pendingNav && (
        <Dialog title="Simpan perubahanmu?" description="Ada perubahan profil yang belum disimpan. Pilih apakah ingin menyimpannya." onClose={() => setPendingNav(null)}>
          <div className="dialog-stack">
            <Button onClick={saveAndLeave} loading={form.submitting} data-autofocus>Simpan perubahan</Button>
            <Button variant="secondary" onClick={discard}>Buang perubahan</Button>
            <button type="button" className="link" onClick={() => setPendingNav(null)}>Lanjut mengedit</button>
          </div>
        </Dialog>
      )}
    </AccountLayout>
  );
}

function PhotoDialog({ onClose }: { onClose: () => void }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f?: File) => {
    if (!f) return;
    const err = validateImage(f, limits.avatarMaxBytes, limits.imageTypes);
    if (err) { setError(`Foto belum dapat diunggah. ${err}`); setFile(null); setPreview(null); return; }
    setError(null); setFile(f); setPreview(URL.createObjectURL(f));
  };
  const save = async () => {
    if (!file) { setError("Pilih foto terlebih dahulu."); return; }
    setBusy(true);
    try {
      setUser(await accountApi.uploadPhoto(file));
      toast.show({ tone: "success", message: "Foto profil diperbarui." });
      onClose();
    } catch (e) {
      setError(errorMessage(e, "Foto belum dapat diunggah."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog title="Ubah foto profil" description="Pilih foto yang jelas agar pemilik mudah mengenalimu." onClose={onClose}>
      {error && <Alert tone="error">{error}</Alert>}
      <input ref={input} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="upload">
        {preview ? <img src={preview} alt="Pratinjau foto profil" className="upload-preview" /> : <Avatar nama="?" size={64} />}
        <h3 className="h4">{file ? file.name : "Pilih foto dari perangkat"}</h3>
        <p className="muted small">JPG atau PNG · Maksimal {limits.avatarMaxBytes / 1024 / 1024} MB</p>
        <Button variant="secondary" onClick={() => input.current?.click()} data-autofocus>{file ? "Ganti foto" : "Pilih foto"}</Button>
      </div>
      <div className="dialog-actions">
        <Button variant="secondary" onClick={onClose}>Batal</Button>
        <Button onClick={save} loading={busy} disabled={!file}>Simpan foto</Button>
      </div>
    </Dialog>
  );
}
