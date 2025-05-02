export interface Schedule {
  date: number;
  startTime: string;
  endTime: string;
  staff: string;
  officeName?: string;
  [key: string]: any;
}

export interface UserSchedule {
  [user: string]: Schedule[];
} 