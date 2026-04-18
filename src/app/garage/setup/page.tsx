'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { compressImage } from '@/lib/imageUpload'
import VehicleModsDraft, { type DraftMod } from '@/components/VehicleModsDraft'

const YEARS = Array.from({ length: new Date().getFullYear() - 1919 }, (_, i) => new Date().getFullYear() + 1 - i)
const BODY_STYLES = ['Sedan', 'Coupe', 'Convertible', 'Hatchback', 'Wagon', 'SUV', 'Truck', 'Van', 'Roadster', 'Other']
const TRANSMISSIONS = ['Automatic', 'Manual', 'DCT / Dual Clutch', 'CVT', 'Other']
const DRIVETRAINS = ['RWD', 'FWD', 'AWD', '4WD']
const BUILD_STATUSES = [
  { value: 'stock', label: 'Stock' },
  { value: 'lightly_modified', label: 'Lightly Modified' },
  { value: 'modified', label: 'Modified' },
  { value: 'full_build', label: 'Full Build' },
  { value: 'race_car', label: 'Race Car' },
  { value: 'project', label: 'Project' },
]

const labelStyle = { display: 'block' as const, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#8892a4', marginBottom: '6px' }
const sectionTitle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#e2e4e9', marginBottom: '14px' }
const hintStyle = { fontSize: '11px', color: '#6b7280', marginTop: '4px' }

export default function GarageSetupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [draftMods, setDraftMods] = useState<DraftMod[]>([])

  const [form, setForm] = useState({
    year: '',
    make: '',
    model: '',
    trim: '',
    color: '',
    engine: '',
    transmission: '',
    drivetrain: '',
    horsepower: '',
    mileage: '',
    build_status: 'stock',
    bio: '',
    location: '',
    club_affiliation: '',
    visibility: 'public',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be signed in'); setLoading(false); return }

    const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (!existingProfile) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const nameParts = fullName.split(' ')
      await supabase.from('profiles').insert({
        id: user.id,
        username: (user.user_metadata?.username || fullName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user') + '_' + user.id.slice(0, 4),
        display_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        first_name: nameParts[0] || '',
        last_name: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
      })
    }

    const slug = `${form.year}-${form.make}-${form.model}-${form.color}`
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

    const { data: newVehicle, error: insertError } = await supabase.from('vehicles').insert({
      owner_id: user.id,
      slug,
      year: form.year ? parseInt(form.year) : null,
      make: form.make,
      model: form.model,
      trim: form.trim,
      color: form.color,
      engine: form.engine,
      transmission: form.transmission,
      drivetrain: form.drivetrain,
      horsepower: form.horsepower,
      mileage: form.mileage,
      build_status: form.build_status,
      bio: form.bio,
      club_affiliation: form.club_affiliation,
      is_public: form.visibility === 'public',
      is_primary: true,
    }).select().single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    if (newVehicle) {
      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i]
          const filename = `vehicles/${user.id}/${newVehicle.id}/${Date.now()}_${i}.${file.name.split('.').pop()}`
          const { error: uploadErr } = await supabase.storage.from('posts').upload(filename, await compressImage(file))
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
            await supabase.from('vehicle_images').insert({ vehicle_id: newVehicle.id, image_url: urlData.publicUrl, sort_order: i })
            if (i === 0) {
              await supabase.from('vehicles').update({ primary_image_url: urlData.publicUrl }).eq('id', newVehicle.id)
            }
          }
        }
      }

      if (draftMods.length > 0) {
        const modsByCategory: Record<string, number> = {}
        const rows = draftMods.map(m => {
          const order = modsByCategory[m.category] ?? 0
          modsByCategory[m.category] = order + 1
          return {
            vehicle_id: newVehicle.id,
            category: m.category,
            item: m.item,
            brand: m.brand || null,
            notes: m.notes || null,
            sort_order: order,
          }
        })
        await supabase.from('vehicle_modifications').insert(rows)
      }
    }

    if (form.location) {
      await supabase.from('profiles').update({ location: form.location }).eq('id', user.id)
    }
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    router.push(`/user/${profile?.username}/${slug}`)
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>
          Build Your <span style={{ color: '#fb923c' }}>Garage</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#8892a4' }}>Add your ride to The Scene</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>

        {/* Vehicle Info */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>Vehicle Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Year *</label>
              <select name="year" value={form.year} onChange={handleChange} className="input" required>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Make *</label>
              <input name="make" value={form.make} onChange={handleChange} className="input" placeholder="Chevrolet" required maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Model *</label>
              <input name="model" value={form.model} onChange={handleChange} className="input" placeholder="Camaro" required maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Body Style</label>
              <select name="trim" value={form.trim} onChange={handleChange} className="input">
                <option value="">Select type</option>
                {BODY_STYLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color *</label>
              <input name="color" value={form.color} onChange={handleChange} className="input" placeholder="Jungle Green" required maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Mileage</label>
              <input name="mileage" value={form.mileage} onChange={handleChange} className="input" placeholder="48,000" maxLength={128} />
            </div>
          </div>
        </div>

        {/* Powertrain */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>Powertrain</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Engine</label>
              <input name="engine" value={form.engine} onChange={handleChange} className="input" placeholder="6.2L LS3 V8" maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Horsepower</label>
              <input name="horsepower" value={form.horsepower} onChange={handleChange} className="input" placeholder="725 WHP" maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Transmission</label>
              <select name="transmission" value={form.transmission} onChange={handleChange} className="input">
                <option value="">Select</option>
                {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Drivetrain</label>
              <select name="drivetrain" value={form.drivetrain} onChange={handleChange} className="input">
                <option value="">Select</option>
                {DRIVETRAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Build Status */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>Build Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '8px' }}>
            {BUILD_STATUSES.map((status) => (
              <label
                key={status.value}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
                  background: form.build_status === status.value ? 'rgba(124,58,237,0.15)' : 'rgba(18,18,30,0.5)',
                  border: form.build_status === status.value ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  fontSize: '12px', fontWeight: 600,
                  color: form.build_status === status.value ? '#a78bfa' : '#8892a4',
                }}
              >
                <input type="radio" name="build_status" value={status.value} checked={form.build_status === status.value} onChange={handleChange} style={{ display: 'none' }} />
                {status.label}
              </label>
            ))}
          </div>
        </div>

        {/* Location & Community */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>Location & Community</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Location</label>
              <AddressAutocomplete
                defaultValue={form.location}
                placeholder="Start typing your city..."
                mode="city"
                onChange={(a) => {
                  const value = [a.city, a.state].filter(Boolean).join(', ')
                  if (value) setForm({ ...form, location: value })
                }}
              />
              <p style={hintStyle}>Pick your city — it drops a pin on the heatmaps and shows up on the feed</p>
            </div>
            <div>
              <label style={labelStyle}>Club Affiliation</label>
              <input name="club_affiliation" value={form.club_affiliation} onChange={handleChange} className="input" placeholder="Lone Star SS Club" maxLength={128} />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="glass" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <div style={sectionTitle}>About This Build</div>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="input"
            rows={4}
            placeholder="Tell the story of your build..."
            maxLength={2000}
          />
        </div>

        {/* Modifications */}
        <div className="glass" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <div style={sectionTitle}>Modifications</div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>Optional — list what you&apos;ve done to your build. You can add more later from the edit page.</p>
          <VehicleModsDraft mods={draftMods} onChange={setDraftMods} />
        </div>

        {/* Photos */}
        <div className="glass" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <div style={sectionTitle}>Photos</div>
          <p style={hintStyle as React.CSSProperties}>Upload photos of your ride. The first photo will be your primary image.</p>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '28px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))} style={{ display: 'none' }} />
            <span style={{ fontSize: '14px', color: '#8892a4' }}>Click to select photos (JPEG, PNG, WebP)</span>
          </label>
          {photoFiles.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {photoFiles.map((f, i) => (
                <div key={i} style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {i === 0 && <span style={{ fontSize: '10px', fontWeight: 700 }}>PRIMARY</span>}
                  {f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visibility */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>Visibility</div>
          <p style={{ fontSize: '13px', color: '#8892a4', marginBottom: '12px' }}>You can change this anytime in settings.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px',
              borderRadius: '12px', cursor: 'pointer',
              background: form.visibility === 'public' ? 'rgba(124,58,237,0.1)' : 'rgba(18,18,30,0.5)',
              border: form.visibility === 'public' ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <input type="radio" name="visibility" value="public" checked={form.visibility === 'public'} onChange={handleChange} style={{ display: 'none' }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: form.visibility === 'public' ? '#a78bfa' : '#8892a4', display: 'block' }}>Public</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Visible to everyone</span>
              </div>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px',
              borderRadius: '12px', cursor: 'pointer',
              background: form.visibility === 'private' ? 'rgba(124,58,237,0.1)' : 'rgba(18,18,30,0.5)',
              border: form.visibility === 'private' ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <input type="radio" name="visibility" value="private" checked={form.visibility === 'private'} onChange={handleChange} style={{ display: 'none' }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: form.visibility === 'private' ? '#a78bfa' : '#8892a4', display: 'block' }}>Private</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Link only</span>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div style={{ gridColumn: '1 / -1', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#ef4444', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            gridColumn: '1 / -1',
            width: '100%', padding: '16px', borderRadius: '12px',
            background: '#f97316', border: '1px solid #fb923c', color: '#0c0c14',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
          }}
        >
          {loading ? 'Creating your garage...' : 'Create Garage'}
        </button>
      </form>
    </div>
  )
}
