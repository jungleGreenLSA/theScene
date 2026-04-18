'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/imageUpload'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  color: string
}

export default function EventPhotoUpload({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setLoggedIn(true)

      const { data } = await supabase
        .from('vehicles')
        .select('id, year, make, model, color')
        .eq('owner_id', user.id)

      if (data && data.length > 0) {
        setVehicles(data)
        setSelectedVehicle(data[0].id)
      }
    }
    loadUserData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Validate file
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setMessage('Only JPEG, PNG, and WebP images are allowed.')
      setLoading(false)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be under 5MB.')
      setLoading(false)
      return
    }

    // Upload to storage
    const compressed = await compressImage(file)
    const filename = `event_photos/${user.id}/${Date.now()}_${compressed.name}`
    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filename, compressed)

    if (uploadError) {
      setMessage('Upload failed: ' + uploadError.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)

    // Create the photo post
    const { error: insertError } = await supabase.from('event_photo_posts').insert({
      event_id: eventId,
      author_id: user.id,
      vehicle_id: selectedVehicle || null,
      image_url: urlData.publicUrl,
      caption: caption.trim(),
    })

    if (insertError) {
      setMessage('Failed to create post: ' + insertError.message)
    } else {
      setMessage('Photo posted! Refresh to see it in the feed.')
      setCaption('')
      setFile(null)
    }
    setLoading(false)
  }

  if (!loggedIn) {
    return (
      <div className="glass p-6 mb-6 text-center">
        <p className="text-muted-light">Sign in to share your photos from this event.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-6 mb-6">
      <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Share a Photo from {eventTitle}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Photo</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-purple/20 file:text-purple-light file:cursor-pointer"
            required
          />
        </div>
        {vehicles.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Your Vehicle</label>
            <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="input">
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} — {v.color}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">Caption (optional)</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="input"
          placeholder="Great show! Here's my car under the lights..."
          maxLength={300}
        />
      </div>

      {message && (
        <p className={`text-sm mb-3 ${message.includes('posted') ? 'text-success' : 'text-danger'}`}>{message}</p>
      )}

      <button type="submit" disabled={loading || !file} className="btn-neon text-xs disabled:opacity-50">
        {loading ? 'Uploading...' : '📸 Post Photo'}
      </button>
    </form>
  )
}
