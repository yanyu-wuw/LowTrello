import { prisma } from './prisma.js'

export async function ensureDefaultWorkspaceForUser(userId: string) {
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true }
  })

  if (existing?.workspaceId) return existing.workspaceId

  const workspace = await prisma.workspace.create({
    data: {
      name: '个人工作区',
      description: '自动创建的默认工作区',
      members: {
        create: {
          userId,
          role: 'admin'
        }
      }
    },
    select: { id: true }
  })

  return workspace.id
}
