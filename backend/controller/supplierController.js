import SupplierGig from '../models/supplierprofilemodel.js';

// Create new supplier shop profile
export const createSupplierGig = async (req, res) => {
    // check if user is authenticated or not
    if (!req.isAuthenticated || !req.user || !req.user._id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Check if user has the supplier role
    if (!req.user.role || req.user.role !== 'supplier') {
        return res.status(403).json({ message: 'Access denied. Only suppliers can create shop profiles.' });
    }

    try {
        //if (!req.body.city){
        //    return res.status(400).json({message: 'City is required'});
        //}
        const supplier = new SupplierGig({
            user: req.user._id,
            userId:req.user._id,
            ShopName: req.body.ShopName,
            shopDescription: req.body.shopDescription,
            materialOffered: req.body.materialOffered,
            title:req.body.title,
            cover:req.body.cover,
            images:req.body.images,
            contactInfo:req.body.contactInfo,
            materials:req.body.materials
            //city: req.body.city
        });

        await supplier.save();
        res.status(201).json({ message: 'Gig created successfully', supplier: supplier });
    }catch (error) {
    res.status(500).json({ error: 'Failed to create supplier gig', details: error.message });
  }
};


// Get all supplier shop profiles
export const getAllSupplierGigs = async (req, res) => {
    try {
      const gigs = await SupplierGig.find().populate('user', 'fname lname email image address');
      
      // Add a check if no gigs are found
      if (!gigs) {
        return res.status(404).json({ message: 'No supplier gigs found' });
      }
      
      res.status(200).json(gigs);
    } catch (error) {
      console.error("Error fetching supplier gigs:", error); 
      res.status(500).json({ 
        error: 'Failed to fetch supplier gigs', 
        details: error.message 
      });
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

{/*// Get filtered supplier shop profiles
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
  }*/}

  // Get filtered supplier shop profiles
export async function findSupplier(req, res) {
  const { city, materialType, priceRange } = req.query;
  console.log("Filters Received → City:", city, "Material Type:", materialType, "Price Range:", priceRange);
  
  try {
    // Basic query without complex aggregation first
    let query = {};
    
    // Since city is not in the supplier model but in the user model, we'll need to use aggregation
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: '$userData'
      }
    ];
    
    // Build match conditions
    const matchConditions = {};
    
    // Filter by city from user's address if provided
    if (city && city !== '') {
      matchConditions['userData.address.city'] = { $regex: new RegExp(city, 'i') };
    }
    
    // Filter by material type if provided
    if (materialType && materialType !== '') {
      matchConditions['materialOffered'] = materialType;
    }
    
    // Add price range filter if it exists
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        matchConditions.averagePrice = { $gte: minPrice, $lte: maxPrice };
      }
    }
    
    // Add match stage if we have conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }
    
    // Execute the aggregation
    const filteredSuppliers = await SupplierGig.aggregate(pipeline);
    
    console.log(`Found ${filteredSuppliers.length} supplier profiles after applying all filters`);
    
    // Format the response to match your expected structure
    const formattedSuppliers = filteredSuppliers.map(gig => {
      return {
        _id: gig._id,
        ShopName: gig.ShopName,
        shopDescription: gig.shopDescription,
        materialOffered: gig.materialOffered,
        title: gig.title,
        cover: gig.cover,
        images: gig.images,
        contactInfo: gig.contactInfo,
        user: {
          _id: gig.userData._id,
          fname: gig.userData.fname,
          lname: gig.userData.lname,
          email: gig.userData.email,
          image: gig.userData.image,
          address: gig.userData.address
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