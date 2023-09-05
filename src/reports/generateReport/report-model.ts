/* eslint-disable no-unused-vars */

export type ReportType = 'entrecomp' | 'digcomp';

export type BaseReportRequest = {
  language: 'es' | 'en';
  user_data: UserDataReport;
  areas: ReportArea;
};

export type ReportRequest = BaseReportRequest & {
  report: ReportType;
};

export type ReportArea = {
  [key in string]: number | null;
};

export type ReportView = {
  title: string;
  type: ReportType;
  userData: UserDataReport;
  reportData: ReportViewData;
};

export type ReportViewData = {
  sections: Section[];
};

export type UserDataReport = {
  name: string;
  sex: string;
  age: number;
  college_career: string;
  educational_level: string;
  date: string;
};

export type Section = {
  title: string;
  areas: BaseArea[];
};

export type BaseArea = {
  title: string;
  feedbackDescription: string;
  feedbackValue: number;
  tickIconLimit: number;
};

export type BaseReportChunk = {
  es: string;
  en: string;
};

export type Feedback = {
  [key in number]: string;
};
export type FeedbackChunk = {
  es: Feedback;
  en: Feedback;
};

export type ReportLeyend = {
  sections: {
    [key in string]: {
      title: BaseReportChunk;
      description: BaseReportChunk;
      areas: string[];
    };
  };
  areas: ReportLeyendArea;
};

export type ReportLeyendArea = {
  [key in string]: {
    empty: BaseReportChunk;
    title: BaseReportChunk;
    feedback: FeedbackChunk;
    related_section: string[];
    tick_icon_limit: number;
  };
};
