import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '48px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginBottom: '24px', textAlign: 'center' }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#e2e4e9', marginBottom: '14px' }}>Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/explore" style={{ fontSize: '14px', color: '#6b7280' }}>Explore</Link></li>
              <li><Link href="/feed" style={{ fontSize: '14px', color: '#6b7280' }}>Feed</Link></li>
              <li><Link href="/events" style={{ fontSize: '14px', color: '#6b7280' }}>Events</Link></li>
              <li><Link href="/clubs" style={{ fontSize: '14px', color: '#6b7280' }}>Clubs</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#e2e4e9', marginBottom: '14px' }}>Community</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/auth/register" style={{ fontSize: '14px', color: '#6b7280' }}>Join The Scene</Link></li>
              <li><Link href="/guidelines" style={{ fontSize: '14px', color: '#6b7280' }}>Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#e2e4e9', marginBottom: '14px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/privacy" style={{ fontSize: '14px', color: '#6b7280' }}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={{ fontSize: '14px', color: '#6b7280' }}>Terms of Service</Link></li>
              <li><Link href="/cookies" style={{ fontSize: '14px', color: '#6b7280' }}>Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            &copy; {new Date().getFullYear()} The Scene. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
