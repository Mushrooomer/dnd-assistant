import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import gameRoutes from './routes/gameRoutes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Basic route for testing
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', message: 'D&D Assistant API is running' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error: Error) => console.error('MongoDB connection error:', error));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle game events
  socket.on('join_game', (gameId: string) => {
    socket.join(gameId);
    console.log(`User joined game: ${gameId}`);
  });

  socket.on('leave_game', (gameId: string) => {
    socket.leave(gameId);
    console.log(`User left game: ${gameId}`);
  });

  socket.on('game_action', (data: { gameId: string; action: any }) => {
    io.to(data.gameId).emit('game_update', data.action);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 