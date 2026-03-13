'use client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/[0.06] bg-[#0A0A0A]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-xs font-bold">V</div>
            <span className="text-sm font-semibold tracking-tight">Visquanta</span>
            <span className="text-xs text-white/30 ml-1">Landing Pages</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40">Admin Dashboard</span>
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
