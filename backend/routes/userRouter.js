import express from 'express';
import { getusers, registeruser, loginUser } from '../controller/userController.js';
import authenticate from '../Middleware/authMiddleware.js';

 const userRouter = express.Router();

 userRouter.get('/',authenticate,getusers);     
  
 userRouter.post('/register',registeruser );
 userRouter.post('/login', loginUser );

 export default userRouter;