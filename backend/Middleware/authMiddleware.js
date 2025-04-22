import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const authenticate = (req,res,next)=> {
        const tokenString = req.header("Authorization");
        if(tokenString!=null){
            const token = tokenString.replace("Bearer ", "");
            req.token = token;

            jwt.verify(token, process.env.JWT_SECRET, 
                (err, decoded) => {
                    if (decoded !== null) {
                       req.user=decoded;
                       next();
                    }
                    else
                    {
                        res.status(401).json({ message: "Unauthorized" });
                    }    
                });
        }
        else{
            next();
        }
    }
export default authenticate;


