import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export const revalidate = 60

async function getPosts() {
  return await prisma.blogPost.findMany({
    where: { status: 'publish' },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function BlogListPage() {
  const posts = await getPosts()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Artikel Terbaru</h1>
      
      {posts.length === 0 ? (
        <p className="text-muted-foreground">Belum ada artikel.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                {post.thumbnail && (
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
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
      )}
    </main>
  )
}
