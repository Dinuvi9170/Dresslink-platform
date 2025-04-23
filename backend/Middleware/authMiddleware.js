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
                       req.isAuthenticated = true;
                       next();
                    }
                    else
                    {
                        res.status(403).json({ message: "invalid Token" });
                    }    
                });
        }
        else{
            req.isAuthenticated = false;
            req.user = null;
            next();
        }
    }

    
export default authenticate;


