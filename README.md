# D&D Assistant

An interactive Dungeons & Dragons assistant that uses AI to create immersive role-playing experiences. The application features an AI Dungeon Master powered by OpenAI's GPT-4, real-time game sessions, and persistent game state management.

## Features

- 🎲 AI-powered Dungeon Master using OpenAI's GPT-4
- 🏰 Support for multiple game sessions
- 👥 User authentication and session management
- 💬 Real-time chat and game interactions
- 🎯 Automatic dice roll suggestions
- 📝 Persistent game state and memory
- 🌍 Dynamic world and NPC management

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (free tier is sufficient)
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dnd-assistant.git
cd dnd-assistant
```

2. Install dependencies for both backend and frontend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Create `.env` files:

Backend `.env`:
```
PORT=3001
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/dnd-assistant?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

4. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Usage

1. Register a new account or log in
2. Create a new game session
3. Start interacting with the AI Dungeon Master
4. Use natural language to describe your actions
5. The AI will respond with appropriate narrative and game mechanics

## Project Structure

```
dnd-assistant/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── store/
    │   └── App.tsx
    └── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT-4 API
- The D&D community for inspiration
- All contributors who help improve this project 