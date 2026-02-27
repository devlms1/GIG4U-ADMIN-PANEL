import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ApiResponse } from '../types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Catches all exceptions and normalises them into the standard ApiResponse shape.
   * Handles HttpException (incl. validation), Prisma client errors, and unknown errors.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as Record<string, unknown>;
        message =
          typeof body.message === 'string'
            ? body.message
            : (body.error as string) ?? exception.message;

        // class-validator returns message as string[]
        if (Array.isArray(body.message)) {
          errors = body.message as string[];
          message = 'Validation failed';
        }
      }
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError
    ) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[]) ?? [];
          message = target.length
            ? `A record with this ${target.join(', ')} already exists`
            : 'Unique constraint violation';
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message =
            (exception.meta?.cause as string) ?? 'Record not found';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database error: ${exception.message}`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `HTTP ${status} — ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      message,
      statusCode: status,
      ...(errors && { errors }),
    };

    response.status(status).json(errorResponse);
  }
}
