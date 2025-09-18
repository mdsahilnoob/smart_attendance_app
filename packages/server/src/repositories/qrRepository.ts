import { prisma } from "../lib/prisma"

export class QRRepository {
  async findByCode(qrCode: string) {
    return prisma.qRSession.findUnique({
      where: { qrCode },
      include: {
        timetableSlot: {
          include: {
            class: {
              include: {
                students: true,
              },
            },
          },
        },
      },
    })
  }

  async create(data: {
    timetableSlotId: string
    qrCode: string
    expiresAt: Date
  }) {
    return prisma.qRSession.create({
      data,
      include: {
        timetableSlot: {
          include: {
            class: true,
          },
        },
      },
    })
  }

  async deactivate(id: string) {
    return prisma.qRSession.update({
      where: { id },
      data: { isActive: false },
    })
  }

  async findActiveByTimetableSlot(timetableSlotId: string) {
    return prisma.qRSession.findFirst({
      where: {
        timetableSlotId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    })
  }

  async cleanupExpired() {
    return prisma.qRSession.updateMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })
  }
}
