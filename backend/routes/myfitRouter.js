import express from 'express';
import { processMyFitData, checkAuthStatus } from '../controller/myfitController.js';
import authenticate from '../Middleware/authMiddleware.js';

const myfitRouter = express.Router();

// Route to check authentication status
myfitRouter.get('/api/auth-check', authenticate, checkAuthStatus);

// Protected MyFit endpoints
myfitRouter.post('/api/body-shape', authenticate, processMyFitData);
myfitRouter.post('/api/generate-silhouette', authenticate, processMyFitData);
myfitRouter.post('/api/upload-dress-image', authenticate, processMyFitData);
myfitRouter.post('/api/virtual-try-on', authenticate, processMyFitData);
myfitRouter.post('/adjust-fit', authenticate, processMyFitData);

export default myfitRouter;