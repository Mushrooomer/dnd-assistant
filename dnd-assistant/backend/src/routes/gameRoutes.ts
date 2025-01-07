import { Router, RequestHandler } from 'express';
import { 
  createGame, 
  getGames, 
  getGame, 
  sendMessage, 
  deleteGame, 
  handleDiceRoll,
  getGameCharacters,
  addCharacterToGame,
  removeCharacterFromGame
} from '../controllers/gameController';
import { auth } from '../middleware/auth';
import { IUser } from '../models/User';

// Define custom types for authenticated requests
type AuthRequestHandler = RequestHandler & {
  user: IUser & { _id: string; username: string; };
};

const router = Router();

// Protect all game routes
router.use(auth);

// Game routes
router.post('/', createGame as unknown as RequestHandler);
router.get('/', getGames as unknown as RequestHandler);
router.get('/:id', getGame as unknown as RequestHandler);
router.post('/:id/message', sendMessage as unknown as RequestHandler);
router.post('/:id/roll', handleDiceRoll as unknown as RequestHandler);
router.delete('/:id', deleteGame as unknown as RequestHandler);

// Character management routes
router.get('/:id/characters', getGameCharacters as unknown as RequestHandler);
router.post('/:id/characters', addCharacterToGame as unknown as RequestHandler);
router.delete('/:id/characters/:characterId', removeCharacterFromGame as unknown as RequestHandler);

export default router; 