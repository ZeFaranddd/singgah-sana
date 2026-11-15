import { useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { tanggal } from '@/lib/format'
import { useAsync, useDebounced, useDocumentTitle } from '@/lib/hooks'
import { Avatar, Badge, EmptyState, ErrorState, LoadingBlock, Pagination, SectionTitle, SelectField, TextField } from '@/components/ui'

const PER_HALAMAN = 15

export function AdminPengguna() {
  useDocumentTitle('Pengguna')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const qd = useDebounced(q)
  const { data, loading, error, reload } = useAsync(() => api.admin.users({ q: qd || undefined, role: role || undefined }), [qd, role])
  const semua = data?.data ?? []
  const totalPages = Math.max(1, Math.ceil(semua.length / PER_HALAMAN))
  const tampil = useMemo(() => semua.slice((page - 1) * PER_HALAMAN, page * PER_HALAMAN), [semua, page])

  return (
    <div className="space-y-6">
      <SectionTitle title="Pengguna" subtitle={`${semua.length} akun terdaftar.`} />
      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <TextField aria-label="Cari pengguna" placeholder="Cari nama, email, atau nomor…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <SelectField aria-label="Peran" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
          <option value="">Semua peran</option>
          <option value="pencari">Pencari</option>
          <option value="pemilik">Pemilik</option>
          <option value="admin">Admin</option>
        </SelectField>
      </div>
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : semua.length === 0 ? (
        <EmptyState title="Pengguna tidak ditemukan" />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#e2e8f0] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#64748b]">
              <tr>{['Pengguna', 'Telepon', 'Peran', 'Bergabung'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {tampil.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nama={u.nama} size={36} />
                      <div><p className="body-medium">{u.nama}</p><p className="text-xs text-[#64748b]">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.nomor_telepon}</td>
                  <td className="px-4 py-3"><Badge tone={u.role === 'admin' ? 'red' : u.role === 'pemilik' ? 'green' : 'purple'}>{u.role}</Badge></td>
                  <td className="px-4 py-3">{tanggal(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
