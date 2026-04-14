import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto" style={{ maxWidth: '1000px', padding: '48px 32px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ marginBottom: '32px' }}>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground" style={{ marginBottom: '16px' }}>Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="text-sm text-muted hover:text-purple-light">Explore</Link></li>
              <li><Link href="/feed" className="text-sm text-muted hover:text-purple-light">Feed</Link></li>
              <li><Link href="/events" className="text-sm text-muted hover:text-purple-light">Events</Link></li>
              <li><Link href="/clubs" className="text-sm text-muted hover:text-purple-light">Clubs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground" style={{ marginBottom: '16px' }}>Community</h4>
            <ul className="space-y-2">
              <li><Link href="/auth/register" className="text-sm text-muted hover:text-purple-light">Join The Scene</Link></li>
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Guidelines</Link></li>
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground" style={{ marginBottom: '16px' }}>Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border text-center" style={{ paddingTop: '24px' }}>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} The Scene. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
