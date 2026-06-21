'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Skeleton from '@/components/Skeleton'

interface Comment {
  id: string
  content: string
  is_offer: boolean
  offer_amount: number | null
  offer_status: string
  created_at: string
  author: { username: string; display_name: string; avatar_url: string }
}

export default function ListingDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const listingId = params.id as string

  const [listing, setListing] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [isOffer, setIsOffer] = useState(false)
  const [posting, setPosting] = useState(false)
  const [mainImage, setMainImage] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUser(user.id)

      const { data: l } = await supabase.from('listings')
        .select('*, seller:profiles!listings_seller_id_fkey(username, display_name, avatar_url, location)')
        .eq('id', listingId).single()
      setListing(l)

      const { data: imgs } = await supabase.from('listing_images').select('*').eq('listing_id', listingId).order('sort_order')
      setImages(imgs || [])

      const { data: cmts } = await supabase.from('listing_comments')
        .select('*, author:profiles!listing_comments_author_id_fkey(username, display_name, avatar_url)')
        .eq('listing_id', listingId).order('created_at', { ascending: true })
      setComments((cmts || []) as unknown as Comment[])

      setLoading(false)
    }
    fetch()
  }, [listingId])

  const handleComment = async () => {
    if (!commentText.trim() && !offerAmount) return
    setPosting(true)

    await supabase.from('listing_comments').insert({
      listing_id: listingId,
      author_id: currentUser,
      content: commentText.trim() || (isOffer ? `Offering $${offerAmount}` : ''),
      is_offer: isOffer,
      offer_amount: isOffer && offerAmount ? parseFloat(offerAmount) : null,
    })

    // Refresh comments
    const { data } = await supabase.from('listing_comments')
      .select('*, author:profiles!listing_comments_author_id_fkey(username, display_name, avatar_url)')
      .eq('listing_id', listingId).order('created_at', { ascending: true })
    setComments((data || []) as unknown as Comment[])

    setCommentText('')
    setOfferAmount('')
    setIsOffer(false)
    setPosting(false)
  }

  const handleAcceptOffer = async (commentId: string, buyerUsername: string) => {
    await supabase.from('listing_comments').update({ offer_status: 'accepted' }).eq('id', commentId)
    await supabase.from('listings').update({ status: 'pending', accepted_offer_id: commentId }).eq('id', listingId)
    window.location.reload()
  }

  const handleCloseListing = async () => {
    const confirmed = window.confirm('Close this listing? It can be re-listed within 7 days.')
    if (!confirmed) return
    await supabase.from('listings').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', listingId)
    window.location.reload()
  }

  const handleRelistListing = async () => {
    await supabase.from('listings').update({ status: 'active', closed_at: null }).eq('id', listingId)
    window.location.reload()
  }

  const handleMarkSold = async () => {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', listingId)
    window.location.reload()
  }

  if (loading) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px' }}><Skeleton variant="card" count={2} /></div>
  if (!listing) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: '#666666' }}>Listing not found</div>

  const isSeller = currentUser === listing.seller_id
  const isActive = listing.status === 'active'
  const isPending = listing.status === 'pending'
  const isClosed = listing.status === 'closed'
  const isSold = listing.status === 'sold'

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/marketplace" style={{ fontSize: '13px', color: '#666666', display: 'block', marginBottom: '20px' }}>&larr; Back to Marketplace</Link>

      {/* Status banner */}
      {isPending && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(95, 168, 221, 0.1)', border: '1px solid rgba(95, 168, 221, 0.3)', marginBottom: '16px', fontSize: '13px', color: 'var(--color-link)', fontWeight: 600 }}>
          Offer accepted -- deal pending
        </div>
      )}
      {isSold && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '16px', fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>
          This item has been sold
        </div>
      )}
      {isClosed && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '16px', fontSize: '13px', color: 'var(--color-danger)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Listing closed</span>
          {isSeller && <button onClick={handleRelistListing} style={{ background: '#2c79c4', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Re-list</button>}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="glass" style={{ overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ height: '350px', background: '#e4e4e4' }}>
            <img src={images[mainImage]?.image_url} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0c0c14' }} />
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', padding: '10px' }}>
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setMainImage(i)} aria-label={`View photo ${i + 1} of ${listing.title}`} style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: mainImage === i ? '2px solid #5fa8dd' : '2px solid transparent', cursor: 'pointer', padding: 0, background: '#e4e4e4' }}>
                  <img src={img.image_url} alt={`${listing.title} photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listing info */}
      <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '3px 10px', borderRadius: '4px', background: listing.listing_type === 'vehicle' ? 'rgba(44, 121, 196, 0.1)' : 'rgba(95, 168, 221, 0.1)', color: listing.listing_type === 'vehicle' ? '#5fa8dd' : '#90caf9', border: `1px solid ${listing.listing_type === 'vehicle' ? 'rgba(44, 121, 196, 0.2)' : 'rgba(95, 168, 221, 0.2)'}` }}>
            {listing.listing_type}
          </span>
          {listing.is_obo && <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', border: '1px solid rgba(34,197,94,0.2)' }}>OBO</span>}
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>{listing.title}</h1>
        <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-success)', marginBottom: '16px' }}>${parseFloat(listing.price).toLocaleString()}{listing.is_obo && <span style={{ fontSize: '14px', color: '#666666', marginLeft: '8px' }}>or best offer</span>}</p>

        {listing.description && (
          <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{listing.description}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e4e4e4' }}>
          <Link href={`/user/${listing.seller?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e4e4e4', backgroundImage: listing.seller?.avatar_url ? `url(${listing.seller.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{listing.seller?.display_name || listing.seller?.username}</p>
              <p style={{ fontSize: '12px', color: '#555555' }}>{listing.seller?.location || 'Location N/A'}</p>
            </div>
          </Link>
        </div>

        {/* Seller actions */}
        {isSeller && isActive && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleCloseListing} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Close Listing</button>
            <button onClick={handleMarkSold} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--color-success)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Mark as Sold</button>
          </div>
        )}
      </div>

      {/* Public comments / offers */}
      <div className="glass" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '16px' }}>Public Offers & Questions</h2>

        {/* Comment input */}
        {isActive && currentUser && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f0f0', borderRadius: '8px', border: '1px solid #e4e4e4' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px', background: !isOffer ? 'rgba(44, 121, 196, 0.15)' : '#f0f0f0', color: !isOffer ? '#5fa8dd' : '#555555', border: !isOffer ? '1px solid rgba(44, 121, 196, 0.3)' : '1px solid #e4e4e4' }}>
                <input type="radio" checked={!isOffer} onChange={() => setIsOffer(false)} className="sr-only" aria-label="Post a question" />
                Question
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px', background: isOffer ? 'rgba(34,197,94,0.15)' : '#f0f0f0', color: isOffer ? '#22c55e' : '#555555', border: isOffer ? '1px solid rgba(34,197,94,0.3)' : '1px solid #e4e4e4' }}>
                <input type="radio" checked={isOffer} onChange={() => setIsOffer(true)} className="sr-only" aria-label="Make an offer" />
                Make Offer
              </label>
            </div>
            {isOffer && (
              <div style={{ marginBottom: '10px' }}>
                <input type="number" step="0.01" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="input" placeholder="Your offer amount ($)" style={{ maxWidth: '200px' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} className="input" placeholder={isOffer ? 'Add a note with your offer (optional)...' : 'Ask the seller a question...'} maxLength={500} style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') handleComment() }} />
              <button onClick={handleComment} disabled={posting || (!commentText.trim() && !offerAmount)} style={{ padding: '10px 20px', borderRadius: '8px', background: isOffer ? '#22c55e' : '#2c79c4', border: 'none', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: posting ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                {isOffer ? 'Submit Offer' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#555555', textAlign: 'center', padding: '16px' }}>No offers or questions yet. Be the first!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comments.map(c => (
              <div key={c.id} style={{ padding: '14px', borderRadius: '8px', background: c.is_offer ? 'rgba(34,197,94,0.05)' : '#f0f0f0', border: `1px solid ${c.is_offer ? 'rgba(34,197,94,0.15)' : '#f5f5f5'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Link href={`/user/${c.author?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e4e4e4', backgroundImage: c.author?.avatar_url ? `url(${c.author.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{c.author?.display_name || c.author?.username}</span>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {c.is_offer && c.offer_amount && (
                      <span style={{ fontSize: '16px', fontWeight: 700, color: c.offer_status === 'accepted' ? 'var(--color-success)' : 'var(--color-link)' }}>
                        ${c.offer_amount.toLocaleString()}
                      </span>
                    )}
                    {c.is_offer && c.offer_status === 'accepted' && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.2)', color: 'var(--color-success)' }}>ACCEPTED</span>
                    )}
                    <span style={{ fontSize: '11px', color: '#555555' }}>
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                {c.content && <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.5 }}>{c.content}</p>}

                {/* Accept offer button (seller only) */}
                {isSeller && c.is_offer && c.offer_status === 'pending' && isActive && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleAcceptOffer(c.id, c.author?.username)} style={{ padding: '6px 14px', borderRadius: '6px', background: '#22c55e', border: 'none', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Accept Offer</button>
                    <button onClick={async () => { await supabase.from('listing_comments').update({ offer_status: 'declined' }).eq('id', c.id); window.location.reload() }} style={{ padding: '6px 14px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
