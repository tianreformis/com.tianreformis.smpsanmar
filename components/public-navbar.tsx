import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { School, LogIn, LayoutDashboard } from 'lucide-react'

export default async function PublicNavbar() {
  const session = await getServerSession(authOptions)

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-primary">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8owQlf3ElVkTaUSYCJ4AJ4As4u2kb1Ks8rw&s" alt="Logo" className="h-8 w-8 rounded-full" />
            <div>
              <span className="text-lg font-bold block leading-tight">SMP Santa Maria</span>
              <span className="text-xs text-muted-foreground block leading-tight">Sistem Manajemen Sekolah</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-sm hover:text-primary transition-colors">
              Blog
            </Link>
            <Link href="/ppdb" className="text-sm hover:text-primary transition-colors">
              PPDB
            </Link>

            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
