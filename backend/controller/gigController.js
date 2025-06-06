import Gig from "../models/gig.js";
import Order from "../models/ordermodel.js";

//create professional gig
export async function creategig(req, res) {
  try {
      
      console.log("Authentication check:", {
          hasUser: !!req.user,
          userId: req.user?._id,
          isAuthenticated: !!req.isAuthenticated
      });
      
      console.log("Request body received:", req.body);
      
      // Check if user is authenticated
      if (!req.user || !req.user._id) {
          return res.status(401).json({ 
              message: 'Unauthorized - invalid authentication',
              details: 'User information is missing from the request'
          });
      }
      // Check if user has the professional role
      if (!req.user.role || req.user.role !== 'professional') {
        return res.status(403).json({ message: 'Access denied. Only professionals can create shop profiles.' });
      }
      
      // Create the gig object without files
      const gig = new Gig({
          user: req.user._id,
          title: req.body.title || '',
          description: req.body.description || '',
          shorttitle: req.body.shorttitle || '',
          shortdesc: req.body.shortdesc || '',
          price: parseInt(req.body.price) || 0,
          category: req.body.category || 'tailoring',
          cover: req.body.cover || '',
          images: req.body.images || [],
          services:req.body.services || [],
          createdAt: new Date(),
      });
      
      // Validate the gig object before saving
      const validationError = gig.validateSync();
      if (validationError) {
          console.error("Validation error:", validationError);
          return res.status(400).json({
              error: 'Validation failed',
              details: validationError.errors
          });
      }
      
      // Save the gig 
      const savedGig = await gig.save();
      
      return res.status(201).json({
          message: 'Gig created successfully',
          gig: {
              id: savedGig._id,
              title: savedGig.title
          }
      });
  } catch (error) {
      console.error("Error creating gig:", error);
      return res.status(500).json({
          error: 'Failed to create gig'
      });
  }
}

export async function getgig (req,res){
  const {_id} = req.params;
  try{
    const gigs = await Gig.findOne({_id}).populate('user', 'fname lname image role address shorttitle shortdesc cover price category createdAt');
    if (!gigs) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    // Fetch related orders with reviews for this gig
    const orders = await Order.find({
      gig: _id,
      'initialReview.rating': { $exists: true }
    }).populate('client', 'fname lname image');
    
    // Format the reviews data from orders
    const initialReviews = orders.map(order => ({
      clientName: order.client ? `${order.client.fname} ${order.client.lname}` : 'Anonymous',
      clientImage: order.client?.image || null,
      rating: order.initialReview.rating,
      comment: order.initialReview.comment,
      givenAt: order.initialReview.givenAt,
      professionalResponse: order.professionalResponse?.comment
    }));
    return res.status(200).json({...gigs.toObject(), initialReviews});
  }
    
  catch (error) {
    res.status(500).json({ error: 'Failed to fetch gigs' });
  }
}
export async function getAllgigs(req, res) {
  try {
    const gigs = await Gig.find().populate('user', 'fname lname image role');
    res.status(200).json(gigs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch gigs' });
  }
}

export async function findgig(req, res) {
  const { city, minPrice, maxPrice } = req.query;
  console.log("Filters Received → City:", city, "Min Price:", minPrice, "Max Price:", maxPrice);
  
  try {
    const pipeline = [];
      
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    });
      
   
    pipeline.push({
      $unwind: '$userData'
    });
      
    
    const matchConditions = {};
      
    // Price filter
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      matchConditions.price = {};
      if (!isNaN(minPrice)) matchConditions.price.$gte = parseInt(minPrice);
      if (!isNaN(maxPrice)) matchConditions.price.$lte = parseInt(maxPrice);
    }
      
    // City filter
    if (city) {
      matchConditions['userData.address.city'] = { $regex: new RegExp(city, 'i') };
    }
      
    // Add match stage if we have conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }
      
    const filteredGigs = await Gig.aggregate(pipeline);
      
    const formattedGigs = filteredGigs.map(gig => ({
      ...gig,
      user: {
        _id: gig.userData._id,
        fname: gig.userData.fname,
        lname: gig.userData.lname,
        image: gig.userData.image,
        role: gig.userData.role,
        address: gig.userData.address
      }
    }));
      
    console.log(`Found ${formattedGigs.length} gigs after applying all filters`);
    return res.status(200).json(formattedGigs);
      
  } catch (error) {
    console.error("Error fetching filtered gigs:", error);
    return res.status(500).json({
      error: true,
      message: error.message || 'Internal server error while fetching gigs'
    });
  }
}
  
