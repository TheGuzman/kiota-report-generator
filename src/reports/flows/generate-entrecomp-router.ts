/* eslint-disable camelcase */
import express from 'express';
import generateReportRouter from '../generateReport/generate-report-router.js';
import { BaseReportRequest } from '../generateReport/report-model.js';
import { ReportRequestAdapter } from '../utils/report-view-adapter.js';

const generateEntrecompRouter = express.Router();

generateEntrecompRouter
  .route('/')
  .post((req, res) => {
    const reportData = req.body;
    res.render('entrecomp-template.ejs', {
      reportData,
    });
  })
  .get((req, res) => {
    const requestData: BaseReportRequest = {
      language: 'es',
      user_data: {
        name: 'Diego Guzmán',
        sex: 'Male',
        age: 29,
        college_career: 'Computer Engineering',
        educational_level: 'Higher Education',
        date: '25/08/2023',
      },
      areas: {
        creativity: 3,
        spotting_opportunities: 5,
        planning_and_management: 6,
        motivation_and_perseverence: 2,
        vision: 3,
        valuing_ideas: 4,
        ethical_and_sustainable_thinking: 5,
        self_awareness_and_self_efficacy: 6,
        mobilising_resources: 5,
        financial_and_economic_literacy: 4,
        mobilising_others: 6,
        taking_the_initiative: 1,
        copying_ambiguity_and_risk: 3,
        working_with_others: 2,
        learning_through_experience: 1,
      },
    } as BaseReportRequest;
    const reportAdapter = new ReportRequestAdapter({
      ...requestData,
      report: 'entrecomp',
    });
    const reportData = reportAdapter.adaptReportRequestToView();

    res.render('entrecomp-template.ejs', {
      reportData,
    });
  });

generateEntrecompRouter.use('/generateReport', generateReportRouter);

export default generateEntrecompRouter;
