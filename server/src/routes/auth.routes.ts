import { Router } from "express";
import { registerController, loginController, getCurrentUserController, logoutController} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const authRouter = Router() ;

authRouter.post('/register', registerController) ;
authRouter.post('/login', loginController) ;
authRouter.get('/me', requireAuth, getCurrentUserController) ; 
authRouter.post('/logout', logoutController) ; 

export default authRouter ;