import express from 'express';
import generateReportRouter from '../generateReport/generate-report-router.js';

const generateDigcompRouter = express.Router();

generateDigcompRouter.route('/').post((req, res) => {
  const reportData = req.body;
  res.render('digcomp-template.ejs', { reportData });
});
// .get((req, res) => {
//   const requestData: ReportRequest = {
//     language: 'es',
//     user_data: {
//       name: 'Diego Guzmán',
//       sex: 'Male',
//       age: 29,
//       college_career: 'Computer Engineering',
//       educational_level: 'Higher Education',
//       date: '25/08/2023',
//     },
//     areas: {
//       creativity: 3,
//       spotting_opportunities: 5,
//       motivation_and_perseverence: 6,
//     },
//   } as ReportRequest;
//   const reportAdapter = new ReportRequestAdapter(requestData);
//   const reportData = reportAdapter.adaptReportRequestToView();

//   res.render('digcomp-template.ejs', { reportData });
// });

generateDigcompRouter.use('/generateReport', generateReportRouter);

export default generateDigcompRouter;
