import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto py-12" style={{ maxWidth: '1000px', padding: '48px 32px' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Image src="/images/logo.png" alt="The Scene" width={48} height={48} className="rounded-full" />
              <span className="text-lg font-bold tracking-wider uppercase">
                the<span className="text-purple">Scene</span>
              </span>
            </div>
            <p className="text-muted text-sm mt-3 leading-relaxed">
              The car community, reimagined. Show off your build, connect with enthusiasts, and discover events near you.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="text-sm text-muted hover:text-purple-light">Explore</Link></li>
              <li><Link href="/feed" className="text-sm text-muted hover:text-purple-light">Feed</Link></li>
              <li><Link href="/events" className="text-sm text-muted hover:text-purple-light">Events</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Community</h4>
            <ul className="space-y-2">
              <li><Link href="/auth/register" className="text-sm text-muted hover:text-purple-light">Join The Scene</Link></li>
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Guidelines</Link></li>
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-muted hover:text-purple-light">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
