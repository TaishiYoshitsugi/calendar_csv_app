import { UserSchedule, Schedule } from './schedule';

// 型定義
export type ToastFunction = {
  (options: {
    title: string;
    description: string;
    status: 'error';
    duration?: number;
    isClosable?: boolean;
  }): void;
};

export interface CalendarProps {
  schedules: UserSchedule;
  selectedUser: string;
  onUserSelect: (user: string) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  filterText: string;
  onFilterChange: (text: string) => void;
}

export interface PDFCalendarDocumentProps {
  currentDate: Date;
  selectedUser: string;
  schedules: Schedule[];
  selectedOffice: Office;
  isGrayscale?: boolean;
  getStaffJobType: (staff: string) => JobType;
}

export type JobType = '看護師' | '理学療法士' | '作業療法士';

export type ColorScheme = {
  [key in JobType]: string;
};

export type Office = '横浜戸塚事業所' | '西東京事業所' | '小平サテライト';

export type ErrorType = 'FILE_PROCESSING' | 'CSV_PARSING' | 'INVALID_DATA' | 'MISSING_COLUMNS' | 'ENCODING' | 'PDF_GENERATION';

export type ErrorConfig = {
  message: string;
  duration?: number;
  isClosable?: boolean;
}; 