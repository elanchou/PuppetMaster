import { Router } from 'express';
import { AIPilotController } from '../controllers/AIPilotController';

const router = Router();
const aiPilotController = new AIPilotController();

// AI Pilot 路由
router.post('/execute', aiPilotController.execute.bind(aiPilotController));

export default router; 