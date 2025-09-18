import AWS from "aws-sdk"
import { v4 as uuidv4 } from "uuid"
import path from "path"
import type Express from "express"

export class S3Service {
  private s3: AWS.S3
  private bucketName: string

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    })
    this.bucketName = process.env.AWS_S3_BUCKET!
  }

  async uploadFile(file: Express.Multer.File, folder = ""): Promise<string> {
    const fileExtension = path.extname(file.originalname)
    const fileName = `${folder}/${uuidv4()}${fileExtension}`

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    }

    try {
      const result = await this.s3.upload(params).promise()
      return result.Location
    } catch (error) {
      console.error("[v0] S3 upload error:", error)
      throw new Error("Failed to upload file to S3")
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const url = new URL(fileUrl)
      const key = url.pathname.substring(1) // Remove leading slash

      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      }

      await this.s3.deleteObject(params).promise()
    } catch (error) {
      console.error("[v0] S3 delete error:", error)
      throw new Error("Failed to delete file from S3")
    }
  }

  async generatePresignedUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
    try {
      // Extract key from URL
      const url = new URL(fileUrl)
      const key = url.pathname.substring(1)

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      }

      return this.s3.getSignedUrl("getObject", params)
    } catch (error) {
      console.error("[v0] S3 presigned URL error:", error)
      throw new Error("Failed to generate presigned URL")
    }
  }
}
