import Gig from "../models/gig.js";


export function creategig (req,res){
    // check is user authenticated or not
    if (!req.isAuthenticated || !req.user || !req.user._id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const gig = new Gig({
        user: req.user._id,
        title: req.body.title,
        description: req.body.description,
        shorttitle: req.body.shorttitle,
        shortdesc: req.body.shortdesc,
        price: req.body.price,
        category: req.body.category,
        cover: req.body.cover,
        images: req.body.images,
        createdAt: req.body.createdAt,
    });
    gig.save()
    .then(() => {
        res.status(201).json({ message: 'Gig created successfully' });
    })
    .catch((error) => {
        console.error(error);
        res.status(500).json({ error: 'Failed to create gig' });
    });

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
  
