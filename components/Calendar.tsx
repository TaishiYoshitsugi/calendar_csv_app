'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, addMonths, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Box, Grid, GridItem, Input, Select, Text as ChakraText, VStack, Button, HStack, useDisclosure, Checkbox, RadioGroup, Stack, Radio, useToast, Progress } from '@chakra-ui/react'
import { UserSchedule, Schedule } from '../types/schedule'
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import { Image } from '@react-pdf/renderer'
import CSVViewer from './CSVViewer'
import { ToastFunction, CalendarProps as CalendarPropsType, PDFCalendarDocumentProps, JobType, ColorScheme, Office, ErrorType, ErrorConfig } from '../types/calendar'

Font.register({
  family: 'KosugiMaru',
  src: 'https://fonts.gstatic.com/s/kosugimaru/v14/0nksC9PgP_wGh21A2KeqGiTq.ttf'
});

const processText = (text: string | undefined): string => {
  if (!text) return ' ';
  if (['月', '火', '水', '木', '金', '土', '日'].includes(text)) {
    return text;
  }
  return text;
}

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
  ];

  const currentMonth = date.getMonth() + 1;
  const currentDay = date.getDate();
  return holidays.some(holiday => holiday.month === currentMonth && holiday.day === currentDay);
};

const pdfStyles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'KosugiMaru',
    size: 'A4 landscape',
  },
  container: {
    position: 'relative',
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    right: 15,
    width: 100,
    height: 'auto',
  },
  logo: {
    width: '100%',
    height: 'auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  user: {
    fontSize: 24,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  calendar: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    border: '1px solid #E2E8F0',
    borderRadius: 4,
    marginTop: 4,
  },
  weekDays: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1px solid #E2E8F0',
  },
  weekDay: {
    flex: 1,
    padding: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    borderRight: '1px solid #E2E8F0',
    backgroundColor: '#F7FAFC',
    fontSize: 10,
  },
  weekDayLast: {
    flex: 1,
    padding: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: '#F7FAFC',
    fontSize: 10,
  },
  days: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    flex: '0 0 14.28%',
    padding: 2,
    minHeight: 92,
    maxHeight: 92,
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  dayEmpty: {
    flex: '0 0 14.28%',
    padding: 2,
    minHeight: 92,
    maxHeight: 92,
    border: '1px solid #E2E8F0',
    backgroundColor: '#F7FAFC',
  },
  dayHeader: {
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    height: 15,
  },
  schedule: {
    fontSize: 8,
    padding: 2,
    backgroundColor: '#EBF8FF',
    borderRadius: 2,
    border: '1px solid #BEE3F8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
  },
  weekend: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  saturday: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#3182CE',
  },
  scheduleTime: {
    fontSize: 13,
    color: '#2C5282',
    fontWeight: 'bold',
    marginBottom: 1,
    textAlign: 'center',
  },
  scheduleStaff: {
    fontSize: 9,
    color: '#2B6CB0',
    textAlign: 'center',
  },
  note: {
    marginTop: 4,
    paddingHorizontal: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  noteText: {
    fontSize: 15,
    color: '#000000',
    fontFamily: 'KosugiMaru',
    textAlign: 'left',
    flex: 1,
  },
  officeInfo: {
    fontSize: 15,
    color: '#000000',
    fontFamily: 'KosugiMaru',
    textAlign: 'right',
    flex: 1,
  },
  phone: {
    fontSize: 24,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    if (!response.ok) {
      throw new Error(`画像の読み込みに失敗しました: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (!base64) {
          reject(new Error('画像の変換に失敗しました'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('画像の変換に失敗しました:', error);
    throw error;
  }
};

const JOB_TYPE_COLORS: ColorScheme = {
  '看護師': '#FFE4E1',  // ピンク色
  '理学療法士': '#E0FFE0',  // 緑色
  '作業療法士': '#E0FFE0'   // 緑色
};

const getJobTypeColor = (jobType: JobType, isGrayscale: boolean = false): string => {
  if (isGrayscale) {
    // グレー表示時は、看護師は白色、理学療法士と作業療法士はグレー
    return jobType === '看護師' ? '#FFFFFF' : '#E2E8F0';
  }
  return JOB_TYPE_COLORS[jobType] || JOB_TYPE_COLORS['看護師'];
};

const officePhoneNumbers: Record<Office, string> = {
  '横浜戸塚事業所': '在宅看護センターことぶき 045-875-6299',
  '西東京事業所': '訪問看護ことぶき 042-452-9281',
  '小平サテライト': '訪問看護ことぶき 小平サテライト 042-312-1960'
};

const ERROR_CONFIG: Record<ErrorType, ErrorConfig> = {
  FILE_PROCESSING: {
    message: 'ファイルの処理に失敗しました',
    duration: 5000,
    isClosable: true
  },
  CSV_PARSING: {
    message: 'CSVファイルの解析に失敗しました',
    duration: 5000,
    isClosable: true
  },
  INVALID_DATA: {
    message: '無効なデータが含まれています',
    duration: 5000,
    isClosable: true
  },
  MISSING_COLUMNS: {
    message: '必要な列が見つかりません',
    duration: 5000,
    isClosable: true
  },
  ENCODING: {
    message: 'ファイルの文字コードが正しくありません',
    duration: 5000,
    isClosable: true
  },
  PDF_GENERATION: {
    message: 'PDFの生成に失敗しました',
    duration: 5000,
    isClosable: true
  }
};

const handleError = (error: Error, toast: ToastFunction, type: ErrorType, details?: string) => {
  console.error(`${ERROR_CONFIG[type].message}:`, error);
  toast({
    title: 'エラー',
    description: details ? `${ERROR_CONFIG[type].message}\n${details}` : ERROR_CONFIG[type].message,
    status: 'error',
    ...ERROR_CONFIG[type]
  });
};

const validateCSVData = (headers: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredColumns = ['日付', '開始時間', '終了時間', '職員名１', '利用者'];
  
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    errors.push(`必要な列が見つかりません: ${missingColumns.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

interface CalendarProps {
  schedules: UserSchedule
  selectedUser: string
  onUserSelect: (user: string) => void
  currentDate: Date
  onDateChange: (date: Date) => void
  filterText: string
  onFilterChange: (text: string) => void
  staffJobTypes: Record<string, JobType>
}

const Calendar: React.FC<CalendarProps> = ({
  schedules,
  selectedUser,
  onUserSelect,
  currentDate,
  onDateChange,
  filterText,
  onFilterChange,
  staffJobTypes
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedOffice, setSelectedOffice] = useState<Office>('横浜戸塚事業所')
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedScheduleOffice, setSelectedScheduleOffice] = useState<string>('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvOfficeNames, setCsvOfficeNames] = useState<string[]>([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState(0)
  const toast = useToast()

  const createSchedulesFromCSV = (csvData: string[][]) => {
    const headers = csvData[0]
    const data = csvData.slice(1)

    // ヘッダーのインデックスを取得
    const dateIndex = headers.findIndex(h => h === '日付')
    const startTimeIndex = headers.findIndex(h => h === '開始時間')
    const endTimeIndex = headers.findIndex(h => h === '終了時間')
    const staffNameIndex = headers.findIndex(h => h === '職員名１')
    const userNameIndex = headers.findIndex(h => h === '利用者')
    const officeNameIndex = 8  // 事業所名は9番目（インデックス8）

    if (dateIndex === -1 || startTimeIndex === -1 || endTimeIndex === -1 || 
        staffNameIndex === -1 || userNameIndex === -1) {
      throw new Error('必要なヘッダーが見つかりません')
    }

    const schedules: UserSchedule = {}
    const uniqueOfficeNames = new Set<string>()

    data.forEach((row) => {
      const dateStr = row[dateIndex]
      const startTime = row[startTimeIndex]
      const endTime = row[endTimeIndex]
      const staffName = row[staffNameIndex]
      const userName = row[userNameIndex]
      const officeName = row[officeNameIndex]

      if (officeName) {
        uniqueOfficeNames.add(officeName)
      }

      if (!dateStr || !startTime || !endTime || !staffName || !userName) {
        return
      }

      const date = new Date(dateStr)
      const day = date.getDate()

      if (isNaN(day)) {
        return
      }

      const schedule: Schedule = {
        date: day,
        startTime,
        endTime,
        staff: staffName,
        officeName
      }

      if (!schedules[userName]) {
        schedules[userName] = []
      }
      schedules[userName].push(schedule)
    })

    setCsvOfficeNames(Array.from(uniqueOfficeNames))
    setCsvHeaders(headers)

    return schedules
  }

  // 全スタッフのリストを取得
  const getAllStaff = useCallback(() => {
    const staffSet = new Set<string>();
    Object.values(schedules).forEach(userSchedules => {
      userSchedules.forEach(schedule => {
        if (schedule.staff) {
          staffSet.add(schedule.staff);
        }
      });
    });
    
    const jobTypeOrder = {
      '看護師': 1,
      '理学療法士': 2,
      '作業療法士': 3
    };

    return Array.from(staffSet).sort((a, b) => {
      const jobTypeA = staffJobTypes[a] || '看護師';
      const jobTypeB = staffJobTypes[b] || '看護師';
      
      if (jobTypeOrder[jobTypeA] !== jobTypeOrder[jobTypeB]) {
        return jobTypeOrder[jobTypeA] - jobTypeOrder[jobTypeB];
      }
      
      return a.localeCompare(b, 'ja');
    });
  }, [schedules, staffJobTypes]);

  // スケジュールに含まれる事業所のリストを取得
  const getScheduleOffices = useCallback(() => {
    const offices = new Set<string>();
    Object.values(schedules).forEach(userSchedules => {
      userSchedules.forEach(schedule => {
        if (schedule.officeName) {
          offices.add(schedule.officeName);
        }
      });
    });
    return Array.from(offices).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [schedules]);

  // 事業所ごとの利用者を取得
  const getUsersByOffice = useCallback((officeName: string) => {
    const users = new Set<string>();
    Object.entries(schedules).forEach(([user, userSchedules]) => {
      if (userSchedules.some(schedule => schedule.officeName === officeName)) {
        users.add(user);
      }
    });
    return Array.from(users).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [schedules]);

  // 選択されたスタッフが訪問する利用者を取得
  const getUsersByStaff = useCallback((staffName: string) => {
    const users = new Set<string>();
    Object.entries(schedules).forEach(([user, userSchedules]) => {
      if (userSchedules.some(schedule => schedule.staff === staffName)) {
        users.add(user);
      }
    });
    return Array.from(users).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [schedules]);

  const getSortedUsers = () => {
    return Object.keys(schedules).sort((a, b) => a.localeCompare(b, 'ja'))
  }

  const getFilteredUsers = () => {
    let filteredUsers = getSortedUsers();
    
    if (selectedScheduleOffice) {
      filteredUsers = getUsersByOffice(selectedScheduleOffice);
    }
    
    if (selectedStaff) {
      filteredUsers = filteredUsers.filter(user => {
        const userSchedules = schedules[user] || [];
        return userSchedules.some(schedule => schedule.staff === selectedStaff);
      });
    }
    
    if (filterText) {
      filteredUsers = filteredUsers.filter(user => user.includes(filterText));
    }
    
    return filteredUsers;
  }

  const users = getFilteredUsers();
  const staffList = getAllStaff();
  const scheduleOffices = getScheduleOffices();
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
      .filter(schedule => Number(schedule.date) === date.getDate())
      .map(schedule => ({
        ...schedule,
        jobType: getStaffJobType(schedule.staff)
      }))
      .sort((a, b) => {
        // 時間を比較して早い順にソート
        const timeA = a.startTime.replace(':', '');
        const timeB = b.startTime.replace(':', '');
        return parseInt(timeA) - parseInt(timeB);
      });
  };

  const getDayColor = (day: string) => {
    if (day === '土') return 'blue.500'
    if (day === '日') return 'red.500'
    return 'black'
  }

  const getDateColor = (date: Date) => {
    const isHolidayDate = isHoliday(date)
    const dayOfWeek = getDay(date)
    
    if (isHolidayDate) return 'red.500'
    if (dayOfWeek === 0) return 'red.500'
    if (dayOfWeek === 6) return 'blue.500'
    return 'black'
  }

  const getLastName = (fullName: string | undefined): string => {
    if (!fullName) return '';
    return fullName.split('　')[0]
  }

  const handleUserSelect = (user: string) => {
    if (selectedUsers.includes(user)) {
      setSelectedUsers(selectedUsers.filter(u => u !== user));
      if (selectedUser === user) {
        onUserSelect('');
      }
    } else {
      setSelectedUsers([...selectedUsers, user]);
      onUserSelect(user);
    }
  };

  const handlePreviewPDF = async (isGrayscale: boolean = false) => {
    if (selectedUsers.length === 0) {
      handleError(new Error('No users selected'), toast, 'INVALID_DATA', '利用者を選択してください');
      return;
    }

    setIsGeneratingPDF(true)
    setPdfProgress(0)

    try {
      const pages = selectedUsers.map(user => {
        const userSchedules = schedules[user] || [];
        return (
          <PDFCalendarDocument
            key={user}
            currentDate={currentDate}
            selectedUser={user}
            schedules={userSchedules}
            selectedOffice={selectedOffice}
            isGrayscale={isGrayscale}
            getStaffJobType={getStaffJobType}
          />
        );
      });

      const doc = (
        <Document>
          {pages}
        </Document>
      );

      try {
        setPdfProgress(30)
        const pdfDoc = pdf(doc);
        
        setPdfProgress(50)
        const pdfBlob = await new Promise<Blob>((resolve, reject) => {
          pdfDoc.toBlob()
            .then(blob => {
              if (!blob) {
                reject(new Error('PDFの生成に失敗しました'));
                return;
              }
              resolve(blob);
            })
            .catch(reject);
        });

        setPdfProgress(80)
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        
        setPdfProgress(100)
        setTimeout(() => {
          URL.revokeObjectURL(url);
          setIsGeneratingPDF(false)
          setPdfProgress(0)
        }, 1000);
      } catch (error) {
        handleError(error as Error, toast, 'PDF_GENERATION', 'PDFの生成に失敗しました。もう一度お試しください。');
        setIsGeneratingPDF(false)
        setPdfProgress(0)
      }
    } catch (error) {
      handleError(error as Error, toast, 'PDF_GENERATION', 'PDFの生成に失敗しました。もう一度お試しください。');
      setIsGeneratingPDF(false)
      setPdfProgress(0)
    }
  };

  const getStaffJobType = (staff: string): JobType => {
    return staffJobTypes[staff] || '看護師'
  }

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const handleOfficeSelect = (officeName: string) => {
    setSelectedOffice(officeName as Office);
    if (officeName) {
      const users = getUsersByOffice(officeName);
      setSelectedUsers(users);
      if (users.length > 0) {
        onUserSelect(users[0]);
      }
    } else {
      setSelectedUsers([]);
      onUserSelect('');
    }
  };

  const handleStaffSelect = (staffName: string) => {
    setSelectedStaff(staffName);
    if (staffName === '') {
      const allUsers = getSortedUsers();
      setSelectedUsers(allUsers);
      if (allUsers.length > 0) {
        onUserSelect(allUsers[0]);
      }
    } else {
      const users = getUsersByStaff(staffName);
      setSelectedUsers(users);
      if (users.length > 0) {
        onUserSelect(users[0]);
      }
    }
  };

  const handleScheduleOfficeSelect = (officeName: string) => {
    setSelectedScheduleOffice(officeName);
    if (officeName === '') {
      const allUsers = getSortedUsers();
      setSelectedUsers(allUsers);
      if (allUsers.length > 0) {
        onUserSelect(allUsers[0]);
      }
    } else {
      const users = getUsersByOffice(officeName);
      setSelectedUsers(users);
      if (users.length > 0) {
        onUserSelect(users[0]);
      }
    }
  };

  return (
    <VStack spacing={4} align="stretch" fontFamily="KosugiMaru" bg="white" p={6} borderRadius="lg" boxShadow="sm">
      <Box bg="blue.50" p={4} borderRadius="lg" boxShadow="sm">
        <VStack spacing={4} align="stretch">
          {/* CSVヘッダー情報の表示 */}
          {csvHeaders.length > 0 && (
            <Box>
              <ChakraText fontSize="md" fontWeight="bold" mb={2} color="blue.700">
                CSVヘッダー情報
              </ChakraText>
              <Box p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                <ChakraText fontSize="sm" mb={2}>
                  全ヘッダー: {csvHeaders.join(', ')}
                </ChakraText>
                <ChakraText fontSize="sm">
                  事業所名の位置: {csvHeaders.indexOf('事業所名')}
                </ChakraText>
              </Box>
            </Box>
          )}

          {/* 事業所名一覧の表示 */}
          {csvOfficeNames.length > 0 && (
            <Box>
              <ChakraText fontSize="md" fontWeight="bold" mb={2} color="blue.700">
                CSVの事業所名一覧
              </ChakraText>
              <Box p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                <ChakraText fontSize="sm">
                  {csvOfficeNames.join(', ')}
                </ChakraText>
              </Box>
            </Box>
          )}

          <Box>
            <ChakraText fontSize="md" fontWeight="bold" mb={2} color="blue.700">
              事業所を選択してください（PDFの電話番号と連動）
            </ChakraText>
            <Select
              value={selectedOffice}
              onChange={(e) => handleOfficeSelect(e.target.value)}
              fontFamily="KosugiMaru"
              bg="white"
              width="100%"
            >
              <option value="横浜戸塚事業所">横浜戸塚事業所</option>
              <option value="西東京事業所">西東京事業所</option>
              <option value="小平サテライト">小平サテライト</option>
            </Select>
          </Box>

          <Box>
            <ChakraText fontSize="md" fontWeight="bold" mb={2} color="blue.700">
              利用者を選択してください（複数選択可）
            </ChakraText>
            <VStack spacing={2} mb={2}>
              <HStack width="100%" spacing={2}>
                <Select
                  placeholder="事業所で絞り込み"
                  value={selectedScheduleOffice}
                  onChange={(e) => {
                    const officeName = e.target.value;
                    setSelectedScheduleOffice(officeName);
                    if (officeName === '') {
                      // 全ての事業所を選択した場合は全利用者を選択
                      const allUsers = getSortedUsers();
                      setSelectedUsers(allUsers);
                      if (allUsers.length > 0) {
                        onUserSelect(allUsers[0]);
                      }
                    } else {
                      const users = getUsersByOffice(officeName);
                      setSelectedUsers(users);
                      if (users.length > 0) {
                        onUserSelect(users[0]);
                      }
                    }
                  }}
                  fontFamily="KosugiMaru"
                  bg="white"
                  width="50%"
                >
                  <option value="">全ての事業所</option>
                  {scheduleOffices.map(office => (
                    <option key={office} value={office}>
                      {office}
                    </option>
                  ))}
                </Select>
                <Select
                  placeholder="訪問スタッフで絞り込み"
                  value={selectedStaff}
                  onChange={(e) => handleStaffSelect(e.target.value)}
                  fontFamily="KosugiMaru"
                  bg="white"
                  width="50%"
                >
                  <option value="">全てのスタッフ</option>
                  {staffList.map(staff => (
                    <option key={staff} value={staff}>
                      {staff} ({staffJobTypes[staff] || '未設定'})
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack width="100%" justify="space-between">
                <Input
                  placeholder="利用者名で検索"
                  value={filterText}
                  onChange={(e) => onFilterChange(e.target.value)}
                  fontFamily="KosugiMaru"
                  bg="white"
                  width="70%"
                />
                <Button
                  onClick={() => {
                    const allUsers = getFilteredUsers();
                    setSelectedUsers(allUsers);
                    if (allUsers.length > 0) {
                      onUserSelect(allUsers[0]);
                    }
                  }}
                  colorScheme="blue"
                  variant="outline"
                  size="md"
                  fontFamily="KosugiMaru"
                  width="28%"
                >
                  全員選択
                </Button>
              </HStack>
            </VStack>
            <Box maxH="200px" overflowY="auto" border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
              {users.map(user => (
                <Box
                  key={user}
                  p={2}
                  display="flex"
                  alignItems="center"
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  bg={selectedUsers.includes(user) ? 'blue.100' : 'white'}
                  _hover={{ bg: 'blue.50' }}
                >
                  <Checkbox
                    isChecked={selectedUsers.includes(user)}
                    onChange={() => handleUserSelect(user)}
                    mr={2}
                  >
                    <ChakraText fontFamily="KosugiMaru">
                      {user}
                    </ChakraText>
                  </Checkbox>
                </Box>
              ))}
            </Box>
          </Box>

          {selectedUsers.length > 0 && (
            <Box>
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <HStack spacing={4} align="center">
                    <ChakraText fontSize="lg" fontWeight="bold" color="blue.700">
                      選択中の利用者
                    </ChakraText>
                    <Box
                      bg="blue.100"
                      px={3}
                      py={1}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                    >
                      <ChakraText fontSize="md" fontWeight="bold" color="blue.700">
                        {selectedUsers.length}名
                      </ChakraText>
                    </Box>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => {
                        setSelectedUsers([]);
                        onUserSelect('');
                      }}
                      fontFamily="KosugiMaru"
                    >
                      選択解除
                    </Button>
                  </HStack>
                  <ChakraText fontSize="md" color="blue.800">
                    {selectedUsers.join('、')}様
                  </ChakraText>
                </VStack>
                <VStack spacing={2} align="stretch" width="300px">
                  <HStack spacing={4}>
                    <Button
                      bg="#bf000a"
                      color="white"
                      size="lg"
                      fontFamily="KosugiMaru"
                      onClick={() => handlePreviewPDF(false)}
                      _hover={{ bg: "#a0000a" }}
                      px={8}
                      isDisabled={isGeneratingPDF}
                    >
                      カラーで表示
                    </Button>
                    <Button
                      bg="#666666"
                      color="white"
                      size="lg"
                      fontFamily="KosugiMaru"
                      onClick={() => handlePreviewPDF(true)}
                      _hover={{ bg: "#555555" }}
                      px={8}
                      isDisabled={isGeneratingPDF}
                    >
                      グレーで表示
                    </Button>
                  </HStack>
                  {isGeneratingPDF && (
                    <Progress
                      value={pdfProgress}
                      size="sm"
                      colorScheme="blue"
                      borderRadius="full"
                      hasStripe
                      isAnimated
                    />
                  )}
                </VStack>
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>

      {selectedUser && (
        <>
          <Box>
            <HStack justify="center" align="center" mb={2} position="relative">
              <Button
                onClick={handlePrevMonth}
                variant="ghost"
                size="sm"
                position="absolute"
                left="0"
                _hover={{ bg: 'blue.50' }}
              >
                ←
              </Button>
              <VStack align="center" spacing={0}>
                <ChakraText fontSize="xl" fontWeight="bold" fontFamily="KosugiMaru">
                  {format(currentDate, 'yyyy年MM月', { locale: ja })}
                </ChakraText>
                <ChakraText fontSize="lg" fontWeight="bold" fontFamily="KosugiMaru" color="blue.700" mt={2}>
                  {selectedUser}様
                </ChakraText>
              </VStack>
              <Button
                onClick={handleNextMonth}
                variant="ghost"
                size="sm"
                position="absolute"
                right="0"
                _hover={{ bg: 'blue.50' }}
              >
                →
              </Button>
            </HStack>
          </Box>

          <Grid templateColumns="repeat(7, 1fr)" gap={1}>
            {weekDays.map(day => (
              <GridItem key={day} p={2} textAlign="center" fontWeight="bold" fontFamily="KosugiMaru" bg="blue.50">
                <ChakraText color={getDayColor(day)}>{day}</ChakraText>
              </GridItem>
            ))}

            {Array(offset).fill(null).map((_, index) => (
              <GridItem
                key={`empty-${index}`}
                p={2}
                minH="100px"
                border="1px solid"
                borderColor="gray.200"
                bg="white"
              />
            ))}

            {days.map((day, index) => (
              <GridItem
                key={day.toString()}
                p={2}
                minH="100px"
                border="1px solid"
                borderColor="gray.200"
                bg="white"
              >
                <ChakraText fontSize="sm" mb={2} fontFamily="KosugiMaru" color={getDateColor(day)}>
                  {format(day, 'd')}
                </ChakraText>
                <VStack spacing={1} align="stretch">
                  {getSchedulesForDate(day).map((schedule, i) => (
                    <Box
                      key={i}
                      p={2}
                      borderRadius="lg"
                      bg={getJobTypeColor(schedule.jobType)}
                      border="1px solid"
                      borderColor="blue.100"
                      boxShadow="sm"
                      transition="all 0.2s"
                      _hover={{
                        transform: 'translateY(-1px)'
                      }}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                    >
                      <ChakraText fontSize="lg" fontWeight="bold" color="blue.700" fontFamily="KosugiMaru">
                        {schedule.startTime} - {schedule.endTime}
                      </ChakraText>
                      <ChakraText fontSize="sm" color="blue.600" fontFamily="KosugiMaru" textAlign="center">
                        {getLastName(schedule.staff)}
                      </ChakraText>
                    </Box>
                  ))}
                </VStack>
              </GridItem>
            ))}
          </Grid>
        </>
      )}
    </VStack>
  )
}

// PDFカレンダードキュメントコンポーネント
const PDFCalendarDocument: React.FC<PDFCalendarDocumentProps> = ({ currentDate, selectedUser, schedules, selectedOffice, isGrayscale = false, getStaffJobType }) => {
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [logoError, setLogoError] = useState<string>('');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        setLogoError('');
        const logoPath = isGrayscale ? "/images/logo_trimming_grey.png" : "/images/logo_trimming.png";
        console.log('Loading logo from:', logoPath);
        const base64 = await convertImageToBase64(logoPath);
        console.log('Logo loaded successfully');
        setLogoBase64(base64);
      } catch (error) {
        console.error('ロゴの読み込みに失敗しました:', error);
        setLogoError('ロゴの読み込みに失敗しました');
      }
    };
    loadLogo();
  }, [isGrayscale]);

  const today = new Date();
  const firstDay = startOfMonth(today);
  const lastDay = endOfMonth(today);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const offset = getDay(firstDay);

  const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

  const getLastName = (fullName: string | undefined): string => {
    if (!fullName) return '';
    return fullName.split('　')[0];
  };

  const getSortedSchedules = (daySchedules: Schedule[]) => {
    return daySchedules
      .filter(schedule => schedule && schedule.staff && schedule.startTime && schedule.endTime)
      .sort((a, b) => {
        // 時間を比較して早い順にソート
        const timeA = a.startTime.replace(':', '');
        const timeB = b.startTime.replace(':', '');
        return parseInt(timeA) - parseInt(timeB);
      });
  };

  return (
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.container}>
        <View style={{
          ...pdfStyles.logoContainer,
          right: isGrayscale ? 10 : 15
        }}>
          <Image
            src={isGrayscale ? "/images/logo_trimming_grey.png" : "/images/logo_trimming.png"}
            style={pdfStyles.logo}
          />
        </View>

        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>
            {format(today, 'yyyy年MM月')} {selectedUser}様
          </Text>
        </View>

        <View style={pdfStyles.calendar}>
          <View style={pdfStyles.weekDays}>
            {weekDays.map((day, index) => (
              <View 
                key={day} 
                style={index === weekDays.length - 1 ? pdfStyles.weekDayLast : pdfStyles.weekDay}
              >
                <Text style={{ 
                  color: isGrayscale ? '#000000' : (day === '日' ? '#E53E3E' : day === '土' ? '#3182CE' : '#000') 
                }}>
                  {processText(day)}
                </Text>
              </View>
            ))}
          </View>

          <View style={pdfStyles.days}>
            {Array(offset).fill(null).map((_, index) => (
              <View key={`empty-${index}`} style={pdfStyles.dayEmpty} />
            ))}

            {days.map((day) => {
              const daySchedules = schedules.filter(s => s.date === day.getDate());
              const sortedSchedules = getSortedSchedules(daySchedules);
              const isWeekend = getDay(day) === 0;
              const isSaturday = getDay(day) === 6;
              const isHolidayDate = isHoliday(day);
              const dayStyle = isGrayscale ? pdfStyles.dayHeader : 
                (isHolidayDate || isWeekend ? pdfStyles.weekend : isSaturday ? pdfStyles.saturday : pdfStyles.dayHeader);

              return (
                <View key={day.toString()} style={pdfStyles.day}>
                  <View style={{ height: 20, display: 'flex', justifyContent: 'center' }}>
                    <Text style={dayStyle}>
                      {format(day, 'd')}
                    </Text>
                  </View>
                  <View style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    justifyContent: 'flex-start',
                    paddingTop: 2
                  }}>
                    {sortedSchedules.map((schedule, i) => {
                      const jobType = getStaffJobType(schedule.staff) || '看護師';
                      return (
                        <View key={i} style={{
                          ...pdfStyles.schedule,
                          backgroundColor: getJobTypeColor(jobType, isGrayscale),
                          border: isGrayscale ? '1px solid #000000' : '1px solid #BEE3F8'
                        }}>
                          <Text style={{
                            ...pdfStyles.scheduleTime,
                            color: isGrayscale ? '#000000' : '#2C5282'
                          }}>
                            {processText(schedule.startTime)} - {processText(schedule.endTime)}
                          </Text>
                          <Text style={{
                            ...pdfStyles.scheduleStaff,
                            color: isGrayscale ? '#000000' : '#2B6CB0'
                          }}>
                            {processText(getLastName(schedule.staff))}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={pdfStyles.note}>
          <Text style={pdfStyles.noteText}>
            ※交通事情により、10分程前後する可能性があります。
          </Text>
          <Text style={pdfStyles.officeInfo}>
            {processText(officePhoneNumbers[selectedOffice])}
          </Text>
        </View>
      </View>
    </Page>
  );
};

export default Calendar;