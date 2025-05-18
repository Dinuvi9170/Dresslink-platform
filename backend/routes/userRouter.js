import express from 'express';
import { getusers, registeruser, loginUser, updateProfile  } from '../controller/userController.js';
import authenticate from '../Middleware/authMiddleware.js';

const userRouter = express.Router();

userRouter.get('/me',authenticate,getusers);

 userRouter.post('/register',registeruser );
 
 userRouter.post('/login', loginUser );

userRouter.put('/updateProfile', authenticate, updateProfile);

 export default userRouter;
