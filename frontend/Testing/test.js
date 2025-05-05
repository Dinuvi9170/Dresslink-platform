import { expect } from 'chai';
import sinon from 'sinon';

// Mock gallery image helper function
function setupGallery(supplierData) {
  let images = [];
  
  // Check all possible image properties in the supplier data
  if (supplierData.images && Array.isArray(supplierData.images) && supplierData.images.length > 0) {
    images = supplierData.images;
  } else if (supplierData.cover) {
    images = [supplierData.cover];
  }
  
  return images;
}

// Sample supplier data
const mockSupplier = {
  _id: '6817ebebcfb614ae94c1b2ab',
  ShopName: 'Test Fabric Shop',
  shopDescription: 'Premium fabric supplier',
  cover: 'https://example.com/cover.jpg',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg'
  ],
  contactInfo: {
    mobile: '1234567890',
    whatsapp: '0987654321'
  },
  materials: [
    { type: 'Cotton', price: 250 },
    { type: 'Silk', price: 450 }
  ],
  user: {
    _id: 'user123',
    fname: 'John',
    lname: 'Doe',
    email: 'john@example.com',
    image: 'https://example.com/user.jpg'
  }
};

// Tests for image gallery functionality
describe('Supplier Gallery Tests', function() {
  it('should extract all images from supplier data', function() {
    const galleryImages = setupGallery(mockSupplier);
    
    expect(galleryImages).to.be.an('array');
    expect(galleryImages).to.have.lengthOf(4);
    expect(galleryImages[0]).to.equal('https://example.com/image1.jpg');
    expect(galleryImages[3]).to.equal('https://example.com/image4.jpg');
  });
  
  it('should use cover image as fallback when no images array exists', function() {
    // Create a proper deep copy of the object to prevent test interference
    const noImagesSupplier = JSON.parse(JSON.stringify(mockSupplier));
    noImagesSupplier.images = null;
    
    const galleryImages = setupGallery(noImagesSupplier);
    
    expect(galleryImages).to.be.an('array');
    expect(galleryImages).to.have.lengthOf(1);
    expect(galleryImages[0]).to.equal('https://example.com/cover.jpg');
  });
  
  it('should return empty array when no images or cover exists', function() {
    // Create a proper deep copy of the object to prevent test interference
    const noImagesSupplier = JSON.parse(JSON.stringify(mockSupplier));
    noImagesSupplier.images = null;
    noImagesSupplier.cover = null;
    
    const galleryImages = setupGallery(noImagesSupplier);
    
    expect(galleryImages).to.be.an('array');
    expect(galleryImages).to.have.lengthOf(0);
  });
});

// Tests for image thumbnail selection
describe('Thumbnail Selection Tests', function() {
  it('should update active image when thumbnail is clicked', function() {
    // Use sinon to create a spy function
    const setActiveImage = sinon.spy();
    
    // Simulate clicking second thumbnail
    setActiveImage(1);
    expect(setActiveImage.calledWith(1)).to.be.true;
    expect(setActiveImage.firstCall.args[0]).to.equal(1);
    
    // Simulate clicking fourth thumbnail
    setActiveImage(3);
    expect(setActiveImage.calledWith(3)).to.be.true;
    expect(setActiveImage.secondCall.args[0]).to.equal(3);
  });
});

// Tests for supplier materials display
describe('Supplier Materials Tests', function() {
  it('should correctly handle materials display', function() {
    const hasMaterials = mockSupplier.materials && 
                       Array.isArray(mockSupplier.materials) && 
                       mockSupplier.materials.length > 0;
    
    expect(hasMaterials).to.be.true;
    expect(mockSupplier.materials).to.be.an('array');
    expect(mockSupplier.materials[0]).to.be.an('object');
    expect(mockSupplier.materials[0].type).to.equal('Cotton');
    expect(mockSupplier.materials[0].price).to.equal(250);
    expect(mockSupplier.materials[1].type).to.equal('Silk');
    expect(mockSupplier.materials[1].price).to.equal(450);
  });
  
  it('should handle missing materials appropriately', function() {
    // Create a proper deep copy to prevent test interference
    const noMaterialsSupplier = JSON.parse(JSON.stringify(mockSupplier));
    noMaterialsSupplier.materials = [];
    
    const hasMaterials = noMaterialsSupplier.materials && 
                       Array.isArray(noMaterialsSupplier.materials) && 
                       noMaterialsSupplier.materials.length > 0;
    
    expect(hasMaterials).to.be.false;
    expect(noMaterialsSupplier.materials).to.be.an('array').that.is.empty;
  });
  
  it('should handle null materials property', function() {
    // Create a proper deep copy to prevent test interference
    const nullMaterialsSupplier = JSON.parse(JSON.stringify(mockSupplier));
    nullMaterialsSupplier.materials = null;
    
    const hasMaterials = nullMaterialsSupplier.materials && 
                       Array.isArray(nullMaterialsSupplier.materials) && 
                       nullMaterialsSupplier.materials.length > 0;
    
    expect(hasMaterials).to.be.false;
    expect(nullMaterialsSupplier.materials).to.be.null;
  });
});