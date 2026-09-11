import type { ErrorRequestHandler } from "express";
import projectsRouter from "./routes/projects.routes.js";
import express from "express";
import issuesRouter from "./routes/issues.routes.js" ;
import cors from "cors" ;
import authRouter from "./routes/auth.routes.js" ;
import cookieParser from "cookie-parser";
import { requireAuth } from "./middleware/auth.middleware.js";
import { requireWorkspaceMember } from "./middleware/workspace.middleware.js";
import workspacesRouter from "./routes/workspaces.routes.js";

const app = express() ;

app.use(express.json()) ;
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials : true,
    }),
) ;
app.use(cookieParser()) ;
app.use("/api/issues", requireAuth, requireWorkspaceMember, issuesRouter);
app.use("/api/workspaces", requireAuth, workspacesRouter);
app.use("/api/auth", authRouter) ;
app.use("/api/projects", requireAuth, requireWorkspaceMember, projectsRouter);
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error.code === "P2002") { res.status(409).json({ message: "A resource with those details already exists" }); return; }
    if (error.code === "P2025") { res.status(404).json({ message: "Resource not found" }); return; }
    if (error.code === "P2003") { res.status(409).json({ message: "Project is in use or no longer available. Move or delete its issues before deleting it." }); return; }
    if (error.type === "entity.parse.failed") { res.status(400).json({ message: "Invalid JSON" }); return; }
    res.status(500).json({ message: "An unexpected server error occurred" });
};
app.use(errorHandler);
export default app ;
