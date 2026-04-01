import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

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
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <h1 className="text-3xl lg:text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="text-muted-foreground mb-8">
          Dipublikasikan pada {new Date(post.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />
          </CardContent>
        </Card>
      </article>

      <style>{`
        .blog-content { font-size: 1rem; line-height: 1.75; color: hsl(var(--foreground)); }
        .blog-content p { margin-bottom: 1rem; }
        .blog-content p:last-child { margin-bottom: 0; }
        .blog-content h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; line-height: 1.3; }
        .blog-content h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; line-height: 1.4; }
        .blog-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; line-height: 1.4; }
        .blog-content strong { font-weight: 700; }
        .blog-content em { font-style: italic; }
        .blog-content u { text-decoration: underline; }
        .blog-content a { color: hsl(var(--primary)); text-decoration: underline; }
        .blog-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .blog-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .blog-content li { margin-bottom: 0.25rem; }
        .blog-content li p { margin-bottom: 0.25rem; }
        .blog-content blockquote { border-left: 4px solid hsl(var(--primary)); padding-left: 1rem; margin: 1rem 0; font-style: italic; color: hsl(var(--muted-foreground)); }
        .blog-content pre { background: hsl(var(--muted)); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; }
        .blog-content code { background: hsl(var(--muted)); padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; }
        .blog-content pre code { background: none; padding: 0; }
        .blog-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
        .blog-content hr { border: 0; border-top: 2px solid hsl(var(--border)); margin: 1.5rem 0; }
        .blog-content text-align-left { text-align: left; }
        .blog-content text-align-center { text-align: center; }
        .blog-content text-align-right { text-align: right; }
        .blog-content text-align-justify { text-align: justify; }
      `}</style>
    </main>
  )
}
