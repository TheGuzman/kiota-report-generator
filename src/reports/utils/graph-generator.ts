import { ChartConfiguration } from 'chart.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';
import log from '../../logger.js';
import { ReportType } from '../generateReport/report-model';

export type Colors = {
  primary: string;
  primaryHex: string;
  secondary: string;
  background: string;
};

const colors: Colors = {
  primary: 'rgba(116, 143, 201, 1)',
  primaryHex: '#748FC9',
  secondary: 'rgba(142, 202, 230, 1)',
  background: 'rgba(234, 248, 255, 0.4)',
};

const digCompColors: Colors = {
  ...colors,
  secondary: 'rgba(245, 234, 172, 1)',
  background: 'rgba(245, 234, 172, 0.4)',
};
const entrecompColors: Colors = {
  ...colors,
};

const graphFillColorMap = new Map<ReportType, Colors>([
  ['entrecomp', entrecompColors],
  ['digcomp', digCompColors],
]);

export type ChartOptions = {
  width: number;
  height: number;
  backgroundColour: string;
  chartData: {
    labels: string[];
    values: number[];
  };
};

export const generateRadarGraph = async (
  options: ChartOptions,
  title: string,
  reportType: ReportType,
) => {
  const { width, height, backgroundColour, chartData } = options;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour,
  });

  const graphColors = graphFillColorMap.get(reportType);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: '',
        data: chartData.values,
        fill: true,
        backgroundColor: graphColors?.background,
        borderColor: graphColors?.secondary,
        borderWidth: 1,
        pointBackgroundColor: graphColors?.primary,
        pointBorderColor: graphColors?.primary,
      },
    ],
  };

  const configuration = {
    type: 'radar',
    data,
    options: {
      devicePixelRatio: 5,
      plugins: {
        legend: {
          display: false,
        },
        padding: {},
      },
      scales: {
        r: {
          min: 0,
          max: 8,
          angleLines: {
            color: colors.primaryHex,
          },
          grid: {
            color: colors.primaryHex,
          },
          pointLabels: {
            padding(context: any) {
              if (context.index === 0) {
                return setCustomPadding(context.label.length);
              }

              return 15;
            },
            color: colors.primaryHex,
            font: {
              size: (context: any) => setCustomFontSize(context.label.length),
              weight: '900',
              family: 'Inter',
            },
            callback(input: string) {
              if (input.length <= 15) {
                return input;
              }

              let result = '';
              let currentLineLength = 0;

              for (const word of input.split(' ')) {
                if (currentLineLength + word.length <= 15) {
                  result += word + ' ';
                  currentLineLength += word.length + 1;
                } else {
                  result += '\n' + word + ' ';
                  currentLineLength = word.length + 1;
                }
              }

              return result.trim();
            },
          },
          ticks: {
            beginAtZero: true,
            callback: (value: any) => `     ${value}`,
            min: -0.001,
            stepSize: 2,
            backdropPadding: {
              x: 0,
              y: 0,
            },
            z: 20,
            color: colors.primaryHex,
            backdropColor: 'transparent',
          },
        },
      },
    },
  };
  const dataUrl = await chartJSNodeCanvas.renderToDataURL(
    configuration as ChartConfiguration,
  );
  const base64Image = dataUrl;

  const base64Data = base64Image.replace(/^data:image\/png;base64,/, '');

  const imagePath = `public/imgs/${title
    .replace(/\s/g, '-')
    .toLowerCase()}.png`;

  fs.writeFile(imagePath, base64Data, 'base64', err => {
    if (err) {
      log.info(`Error in chart png generation: ${err}`);
    }
  });
  return dataUrl;
};

const setCustomPadding = (stringLength: number): number => stringLength;
const setCustomFontSize = (stringLength: number): number => {
  if (stringLength >= 50) {
    return 10;
  }

  return 12;
};
