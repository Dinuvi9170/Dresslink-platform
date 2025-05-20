import express from 'express';
import { creategig, getgig, findgig, getAllgigs,updateProfessionalGig , getUserProfessionalGigs, searchGigs ,deleteGig} from '../controller/gigController.js';
import authenticate from '../Middleware/authMiddleware.js';

const gigRouter = express.Router();

//search by name
gigRouter.get('/searchByName', searchGigs);

//get filtered gigs
gigRouter.get('/search',findgig);

// Get current user's professional gigs 
gigRouter.get('/mygigs',authenticate,getUserProfessionalGigs);

//get single gig
gigRouter.get('/:_id',getgig);

//get all gigs
gigRouter.get('/',getAllgigs);

//create gig
gigRouter.post('/creategig',authenticate,creategig);

//delete gig
gigRouter.delete('/:_id',authenticate,deleteGig);

//update gig
gigRouter.put('/:_id',authenticate,updateProfessionalGig );

export default gigRouter;