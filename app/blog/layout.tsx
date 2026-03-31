import Link from 'next/link'
import { Newspaper } from 'lucide-react'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Newspaper className="h-6 w-6" />
              <span className="text-xl font-bold">SMS School</span>
            </Link>
            <nav className="flex gap-4">
              <Link href="/blog" className="text-sm hover:text-primary">Blog</Link>
              <Link href="/ppdb" className="text-sm hover:text-primary">PPDB</Link>
              <Link href="/login" className="text-sm hover:text-primary">Login</Link>
            </nav>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
