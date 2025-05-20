import express from 'express';
import dotenv from'dotenv';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import userRouter from './routes/userRouter.js';
import gigRouter from './routes/gigRouter.js';
import cors from "cors";
import http from 'http';
import { Server } from 'socket.io';
import appointmentRouter from './routes/appointmentRouter.js';
import conversationRouter from './routes/conversationRouter.js';
import messageRouter from './routes/messageRouter.js';
import supplierRouter from './routes/supplierRouter.js';
import myfitRouter from './routes/myfitRouter.js';
import { autoUpdateAppointmentStatus } from './controller/appointmentController.js';
import orderrouter from './routes/orderRouter.js';

dotenv.config();
connectDB();
const app= express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));


app.use("/user", userRouter)
app.use("/gigs", gigRouter)
app.use("/appointments", appointmentRouter)
app.use("/conversations", conversationRouter)
app.use("/messages", messageRouter)
app.use("/suppliers",supplierRouter)
app.use("/myfit", myfitRouter)
app.use("/orders",orderrouter)

// Run auto-update every hour
setInterval(async () => {
  console.log('Running scheduled appointment status update');
  const result = await autoUpdateAppointmentStatus();
  console.log(`Auto-update completed: ${result.count} appointments updated`);
}, 60 * 60 * 1000);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('sendMessage', ({ senderId, receiverId, content }) => {
        io.emit('getMessage', {
          senderId,
          receiverId,
          content,
          createdAt: new Date()
        });
      });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


const PORT= process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});




