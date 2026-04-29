import { Controller, Get, GoneException, NotFoundException, Query, Res } from '@nestjs/common';
import { Response } from 'express';

import { Public } from 'src/core/decorators/public.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import {
  FinalCopyAccessTokenAlreadyUsedError,
  FinalCopyAccessTokenExpiredError,
  FinalCopyAccessTokenNotFoundError,
  SignedSigningArtifactNotFoundError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';

import { DocumentSigningFacade } from '../../document-signing.facade';

@Public()
@Controller('document-signing/public/final-copy')
export class GetFinalSignedCopyHttpController {
  constructor(private readonly documentSigningFacade: DocumentSigningFacade) {}

  @Get('download')
  async download(@Query('token') token: string | undefined, @Res() res: Response): Promise<void> {
    try {
      const document = await this.documentSigningFacade.streamFinalSignedCopy(token ?? '');

      res.set({
        'Content-Type': document.contentType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.contentLength,
      });

      document.stream.pipe(res);
    } catch (error) {
      if (error instanceof FinalCopyAccessTokenNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof FinalCopyAccessTokenExpiredError || error instanceof FinalCopyAccessTokenAlreadyUsedError) {
        throw new GoneException(error.message);
      }

      if (error instanceof SignedSigningArtifactNotFoundError) {
        throw new ProblemException(500, 'Signed Artifact Missing', error.message, 'errors://signed-artifact-missing');
      }

      throw error;
    }
  }
}
