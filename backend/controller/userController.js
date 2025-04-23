import User from '../models/usermodels.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
export function getusers(req, res) {
  User.find().then(
    (data) => {
        res.status(200).json(data);
  });     
}   

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
                },
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        });
}


