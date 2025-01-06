import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

// Add logging middleware for debugging
router.use((req, res, next) => {
  console.log(`Auth Route accessed: ${req.method} ${req.url}`);
  next();
});

router.post('/register', register);
router.post('/login', login);

export default router; 