import Link from 'next/link'

export const metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/" className="text-muted-light hover:text-purple-light" style={{ fontSize: '13px', display: 'block', marginBottom: '24px' }}>&larr; Back to Home</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Terms of <span className="text-purple-light">Service</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '32px' }}>Last updated: April 2026</p>

      <div className="glass" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>1. Acceptance of Terms</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. By accessing or using The Scene, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>2. Account Registration</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>3. User Content</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident. You retain ownership of content you post. By posting content, you grant The Scene a non-exclusive license to display, distribute, and promote your content on the platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>4. Prohibited Conduct</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. You may not use the platform to harass others, post illegal content, impersonate others, spam, or attempt to gain unauthorized access to the system.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>5. Termination</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. We reserve the right to suspend or terminate accounts that violate these terms or our Community Guidelines.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>6. Disclaimer</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. The platform is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the accuracy of user-submitted vehicle information or event details.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>7. Contact</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>For questions about these terms, contact us at <a href="mailto:support@thescene.jeffsquier.dev" className="text-purple-light hover:text-neon-light">support@thescene.jeffsquier.dev</a>.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
