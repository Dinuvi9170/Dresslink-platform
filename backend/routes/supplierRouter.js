import express from 'express';
import { createSupplierGig,findSupplier, getSupplierGigById, getAllSupplierGigs } from '../controller/supplierController.js';
import authenticate from '../Middleware/authMiddleware.js';

const supplierRouter = express.Router();

// Get filtered suppliers
supplierRouter.get('/search', findSupplier);

// Get single supplier
supplierRouter.get('/:_id', getSupplierGigById);

// Get all suppliers
supplierRouter.get('/', getAllSupplierGigs);

// Create supplier profile
supplierRouter.post('/create', authenticate, createSupplierGig);

export default supplierRouter;