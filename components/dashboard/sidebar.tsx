'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, 
  Calendar, FileText, ClipboardList, Newspaper, 
  Settings, LogOut, School, KeyRound, CalendarDays
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface SidebarProps {
  role: string
}

const adminMenu = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/siswa', icon: GraduationCap, label: 'Siswa' },
  { href: '/dashboard/guru', icon: Users, label: 'Guru' },
  { href: '/dashboard/kelas', icon: School, label: 'Kelas' },
  { href: '/dashboard/mapel', icon: BookOpen, label: 'Mapel' },
  { href: '/dashboard/jadwal', icon: Calendar, label: 'Jadwal' },
  { href: '/dashboard/nilai', icon: FileText, label: 'Nilai' },
  { href: '/dashboard/ppdb', icon: ClipboardList, label: 'PPDB' },
  { href: '/dashboard/blog', icon: Newspaper, label: 'Blog' },
  { href: '/dashboard/tahun-pelajaran', icon: CalendarDays, label: 'Tahun Pelajaran' },
  { href: '/dashboard/reset-password', icon: KeyRound, label: 'Reset Password' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

const guruMenu = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/kelas', icon: School, label: 'Kelas' },
  { href: '/dashboard/jadwal', icon: Calendar, label: 'Jadwal' },
  { href: '/dashboard/nilai', icon: FileText, label: 'Input Nilai' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

const siswaMenu = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/nilai', icon: FileText, label: 'Nilai Saya' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function DashboardSidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const menu = role === 'ADMIN' ? adminMenu : role === 'GURU' ? guruMenu : siswaMenu

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-50 hidden lg:block">
        <aside className="h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex items-center gap-2 p-6 border-b border-gray-200 dark:border-gray-700">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8owQlf3ElVkVaUSYCJ4AJ4As4u2kb1Ks8rw&s" alt="Logo" className="h-8 w-8 rounded-full" />
            <span className="text-lg font-bold">SMP Santa Maria</span>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menu.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>

      <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
        <aside className="h-screen w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8owQlf3ElVkVaUSYCJ4AJ4As4u2kb1Ks8rw&s" alt="Logo" className="h-8 w-8 rounded-full" />
          </div>
          
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {menu.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center p-3 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              )
            })}
          </nav>
          
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center p-3 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
