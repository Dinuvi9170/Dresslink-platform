import express from 'express';
import { getprofessionals, Saveprofessional } from '../controller/professionalController.js';

 const professionalRouter = express.Router();

// professionalRouter.get('/',getprofessionals);     
  
 //professionalRouter.post('/',Saveprofessional );

 export default professionalRouter;