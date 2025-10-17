import {
	type ArgumentsHost,
	Catch,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import type { Response } from "express";
import { ZodSerializationException, ZodValidationException } from "nestjs-zod";
import { ZodError } from "zod";

@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		// ========================================================================
		// Validation Errors (Client's fault - 400)
		// ========================================================================
		if (exception instanceof ZodValidationException) {
			const zodError = exception.getZodError();

			// Type guard: ensure it's actually a ZodError
			if (zodError instanceof ZodError) {
				// Log for analytics (track common validation errors)
				this.logger.debug(
					`Validation failed for ${request.method} ${request.url}`,
					{
						errors: zodError.issues,
						body: request.body,
					},
				);

				// Flatten nested errors for easier frontend consumption
				const errors = this.flattenZodErrors(zodError);

				return response.status(HttpStatus.BAD_REQUEST).json({
					success: false,
					statusCode: HttpStatus.BAD_REQUEST,
					message: "Validation failed",
					errors,
					timestamp: new Date().toISOString(),
					path: request.url,
				});
			}
		}

		// ========================================================================
		// Serialization Errors (Server's fault - 500)
		// ========================================================================
		if (exception instanceof ZodSerializationException) {
			const zodError = exception.getZodError();

			// Type guard: ensure it's actually a ZodError
			if (zodError instanceof ZodError) {
				// THIS IS CRITICAL: Log with high severity
				this.logger.error(
					`🔥 Serialization Error: ${request.method} ${request.url}`,
					{
						errors: zodError.issues,
						stack: exception.stack,
						controller: request.route?.path,
					},
				);

				// In production, alert your team
				// await this.notifyTeam({
				//   severity: 'HIGH',
				//   type: 'SERIALIZATION_ERROR',
				//   details: zodError.issues,
				// });
			}

			// Never expose internal errors to client
			return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				success: false,
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				message: "Internal server error",
				timestamp: new Date().toISOString(),
			});
		}

		// Let base filter handle all other exceptions
		super.catch(exception, host);
	}

	/**
	 * Helper to flatten nested Zod errors for frontend consumption
	 */
	private flattenZodErrors(zodError: ZodError) {
		return zodError.issues.map((err) => ({
			field: err.path.join("."),
			message: err.message,
			code: err.code,
			...(err.code === "invalid_type" && {
				expected: (err as any).expected,
				received: (err as any).received,
			}),
		}));
	}
}
