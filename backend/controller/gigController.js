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

export async function getgigs (req,res){
    const {_id} = req.params;
    try{
        const gigs = await Gig.findOne({_id}).populate('user', 'fname lname image role shorttitle shortdesc price category createdAt');
        if (!gigs) {
            return res.status(404).json({ message: 'Gig not found' });
        }
        return res.status(200).json(gigs);
    }
    
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch gigs' });
    }
}
   
