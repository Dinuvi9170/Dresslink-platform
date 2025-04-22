import express from 'express';
import { getusers, loginUser, Saveuser } from '../controller/userController.js';

 const userRouter = express.Router();

 userRouter.get('/',getusers);     
  
 userRouter.post('/',Saveuser );
 userRouter.post('/login', loginUser );

 export default userRouter;