import { prisma } from "../lib/prisma"
import type { FileType } from "@prisma/client"

export interface CreateResourceData {
  title: string
  description?: string
  fileType: FileType
  url: string
  classId: string
}

export class ResourceRepository {
  async create(data: CreateResourceData) {
    return prisma.resource.create({
      data,
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })
  }

  async findById(id: string) {
    return prisma.resource.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
            students: true,
          },
        },
      },
    })
  }

  async findByClassId(classId: string) {
    return prisma.resource.findMany({
      where: { classId },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })
  }

  async findByTeacherId(teacherId: string) {
    return prisma.resource.findMany({
      where: {
        class: {
          teacherId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        class: true,
      },
    })
  }

  async update(id: string, data: Partial<CreateResourceData>) {
    return prisma.resource.update({
      where: { id },
      data,
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })
  }

  async delete(id: string) {
    return prisma.resource.delete({
      where: { id },
    })
  }

  async findResourcesForStudent(studentId: string) {
    return prisma.resource.findMany({
      where: {
        class: {
          students: {
            some: {
              id: studentId,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })
  }
}
