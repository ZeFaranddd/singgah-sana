import { useState } from 'react'
import { api } from '@/lib/api'
import { linkWhatsApp, waktuRelatif } from '@/lib/format'
import { emitNotifChanged, useAsync, useDocumentTitle } from '@/lib/hooks'
import { Link } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Badge, Button, EmptyState, ErrorState, Icon, LoadingBlock, SectionTitle, Tabs, TextArea } from '@/components/ui'
import type { Inquiry } from '@/lib/types'

function BalasForm({ inquiry, onDone }: { inquiry: Inquiry; onDone: (i: Inquiry) => void }) {
  const toast = useToast()
  const [teks, setTeks] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const kirim = async () => {
    if (teks.trim().length < 2) return setError('Tulis balasan terlebih dahulu.')
    setError('')
    setLoading(true)
    try {
      const res = await api.inquiries.reply(inquiry._id, teks.trim())
      toast.success('Balasan terkirim.')
      emitNotifChanged()
      onDone({ ...inquiry, ...res.data, kos_id: inquiry.kos_id, pencari_id: inquiry.pencari_id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim balasan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <TextArea label="Balasanmu" rows={3} value={teks} maxLength={1000} onChange={(e) => setTeks(e.target.value)} error={error} hint="Balasan yang sudah terkirim tidak dapat diubah." />
      <Button primary small loading={loading} onClick={kirim}>Kirim balasan</Button>
    </div>
  )
}

export function OwnerPesan() {
  useDocumentTitle('Pesan')
  const { data, loading, error, reload, setData } = useAsync(() => api.inquiries.owner(), [])
  const [filter, setFilter] = useState<'menunggu' | 'dibalas' | 'semua'>('menunggu')

  const semua = data?.data ?? []
  const tampil = filter === 'semua' ? semua : semua.filter((i) => i.status === filter)
  const ganti = (baru: Inquiry) => setData((prev) => (prev ? { ...prev, data: prev.data.map((i) => (i._id === baru._id ? baru : i)) } : prev))

  return (
    <div className="space-y-6">
      <SectionTitle title="Pesan" subtitle="Pertanyaan dan permintaan survei dari calon penghuni." />
      <Tabs
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'menunggu', label: 'Belum dibalas', count: semua.filter((i) => i.status === 'menunggu').length },
          { value: 'dibalas', label: 'Sudah dibalas', count: semua.filter((i) => i.status === 'dibalas').length },
          { value: 'semua', label: 'Semua', count: semua.length },
        ]}
      />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : tampil.length === 0 ? (
        <EmptyState title={filter === 'menunggu' ? 'Tidak ada pesan yang menunggu' : 'Belum ada pesan'} text="Pesan dari calon penghuni akan muncul di sini." />
      ) : (
        <ul className="space-y-4">
          {tampil.map((i) => {
            const wa = linkWhatsApp(i.pencari_id?.nomor_telepon, `Halo ${i.pencari_id?.nama ?? ''}, saya pemilik ${i.kos_id.nama}.`)
            return (
              <li key={i._id} className="rounded-3xl border border-[#e2e8f0] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="body-medium">{i.pencari_id?.nama} <span className="text-[#64748b]">· {i.pencari_id?.email}</span></p>
                  <Badge tone={i.status === 'dibalas' ? 'green' : 'amber'}>{i.status === 'dibalas' ? 'Sudah dibalas' : 'Belum dibalas'}</Badge>
                </div>
                <p className="mt-1 text-xs text-[#64748b]">
                  <Link to={`/kos/${i.kos_id._id}`} className="hover:text-[#7c3aed]">{i.kos_id.nama}</Link> · {waktuRelatif(i.createdAt)}
                </p>
                <p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm">{i.pesan}</p>
                {i.status === 'dibalas' ? (
                  <div className="mt-3 rounded-2xl bg-[#f5f3ff] p-4 text-sm">
                    <p className="label mb-1 text-xs text-[#7c3aed]">Balasanmu</p>
                    {i.balasan}
                  </div>
                ) : (
                  <BalasForm inquiry={i} onDone={ganti} />
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className="label mt-4 inline-flex items-center gap-2 text-sm text-[#7c3aed] hover:underline">
                    <Icon name="phone" size={16} /> Hubungi via WhatsApp
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
