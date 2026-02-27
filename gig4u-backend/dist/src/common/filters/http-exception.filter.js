"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                const body = exceptionResponse;
                message =
                    typeof body.message === 'string'
                        ? body.message
                        : body.error ?? exception.message;
                if (Array.isArray(body.message)) {
                    errors = body.message;
                    message = 'Validation failed';
                }
            }
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002': {
                    status = common_1.HttpStatus.CONFLICT;
                    const target = exception.meta?.target ?? [];
                    message = target.length
                        ? `A record with this ${target.join(', ')} already exists`
                        : 'Unique constraint violation';
                    break;
                }
                case 'P2025':
                    status = common_1.HttpStatus.NOT_FOUND;
                    message =
                        exception.meta?.cause ?? 'Record not found';
                    break;
                default:
                    status = common_1.HttpStatus.BAD_REQUEST;
                    message = `Database error: ${exception.message}`;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        this.logger.error(`HTTP ${status} — ${message}`, exception instanceof Error ? exception.stack : undefined);
        const errorResponse = {
            success: false,
            data: null,
            message,
            statusCode: status,
            ...(errors && { errors }),
        };
        response.status(status).json(errorResponse);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map