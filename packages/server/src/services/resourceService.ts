import { ResourceRepository, type CreateResourceData } from "../repositories/resourceRepository"
import { ClassRepository } from "../repositories/classRepository"
import { S3Service } from "./s3Service"
import type { FileType } from "@prisma/client"
import type { Express } from "express"

export class ResourceService {
  private resourceRepository: ResourceRepository
  private classRepository: ClassRepository
  private s3Service: S3Service

  constructor() {
    this.resourceRepository = new ResourceRepository()
    this.classRepository = new ClassRepository()
    this.s3Service = new S3Service()
  }

  async uploadResource(
    teacherId: string,
    classId: string,
    file: Express.Multer.File,
    title: string,
    description?: string,
  ) {
    // Verify teacher owns this class
    const classData = await this.classRepository.findById(classId)
    if (!classData || classData.teacherId !== teacherId) {
      throw new Error("Access denied: You don't own this class")
    }

    // Upload file to S3
    const s3Url = await this.s3Service.uploadFile(file, `resources/${classId}`)

    // Determine file type
    const fileType = this.getFileType(file.mimetype)

    // Create resource record
    const resource = await this.resourceRepository.create({
      title,
      description,
      fileType,
      url: s3Url,
      classId,
    })

    return resource
  }

  async createLinkResource(teacherId: string, classId: string, title: string, url: string, description?: string) {
    // Verify teacher owns this class
    const classData = await this.classRepository.findById(classId)
    if (!classData || classData.teacherId !== teacherId) {
      throw new Error("Access denied: You don't own this class")
    }

    // Create resource record
    const resource = await this.resourceRepository.create({
      title,
      description,
      fileType: "LINK",
      url,
      classId,
    })

    return resource
  }

  async getClassResources(classId: string, userId: string, userRole: string) {
    if (userRole === "TEACHER") {
      // Verify teacher owns this class
      const classData = await this.classRepository.findById(classId)
      if (!classData || classData.teacherId !== userId) {
        throw new Error("Access denied: You don't own this class")
      }
    } else if (userRole === "STUDENT") {
      // Verify student is enrolled in this class
      const classData = await this.classRepository.findById(classId)
      if (!classData || !classData.students.some((student) => student.id === userId)) {
        throw new Error("Access denied: You are not enrolled in this class")
      }
    }

    return this.resourceRepository.findByClassId(classId)
  }

  async getStudentResources(studentId: string) {
    return this.resourceRepository.findResourcesForStudent(studentId)
  }

  async getTeacherResources(teacherId: string) {
    return this.resourceRepository.findByTeacherId(teacherId)
  }

  async updateResource(resourceId: string, teacherId: string, updates: Partial<CreateResourceData>) {
    // Verify teacher owns this resource
    const resource = await this.resourceRepository.findById(resourceId)
    if (!resource || resource.class.teacherId !== teacherId) {
      throw new Error("Access denied: You don't own this resource")
    }

    return this.resourceRepository.update(resourceId, updates)
  }

  async deleteResource(resourceId: string, teacherId: string) {
    // Verify teacher owns this resource
    const resource = await this.resourceRepository.findById(resourceId)
    if (!resource || resource.class.teacherId !== teacherId) {
      throw new Error("Access denied: You don't own this resource")
    }

    // Delete file from S3 if it's not a link
    if (resource.fileType !== "LINK") {
      await this.s3Service.deleteFile(resource.url)
    }

    return this.resourceRepository.delete(resourceId)
  }

  private getFileType(mimetype: string): FileType {
    if (mimetype.startsWith("image/")) return "IMAGE"
    if (mimetype.startsWith("video/")) return "VIDEO"
    if (mimetype === "application/pdf") return "PDF"
    return "DOCUMENT"
  }
}
