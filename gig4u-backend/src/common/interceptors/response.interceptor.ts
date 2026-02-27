import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../types';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  /**
   * Wraps all successful responses in the standard ApiResponse envelope.
   * If the controller returns `{ message, data }`, the message is forwarded.
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;

        const hasEnvelope =
          res !== null &&
          typeof res === 'object' &&
          'data' in res &&
          'message' in res;

        return {
          success: true,
          data: hasEnvelope ? res.data : (res ?? null),
          message: hasEnvelope ? res.message : 'Success',
          statusCode,
        };
      }),
    );
  }
}
