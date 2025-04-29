import express from 'express';
import { createSupplierGig,findSupplier, getSupplierGigById, getAllSupplierGigs } from '../controller/supplierController.js';
import authenticate from '../Middleware/authMiddleware.js';

const supplierRouter = express.Router();

// Get filtered suppliers
supplierRouter.get('/search', findSupplier);

// Get all suppliers
supplierRouter.get('/', getAllSupplierGigs);

// Get single supplier
supplierRouter.get('/:_id', getSupplierGigById);

// Create supplier profile
supplierRouter.post('/creategig', authenticate, createSupplierGig);

export default supplierRouter;