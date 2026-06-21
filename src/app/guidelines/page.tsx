import Link from 'next/link'

export const metadata = { title: 'Community Guidelines' }

export default function GuidelinesPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px clamp(16px, 4vw, 32px) 40px' }}>
      <Link href="/" className="text-muted-light hover:text-teal-light" style={{ fontSize: '13px', display: 'block', marginBottom: '24px' }}>&larr; Back to Home</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Community <span className="gradient-text">Guidelines</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '32px' }}>Last updated: <span className="spec">April 2026</span></p>

      <div className="glass" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>1. Respect the Community</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Treat every member with respect regardless of their vehicle, build status, or experience level.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>2. Keep It Car-Focused</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. The Scene is a car community first. Keep discussions, posts, and guestbook entries related to vehicles, builds, events, and the automotive lifestyle.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>3. No Harassment or Hate Speech</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Harassment, bullying, threats, or hate speech of any kind will result in immediate account suspension.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>4. No Spam or Self-Promotion</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Excessive self-promotion, spam, or commercial advertising without approval is not permitted. Share your build, not your sales pitch.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>5. No Political or Religious Content</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. The Scene is a place for cars. Political, religious, and other divisive content has no place here and will be removed.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>6. Accurate Information</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Be honest about your build. Don&apos;t misrepresent horsepower, modifications, or ownership.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>7. Event Conduct</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident. When attending or posting about events listed on The Scene, represent the community well. Follow all event rules and local laws.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>8. Enforcement</h2>
            <p className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Violations of these guidelines may result in content removal, temporary suspension, or permanent ban at the discretion of The Scene moderation team.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
