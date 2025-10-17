import {
	type CallHandler,
	type ExecutionContext,
	type HttpException,
	HttpStatus,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import { type Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

export type Response<T> = {
	success: boolean;
	statusCode: number;
	path: string;
	message?: string;
	errors?: string[];
	data: T;
	timestamp: string;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<Response<T>> {
		return next.handle().pipe(
			map((res: unknown) => this.responseHandler(res, context)),
			catchError((err: HttpException) => throwError(() => err)),
		);
	}

	responseHandler(res: any, context: ExecutionContext) {
		const ctx = context.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();
		const statusCode = response.statusCode;

		return {
			success: true,
			path: request.url,
			statusCode,
			data: res,
			timestamp: new Date().toISOString(),
		};
	}
}
