import express from 'express';
import * as controller from './json.controller';
import wrapAsync from '../../helpers/wrapAsync';

const router = express.Router();

// GET
router.get('/data', wrapAsync(controller.getAll));

export default router;
