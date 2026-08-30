import express from "express";
import issuesRouter from "./routes/issues.routes.js" ;
import cors from "cors" ;
import authRouter from "./routes/auth.routes.js" ;

const app = express() ;

app.use(express.json()) ;
app.use(
    cors({
        origin: "http://localhost:5173",
    }),
) ;
app.use("/api/issues", issuesRouter) ;
app.use("/api/auth", authRouter) ;
export default app ;