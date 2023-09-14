/* eslint-disable func-call-spacing */
import AWS from 'aws-sdk';
import ejs from 'ejs';
import express from 'express';
import fs from 'fs';
import path from 'path';
import puppeteer, { Viewport } from 'puppeteer';
import log from '../../logger.js';
import { generateRadarGraph } from '../utils/graph-generator.js';
import { ReportRequestAdapter } from '../utils/report-view-adapter.js';
import { ReportRequest, ReportType, ReportView } from './report-model.js';

const urlMap = new Map<string, () => string>([
  ['entrecomp', () => process.env.ENTRECOMP as string],
  ['digcomp', () => process.env.DIGCOMP as string],
]);
const generateReportRouter = express.Router();
generateReportRouter.route('/').post((req, res) => {
  const reportType = req.baseUrl.split('/reports')[1]?.split('/')[1];
  let requestData: ReportRequest = req.body;
  requestData = { ...requestData, report: reportType as ReportType };
  const reportAdapter = new ReportRequestAdapter(requestData);
  const reportData = reportAdapter.adaptReportRequestToView();

  ejs.renderFile(
    path.join('', 'views/', `${reportType}-template.ejs`),
    { reportData },
    async (err, _data) => {
      if (err) {
        log.info(err);
      } else {
        reportData.reportData.sections.forEach(async section => {
          await generateRadarGraph(
            {
              width: 440,
              height: 440,
              backgroundColour: 'transparent',
              chartData: {
                labels: section.areas.map(area => area.title),
                values: section.areas.map(area => area.feedbackValue),
              },
            },
            section.title,
            reportData.type,
          );
        });
        const date = Date.now();
        log.info(reportData.reportData.sections);
        // Await generatePDF(reportData);
        const pfdFile = (await generatePDF(reportData)) as Buffer;

        cleanImagesDirectory();
        const reportFile = await uploadReport(date, pfdFile.toString('base64'));
        res.json(reportFile.Location);
      }
    },
  );
});
// .get((_req, res) => {
//   const requestData = {
//     language: 'es',
//     report: 'digcomp',
//     user_data: {
//       name: 'Diego Guzmán',
//       sex: 'Male',
//       age: 29,
//       college_career: 'Computer Engineering',
//       educational_level: 'Higher Education',
//       date: '25/08/2023',
//     },
//     areas: {
//       interacting_through_digital_technologies: 2,
//       sharing_through_digital_technologies: 4,
//       engaging_in_online_citizenship_through_digital_technologies: 4,
//       communication_and_collaboration: 5,
//       netiquette: 1,
//       managing_digital_identity: 3,
//       developing_content: 4,
//       integrating_and_reelaborating: 2,
//       copyright_and_licenses: 1,
//       programming: 2,
//       protecting_devices: 5,
//       protecting_personal_data_and_privacy: 5,
//       protecting_health_and_well_being: 3,
//       protecting_the_environment: 7,
//       solving_technical_problems: 6,
//       identifying_needs_and_technological_responses: 4,
//       creatively_using_technology: 4,
//       identifying_digital_competence_gaps: 2,
//       browsing_searching_and_filtering_information: 3,
//       evaluating_data_information_and_digital_content: 3,
//       managing_data_information_and_digital_content: 5,
//     },
//   };
//   const reportAdapter = new ReportRequestAdapter(
//     requestData as ReportRequest,
//   );
//   const reportData = reportAdapter.adaptReportRequestToView();
//   res.render('digcomp-template.ejs', {
//     reportData,
//   });
// });
export default generateReportRouter;

const generatePDF = async (
  reportData: ReportView,
): Promise<Buffer | undefined> => {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--single-process',
      '--no-zygote',
    ],
  });
  const page = await browser.newPage();
  const viewport = page.viewport() as Viewport;
  page.setViewport({ deviceScaleFactor: 2, ...viewport });

  await page.setRequestInterception(true);

  page.once('request', interceptedRequest => {
    const data = {
      method: 'POST',
      postData: JSON.stringify(reportData),
      headers: {
        ...interceptedRequest.headers(),
        'Content-Type': 'application/json',
      },
    };
    interceptedRequest.continue(data);
    page.setRequestInterception(false);
  });

  const geturl = urlMap.get(reportData.type);
  if (geturl) {
    await page.goto(geturl() as string, {
      waitUntil: ['domcontentloaded', 'networkidle0', 'load'],
    });
    const file = await page.pdf({
      format: 'A4',
      printBackground: true,
      path: process.env.ARTIFACTS_PATH + `${Date.now()}.pdf`,
      timeout: 0,
    });

    await browser.close();
    return file;
  }
};

const uploadReport = async (
  date: number,
  file: string,
): Promise<AWS.S3.ManagedUpload.SendData> => {
  const s3 = new AWS.S3({
    region: process.env.AWS_BUCKET_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  const data: AWS.S3.ManagedUpload.SendData = await s3
    .upload(
      {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: date.toString() + '.pdf',
        Body: Buffer.from(file, 'base64'),
        ContentType: 'application/pdf',
      },
      (err: any, data: any) => {
        if (err) {
          log.info(err);
          return;
        }

        log.info(`File uploaded successfully. ${data.Location}`);
      },
    )
    .promise();
  return data;
};

const cleanImagesDirectory = () => {
  try {
    const files = fs.readdirSync('public/imgs/');
    for (const file of files) {
      const filePath = path.join('public/imgs/', file);
      const stats = fs.statSync(filePath);

      if (stats.isFile() && file !== '.gitkeep') {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err: any) {
    log.info(`Error: ${err.message}`);
  }
};
