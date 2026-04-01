import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export const revalidate = 60

const POSTS_PER_PAGE = 6

async function getPosts(page: number) {
  const skip = (page - 1) * POSTS_PER_PAGE
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: 'publish' },
      orderBy: { createdAt: 'desc' },
      skip,
      take: POSTS_PER_PAGE
    }),
    prisma.blogPost.count({ where: { status: 'publish' } })
  ])
  return { posts, total, totalPages: Math.ceil(total / POSTS_PER_PAGE) }
}

export default async function BlogListPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page || '1')
  const { posts, total, totalPages } = await getPosts(page)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Artikel Terbaru</h1>
      
      {posts.length === 0 ? (
        <p className="text-muted-foreground">Belum ada artikel.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {post.thumbnail ? (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3">{post.content}</p>
                  </CardContent>
                  <CardFooter>
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Link href={page > 1 ? `/blog?page=${page - 1}` : '/blog'}>
                <Button variant="outline" size="sm" disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                </Button>
              </Link>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/blog?page=${p}`}>
                  <Button
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                  >
                    {p}
                  </Button>
                </Link>
              ))}

              <Link href={page < totalPages ? `/blog?page=${page + 1}` : `/blog?page=${page}`}>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                  Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  )
}
