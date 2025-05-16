import express from 'express';
import { 
    createSupplierGig,
    findSupplier, 
    getSupplierGigById, 
    getAllSupplierGigs,
    getUserSupplierGigs,
    updateSupplierGig ,
    deleteSupplierGig} from '../controller/supplierController.js';
import authenticate from '../Middleware/authMiddleware.js';

const supplierRouter = express.Router();

// Get filtered suppliers
supplierRouter.get('/search', findSupplier);

// Get all suppliers gigs
supplierRouter.get('/', getAllSupplierGigs);

// Get current user's supplier gigs 
supplierRouter.get('/mygigs', authenticate, getUserSupplierGigs);

// Get single supplier
supplierRouter.get('/:_id', getSupplierGigById);

// Create supplier profile
supplierRouter.post('/creategig', authenticate, createSupplierGig);

// Update supplier profile 
supplierRouter.put('/:_id', authenticate, updateSupplierGig);

// Delete supplier profile 
supplierRouter.delete('/:_id', authenticate, deleteSupplierGig);


export default supplierRouter;