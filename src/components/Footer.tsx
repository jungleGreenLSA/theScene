import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '48px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '32px', marginBottom: '24px', textAlign: 'center' }}>
          <div>
            <h4 className="eyebrow" style={{ marginBottom: '14px' }}>Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/explore" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Explore</Link></li>
              <li><Link href="/feed" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Feed</Link></li>
              <li><Link href="/events" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Events</Link></li>
              <li><Link href="/clubs" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Clubs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow" style={{ marginBottom: '14px' }}>Community</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/auth/register" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Join The Scene</Link></li>
              <li><Link href="/guidelines" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow" style={{ marginBottom: '14px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/privacy" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Terms of Service</Link></li>
              <li><Link href="/cookies" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            &copy; {new Date().getFullYear()} The Scene. All rights reserved.
          </p>
          <p style={{ fontSize: '12px' }}>
            <a href="mailto:support@thescene.fyi" style={{ color: '#2dd4bf', textDecoration: 'none' }}>Contact Support</a>
            <span style={{ color: '#3a3a4a', margin: '0 8px' }}>|</span>
            <span style={{ color: '#6b7280' }}>support@thescene.fyi</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
