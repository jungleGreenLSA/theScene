import Link from 'next/link'

export const metadata = { title: 'Cookie Policy' }

export default function CookiePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/" className="text-muted-light hover:text-purple-light" style={{ fontSize: '13px', display: 'block', marginBottom: '24px' }}>&larr; Back to Home</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Cookie <span className="text-purple-light">Policy</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '32px' }}>Last updated: April 2026</p>

      <div className="glass" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>1. What Are Cookies</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and keep you logged in.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>2. Cookies We Use</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. We use essential cookies for authentication and session management. These are required for the platform to function. We may also use analytics cookies to understand how the platform is used.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>3. Third-Party Cookies</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit. If you sign in with Google or Facebook, those services may set their own cookies. Please refer to their respective cookie policies for details.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>4. Managing Cookies</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. You can manage cookies through your browser settings. Disabling essential cookies may prevent you from using certain features of the platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>5. Contact</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>For questions about cookies, contact us at <a href="mailto:support@thescene.jeffsquier.dev" className="text-purple-light hover:text-neon-light">support@thescene.jeffsquier.dev</a>.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
