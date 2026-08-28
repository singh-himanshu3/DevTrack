import express from "express";
import issuesRouter from "./routes/issues.routes.js" ;
import cors from "cors" ;

const app = express() ;

app.use(express.json()) ;
app.use(
    cors({
        origin: "http://localhost:5173",
    }),
) ;
app.use("/api/issues", issuesRouter) ;

export default app ;