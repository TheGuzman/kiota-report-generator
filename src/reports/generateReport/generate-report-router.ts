/* eslint-disable func-call-spacing */
import ejs from 'ejs';
import express from 'express';
import path from 'path';
import puppeteer from 'puppeteer';

import fs from 'fs';
import { generateRadarGraph } from '../utils/graph-generator.js';
import { ReportRequestAdapter } from '../utils/report-view-adapter.js';
import { ReportRequest, ReportType, ReportView } from './report-model.js';

import { Viewport } from 'puppeteer';
import log from '../../logger.js';
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
        const pfdFile = await printPDF(reportData);
        cleanImagesDirectory();
        log.info('generated ReportData', reportData);
        res.download(pfdFile as string);
      }
    },
  );
});
export default generateReportRouter;

const printPDF = async (reportData: ReportView) => {
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
  log.info(viewport, 'viewPort');

  page.setViewport({
    deviceScaleFactor: 2,
    width: viewport.width + 20,
    height: viewport.height,
  });
  const date = Date.now();

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
    await page.pdf({
      format: 'A4',
      path: process.env.ARTIFACTS_PATH + `${date}.pdf`,
      printBackground: true,
      timeout: 0,
    });
    await browser.close();

    const file = process.env.ARTIFACTS_PATH + `${date}.pdf`;
    return file;
  }
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
