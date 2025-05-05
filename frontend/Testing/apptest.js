import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';

describe('Supplier API Tests', function() {
  let axiosStub;
  
  beforeEach(function() {
    // Create a stub for axios.get
    axiosStub = sinon.stub(axios, 'get');
  });
  
  afterEach(function() {
    // Restore original functionality
    axiosStub.restore();
  });
  
  it('should fetch supplier data successfully', async function() {
    // Mock successful response
    const mockData = { 
      _id: '6817ebebcfb614ae94c1b2ab',
      ShopName: 'Test Shop',
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image4.jpg'
      ]
    };
    axiosStub.resolves({ data: mockData });
    
    // Make the API call
    const response = await axios.get('http://localhost:3000/suppliers/6817ebebcfb614ae94c1b2ab');
    
    // Verify the call was made correctly
    expect(axiosStub.calledWith('http://localhost:3000/suppliers/6817ebebcfb614ae94c1b2ab')).to.be.true;
    expect(response.data).to.deep.equal(mockData);
    expect(response.data.images.length).to.equal(4);
  });
  
  it('should handle API errors properly', async function() {
    // Mock an API error
    axiosStub.rejects(new Error('Network Error'));
    
    try {
      await axios.get('http://localhost:3000/suppliers/6817ebebcfb614ae94c1b2ab');
      // Should not reach here
      expect.fail('Expected an error to be thrown');
    } catch (error) {
      expect(error.message).to.equal('Network Error');
    }
  });
});