import { prisma } from './prisma'

export async function logActivity(userId: string, action: string, details?: string) {
  await prisma.activityLog.create({
    data: { userId, action, details }
  })
}
