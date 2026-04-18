'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { compressImage } from '@/lib/imageUpload'

export default function CreateListingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const [form, setForm] = useState({ listing_type: 'vehicle', title: '', description: '', price: '', is_obo: false })

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
      // Allow admin or premium
      if (data?.subscription_tier === 'premium') setIsPremium(true)
      // Also check role
      const { data: role } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (role?.role === 'admin') setIsPremium(true)
    }
    check()
  }, [])

  const maxPhotos = form.listing_type === 'vehicle' ? 6 : 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPremium) { setError('Premium membership required to list items'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get seller location
    const { data: profile } = await supabase.from('profiles').select('location').eq('id', user.id).single()
    const locParts = (profile?.location || '').split(',').map((s: string) => s.trim())

    const { data: listing, error: listingError } = await supabase.from('listings').insert({
      seller_id: user.id,
      listing_type: form.listing_type,
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      is_obo: form.is_obo,
      city: locParts[0] || '',
      state: locParts[1] || '',
    }).select().single()

    if (listingError) { setError(listingError.message); setLoading(false); return }

    // Upload images
    for (let i = 0; i < Math.min(files.length, maxPhotos); i++) {
      const file = files[i]
      const filename = `marketplace/${user.id}/${Date.now()}_${i}.${file.name.split('.').pop()}`
      const { error: uploadErr } = await supabase.storage.from('posts').upload(filename, await compressImage(file))
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
        await supabase.from('listing_images').insert({ listing_id: listing.id, image_url: urlData.publicUrl, sort_order: i })
      }
    }

    router.push(`/marketplace/${listing.id}`)
  }

  if (!isPremium) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <div className="glass" style={{ padding: '48px 32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>Premium Feature</h1>
          <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '24px', lineHeight: 1.6 }}>
            Listing items for sale is a premium feature. Anyone can browse and interact with listings, but posting requires a premium membership.
          </p>
          <Link href="/pricing" style={{ padding: '12px 28px', borderRadius: '8px', background: '#f97316', color: '#0c0c14', fontSize: '14px', fontWeight: 700 }}>Upgrade to Premium - $4.99/mo</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/marketplace" style={{ fontSize: '13px', color: '#8892a4', display: 'block', marginBottom: '20px' }}>&larr; Back to Marketplace</Link>

      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>
        List an <span style={{ color: '#fb923c' }}>Item</span>
      </h1>
      <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '28px' }}>All offers and questions are public for transparency</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#8892a4', marginBottom: '6px' }}>Type *</label>
              <select value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value })} className="input">
                <option value="vehicle">Vehicle for Sale</option>
                <option value="parts">Parts for Sale</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#8892a4', marginBottom: '6px' }}>Price * ($)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="0.00" required style={{ flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#8892a4', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={form.is_obo} onChange={(e) => setForm({ ...form, is_obo: e.target.checked })} />
                  OBO
                </label>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#8892a4', marginBottom: '6px' }}>Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder={form.listing_type === 'vehicle' ? '2015 Chevrolet SS - Jungle Green' : 'Kooks Long Tube Headers for LS3'} required maxLength={128} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#8892a4', marginBottom: '6px' }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={4} placeholder="Describe what you're selling, condition, reason for selling..." maxLength={2000} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#8892a4', marginBottom: '6px' }}>Photos (max {maxPhotos})</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, maxPhotos))} className="input" style={{ fontSize: '13px' }} />
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{files.length} of {maxPhotos} photos selected</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#ef4444', fontSize: '13px' }}>{error}</div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '16px', borderRadius: '12px',
          background: '#f97316', border: '1px solid #fb923c', color: '#0c0c14',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1,
        }}>
          {loading ? 'Posting...' : 'Post Listing'}
        </button>
      </form>
    </div>
  )
}
