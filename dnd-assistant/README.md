# D&D Digital Assistant

A modern web application that combines traditional D&D gameplay with AI-powered assistance and multiplayer capabilities.

## Features

- AI Dungeon Master using OpenAI API
- Support for official D&D 5E adventures
- Multiplayer support (AI companions and human players)
- Digital dice rolling mechanism
- User authentication and game state management

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB
- Socket.io
- OpenAI API

### Frontend
- React with TypeScript
- Redux Toolkit
- Material-UI
- Socket.io Client

## Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier is sufficient)
- OpenAI API key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=3001
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/dnd-assistant?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
This project is licensed under the ISC License. 