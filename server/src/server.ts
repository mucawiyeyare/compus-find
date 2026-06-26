import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';
import { handleSockets } from './sockets/socket.handler';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_connect';

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Setup sockets
handleSockets(io);

// Connect to Database
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB database connection established successfully.');
    // Start Server
    server.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error. Starting server without db connection for fallback mock mode...', err);
    
    // Start Server regardless so that frontends can load or mock interfaces function
    server.listen(PORT, () => {
      console.log(`Server running in Mock mode on port: ${PORT}`);
    });
  });
