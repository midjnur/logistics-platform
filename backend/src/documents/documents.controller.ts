import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { DocumentsService } from './documents.service';
import { DocumentType } from './document.entity';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: DocumentType,
    @Body('shipmentId') shipmentId: string,
    @Request() req: { user: any },
  ) {
    // For carriers, the owner_id is the carrier ID (which is the same as user_id in our schema)
    return this.documentsService.uploadFile(
      file,
      req.user.userId,
      type,
      shipmentId,
    );
  }

  @Get('my-documents')
  async getMyDocuments(@Request() req: { user: any }) {
    return this.documentsService.findByOwner(req.user.userId);
  }
}
