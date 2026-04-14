'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const BUILD_STATUSES = [
  { value: 'stock', label: 'Stock' },
  { value: 'lightly_modified', label: 'Lightly Modified' },
  { value: 'modified', label: 'Modified' },
  { value: 'full_build', label: 'Full Build' },
  { value: 'race_car', label: 'Race Car' },
  { value: 'project', label: 'Project' },
]

export default function GarageSetupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (!user) {
      setError('You must be signed in')
      setLoading(false)
      return
    }

    // Generate slug from vehicle details
    const slug = `${form.year}-${form.make}-${form.model}-${form.color}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const { error: insertError } = await supabase.from('vehicles').insert({
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
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      // Update profile location if provided
      if (form.location) {
        await supabase.from('profiles').update({ location: form.location }).eq('id', user.id)
      }

      // Get username for redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      router.push(`/user/${profile?.username}/${slug}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Build Your <span className="text-neon-light text-glow-neon">Garage</span>
        </h1>
        <p className="text-muted-light">Tell us about your ride</p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 space-y-6">
        {/* Vehicle basics */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            🚗 Vehicle Info
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Year *</label>
              <input name="year" value={form.year} onChange={handleChange} className="input" placeholder="2015" required type="number" min="1900" max="2030" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Make *</label>
              <input name="make" value={form.make} onChange={handleChange} className="input" placeholder="Chevrolet" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Model *</label>
              <input name="model" value={form.model} onChange={handleChange} className="input" placeholder="SS" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Trim</label>
              <input name="trim" value={form.trim} onChange={handleChange} className="input" placeholder="SS" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Color *</label>
              <input name="color" value={form.color} onChange={handleChange} className="input" placeholder="Jungle Green" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Mileage</label>
              <input name="mileage" value={form.mileage} onChange={handleChange} className="input" placeholder="47,000" />
            </div>
          </div>
        </div>

        {/* Powertrain */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            ⚡ Powertrain
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Engine</label>
              <input name="engine" value={form.engine} onChange={handleChange} className="input" placeholder="6.2L LS3 V8" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Transmission</label>
              <input name="transmission" value={form.transmission} onChange={handleChange} className="input" placeholder="6-Speed Auto" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Drivetrain</label>
              <input name="drivetrain" value={form.drivetrain} onChange={handleChange} className="input" placeholder="RWD" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Horsepower</label>
              <input name="horsepower" value={form.horsepower} onChange={handleChange} className="input" placeholder="725 WHP" />
            </div>
          </div>
        </div>

        {/* Build status */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            🔧 Build Status
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {BUILD_STATUSES.map((status) => (
              <label
                key={status.value}
                className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                  form.build_status === status.value
                    ? 'border-purple bg-purple/10 text-purple-light'
                    : 'border-border bg-surface hover:border-border-hover text-muted-light'
                }`}
              >
                <input
                  type="radio"
                  name="build_status"
                  value={status.value}
                  checked={form.build_status === status.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                {status.label}
              </label>
            ))}
          </div>
        </div>

        {/* Location & Community */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            📍 Location &amp; Community
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Location (City, State or Zip)</label>
              <input name="location" value={form.location} onChange={handleChange} className="input" placeholder="Dallas, TX or 75201" />
              <p className="text-xs text-muted mt-1">Helps others find builds near them</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Club Affiliation</label>
              <input name="club_affiliation" value={form.club_affiliation} onChange={handleChange} className="input" placeholder="Lone Star SS Club" />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            📝 About This Build
          </h2>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="input"
            rows={4}
            placeholder="Tell the story of your build... What makes it special? What have you done to it? What are your plans?"
          />
        </div>

        {/* Visibility */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            🔒 Visibility
          </h2>
          <p className="text-muted-light text-sm mb-4">Choose who can see your garage page. You can change this anytime in settings.</p>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                form.visibility === 'public'
                  ? 'border-purple bg-purple/10'
                  : 'border-border bg-surface hover:border-border-hover'
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={form.visibility === 'public'}
                onChange={handleChange}
                className="sr-only"
              />
              <div>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🌎</span>
                <span className={`text-sm font-semibold block ${form.visibility === 'public' ? 'text-purple-light' : 'text-muted-light'}`}>Public</span>
                <span className="text-xs text-muted block mt-1">Anyone can find and view your garage, specs, mods, photos, and guestbook.</span>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                form.visibility === 'private'
                  ? 'border-purple bg-purple/10'
                  : 'border-border bg-surface hover:border-border-hover'
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={form.visibility === 'private'}
                onChange={handleChange}
                className="sr-only"
              />
              <div>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🔒</span>
                <span className={`text-sm font-semibold block ${form.visibility === 'private' ? 'text-purple-light' : 'text-muted-light'}`}>Private</span>
                <span className="text-xs text-muted block mt-1">Only people with your direct link can view your garage. Hidden from search and explore.</span>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-neon justify-center py-4 text-base disabled:opacity-50"
        >
          {loading ? 'Creating your garage...' : '🏁 Create My Garage'}
        </button>
      </form>
    </div>
  )
}
