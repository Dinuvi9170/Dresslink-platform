import express from 'express';
import dotenv from'dotenv';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import userRouter from './routes/userRouter.js';
import gigRouter from './routes/gigRouter.js';
import cors from "cors";
import appointmentRouter from './routes/appointmentRouter.js';

dotenv.config();
connectDB();
const app= express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));


app.use("/user", userRouter)
app.use("/gigs", gigRouter)
app.use("/appointments", appointmentRouter)

const PORT= process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});




