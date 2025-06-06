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
        const supplier = new SupplierGig({
            user: req.user._id,
            userId:req.user._id,
            ShopName: req.body.ShopName,
            shopDescription: req.body.shopDescription,
            materialOffered: req.body.materialOffered,
            title:req.body.title,
            cover:req.body.cover,
            shopImages:req.body.shopImages,
            contactInfo:req.body.contactInfo,
            materials:req.body.materials
            
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
    const gig = await SupplierGig.findById(req.params._id).populate('user', 'fname lname email image address');

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
    
    let query = {};
    
   // Check if city is provided and add to query
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

    const materialsConditions = [];
    
    // Filter by material type if provided
    if (materialType && materialType !== '') {
      materialsConditions.push({ 
        $match: {
          "materials.type": materialType
        } 
      });
    }
    
    // Add price range filter if it exists
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        materialsConditions.push({
          $match: {
            "materials.price": { $gte: minPrice, $lte: maxPrice }
          }
        });
      }
    }

    if (materialsConditions.length > 0) {
      pipeline.push({
        $match: {
          $or: [
            { "materials.type": materialType && materialType !== '' ? materialType : { $exists: true } },
            { "materials.price": priceRange ? { 
                $gte: Number(priceRange.split('-')[0]), 
                $lte: Number(priceRange.split('-')[1]) 
              } : { $exists: true } 
            }
          ]
        }
      });
    }
    
    // Add the match conditions to the pipeline
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    const filteredSuppliers = await SupplierGig.aggregate(pipeline);
    
    console.log(`Found ${filteredSuppliers.length} supplier profiles after applying all filters`);
    
    
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
        materials: gig.materials,
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
// Get all gigs for the currently authenticated user
export const getUserSupplierGigs = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.isAuthenticated || !req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const userGigs = await SupplierGig.find({ user: req.user._id });
        console.log("Found user gigs:", userGigs);
        res.status(200).json(userGigs);
    } catch (error) {
        console.error("Error fetching user's supplier gigs:", error);
        res.status(500).json({ 
            error: 'Failed to fetch your gigs', 
            details: error.message 
        });
    }
};

// Update a supplier gig
export const updateSupplierGig = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.isAuthenticated || !req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const gigId = req.params._id;
        
        // Check if the gig exists and belongs to the user
        const existingGig = await SupplierGig.findById(gigId);
        
        if (!existingGig) {
            return res.status(404).json({ message: 'Supplier gig not found' });
        }
        
        if (existingGig.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only update your own gigs' });
        }
        
        // Update the gig with new data
        const updatedGig = await SupplierGig.findByIdAndUpdate(
            gigId, 
            {
                ShopName: req.body.ShopName,
                shopDescription: req.body.shopDescription,
                materialOffered: req.body.materialOffered,
                title: req.body.title,
                cover: req.body.cover,
                shopImages: req.body.shopImages,
                contactInfo: req.body.contactInfo,
                materials: req.body.materials
            }, 
            { new: true, runValidators: true }
        );
        
        res.status(200).json({ 
            message: 'Supplier gig updated successfully', 
            gig: updatedGig 
        });
    } catch (error) {
        console.error("Error updating supplier gig:", error);
        res.status(500).json({ 
            error: 'Failed to update supplier gig', 
            details: error.message 
        });
    }
};

// Delete a supplier gig
export const deleteSupplierGig = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.isAuthenticated || !req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const gigId = req.params._id;
        
        // Check if the gig exists and belongs to the user
        const existingGig = await SupplierGig.findById(gigId);
        
        if (!existingGig) {
            return res.status(404).json({ message: 'Supplier gig not found' });
        }
        
        if (existingGig.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own gigs' });
        }
        
        // Delete the gig
        await SupplierGig.findByIdAndDelete(gigId);
        
        res.status(200).json({ 
            message: 'Supplier gig deleted successfully'
        });
    } catch (error) {
        console.error("Error deleting supplier gig:", error);
        res.status(500).json({ 
            error: 'Failed to delete supplier gig', 
            details: error.message 
        });
    }
};
