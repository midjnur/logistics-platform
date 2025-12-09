import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, DocumentType } from './document.entity';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentsService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName = 'logistics-documents';

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private configService: ConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000')),
      useSSL: false,
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');

      // Set bucket policy to allow public read (optional, better to use presigned URLs for security)
      // For now, we'll use presigned URLs for access
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    ownerId: string,
    type: DocumentType,
    shipmentId?: string,
  ): Promise<Document> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${ownerId}/${type.toLowerCase()}_${Date.now()}.${fileExt}`;

    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    const document = this.documentsRepository.create({
      owner_id: ownerId,
      type,
      file_url: fileName, // Store the path, not the full URL
      status: DocumentStatus.PENDING,
      shipment_id: shipmentId,
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return this.documentsRepository.save(document);
  }

  async getDocumentUrl(fileName: string): Promise<string> {
    // Generate a presigned URL valid for 1 hour
    return this.minioClient.presignedGetObject(this.bucketName, fileName, 3600);
  }

  async findByOwner(ownerId: string): Promise<Document[]> {
    const docs = await this.documentsRepository.find({
      where: { owner_id: ownerId },
    });
    // Enrich with presigned URLs
    for (const doc of docs) {
      doc.file_url = await this.getDocumentUrl(doc.file_url);
    }
    return docs;
  }
}
