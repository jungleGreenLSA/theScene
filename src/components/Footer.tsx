import Link from 'next/link'

const COLS = [
  {
    title: 'The site',
    links: [
      { href: '/explore', label: 'Explore builds' },
      { href: '/feed', label: 'Feed' },
      { href: '/events', label: 'Events' },
      { href: '/clubs', label: 'Clubs' },
      { href: '/marketplace', label: 'Marketplace' },
    ],
  },
  {
    title: 'Members',
    links: [
      { href: '/auth/register', label: 'Join — it’s free' },
      { href: '/auth/login', label: 'Sign in' },
      { href: '/guidelines', label: 'Community guidelines' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/cookies', label: 'Cookies' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="stripe" aria-hidden="true" />
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 20px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '28px', alignItems: 'start' }}>
          <div style={{ gridColumn: 'span 1' }}>
            <p className="display" style={{ fontSize: '26px', lineHeight: 1 }}>The <span style={{ color: 'var(--color-accent)' }}>Scene</span></p>
            <p className="spec" style={{ marginTop: '10px', fontSize: '12px', maxWidth: '28ch' }}>
              Your car. Your page. Your people.<br />Free to join. Every feature, every member.
            </p>
          </div>
          {COLS.map(col => (
            <div key={col.title}>
              <h4 className="label-mono" style={{ marginBottom: '12px', fontSize: '10px' }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {col.links.map(l => (
                  <li key={l.href}><Link href={l.href} style={{ fontSize: '14px' }}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '28px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <p className="spec" style={{ fontSize: '11px' }}>&copy; {new Date().getFullYear()} The Scene. All rights reserved.</p>
          <p className="spec" style={{ fontSize: '11px' }}>
            <a href="mailto:support@thescene.fyi">support@thescene.fyi</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
