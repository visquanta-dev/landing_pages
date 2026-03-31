'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Landing Pages', href: '/dashboard' },
    { label: '10DLC Campaigns', href: '/dashboard/10dlc' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/[0.06] bg-[#0A0A0A]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-xs font-bold">V</div>
            <span className="text-sm font-semibold tracking-tight">Visquanta</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              {tabs.map(tab => {
                const isActive = tab.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(tab.href)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                      isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </nav>
            <div className="w-px h-4 bg-white/[0.08]" />
            <button
              onClick={async () => {
                await fetch('/api/auth', { method: 'DELETE' })
                window.location.href = '/login'
              }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
