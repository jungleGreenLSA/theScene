import Link from 'next/link'

export const metadata = { title: 'Terms of Service' }

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>{title}</h2>
    <div className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {children}
    </div>
  </div>
)

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/" className="text-muted-light hover:text-purple-light" style={{ fontSize: '13px', display: 'block', marginBottom: '24px' }}>&larr; Back to Home</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Terms of <span className="text-purple-light">Service</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '32px' }}>Effective: April 17, 2026 · These terms govern your use of thescene.fyi.</p>

      <div className="glass" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <Section title="1. Acceptance of terms">
            <p>By creating an account, signing in, or using The Scene (&quot;the Service&quot;), you agree to these Terms of Service and our <Link href="/privacy" className="text-purple-light hover:text-neon-light">Privacy Policy</Link>. If you don&apos;t agree, don&apos;t use the Service.</p>
            <p>We may update these terms. When we do, we&apos;ll change the &quot;Effective&quot; date above and notify you in-app or by email. Continued use after the effective date means you accept the update.</p>
          </Section>

          <Section title="2. Who can use the Service">
            <p>You must be at least 13 years old. Marketplace features (posting items for sale or making offers) require you to be 18 or older. By agreeing to these terms, you represent that you meet the age requirements.</p>
            <p>You may not use the Service if you are barred from doing so under applicable law.</p>
          </Section>

          <Section title="3. Your account">
            <p>You&apos;re responsible for keeping your login credentials secure and for any activity under your account. Tell us right away (support@thescene.fyi) if you suspect unauthorized access.</p>
            <p>You must provide accurate account information — real email, real name or username you&apos;re willing to stand behind, and accurate vehicle and profile data.</p>
            <p>One person, one account. Don&apos;t create additional accounts to evade bans or rate limits.</p>
          </Section>

          <Section title="4. Your content">
            <p>You retain ownership of everything you post — vehicles, photos, feed posts, comments, guestbook entries, listings, club/event/shop pages. By posting, you grant The Scene a worldwide, non-exclusive, royalty-free license to host, store, reproduce, modify (for formatting), display, and distribute your content on the Service, including generating preview images (OG cards) that link back to your content.</p>
            <p>You represent that you own or have the necessary rights to the content you post, and that it does not violate anyone else&apos;s intellectual property or privacy rights.</p>
            <p>We may remove content that violates these terms or our community guidelines, at our discretion. You can delete your own content at any time.</p>
          </Section>

          <Section title="5. Acceptable use">
            <p>Don&apos;t:</p>
            <p>• Post content that&apos;s illegal, harassing, hateful, sexually explicit, or violent.</p>
            <p>• Impersonate another person, business, or vehicle owner.</p>
            <p>• Scrape, mirror, or systematically download the Service without written permission.</p>
            <p>• Send spam, commercial solicitations outside the marketplace, or unsolicited mass messages.</p>
            <p>• Attempt to bypass authentication, rate limits, or row-level security; reverse engineer or probe for vulnerabilities outside a responsible-disclosure context.</p>
            <p>• Upload viruses, malware, or automated content-generation scripts.</p>
            <p>• Misrepresent a vehicle you don&apos;t own as your build, or a sighting as being of a car you do own.</p>
            <p>• Use the Service to interfere with another member&apos;s use of it.</p>
            <p>Violations can result in content removal, account suspension, or permanent ban. We may report serious violations to law enforcement.</p>
          </Section>

          <Section title="6. Marketplace">
            <p>The Scene provides the marketplace as a platform for members to list and discuss vehicles and parts. We are not a party to any transaction. We don&apos;t inspect vehicles or verify listing accuracy. Buyers and sellers transact directly, at their own risk.</p>
            <p>You agree:</p>
            <p>• Listings you post must accurately describe what you&apos;re selling and must be legal to sell (no stolen, counterfeit, or unsafe items).</p>
            <p>• Comments and offers are public — assume any message you send in the marketplace is visible to other members.</p>
            <p>• We don&apos;t offer buyer protection, escrow, or dispute resolution. Meet in person in a safe public location and verify items before payment.</p>
            <p>• Premium membership unlocks listing-posting capability but does not grant any warranty on listings or transactions.</p>
          </Section>

          <Section title="7. Clubs, events, shops, and sightings">
            <p>Clubs, events, shops, and sightings you post are informational. The Scene does not endorse, inspect, or verify them.</p>
            <p>Event organizers are responsible for complying with local laws, venue permissions, insurance, and safety requirements. Claiming or attending an event is at your own risk.</p>
          </Section>

          <Section title="8. Premium subscriptions">
            <p>Premium is a recurring monthly or annual subscription billed through Stripe. Prices are listed on the Pricing page and may change on 30 days&apos; notice; any change applies at the next renewal.</p>
            <p>Subscriptions auto-renew unless canceled. You can cancel anytime from Settings; access continues through the end of the current billing period. No pro-rated refunds except where required by law.</p>
          </Section>

          <Section title="9. Intellectual property of the Service">
            <p>The Scene name, logo, SVG graphics, site design, and code are owned by us and protected by copyright and trademark law. These terms do not grant you any ownership or license to use our marks outside the Service.</p>
          </Section>

          <Section title="10. DMCA / copyright complaints">
            <p>If you believe content on The Scene infringes your copyright, send a DMCA notice to support@thescene.fyi including: (a) identification of the copyrighted work, (b) the URL of the infringing content, (c) your contact info, (d) a statement under penalty of perjury that you&apos;re authorized to act for the copyright owner, and (e) your physical or electronic signature. We&apos;ll take appropriate action, which may include removal of the content.</p>
          </Section>

          <Section title="11. Termination">
            <p>You can delete your account at any time from Settings. We may suspend or terminate your account — with or without notice — if we believe you&apos;ve violated these terms, if required by law, or for prolonged inactivity.</p>
            <p>Sections that by their nature should survive termination (content license, indemnity, disclaimers, limitations of liability, arbitration) will do so.</p>
          </Section>

          <Section title="12. Disclaimer of warranties">
            <p>The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;, without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or secure, or that user content is accurate or lawful. Your use of the Service is at your own risk.</p>
          </Section>

          <Section title="13. Limitation of liability">
            <p>To the maximum extent permitted by law, The Scene and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages arising out of your use of (or inability to use) the Service. Our total liability for any claim arising out of these terms or the Service is limited to the greater of (a) the amount you paid us in the 12 months preceding the claim, or (b) US $100.</p>
          </Section>

          <Section title="14. Indemnity">
            <p>You agree to indemnify and hold The Scene harmless from any claim, demand, or damages (including attorneys&apos; fees) arising from content you post, your use of the Service, your violation of these terms, or your violation of any third-party rights.</p>
          </Section>

          <Section title="15. Governing law and disputes">
            <p>These terms are governed by the laws of the State of Texas, without regard to conflict-of-laws principles. Any dispute must be brought in the state or federal courts located in Denton County, Texas, and you consent to personal jurisdiction there.</p>
            <p>To the extent permitted by law, you and The Scene agree to resolve disputes through binding individual arbitration rather than a class action, under the rules of the American Arbitration Association. You may opt out of arbitration within 30 days of first accepting these terms by emailing support@thescene.fyi with the subject &quot;Arbitration Opt-Out&quot;.</p>
          </Section>

          <Section title="16. Changes to the Service">
            <p>We may add, change, or remove features of The Scene at any time. We&apos;ll try to give advance notice for material changes that affect paid subscribers.</p>
          </Section>

          <Section title="17. Contact">
            <p><a href="mailto:support@thescene.fyi" className="text-purple-light hover:text-neon-light">support@thescene.fyi</a> for any questions about these terms.</p>
          </Section>

        </div>
      </div>
    </div>
  )
}
