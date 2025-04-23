import express from 'express';
import { creategig, getgigs } from '../controller/gigController.js';
import authenticate from '../Middleware/authMiddleware.js';

const gigRouter = express.Router();

gigRouter.get('/:_id', getgigs);

gigRouter.post('/creategig',authenticate,creategig);

export default gigRouter;