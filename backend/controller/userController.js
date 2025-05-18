import User from '../models/usermodels.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
//get profile
export const getusers = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 //create account
export function registeruser (req, res){
    if(req.body.role=="admin"){
        if(req.user!=null){
            if(req.user.role!="admin"){
                res.status(403).json({ message: 'You are not authorized to create an admin user' })
                return
            }
        }
        else{
            res.status(401).json({ message: 'you are not logged in. Pease login first' })
            return
        }   
    } 
    // Hash the password before saving the user
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const user = new User({
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role,
        phone: req.body.phone,
        address: req.body.address,
        image: req.body.image,
        createdAt: req.body.createdAt,
    });
    user.save()
        .then(() => {
            res.status(201).json({ message: 'User created successfully' });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: 'Failed to create user' });
        }   );
}
//login
export function loginUser (req, res) {
    const email= req.body.email;
    const password= req.body.password;
    User.findOne({ email: email })
    .then((user) => {
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // Compare password with the hashed password in the database
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {  
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // Generate a JWT token
        const token = jwt.sign({
             _id: user._id,
            email: user.email,
            fname: user.fname,
            lname: user.lname,
            role: user.role,
            image: user.image,
            address: user.address,
        }, process.env.JWT_SECRET,);

        // send a success response
        res.status(200).json({ 
            message: 'Login successful', 
            token: token, 
            user: {
                _id: user._id,
                email: user.email,
                fname: user.fname,
                lname: user.lname,
                role: user.role,
                image: user.image,
                address: user.address,
            },
        });
    })
    .catch((error) => {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    });
}

//update user
export const updateProfile = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user by ID
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields, only if provided in the request
    if (req.body.fname) user.fname = req.body.fname;
    if (req.body.lname) user.lname = req.body.lname;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.image) user.image = req.body.image;
    
    // Update address if provided
    if (req.body.address) {
      user.address = {
        number: req.body.address.number || user.address?.number,
        street: req.body.address.street || user.address?.street,
        city: req.body.address.city || user.address?.city,
        district: req.body.address.district || user.address?.district,
        province: req.body.address.province || user.address?.province
      };
    }
    
    // Save the updated user
    await user.save();

    // Generate a new JWT token with updated user information
    const newToken = jwt.sign({
      _id: user._id,
      email: user.email,
      fname: user.fname,
      lname: user.lname,
      role: user.role,
      image: user.image,
      address: user.address,
    }, process.env.JWT_SECRET);
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      token: newToken,
      user: {
        _id: user._id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        role: user.role,
        phone: user.phone,
        image: user.image,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
