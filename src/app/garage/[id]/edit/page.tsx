'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ShopTagger from '@/components/ShopTagger'
import VehicleMods from '@/components/VehicleMods'

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
const YEARS = Array.from({ length: new Date().getFullYear() - 1919 }, (_, i) => new Date().getFullYear() + 1 - i)

const labelStyle = { display: 'block' as const, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#8892a4', marginBottom: '6px' }
const sectionTitle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#e2e4e9', marginBottom: '14px' }

export default function EditVehiclePage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const vehicleId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    year: '', make: '', model: '', trim: '', color: '', engine: '',
    transmission: '', drivetrain: '', horsepower: '', mileage: '',
    build_status: 'stock', bio: '', is_public: true,
  })

  useEffect(() => {
    const load = async () => {
      const { data: v } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single()
      if (v) {
        setForm({
          year: v.year?.toString() || '',
          make: v.make || '',
          model: v.model || '',
          trim: v.trim || '',
          color: v.color || '',
          engine: v.engine || '',
          transmission: v.transmission || '',
          drivetrain: v.drivetrain || '',
          horsepower: v.horsepower || '',
          mileage: v.mileage || '',
          build_status: v.build_status || 'stock',
          bio: v.bio || '',
          is_public: v.is_public !== false,
        })
      }
      setLoading(false)
    }
    load()
  }, [vehicleId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase.from('vehicles').update({
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
      is_public: form.is_public,
      updated_at: new Date().toISOString(),
    }).eq('id', vehicleId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Vehicle updated!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this vehicle? This removes all photos, mods, guestbook entries, and cannot be undone.')
    if (!confirmed) return
    const typed = window.prompt('Type "delete" to confirm:')
    if (typed?.toLowerCase() !== 'delete') return

    await supabase.from('vehicles').delete().eq('id', vehicleId)
    router.push('/garage')
  }

  if (loading) return <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: '#8892a4' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/garage" style={{ fontSize: '13px', color: '#8892a4', display: 'block', marginBottom: '20px' }}>&larr; Back to Garage</Link>

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>
        Edit <span style={{ color: '#fb923c' }}>{form.year} {form.make} {form.model}</span>
      </h1>
      <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '28px' }}>Update your vehicle details</p>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '16px', fontSize: '13px', color: '#22c55e' }}>{message}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>
        {/* Vehicle Info */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>Vehicle Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Year</label>
              <select name="year" value={form.year} onChange={handleChange} className="input">
                <option value="">Select</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Make</label>
              <input name="make" value={form.make} onChange={handleChange} className="input" maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input name="model" value={form.model} onChange={handleChange} className="input" maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Body Style</label>
              <select name="trim" value={form.trim} onChange={handleChange} className="input">
                <option value="">Select</option>
                {BODY_STYLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <input name="color" value={form.color} onChange={handleChange} className="input" maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Mileage</label>
              <input name="mileage" value={form.mileage} onChange={handleChange} className="input" maxLength={128} />
            </div>
          </div>
        </div>

        {/* Powertrain */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>Powertrain</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Engine</label>
              <input name="engine" value={form.engine} onChange={handleChange} className="input" maxLength={128} />
            </div>
            <div>
              <label style={labelStyle}>Horsepower</label>
              <input name="horsepower" value={form.horsepower} onChange={handleChange} className="input" maxLength={128} />
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
              <label key={status.value} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '20px', cursor: 'pointer',
                background: form.build_status === status.value ? 'rgba(124,58,237,0.15)' : 'rgba(18,18,30,0.5)',
                border: form.build_status === status.value ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                fontSize: '12px', fontWeight: 600, color: form.build_status === status.value ? '#a78bfa' : '#8892a4',
              }}>
                <input type="radio" name="build_status" value={status.value} checked={form.build_status === status.value} onChange={handleChange} style={{ display: 'none' }} />
                {status.label}
              </label>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>About This Build</div>
          <textarea name="bio" value={form.bio} onChange={handleChange} className="input" rows={4} maxLength={2000} placeholder="Tell the story of your build..." />
        </div>

        {/* Modifications — full width for its categorized sub-layout */}
        <div className="glass" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <div style={sectionTitle}>Modifications</div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>List what you&apos;ve done to your build. Categorized so visitors can scan quickly.</p>
          <VehicleMods vehicleId={vehicleId} />
        </div>

        {/* Shops — full width */}
        <div className="glass" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <div style={sectionTitle}>Shops That Worked On This Build</div>
          <ShopTagger vehicleId={vehicleId} />
        </div>

        {/* Visibility */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={sectionTitle}>Visibility</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '12px', cursor: 'pointer',
              background: form.is_public ? 'rgba(124,58,237,0.1)' : 'rgba(18,18,30,0.5)',
              border: form.is_public ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <input type="radio" name="is_public" value="true" checked={form.is_public === true} onChange={() => setForm({ ...form, is_public: true })} style={{ display: 'none' }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: form.is_public ? '#a78bfa' : '#8892a4', display: 'block' }}>Public</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Visible to everyone</span>
              </div>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '12px', cursor: 'pointer',
              background: !form.is_public ? 'rgba(124,58,237,0.1)' : 'rgba(18,18,30,0.5)',
              border: !form.is_public ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <input type="radio" name="is_public" value="false" checked={form.is_public === false} onChange={() => setForm({ ...form, is_public: false })} style={{ display: 'none' }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: !form.is_public ? '#a78bfa' : '#8892a4', display: 'block' }}>Private</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Link only</span>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div style={{ gridColumn: '1 / -1', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#ef4444', fontSize: '13px' }}>{error}</div>
        )}

        {/* Actions */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving} style={{
            flex: 1, padding: '16px', borderRadius: '12px',
            background: '#f97316', border: '1px solid #fb923c', color: '#0c0c14',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1,
          }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/garage/${vehicleId}/photos`} style={{
            padding: '16px 24px', borderRadius: '12px',
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa',
            fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            Photos
          </Link>
        </div>

        {/* Delete */}
        <button type="button" onClick={handleDelete} style={{
          gridColumn: '1 / -1',
          width: '100%', padding: '12px', borderRadius: '8px',
          background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
        }}>
          Delete this vehicle permanently
        </button>
      </form>
    </div>
  )
}
