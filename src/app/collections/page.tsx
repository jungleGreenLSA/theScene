'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SavedItem {
  id: string
  target_type: string
  target_id: string
  note: string
  created_at: string
}

export default function CollectionsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [collectionId, setCollectionId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get or create default collection
      let { data: collection } = await supabase.from('collections').select('id').eq('user_id', user.id).eq('name', 'Saved').single()

      if (!collection) {
        const { data: newCol } = await supabase.from('collections').insert({ user_id: user.id, name: 'Saved' }).select().single()
        collection = newCol
      }

      if (collection) {
        setCollectionId(collection.id)
        const { data } = await supabase.from('collection_items').select('*').eq('collection_id', collection.id).order('created_at', { ascending: false })
        setItems((data || []) as SavedItem[])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px', textAlign: 'center' }} className="text-muted-light">Loading...</div>


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>My <span className="gradient-text">Collections</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.85rem', marginBottom: '24px' }}>Builds, events, and mods you&apos;ve saved for later</p>

      {items.length === 0 ? (
        <div className="panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>Nothing saved yet</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>When browsing, use the save button to bookmark builds and events you like.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => (
            <div key={item.id} className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="eyebrow" style={{ fontSize: '10px' }}>{item.target_type}</span>
                {item.note && <p className="text-muted-light" style={{ fontSize: '13px', marginTop: '4px' }}>{item.note}</p>}
                <p className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>Saved {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <button
                onClick={async () => {
                  await supabase.from('collection_items').delete().eq('id', item.id)
                  setItems(items.filter(i => i.id !== item.id))
                }}
                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
