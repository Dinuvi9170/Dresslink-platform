import Gig from "../models/gig.js";


export async function creategig(req, res) {
  try {
      // Enhanced authentication debugging
      console.log("Authentication check:", {
          hasUser: !!req.user,
          userId: req.user?._id,
          isAuthenticated: !!req.isAuthenticated
      });
      
      // Log request body for debugging
      console.log("Request body received:", req.body);
      
      // Check if user is authenticated
      if (!req.user || !req.user._id) {
          return res.status(401).json({ 
              message: 'Unauthorized - invalid authentication',
              details: 'User information is missing from the request'
          });
      }
      
      // Create the gig object without files
      const gig = new Gig({
          user: req.user._id,
          title: req.body.title || '',
          description: req.body.description || '',
          shorttitle: req.body.shorttitle || '',
          shortdesc: req.body.shortdesc || '',
          price: parseInt(req.body.price) || 0,
          category: req.body.category || 'other',
          // No files handling for now
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
      
      // Save the gig using await for better error handling
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
      
      // Return a more helpful error message
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
        return res.status(200).json(gigs);
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
      // Use aggregation for more efficient filtering
      const pipeline = [];
      
      // Start with a lookup to get user data
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      });
      
      // Unwind the userData array
      pipeline.push({
        $unwind: '$userData'
      });
      
      // Build match conditions
      const matchConditions = {};
      
      // Price filter
      if (!isNaN(minPrice) || !isNaN(maxPrice)) {
        matchConditions.price = {};
        if (!isNaN(minPrice)) matchConditions.price.$gte = parseInt(minPrice);
        if (!isNaN(maxPrice)) matchConditions.price.$lte = parseInt(maxPrice);
      }
      
      // City filter - apply at database level when possible
      if (city) {
        matchConditions['userData.address.city'] = { $regex: new RegExp(city, 'i') };
      }
      
      // Add match stage if we have conditions
      if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
      }
      
      // Execute the aggregation
      const filteredGigs = await Gig.aggregate(pipeline);
      
      // Format the result to match your current structure
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
  
