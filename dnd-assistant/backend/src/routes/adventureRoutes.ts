import { Router } from 'express';
import { getAdventures } from '../controllers/adventureController';

const router = Router();

router.get('/', getAdventures);

export default router; 