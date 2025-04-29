import express from 'express';
import { creategig, getgig, findgig, getAllgigs } from '../controller/gigController.js';
import authenticate from '../Middleware/authMiddleware.js';

const gigRouter = express.Router();

//get filtered gigs
gigRouter.get('/search',findgig);

//get single gig
gigRouter.get('/:_id',getgig);

//get all gigs
gigRouter.get('/',getAllgigs);

//create gig
gigRouter.post('/creategig',authenticate,creategig);

export default gigRouter;