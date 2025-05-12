'use client'

import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Box, Button, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton } from '@chakra-ui/react'
import { Schedule, UserSchedule } from '../types/schedule'
import { useEffect, useState } from 'react'

interface PDFCalendarProps {
  schedules: UserSchedule
  currentDate: Date
  selectedUser: string
  onClose?: () => void
}

// PDFのスタイル定義
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'KosugiMaru',
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  user: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  calendar: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  day: {
    width: '14.28%',
    padding: 5,
    border: '1px solid #000',
    minHeight: 100,
  },
  dayHeader: {
    fontSize: 12,
    marginBottom: 5,
  },
  schedule: {
    fontSize: 8,
    marginBottom: 2,
  },
  weekend: {
    color: 'red',
  },
  saturday: {
    color: 'blue',
  },
})

// 祝日判定用の関数
const isHoliday = (date: Date): boolean => {
  const holidays = [
    { month: 1, day: 1 },   // 元日
    { month: 1, day: 8 },   // 成人の日
    { month: 2, day: 11 },  // 建国記念日
    { month: 2, day: 23 },  // 天皇誕生日
    { month: 3, day: 20 },  // 春分の日
    { month: 4, day: 29 },  // 昭和の日
    { month: 5, day: 3 },   // 憲法記念日
    { month: 5, day: 4 },   // みどりの日
    { month: 5, day: 5 },   // こどもの日
    { month: 7, day: 15 },  // 海の日
    { month: 8, day: 11 },  // 山の日
    { month: 9, day: 16 },  // 敬老の日
    { month: 9, day: 22 },  // 秋分の日
    { month: 10, day: 14 }, // スポーツの日
    { month: 11, day: 3 },  // 文化の日
    { month: 11, day: 23 }, // 勤労感謝の日
  ]

  const currentMonth = date.getMonth() + 1
  const currentDay = date.getDate()

  return holidays.some(holiday => 
    holiday.month === currentMonth && holiday.day === currentDay
  )
}

// PDFカレンダーコンポーネント
const PDFCalendarDocument = ({ schedules, currentDate, selectedUser }: PDFCalendarProps) => {
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const weekDays = ['月', '火', '水', '木', '金', '土', '日']
  const firstDayOfMonth = getDay(startOfMonth(currentDate))
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const getSchedulesForDate = (date: Date) => {
    if (!selectedUser) return [];
    const userSchedules = schedules[selectedUser] || [];
    return userSchedules
      .filter((schedule: Schedule) => {
        // 日付の比較を年月日で行う
        const scheduleDate = new Date(schedule.date);
        const targetDate = new Date(date);
        return scheduleDate.getFullYear() === targetDate.getFullYear() &&
               scheduleDate.getMonth() === targetDate.getMonth() &&
               scheduleDate.getDate() === targetDate.getDate();
      })
      .sort((a: Schedule, b: Schedule) => {
        const timeA = a.startTime.replace(':', '');
        const timeB = b.startTime.replace(':', '');
        return parseInt(timeA) - parseInt(timeB);
      });
  }

  const getDateColor = (date: Date) => {
    if (isHoliday(date)) return styles.weekend
    const dayOfWeek = getDay(date)
    if (dayOfWeek === 0) return styles.weekend
    if (dayOfWeek === 6) return styles.saturday
    return {}
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          {format(currentDate, 'yyyy年MM月', { locale: ja })}
        </Text>
        <Text style={styles.user}>
          {selectedUser}様
        </Text>
        <View style={styles.calendar}>
          {weekDays.map(day => (
            <View key={day} style={styles.day}>
              <Text style={styles.dayHeader}>{day}</Text>
            </View>
          ))}
          {Array(offset).fill(null).map((_, index) => (
            <View key={`empty-${index}`} style={styles.day} />
          ))}
          {days.map(day => (
            <View key={day.toString()} style={styles.day}>
              <Text style={[styles.dayHeader, getDateColor(day)]}>
                {format(day, 'd')}
              </Text>
              {getSchedulesForDate(day).map((schedule, i) => (
                <Text key={i} style={styles.schedule}>
                  {schedule.startTime} - {schedule.endTime}
                  {'\n'}
                  {schedule.staff}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

export default function PDFCalendar({ schedules, currentDate, selectedUser, onClose }: PDFCalendarProps) {
  const [pdfData, setPdfData] = useState<Omit<PDFCalendarProps, 'onClose'>>({
    schedules,
    currentDate: new Date(currentDate),
    selectedUser
  });

  useEffect(() => {
    // 現在の日付とスケジュールを最新の状態に更新
    setPdfData({
      schedules,
      currentDate: new Date(currentDate),
      selectedUser
    });
  }, [schedules, currentDate, selectedUser]);

  const handleDownload = async () => {
    try {
      const blob = await pdf(
        <PDFCalendarDocument
          schedules={schedules}
          currentDate={new Date(currentDate)}
          selectedUser={selectedUser}
          onClose={onClose || (() => {})}
        />
      ).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedUser}_${format(currentDate, 'yyyy年MM月')}_カレンダー.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDFダウンロードエラー:', error)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose || (() => {})} size="full">
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p={0}>
          <Box position="relative" h="100vh">
            <Button
              position="absolute"
              top={4}
              right={16}
              zIndex={1}
              colorScheme="blue"
              size="sm"
              onClick={handleDownload}
              fontFamily="'Kosugi Maru', sans-serif"
            >
              PDFをダウンロード
            </Button>
            <PDFViewer style={{ width: '100%', height: '100%' }}>
              <PDFCalendarDocument
                schedules={schedules}
                currentDate={new Date(currentDate)}
                selectedUser={selectedUser}
                onClose={onClose || (() => {})}
              />
            </PDFViewer>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
} 