// Get all gigs for the currently authenticated user
export const getUserProfessionalGigs = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.isAuthenticated || !req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const userGigs = await Gig.find({ user: req.user._id });
        console.log("Found user gigs:", userGigs);
        res.status(200).json(userGigs);
    } catch (error) {
        console.error("Error fetching user's professional gigs:", error);
        res.status(500).json({ 
            error: 'Failed to fetch your gigs', 
            details: error.message 
        });
    }
};

// Update a professional gig
export const updateProfessionalGig = async (req, res) => {
  try {
    // Check authentication 
    if (!req.isAuthenticated || !req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const gigId = req.params._id;
    console.log(`Updating gig with ID: ${gigId}`);
    console.log(`User ID: ${req.user._id}`);

    // Check if the gig exists and belongs to the user
    const existingGig = await Gig.findById(gigId);

    if (!existingGig) {
      console.log(`Gig with ID ${gigId} not found`);
      return res.status(404).json({ message: 'Professional gig not found' });
    }

    if (existingGig.user.toString() !== req.user._id.toString()) {
      console.log(`User ${req.user._id} is not authorized to update gig ${gigId}`);
      return res.status(403).json({ message: 'You can only update your own gigs' });
    }

    const updateData = {
      title: req.body.title || existingGig.title,
      description: req.body.description || existingGig.description,
      shorttitle: req.body.shorttitle || existingGig.shorttitle,
      shortdesc: req.body.shortdesc || existingGig.shortdesc,
      price: parseInt(req.body.price) || existingGig.price,
      category: req.body.category || existingGig.category,
      cover: req.body.cover || existingGig.cover,
      images: req.body.images || existingGig.images
    };

    console.log("Update data:", updateData);

    // Update the gig with new data
    try {
      const updatedGig = await Gig.findByIdAndUpdate(
        gigId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      console.log(`Gig ${gigId} updated successfully`);
      res.status(200).json({
        message: 'Professional gig updated successfully',
        gig: updatedGig
      });
    } catch (updateError) {
      console.error("Error during gig update:", updateError);
      return res.status(500).json({
        error: 'Failed to update professional gig',
        details: updateError.message
      });
    }
  } catch (error) {
    console.error("Error updating professional gig:", error);
    res.status(500).json({
      error: 'Failed to update professional gig',
      details: error.message
    });
  }
};

// Delete a professional gig
export const deleteGig = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.isAuthenticated || !req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const gigId = req.params._id;
        
        // check if the gig exists and belongs to the user
        const existingGig = await Gig.findById(gigId);
        
        if (!existingGig) {
            return res.status(404).json({ message: 'Professional gig not found' });
        }
        
        if (existingGig.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own gigs' });
        }
        
        // Delete the gig
        await Gig.findByIdAndDelete(gigId);
        
        res.status(200).json({ 
            message: 'Professional gig deleted successfully'
        });
    } catch (error) {
        console.error("Error deleting professional gig:", error);
        res.status(500).json({ 
            error: 'Failed to delete professional gig', 
            details: error.message 
        });
    }
};

// search by name
export async function searchGigs(req, res) {
  const { search } = req.query;
  
  try {
    if (!search || search.trim() === '') {
      return await findgig(req, res);
    }

    const searchRegex = new RegExp(search.trim(), 'i');
    
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
      },
      {
        $match: {
          $or: [
            { title: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { category: { $regex: searchRegex } },
            { 'userData.fname': { $regex: searchRegex } },
            { 'userData.lname': { $regex: searchRegex } }
          ]
        }
      }
    ];
    
    const results = await Gig.aggregate(pipeline);
  
    const formattedResults = results.map(gig => ({
      ...gig,
      user: {
        _id: gig.userData._id,
        fname: gig.userData.fname,
        lname: gig.userData.lname,
        image: gig.userData.image,
        role: gig.userData.role,
        address: gig.userData.address
      }
    }));
    
    return res.status(200).json(formattedResults);
  } catch (error) {
    console.error("Error searching gigs:", error);
    return res.status(500).json({
      error: true,
      message: error.message || 'Internal server error while searching gigs'
    });
  }
}
