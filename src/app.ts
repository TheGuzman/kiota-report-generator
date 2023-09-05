import cors from 'cors';
import express from 'express';
import reportsRouter from './reports/reports-router.js';
const app = express();

app.use(express.json());
app.use(cors());

app.get('/', async (_req, res) => {
  res.json('Server ON');
});

app.use('/reports', reportsRouter);
app.use(express.static('public'));
app.disable('x-powered-by');
app.set('view engine', 'ejs');

export default app;
