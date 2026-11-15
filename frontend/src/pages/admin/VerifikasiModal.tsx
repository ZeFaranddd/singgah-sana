import { useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button, Modal, Notice, TextArea } from '@/components/ui'
import type { Kos } from '@/lib/types'

/** Dialog setujui / tolak kos, dipakai oleh Peninjauan, Semua kos, dan Laporan. */
export function VerifikasiModal({ kos, status, onClose, onDone }: { kos: Kos | null; status: 'approved' | 'rejected'; onClose: () => void; onDone: (k: Kos) => void }) {
  const toast = useToast()
  const [catatan, setCatatan] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const tolak = status === 'rejected'

  const kirim = async () => {
    if (!kos) return
    if (tolak && catatan.trim().length < 5) return setError('Tuliskan alasan penolakan agar pemilik tahu apa yang perlu diperbaiki.')
    setLoading(true)
    setError('')
    try {
      const res = await api.admin.verify(kos._id, status, catatan.trim() || undefined)
      toast.success(tolak ? 'Kos ditolak dan pemilik diberi tahu.' : 'Kos disetujui dan kini tayang.')
      setCatatan('')
      onDone(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={Boolean(kos)}
      onClose={onClose}
      title={tolak ? 'Tolak / turunkan kos' : 'Setujui kos'}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant={tolak ? 'danger' : 'primary'} loading={loading} onClick={kirim}>{tolak ? 'Tolak kos' : 'Setujui & terbitkan'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[#475569]">{kos?.nama}</p>
        <TextArea label={tolak ? 'Alasan penolakan' : 'Catatan (opsional)'} value={catatan} onChange={(e) => setCatatan(e.target.value)} maxLength={500} placeholder={tolak ? 'Mis. foto buram dan alamat kurang jelas.' : 'Mis. data sudah sesuai hasil pengecekan.'} />
        {error && <Notice tone="red">{error}</Notice>}
      </div>
    </Modal>
  )
}
