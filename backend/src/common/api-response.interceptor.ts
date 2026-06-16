import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const statusCode = context
      .switchToHttp()
      .getResponse<Response>().statusCode;
    return next.handle().pipe(
      map((result: unknown) => {
        if (
          result &&
          typeof result === 'object' &&
          'data' in result &&
          'total' in result
        ) {
          return { ...result, message: 'Operación exitosa', statusCode };
        }
        return {
          data: result ?? null,
          message: 'Operación exitosa',
          statusCode,
        };
      }),
    );
  }
}
