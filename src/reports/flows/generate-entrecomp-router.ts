import express from 'express';
import generateReportRouter from '../generateReport/generate-report-router.js';

const generateEntrecompRouter = express.Router();

generateEntrecompRouter.route('/').post((req, res) => {
  const reportData = req.body;
  res.render('entrecomp-template.ejs', {
    reportData,
  });
});

generateEntrecompRouter.use('/generateReport', generateReportRouter);

export default generateEntrecompRouter;
