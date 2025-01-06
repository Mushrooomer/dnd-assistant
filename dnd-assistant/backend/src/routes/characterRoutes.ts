import { Router, RequestHandler } from 'express';
import { auth } from '../middleware/auth';
import {
  createCharacter,
  getCharacters,
  getCharacter,
  updateCharacter,
  deleteCharacter
} from '../controllers/characterController';

const router = Router();

// Protect all character routes
router.use(auth);

// Cast handlers to unknown first to satisfy TypeScript
router.post('/', createCharacter as unknown as RequestHandler);
router.get('/', getCharacters as unknown as RequestHandler);
router.get('/:id', getCharacter as unknown as RequestHandler);
router.patch('/:id', updateCharacter as unknown as RequestHandler);
router.delete('/:id', deleteCharacter as unknown as RequestHandler);

export default router; 