import express from 'express';
import { creategig, getgig,getAllgigs } from '../controller/gigController.js';
import authenticate from '../Middleware/authMiddleware.js';

const gigRouter = express.Router();

//get single gig
gigRouter.get('/single/:_id', getgig);

//get all gigs
gigRouter.get('/',getAllgigs);

gigRouter.post('/creategig',authenticate,creategig);

export default gigRouter;