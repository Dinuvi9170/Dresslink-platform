import express from 'express';
import { creategig, getGigs } from '../controller/gigController.js';
import authenticate from '../Middleware/authMiddleware.js';

const gigRouter = express.Router();

gigRouter.get('/', getGigs);

gigRouter.post('/creategig',authenticate,creategig);

export default gigRouter;