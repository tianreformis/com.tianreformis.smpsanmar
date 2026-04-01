import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

async function getPost(slug: string) {
  return await prisma.blogPost.findUnique({ where: { slug } })
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  
  if (!post || post.status !== 'publish') {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Blog
      </Link>

      <article>
        {post.thumbnail && (
          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-8">
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="text-muted-foreground mb-8">
          Dipublikasikan pada {new Date(post.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <Card>
          <CardContent className="prose max-w-none pt-6">
            <div className="whitespace-pre-wrap">{post.content}</div>
          </CardContent>
        </Card>
      </article>
    </main>
  )
}
