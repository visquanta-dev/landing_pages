import { createServiceClient } from '@/lib/supabase'
import type { Dealership } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ subdomain: string }> }

export default async function DealerLandingPage({ params }: Props) {
  const { subdomain } = await params
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('dealerships')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('is_active', true)
    .single()

  if (error || !data) return notFound()

  return <LandingPage dealer={data as Dealership} />
}

export async function generateMetadata({ params }: Props) {
  const { subdomain } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('dealerships')
    .select('page_title, dealership_name')
    .eq('subdomain', subdomain)
    .single()

  return {
    title: data?.page_title || `Book Your Appointment | ${data?.dealership_name || 'Dealership'}`,
  }
}
