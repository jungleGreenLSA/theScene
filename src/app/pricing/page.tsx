import { redirect } from 'next/navigation'

// There is no paid tier. Old links to /pricing land on the signup page.
export default function PricingPage() {
  redirect('/auth/register')
}
