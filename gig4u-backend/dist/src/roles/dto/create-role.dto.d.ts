import { UserType } from '@prisma/client';
export declare class CreateRoleDto {
    name: string;
    displayName: string;
    description?: string;
    actorType: UserType;
    parentId?: string;
}
