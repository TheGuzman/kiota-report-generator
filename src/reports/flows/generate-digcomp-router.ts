import express from 'express';
import generateReportRouter from '../generateReport/generate-report-router.js';

const generateDigcompRouter = express.Router();

generateDigcompRouter.route('/').post((req, res) => {
  const reportData = req.body;
  res.render('digcomp-template.ejs', { reportData });
});
generateDigcompRouter.use('/generateReport', generateReportRouter);

export default generateDigcompRouter;
