'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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

  if (loading) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--color-muted-light)' }}>Loading...</div>
  if (!listing) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--color-muted-light)' }}>Listing not found</div>

  const isSeller = currentUser === listing.seller_id
  const isActive = listing.status === 'active'
  const isPending = listing.status === 'pending'
  const isClosed = listing.status === 'closed'
  const isSold = listing.status === 'sold'

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/marketplace" style={{ fontSize: '13px', color: 'var(--color-accent)', display: 'block', marginBottom: '20px' }}>&larr; Back to Marketplace</Link>

      {/* Status banner */}
      {isPending && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(242,169,0,0.1)', border: '1px solid rgba(242,169,0,0.3)', marginBottom: '16px', fontSize: '13px', color: 'var(--color-accent-light)', fontWeight: 600 }}>
          Offer accepted -- deal pending
        </div>
      )}
      {isSold && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(86,194,113,0.1)', border: '1px solid rgba(86,194,113,0.3)', marginBottom: '16px', fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>
          This item has been sold
        </div>
      )}
      {isClosed && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(229,72,77,0.1)', border: '1px solid rgba(229,72,77,0.3)', marginBottom: '16px', fontSize: '13px', color: 'var(--color-danger)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Listing closed</span>
          {isSeller && <button onClick={handleRelistListing} style={{ background: 'var(--color-accent)', border: 'none', color: 'var(--color-background)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Re-list</button>}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="panel" style={{ overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ height: '350px', background: 'var(--color-surface-light)' }}>
            <img src={images[mainImage]?.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--color-background)' }} />
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', padding: '10px' }}>
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setMainImage(i)} style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: mainImage === i ? '2px solid var(--color-accent)' : '2px solid transparent', cursor: 'pointer', padding: 0, background: 'var(--color-surface-light)' }}>
                  <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listing info */}
      <div className="panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className={listing.listing_type === 'vehicle' ? 'chip chip-purple' : 'chip'}>
            {listing.listing_type}
          </span>
          {listing.is_obo && <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: 'rgba(86,194,113,0.1)', color: 'var(--color-success)', border: '1px solid rgba(86,194,113,0.2)' }}>OBO</span>}
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '8px' }}>{listing.title}</h1>
        <p className="spec" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '16px' }}>${parseFloat(listing.price).toLocaleString()}{listing.is_obo && <span style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginLeft: '8px' }}>or best offer</span>}</p>

        {listing.description && (
          <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{listing.description}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <Link href={`/user/${listing.seller?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-surface-light)', backgroundImage: listing.seller?.avatar_url ? `url(${listing.seller.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground)' }}>{listing.seller?.display_name || listing.seller?.username}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{listing.seller?.location || 'Location N/A'}</p>
            </div>
          </Link>
        </div>

        {/* Seller actions */}
        {isSeller && isActive && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleCloseListing} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(229,72,77,0.1)', border: '1px solid rgba(229,72,77,0.2)', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Close Listing</button>
            <button onClick={handleMarkSold} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(86,194,113,0.1)', border: '1px solid rgba(86,194,113,0.2)', color: 'var(--color-success)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Mark as Sold</button>
          </div>
        )}
      </div>

      {/* Public comments / offers */}
      <div className="panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '16px' }}>Public Offers & Questions</h2>

        {/* Comment input */}
        {isActive && currentUser && (
          <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-surface-lowest)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px', background: !isOffer ? 'rgba(242,169,0,0.12)' : 'var(--color-surface-lowest)', color: !isOffer ? 'var(--color-accent)' : 'var(--color-muted)', border: !isOffer ? '1px solid rgba(242,169,0,0.3)' : '1px solid var(--color-border)' }}>
                <input type="radio" checked={!isOffer} onChange={() => setIsOffer(false)} style={{ display: 'none' }} />
                Question
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px', background: isOffer ? 'rgba(86,194,113,0.15)' : 'var(--color-surface-lowest)', color: isOffer ? 'var(--color-success)' : 'var(--color-muted)', border: isOffer ? '1px solid rgba(86,194,113,0.3)' : '1px solid var(--color-border)' }}>
                <input type="radio" checked={isOffer} onChange={() => setIsOffer(true)} style={{ display: 'none' }} />
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
              <button onClick={handleComment} disabled={posting || (!commentText.trim() && !offerAmount)} style={{ padding: '10px 20px', borderRadius: '8px', background: isOffer ? 'var(--color-success)' : 'var(--color-accent)', border: 'none', color: 'var(--color-background)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: posting ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                {isOffer ? 'Submit Offer' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center', padding: '16px' }}>No offers or questions yet. Be the first!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comments.map(c => (
              <div key={c.id} style={{ padding: '14px', borderRadius: '8px', background: c.is_offer ? 'rgba(86,194,113,0.05)' : 'var(--color-surface-lowest)', border: `1px solid ${c.is_offer ? 'rgba(86,194,113,0.15)' : 'var(--color-surface-light)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Link href={`/user/${c.author?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-surface-light)', backgroundImage: c.author?.avatar_url ? `url(${c.author.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>{c.author?.display_name || c.author?.username}</span>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {c.is_offer && c.offer_amount && (
                      <span className="spec" style={{ fontSize: '16px', fontWeight: 700, color: c.offer_status === 'accepted' ? 'var(--color-success)' : 'var(--color-accent)' }}>
                        ${c.offer_amount.toLocaleString()}
                      </span>
                    )}
                    {c.is_offer && c.offer_status === 'accepted' && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(86,194,113,0.2)', color: 'var(--color-success)' }}>ACCEPTED</span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                {c.content && <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>{c.content}</p>}

                {/* Accept offer button (seller only) */}
                {isSeller && c.is_offer && c.offer_status === 'pending' && isActive && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleAcceptOffer(c.id, c.author?.username)} style={{ padding: '6px 14px', borderRadius: '6px', background: 'var(--color-success)', border: 'none', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Accept Offer</button>
                    <button onClick={async () => { await supabase.from('listing_comments').update({ offer_status: 'declined' }).eq('id', c.id); window.location.reload() }} style={{ padding: '6px 14px', borderRadius: '6px', background: 'rgba(229,72,77,0.1)', border: '1px solid rgba(229,72,77,0.2)', color: 'var(--color-danger)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Decline</button>
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
