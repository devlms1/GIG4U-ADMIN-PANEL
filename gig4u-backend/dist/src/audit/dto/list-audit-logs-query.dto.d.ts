import { PaginationDto } from '../../common/dto';
export declare class ListAuditLogsQueryDto extends PaginationDto {
    actorUserId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
}
