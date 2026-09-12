declare global {
    namespace Express {
        interface Request {
            userId?: number;
            workspaceId?: number;
            issueScope?: { id: number; workspaceId: number; projectId: number };
        }
    }
}

export {} ;
