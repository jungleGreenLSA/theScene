import Link from 'next/link'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/" className="text-muted-light hover:text-purple-light" style={{ fontSize: '13px', display: 'block', marginBottom: '24px' }}>&larr; Back to Home</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Privacy <span className="text-purple-light">Policy</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '32px' }}>Last updated: April 2026</p>

      <div className="glass" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>1. Information We Collect</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. We collect information you provide directly, such as your name, email address, phone number, vehicle information, photos, and profile data. We also collect usage data such as page views, interactions, and device information.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>2. How We Use Your Information</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. We use your information to provide and improve the platform, authenticate your account, display your vehicle profile, enable social features, and communicate with you about your account.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>3. Information Sharing</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. We do not sell your personal information. We may share information with service providers who help operate the platform, or as required by law.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>4. Data Storage and Security</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Your data is stored securely using industry-standard encryption and access controls. We use Supabase for data storage and authentication, which provides enterprise-grade security.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>5. Your Rights</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. You have the right to access, correct, or delete your personal data. You can manage your profile visibility settings at any time. To request data deletion, contact support@thescene.fyi.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>6. Cookies</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. We use essential cookies for authentication and session management. See our Cookie Policy for more details.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>7. Contact</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>For privacy-related questions, contact us at <a href="mailto:support@thescene.fyi" className="text-purple-light hover:text-neon-light">support@thescene.fyi</a>.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
