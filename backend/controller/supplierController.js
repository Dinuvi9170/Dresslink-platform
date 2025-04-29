import SupplierGig from '../models/supplierprofilemodel.js';
import User from '../models/usermodels.js';

// Create new supplier shop profile
export const createSupplierGig = async (req, res) => {
  try {
    const { userId, shopName, description, materialType, price, city, images } = req.body;

    // Validate supplier role
    const user = await User.findById(userId);
    if (!user || user.role !== 'supplier') {
      return res.status(403).json({ error: 'Only suppliers can create shop profiles' });
    }

    const newGig = new SupplierGig({
      userId,
      shopName,
      description,
      materialType,
      price,
      city,
      images,
    });

    const savedGig = await newGig.save();
    res.status(201).json(savedGig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier gig', details: error.message });
  }
};

// Get all supplier shop profiles
export const getAllSupplierGigs = async (req, res) => {
  try {
    const gigs = await SupplierGig.find().populate('userId', 'fname lname email image');
    res.status(200).json(gigs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier gigs', details: error.message });
  }
};

// Get a single shop profile by ID
export const getSupplierGigById = async (req, res) => {
  try {
    const gig = await SupplierGig.findById(req.params.id).populate('userId', 'fname lname email image');

    if (!gig) {
      return res.status(404).json({ error: 'Shop profile not found' });
    }

    res.status(200).json(gig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch the shop profile', details: error.message });
  }
};

// Get filtered supplier shop profiles
export async function findSupplier(req, res) {
    const { city, materialType, priceRange } = req.query;
    console.log("Filters Received → City:", city, "Material Type:", materialType, "Price Range:", priceRange);
    
    try {
      // Basic query without complex aggregation first
      let query = {};
      
      // Add filters to query if they exist
      if (city && city !== '') {
        query.city = { $regex: new RegExp(city, 'i') };
      }
      
      if (materialType && materialType !== '') {
        query.materialType = materialType;
      }
      
      // Add price range filter if it exists
      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        if (!isNaN(minPrice) && !isNaN(maxPrice)) {
          query.price = { $gte: minPrice, $lte: maxPrice };
        }
      }
      
      // Execute the query with populated user data
      const filteredSuppliers = await SupplierGig.find(query)
        .populate('userId', 'fname lname email image')
        .lean(); // Use lean() for better performance
      
      console.log(`Found ${filteredSuppliers.length} supplier profiles after applying all filters`);
      
      // Format the response to match your expected structure
      const formattedSuppliers = filteredSuppliers.map(gig => {
        return {
          _id: gig._id,
          shopName: gig.shopName,
          description: gig.description,
          materialType: gig.materialType,
          price: gig.price,
          city: gig.city,
          images: gig.images,
          userId: gig.userId._id,
          user: {
            _id: gig.userId._id,
            fname: gig.userId.fname,
            lname: gig.userId.lname,
            email: gig.userId.email,
            image: gig.userId.image
          }
        };
      });
      
      return res.status(200).json(formattedSuppliers);
      
    } catch (error) {
      console.error("Error fetching filtered supplier profiles:", error);
      return res.status(500).json({
        error: true,
        message: error.message || 'Internal server error while fetching supplier profiles'
      });
    }
  }