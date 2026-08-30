import express from "express";
import issuesRouter from "./routes/issues.routes.js" ;
import cors from "cors" ;
import authRouter from "./routes/auth.routes.js" ;
import cookieParser from "cookie-parser";

const app = express() ;

app.use(express.json()) ;
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials : true,
    }),
) ;
app.use(cookieParser()) ;
app.use("/api/issues", issuesRouter) ;
app.use("/api/auth", authRouter) ;
export default app ;