import { UsersService } from '../users/users.service';
export declare class AdminController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getStats(): Promise<{
        data: {
            pendingKyc: number;
            activeProjects: number;
            totalUsers: number;
            clientCount: number;
            spCount: number;
            adminCount: number;
        };
        message: string;
    }>;
}
