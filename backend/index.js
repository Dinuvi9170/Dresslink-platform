import express from 'express';
import dotenv from'dotenv';
import connectDB from './config/db.js';

dotenv.config();
connectDB();
const app= express();

app.get('/', (req, res) => {
    res.send('This is a get request.');
});

const PORT= process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});


