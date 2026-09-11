declare global {
    namespace Express {
        interface Request {
            userId?: number;
            workspaceId?: number;
        }
    }
}

export {} ;
