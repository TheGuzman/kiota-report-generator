import express from 'express';
import generateDigCompRouter from './flows/generate-digcomp-router.js';
import generateEntrecompRouter from './flows/generate-entrecomp-router.js';

const reportsRouter = express.Router();

reportsRouter.use('/entrecomp', generateEntrecompRouter);

reportsRouter.use('/digcomp', generateDigCompRouter);

export default reportsRouter;
