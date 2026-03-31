import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { blogSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'publish'
    const publicOnly = searchParams.get('public') === 'true'

    const where = publicOnly ? { status: 'publish' } : status ? { status } : {}

    const data = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = blogSchema.parse(body)

    const blog = await prisma.blogPost.create({ data })
    await logActivity(session.user.id, 'CREATE_BLOG', `Created blog ${data.title}`)
    
    return NextResponse.json({ data: blog }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
