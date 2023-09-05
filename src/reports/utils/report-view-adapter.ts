/* eslint-disable operator-linebreak */
import log from '../../logger.js';
import {
  ReportArea,
  ReportLeyend,
  ReportRequest,
  ReportView,
  Section,
} from '../generateReport/report-model.js';

import fs from 'fs';
export class ReportRequestAdapter {
  #reportRequest: ReportRequest;
  #reportLeyend: ReportLeyend = {
    sections: {},
    areas: {},
  };

  constructor(reportRequest: ReportRequest) {
    this.#reportRequest = reportRequest;
    this.#setLeyend();
  }

  adaptReportRequestToView(): ReportView {
    return {
      title:
        this.#reportRequest.report.charAt(0).toUpperCase() +
        this.#reportRequest.report.slice(1),
      userData: this.#reportRequest.user_data,
      type: this.#reportRequest.report,
      reportData: {
        sections: this.#setSections(this.#reportRequest.areas),
      },
    } as ReportView;
  }

  #setSections(areas: ReportArea): Section[] {
    const sections = [] as Section[];
    Array.from(Object.keys(areas)).forEach(area => {
      const section = this.#findSection(area);
      if (
        !sections.find(
          existingSection =>
            existingSection.title ===
            this.#reportLeyend.sections[section.title].title[
              this.#reportRequest.language
            ],
        )
      ) {
        sections.push(this.#setAreasInSection(section));
      }
    });

    return this.#sortMostRelevantSectionFirst(sections);
  }

  #setAreasInSection(section: Section): Section {
    const sectionAreas = this.#reportLeyend.sections[section.title].areas ?? [];
    const unSortedSection = {
      title:
        this.#reportLeyend.sections[section.title].title[
          this.#reportRequest.language
        ],
      areas: sectionAreas.map((area: string) => this.#setArea(area)),
    };

    return this.#sortAndRearrangeAreas(unSortedSection);
  }

  #setArea(area: string) {
    const lang = this.#reportRequest.language;
    const reportArea = this.#reportLeyend.areas[area];
    const areaFeedbackValue = this.#reportRequest.areas[area] ?? 0;
    const feedbackDescription = this.#checkIfDefinedOrNull(area)
      ? reportArea.empty[lang]
      : reportArea.feedback[lang][areaFeedbackValue];
    return {
      title: this.#reportLeyend.areas[area].title[this.#reportRequest.language],
      feedbackValue: areaFeedbackValue,
      feedbackDescription,
      tickIconLimit: this.#reportLeyend.areas[area].tick_icon_limit,
    };
  }

  #checkIfDefinedOrNull(area: string) {
    return (
      this.#reportRequest.areas[area] === null ||
      !this.#reportRequest.areas[area]
    );
  }

  #findSection(area: string): Section {
    return {
      title: this.#reportLeyend.areas[area].related_section[0],
      areas: [],
    };
  }

  #setLeyend() {
    try {
      const data = fs.readFileSync(
        `public/leyends/${this.#reportRequest.report}.json`,
        {
          encoding: 'utf-8',
        },
      );
      const reportLeyend: ReportLeyend = JSON.parse(data);
      this.#reportLeyend = reportLeyend;
    } catch (error) {
      log.info('Error reading or parsing the JSON file:', error);
    }
  }

  #sortAndRearrangeAreas(section: Section): Section {
    const sortedAreas = section.areas
      .slice()
      .sort((a, b) => a.title.length - b.title.length);
    const middleIndex = Math.floor(sortedAreas.length / 2);

    const beforeMiddle = sortedAreas.slice(0, middleIndex);
    const afterMiddle = sortedAreas.slice(middleIndex);

    const shortestTitleArea = beforeMiddle.reduce(
      (shortest, current) =>
        current.title.length < shortest.title.length ? current : shortest,
      beforeMiddle[0],
    );

    const shortestIndex = beforeMiddle.indexOf(shortestTitleArea);
    beforeMiddle.splice(shortestIndex, 1);

    return {
      title: section.title,
      areas: [shortestTitleArea, ...beforeMiddle, ...afterMiddle],
    };
  }

  #sortMostRelevantSectionFirst(sections: Section[]): Section[] {
    const queryTitle = this.#setQuery();

    const mostRelevantSection = sections.find(
      section => section.title === queryTitle,
    );

    const mostRelevantSectionIndex = sections.findIndex(
      section => section.title === queryTitle,
    );

    if (mostRelevantSectionIndex === -1) {
      return sections;
    }

    sections.splice(mostRelevantSectionIndex, 1);

    sections.unshift(mostRelevantSection as Section);

    return sections;
  }

  #setQuery(): string {
    if (this.#reportRequest.language !== 'es') {
      return 'Most relevant';
    }

    return 'Más relevantes';
  }
}
