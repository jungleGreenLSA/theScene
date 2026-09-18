'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { compressImage } from '@/lib/imageUpload'

interface VehicleImage { id: string; image_url: string; caption: string; sort_order: number }

export default function VehiclePhotosPage() {
  const supabase = createClient()
  const params = useParams()
  const vehicleId = params.id as string

  const [vehicle, setVehicle] = useState<any>(null)
  const [images, setImages] = useState<VehicleImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: v } = await supabase.from('vehicles').select('id, year, make, model, color, primary_image_url').eq('id', vehicleId).single()
      setVehicle(v)

      const { data: imgs } = await supabase.from('vehicle_images').select('*').eq('vehicle_id', vehicleId).order('sort_order')
      setImages(imgs || [])

      setLoading(false)
    }
    load()
  }, [vehicleId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    for (let i = 0; i < files.length; i++) {
      const raw = files[i]
      if (raw.size > 15 * 1024 * 1024) { setMessage('Max 15MB per photo'); continue }
      const file = await compressImage(raw)

      const filename = `vehicles/${user.id}/${vehicleId}/${Date.now()}_${i}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('posts').upload(filename, file)
      if (error) { setMessage('Upload failed: ' + error.message); continue }

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)

      await supabase.from('vehicle_images').insert({
        vehicle_id: vehicleId,
        image_url: urlData.publicUrl,
        sort_order: images.length + i,
      })

      if (!vehicle?.primary_image_url && i === 0) {
        await supabase.from('vehicles').update({ primary_image_url: urlData.publicUrl }).eq('id', vehicleId)
      }
    }

    const { data: imgs } = await supabase.from('vehicle_images').select('*').eq('vehicle_id', vehicleId).order('sort_order')
    setImages(imgs || [])
    setMessage(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded!`)
    setUploading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSetPrimary = async (imageUrl: string) => {
    await supabase.from('vehicles').update({ primary_image_url: imageUrl }).eq('id', vehicleId)
    setVehicle({ ...vehicle, primary_image_url: imageUrl })
    setMessage('Primary photo updated!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDelete = async (imageId: string) => {
    if (!window.confirm('Delete this photo?')) return
    await supabase.from('vehicle_images').delete().eq('id', imageId)
    setImages(images.filter(i => i.id !== imageId))
    setMessage('Photo deleted')
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--color-muted-light)' }}>Loading…</div>
  if (!vehicle) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--color-muted-light)' }}>Vehicle not found</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px 40px' }}>
      <Link href="/garage" style={{ fontSize: '13px', color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px', opacity: 0.8 }}>&larr; Back to Garage</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '4px' }}>Photo Gallery</p>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 700, color: 'var(--color-foreground)' }}>
            <span className="spec" style={{ fontSize: '11px', color: 'var(--color-muted-light)', display: 'block', marginBottom: '2px' }}>{vehicle.year}</span>
            {vehicle.make} {vehicle.model}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginTop: '4px' }}><span className="spec">{images.length}</span> photo{images.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: message.includes('failed') || message.includes('capped') ? 'rgba(229,72,77,0.1)' : 'rgba(242,169,0,0.08)', border: `1px solid ${message.includes('failed') || message.includes('capped') ? 'rgba(229,72,77,0.3)' : 'rgba(242,169,0,0.25)'}`, marginBottom: '16px', fontSize: '13px', color: message.includes('failed') || message.includes('capped') ? 'var(--color-danger)' : 'var(--color-accent)' }}>
          {message}
        </div>
      )}

      {/* Upload */}
      <div className="panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px', border: '2px dashed rgba(242,169,0,0.18)', borderRadius: '8px', cursor: 'pointer', transition: 'border-color 0.2s', minHeight: '80px' }}>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
          <span style={{ fontSize: '14px', color: uploading ? 'var(--color-accent)' : 'var(--color-muted-light)' }}>{uploading ? 'Uploading...' : 'Click to upload photos (JPEG, PNG, WebP, max 5MB each)'}</span>
        </label>
      </div>

      {/* Gallery */}
      {images.length === 0 ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted-light)' }}>No photos yet. Upload some above!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
          {images.map(img => (
            <div key={img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-surface-light)', aspectRatio: '2 / 1' }}>
              <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {vehicle.primary_image_url === img.image_url && (
                <span style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(86,194,113,0.9)', color: 'white', fontWeight: 600 }}>Primary</span>
              )}
              <div style={{ position: 'absolute', bottom: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                {vehicle.primary_image_url !== img.image_url && (
                  <button onClick={() => handleSetPrimary(img.image_url)} title="Set as primary" style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(242,169,0,0.4)', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '9px', fontWeight: 700, minHeight: '36px', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.05em' }}>SET PRIMARY</button>
                )}
                <button onClick={() => handleDelete(img.id)} title="Delete" style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(229,72,77,0.4)', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '9px', fontWeight: 700, minHeight: '36px', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.05em' }}>DELETE</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
