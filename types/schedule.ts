export interface Schedule {
  date: Date | number;
  startTime: string;
  endTime: string;
  staff: string;
  officeName?: string;
  [key: string]: any;
}

export interface UserSchedule {
  [user: string]: Schedule[];
} 