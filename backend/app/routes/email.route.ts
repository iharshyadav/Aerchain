import express from 'express';
import { sendEmailController, sendEmailToMultipleVendorsController } from '../controller/email.controller.js';

const router = express.Router();

router.post('/send', sendEmailController);
router.post('/send-multiple', sendEmailToMultipleVendorsController);

export default router;