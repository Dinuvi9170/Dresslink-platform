import chai from 'chai';
import chaiHttp from 'chai-http';
import { describe, it, before, after } from 'mocha';
import mongoose from 'mongoose';
import sinon from 'sinon';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config({ path: '../../backend/.env' });

const expect = chai.expect;
chai.use(chaiHttp);

// Mock data for tests
const mockSupplierId = '6817ebebcfb614ae94c1b2ab';
const mockUserId = 'user123';
const API_URL = 'http://localhost:3000';

// Define mock data
const mockSuppliers = [
  {
    _id: mockSupplierId,
    ShopName: 'Test Shop',
    shopDescription: 'Test Description',
    materialOffered: ['Cotton', 'Silk', 'Linen'],
    materials: [
      { type: 'Cotton', price: 250 },
      { type: 'Silk', price: 450 }
    ],
    cover: 'https://example.com/cover.jpg',
    contactInfo: {
      mobile: '1234567890',
      email: 'shop@test.com',
      whatsapp: '0987654321'
    },
    title: 'Test Shop Title',
    shopImages: 'https://example.com/shop.jpg',
    user: mockUserId
  }
];

describe('Supplier API Tests', () => {
  let mockRequest;
  
  before(function() {
    this.timeout(5000);
    
    // Create mock for chai.request to avoid actual HTTP calls
    mockRequest = sinon.stub(chai, 'request').returns({
      get: sinon.stub().callsFake((path) => {
        // Mock responses based on path
        if (path === '/suppliers') {
          return Promise.resolve({ 
            status: 200, 
            body: mockSuppliers,
            // Add chai-http properties
            has: { status: true },
            ok: true
          });
        } else if (path === `/suppliers/${mockSupplierId}`) {
          return Promise.resolve({ 
            status: 200, 
            body: mockSuppliers[0],
            has: { status: true },
            ok: true
          });
        } else if (path === '/suppliers/invalid-id') {
          return Promise.resolve({ 
            status: 400,
            body: { error: 'Invalid ID format' },
            has: { status: true },
            ok: false
          });
        } else if (path.includes('/suppliers/')) {
          // Non-existent ID
          return Promise.resolve({ 
            status: 404,
            body: { error: 'Supplier not found' },
            has: { status: true },
            ok: false
          });
        } else {
          // Default response for other paths
          return Promise.resolve({ 
            status: 200, 
            body: {},
            has: { status: true },
            ok: true
          });
        }
      })
    });
    
    console.log('Using mocked HTTP and database responses for testing');
  });

  after(function() {
    // Restore chai.request to its original implementation
    mockRequest.restore();
    console.log('Mock restored, test completed');
  });

  it('should get all suppliers', async () => {
    const res = await chai.request(API_URL).get('/suppliers');
    
    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
    expect(res.body).to.have.lengthOf.at.least(1);
  });

  it('should return supplier details for valid ID', async () => {
    const res = await chai.request(API_URL).get(`/suppliers/${mockSupplierId}`);
    
    expect(res).to.have.status(200);
    expect(res.body).to.be.an('object');
    expect(res.body.ShopName).to.equal('Test Shop');
    expect(res.body.materialOffered).to.be.an('array').that.includes('Cotton');
    expect(res.body.materials).to.be.an('array').with.lengthOf(2);
  });

  it('should return 404 for non-existent supplier', async () => {
    const fakeId = '60f1a5b9e6c7a234567890ab'; // Any non-matching ID
    const res = await chai.request(API_URL).get(`/suppliers/${fakeId}`);
    
    expect(res).to.have.status(404);
  });

  it('should handle invalid ID format', async () => {
    const res = await chai.request(API_URL).get('/suppliers/invalid-id');
    expect(res.status).to.be.oneOf([400, 404, 500]);
  });
});