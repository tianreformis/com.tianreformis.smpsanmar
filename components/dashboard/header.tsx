'use client'

import Link from 'next/link'
import { Bell, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role: string
  }
}

export function DashboardHeader({ user }: HeaderProps) {
  const pathname = usePathname()
  const isSettings = pathname === '/dashboard/settings'

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
            {isSettings ? 'Settings' : `Selamat Datang, ${user.name || user.email}`}
          </h1>
          {!isSettings && (
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
              <span className="hidden sm:inline">Role: </span>{user.role}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1 lg:gap-2">
          <ThemeSwitcher />
          
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-full">
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                  <AvatarImage src="/api/placeholder/40/40" />
                  <AvatarFallback>
                    <User className="h-4 w-4 lg:h-5 lg:w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
