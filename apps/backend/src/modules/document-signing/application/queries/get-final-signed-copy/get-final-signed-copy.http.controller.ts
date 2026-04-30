import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

import { Public } from 'src/core/decorators/public.decorator';
import { mapDocumentSigningPublicHttpError } from '../../document-signing-public-http.helper';
import { GetFinalSignedCopyService } from './get-final-signed-copy.service';

@Public()
@Controller('document-signing/public/final-copy')
export class GetFinalSignedCopyHttpController {
  constructor(private readonly getFinalSignedCopyService: GetFinalSignedCopyService) {}

  @Get('download')
  async download(@Query('token') token: string | undefined, @Res() res: Response): Promise<void> {
    try {
      const document = await this.getFinalSignedCopyService.download(token ?? '');

      res.set({
        'Content-Type': document.contentType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.contentLength,
      });

      document.stream.pipe(res);
    } catch (error) {
      throw mapDocumentSigningPublicHttpError(error);
    }
  }
}
