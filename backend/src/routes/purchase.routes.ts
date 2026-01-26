
import { Router } from 'express';
import { createBookCharge } from '../controllers/purchase.controller';

const router = Router();

router.post('/book-generation', createBookCharge);

export default router;
