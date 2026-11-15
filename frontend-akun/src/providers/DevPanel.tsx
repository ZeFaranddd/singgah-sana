"use client";

import { navigate } from "../lib/router";
import { getScenario, scenarios, setScenario, type Scenario } from "../lib/api/mock/scenario";

/** Hanya saat `vite dev` + mock: pengganti "Frame acuan" Figma. Tidak ikut build produksi. */
const links: [string, string][] = [
  ["/masuk", "Masuk"], ["/daftar", "Daftar"], ["/verifikasi-email", "Periksa email"],
  ["/verifikasi-email/konfirmasi?token=kedaluwarsa", "Tautan kedaluwarsa"], ["/lupa-sandi", "Lupa sandi"],
  ["/reset-sandi?token=abc", "Reset sandi"], ["/dibatasi", "Akun dibatasi"],
  ["/akun", "Ringkasan"], ["/akun/profil", "Profil"], ["/akun/keamanan", "Keamanan"],
  ["/akun/notifikasi", "Notifikasi"], ["/akun/preferensi", "Preferensi"], ["/favorit", "Favorit"], ["/pesan", "Pesan"],
];

export function DevPanel() {
  return (
    <details className="dev-panel">
      <summary>Dev · mock</summary>
      <label>
        Skenario API
        <select
          defaultValue={getScenario()}
          onChange={(e) => { setScenario(e.target.value as Scenario); location.reload(); }}
        >
          {Object.entries(scenarios).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label>
        Lompat ke
        <select defaultValue="" onChange={(e) => e.target.value && navigate(e.target.value, { force: true })}>
          <option value="">Pilih rute…</option>
          {links.map(([to, label]) => <option key={to} value={to}>{label}</option>)}
        </select>
      </label>
      <p>Akun uji: nadia@example.com / Password1</p>
    </details>
  );
}
