import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CSVRow } from '../types/csv';

// PDFのスタイル定義
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'KosugiMaru',
    size: 'A4 landscape',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    padding: 5,
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
  },
  day: {
    width: '14.28%',
    height: 100,
    padding: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 10,
  },
  dayNumber: {
    fontSize: 12,
    marginBottom: 5,
  },
  schedule: {
    fontSize: 8,
    marginBottom: 2,
  },
  today: {
    backgroundColor: '#e6f3ff',
  },
  otherMonth: {
    backgroundColor: '#f5f5f5',
  },
  grayscale: {
    color: '#666666',
  },
});

interface PDFCalendarDocumentProps {
  currentDate: Date;
  selectedUser: string;
  schedules: CSVRow[];
  selectedOffice: string;
  isGrayscale: boolean;
  getStaffJobType: (staffId: string) => string;
}

const PDFCalendarDocument = ({
  currentDate,
  selectedUser,
  schedules,
  selectedOffice,
  isGrayscale,
  getStaffJobType,
}: PDFCalendarDocumentProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const getDayStyle = (day: Date) => {
    const baseStyle = styles.day;
    const additionalStyles = [];

    if (isToday(day)) {
      additionalStyles.push(styles.today);
    }
    if (!isSameMonth(day, currentDate)) {
      additionalStyles.push(styles.otherMonth);
    }
    if (isGrayscale) {
      additionalStyles.push(styles.grayscale);
    }

    return [baseStyle, ...additionalStyles];
  };

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{selectedUser} - {selectedOffice}</Text>
        <Text style={styles.date}>{format(currentDate, 'yyyy年MM月', { locale: ja })}</Text>
      </View>

      <View style={styles.calendar}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text>{day}</Text>
          </View>
        ))}

        {days.map((day) => {
          const daySchedules = schedules.filter(
            (schedule) => format(new Date(schedule['日付']), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );

          return (
            <View
              key={day.toString()}
              style={getDayStyle(day)}
            >
              <Text style={styles.dayNumber}>{format(day, 'd')}</Text>
              {daySchedules.map((schedule, index) => (
                <Text key={index} style={styles.schedule}>
                  {schedule['開始時間']} - {schedule['終了時間']} - {schedule['職員名１']}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    </Page>
  );
};

export default PDFCalendarDocument; 