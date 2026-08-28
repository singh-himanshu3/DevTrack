import express from "express";
import issuesRouter from "./routes/issues.routes.js" ;

const app = express() ;

app.use(express.json()) ;
app.use("/api/issues", issuesRouter) ;

export default app ;