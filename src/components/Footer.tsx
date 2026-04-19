import Link from 'next/link'

const linkStyle: React.CSSProperties = {
  fontSize: '12px',
}

const headingStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: '#2a2a2a',
  marginBottom: '8px',
}

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', marginTop: '20px', background: '#ebebeb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 12px 12px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '14px',
        }}>
          <div>
            <h4 style={headingStyle}>Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><Link href="/explore" style={linkStyle}>Explore</Link></li>
              <li><Link href="/feed" style={linkStyle}>Feed</Link></li>
              <li><Link href="/events" style={linkStyle}>Events</Link></li>
              <li><Link href="/clubs" style={linkStyle}>Clubs</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={headingStyle}>Community</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><Link href="/auth/register" style={linkStyle}>Join The Scene</Link></li>
              <li><Link href="/guidelines" style={linkStyle}>Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={headingStyle}>Legal</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><Link href="/privacy" style={linkStyle}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={linkStyle}>Terms of Service</Link></li>
              <li><Link href="/cookies" style={linkStyle}>Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11px',
          color: '#2c3e50',
        }}>
          <span>&copy; {new Date().getFullYear()} The Scene. All rights reserved.</span>
          <span>
            <a href="mailto:support@thescene.fyi" style={linkStyle}>
              support@thescene.fyi
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
