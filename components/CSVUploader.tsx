'use client'

import { useState, useCallback, useMemo } from 'react'
import { Box, Button, Text, VStack, Select, HStack, useToast, ScaleFade, UseToastOptions } from '@chakra-ui/react'
import Papa from 'papaparse'
import { UserSchedule } from '../types/schedule'

interface CSVUploaderProps {
  onUpload: (data: UserSchedule, staffJobTypes: Record<string, JobType>) => void
}

interface MissingJobType {
  staffName: string
  rowIndex: number
}

type JobType = '看護師' | '理学療法士' | '作業療法士'

const JOB_TYPES: JobType[] = ['看護師', '理学療法士', '作業療法士']

interface CSVRow {
  [key: string]: string | number
}

// 共通のトースト設定を定数として定義
const TOAST_CONFIG = {
  duration: 5000,
  isClosable: true,
} as const;

// エラーメッセージの定義
const ERROR_MESSAGES = {
  FILE_PROCESSING: 'ファイルの処理に失敗しました',
  CSV_PARSING: 'CSVファイルの解析に失敗しました',
  INVALID_DATA: '無効なデータが含まれています',
  MISSING_COLUMNS: '必要な列が見つかりません',
  ENCODING: 'ファイルの文字コードが正しくありません',
  EMPTY_FILE: 'CSVファイルにデータが含まれていません',
  INVALID_JOB_TYPE: '無効な職種が含まれています',
} as const;

// エラーの種類を定義
type ErrorType = keyof typeof ERROR_MESSAGES;

// エラー処理を共通化する関数
const handleError = (
  error: Error,
  toast: (options: UseToastOptions) => void,
  type: ErrorType,
  details?: string
) => {
  console.error(`${ERROR_MESSAGES[type]}:`, error);
  toast({
    title: 'エラー',
    description: details ? `${ERROR_MESSAGES[type]}\n${details}` : ERROR_MESSAGES[type],
    status: 'error',
    ...TOAST_CONFIG,
  });
};

// CSVデータの検証関数
const validateCSVData = (data: CSVRow[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredColumns = ['日付', '開始時間', '終了時間', '職員名１', '利用者'];

  // ヘッダーの検証
  const headers = Object.keys(data[0] || {});
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    errors.push(`必要な列が見つかりません: ${missingColumns.join(', ')}`);
  }

  // データの検証
  data.forEach((row, index) => {
    if (!row['利用者']) {
      errors.push(`${index + 1}行目: 利用者名が入力されていません`);
    }
    if (!row['日付']) {
      errors.push(`${index + 1}行目: 日付が入力されていません`);
    }
    if (!row['開始時間']) {
      errors.push(`${index + 1}行目: 開始時間が入力されていません`);
    }
    if (!row['終了時間']) {
      errors.push(`${index + 1}行目: 終了時間が入力されていません`);
    }
    if (!row['職員名１']) {
      errors.push(`${index + 1}行目: 職員名が入力されていません`);
    }
    if (row['職種１'] && !JOB_TYPES.includes(String(row['職種１']) as JobType)) {
      errors.push(`${index + 1}行目: 無効な職種が含まれています (${row['職種１']})`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

const JOB_TYPE_COLORS: Record<JobType, string> = {
  '看護師': '#EBF8FF',
  '理学療法士': '#F0FFF4',
  '作業療法士': '#FAF5FF'
};

export default function CSVUploader({ onUpload }: CSVUploaderProps) {
  const [fileName, setFileName] = useState<string>('')
  const [processedData, setProcessedData] = useState<CSVRow[]>([])
  const [missingJobTypes, setMissingJobTypes] = useState<MissingJobType[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [manualInput, setManualInput] = useState<{ [key: string]: JobType }>({})
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [staffByJobType, setStaffByJobType] = useState<Record<JobType, string[]>>({
    '看護師': [],
    '理学療法士': [],
    '作業療法士': []
  })
  const toast = useToast()

  const handleManualInput = useCallback((staffName: string, jobType: JobType) => {
    setManualInput(prev => ({
      ...prev,
      [staffName]: jobType
    }))
    const allSelected = missingJobTypes.every(({ staffName }) => 
      manualInput[staffName] || jobType
    )
    setIsAllSelected(allSelected)
  }, [missingJobTypes, manualInput])

  const generateUserSchedules = useCallback((data: CSVRow[]) => {
    const userSchedules: UserSchedule = {}
    const staffByJobType: Record<JobType, string[]> = {
      '看護師': [],
      '理学療法士': [],
      '作業療法士': []
    }

    data.forEach((row: CSVRow) => {
      const user = row['利用者'] as string
      const staff = row['職員名１'] as string
      const jobType = row['職種１'] as JobType
      const officeName = row['事業所名'] as string

      if (!user) return

      if (!userSchedules[user]) {
        userSchedules[user] = []
      }

      userSchedules[user].push({
        date: parseInt(row['日付'] as string),
        startTime: row['開始時間'] as string,
        endTime: row['終了時間'] as string,
        staff: staff,
        officeName: officeName
      })

      // 職種ごとの職員リストを作成
      if (jobType && !staffByJobType[jobType].includes(staff)) {
        staffByJobType[jobType].push(staff)
      }
    })

    // 職種ごとの職員リストをソート
    Object.keys(staffByJobType).forEach((jobType) => {
      staffByJobType[jobType as JobType].sort((a, b) => a.localeCompare(b, 'ja'))
    })

    return { userSchedules, staffByJobType }
  }, [])

  const applyManualInput = useCallback(() => {
    const newData = [...processedData]
    missingJobTypes.forEach(({ staffName, rowIndex }) => {
      if (manualInput[staffName]) {
        newData[rowIndex]['職種１'] = manualInput[staffName]
      }
    })
    setProcessedData(newData)
    setMissingJobTypes([])
    setIsComplete(true)
    toast({
      title: 'データの読み込み完了',
      status: 'success',
      ...TOAST_CONFIG,
    })

    const { userSchedules, staffByJobType: newStaffByJobType } = generateUserSchedules(newData)
    setStaffByJobType(newStaffByJobType)
    
    // 職種情報をマッピング
    const staffJobTypes: Record<string, JobType> = {}
    Object.entries(newStaffByJobType).forEach(([jobType, staffList]) => {
      staffList.forEach(staff => {
        staffJobTypes[staff] = jobType as JobType
      })
    })
    
    onUpload(userSchedules, staffJobTypes)
  }, [processedData, missingJobTypes, manualInput, toast, onUpload, generateUserSchedules])

  const resetState = useCallback(() => {
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
    setFileName('')
    setProcessedData([])
    setMissingJobTypes([])
    setIsProcessing(false)
    setIsComplete(false)
    setManualInput({})
    setIsAllSelected(false)
  }, [])

  const handleFileDelete = useCallback(() => {
    resetState()
  }, [resetState])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    resetState()
    setFileName(file.name)
    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const rawData = e.target?.result as string
        Papa.parse<CSVRow>(rawData, {
          header: true,
          skipEmptyLines: true,
          encoding: 'shift-jis',
          complete: (results) => {
            try {
              // CSVデータの検証
              const validation = validateCSVData(results.data)
              if (!validation.isValid) {
                handleError(
                  new Error('Invalid CSV data'),
                  toast,
                  'INVALID_DATA',
                  validation.errors.join('\n')
                )
                setIsProcessing(false)
                return
              }

              // ヘッダー情報を取得
              const headers = results.meta.fields || []
              console.log('=== CSVヘッダー分析 ===')
              console.log('全ヘッダー:', headers)
              console.log('ヘッダーの長さ:', headers.length)
              headers.forEach((header, index) => {
                console.log(`ヘッダー[${index}]: "${header}"`)
              })

              // 事業所名のヘッダーを確認
              const officeNameIndex = headers.indexOf('事業所名')
              console.log('事業所名のインデックス:', officeNameIndex)
              if (officeNameIndex === -1) {
                console.warn('事業所名のヘッダーが見つかりません')
              }

              // 最初のデータ行を分析
              if (results.data.length > 0) {
                console.log('=== 最初のデータ行分析 ===')
                const firstRow = results.data[0]
                console.log('事業所名の値:', firstRow['事業所名'])
              }

              const newProcessedData = results.data.map((row, index) => {
                if (!row['職種１'] || String(row['職種１']).trim() === '') {
                  const sameStaffRows = results.data.filter((r) => 
                    r['職員名１'] === row['職員名１'] && 
                    r['職種１'] && 
                    String(r['職種１']).trim() !== ''
                  )
                  
                  if (sameStaffRows.length > 0) {
                    const staffRow = sameStaffRows[0] as CSVRow;
                    const jobTypeStr = String(staffRow['職種１']);
                    if (JOB_TYPES.includes(jobTypeStr as JobType)) {
                      row['職種１'] = jobTypeStr;
                    } else {
                      setMissingJobTypes(prev => [...prev, {
                        staffName: String(row['職員名１']),
                        rowIndex: index
                      }]);
                    }
                  } else {
                    setMissingJobTypes(prev => [...prev, {
                      staffName: String(row['職員名１']),
                      rowIndex: index
                    }])
                  }
                }
                return row
              })
              
              setProcessedData(newProcessedData)
              
              if (missingJobTypes.length === 0) {
                setIsComplete(true)
                toast({
                  title: 'データの読み込み完了',
                  status: 'success',
                  ...TOAST_CONFIG,
                })

                const { userSchedules, staffByJobType: newStaffByJobType } = generateUserSchedules(newProcessedData)
                setStaffByJobType(newStaffByJobType)
                
                // 職種情報をマッピング
                const staffJobTypes: Record<string, JobType> = {}
                Object.entries(newStaffByJobType).forEach(([jobType, staffList]) => {
                  staffList.forEach(staff => {
                    staffJobTypes[staff] = jobType as JobType
                  })
                })
                
                onUpload(userSchedules, staffJobTypes)
              }
            } catch (error) {
              handleError(error as Error, toast, 'INVALID_DATA')
            } finally {
              setIsProcessing(false)
            }
          },
          error: (error: Error) => {
            handleError(error as Error, toast, 'CSV_PARSING')
            setIsProcessing(false)
          }
        })
      } catch (error) {
        handleError(error as Error, toast, 'FILE_PROCESSING')
        setIsProcessing(false)
      }
    }

    reader.onerror = () => {
      handleError(new Error('File read error'), toast, 'FILE_PROCESSING')
      setIsProcessing(false)
    }

    reader.readAsText(file, 'shift-jis')
  }, [onUpload, toast, missingJobTypes, generateUserSchedules, resetState])

  const jobTypeOptions = useMemo(() => (
    JOB_TYPES.map((jobType) => (
      <option key={jobType} value={jobType}>
        {jobType}
      </option>
    ))
  ), [])

  const staffList = useMemo(() => (
    missingJobTypes.map(({ staffName }, index) => (
      <HStack key={index} spacing={4}>
        <Text fontFamily="'Kosugi Maru', sans-serif" width="200px">
          {staffName}
        </Text>
        <Select
          placeholder="職種を選択"
          value={manualInput[staffName] || ''}
          onChange={(e) => handleManualInput(staffName, e.target.value as JobType)}
          width="200px"
          bg="white"
          _hover={{ borderColor: "blue.400" }}
          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
        >
          {jobTypeOptions}
        </Select>
      </HStack>
    ))
  ), [missingJobTypes, manualInput, handleManualInput, jobTypeOptions])

  return (
    <VStack spacing={4} align="stretch">
      <Box textAlign="center">
        <Text fontSize="lg" fontWeight="medium" mb={2}>カイポケ 各種情報出力/出力対象選択/スケジュール表</Text>
        <Text fontSize="sm" color="gray.600" mb={4}>「予定」・「月間スケジュールから取得」を選択しcsvを出力してください</Text>
        <HStack justify="center">
          {!fileName && (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="csv-upload"
                disabled={isProcessing}
              />
              <Button
                as="label"
                htmlFor="csv-upload"
                cursor="pointer"
                bg="#bf000a"
                color="white"
                _hover={{ bg: "#a0000a" }}
                fontFamily="Kosugi Maru"
                isLoading={isProcessing}
                loadingText="処理中..."
                transition="all 0.2s"
                _active={{ transform: 'scale(0.95)' }}
              >
                ファイルを選択
              </Button>
            </>
          )}
        </HStack>
      </Box>

      {fileName && (
        <ScaleFade in={true} initialScale={0.9}>
          <Box mt={2} p={3} bg="gray.50" borderRadius="md">
            <HStack justify="space-between" align="center">
              <Text fontFamily="'Kosugi Maru', sans-serif">
                アップロードされたファイル: {fileName}
              </Text>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={handleFileDelete}
                leftIcon={<span>🗑️</span>}
                _hover={{ bg: "red.50" }}
                transition="all 0.2s"
              >
                ファイルを削除
              </Button>
            </HStack>
          </Box>
        </ScaleFade>
      )}

      {missingJobTypes.length > 0 && (
        <ScaleFade in={true} initialScale={0.9}>
          <Box mt={4} p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
            <Text 
              mb={4} 
              fontFamily="'Kosugi Maru', sans-serif" 
              fontWeight="bold"
              color="red.500"
              fontSize="lg"
            >
              ※下記の職員の職種を入力してください
            </Text>
            <VStack spacing={3} align="stretch">
              {staffList}
              <Button
                onClick={applyManualInput}
                colorScheme="blue"
                mt={2}
                isDisabled={!isAllSelected}
                _hover={isAllSelected ? { bg: "blue.600", transform: "translateY(-1px)" } : undefined}
                transition="all 0.2s"
                _active={{ transform: "scale(0.95)" }}
              >
                入力完了
              </Button>
            </VStack>
          </Box>
        </ScaleFade>
      )}

      {isComplete && !missingJobTypes.length && (
        <ScaleFade in={true} initialScale={0.9}>
          <VStack spacing={4} align="stretch">
            <Box p={4} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
              <Text fontFamily="'Kosugi Maru', sans-serif" color="green.500" fontWeight="bold" textAlign="center">
                データの読み込みが完了しました
              </Text>
            </Box>

            <Box p={4} bg="white" borderRadius="md" border="1px" borderColor="gray.200">
              <Text fontFamily="'Kosugi Maru', sans-serif" fontWeight="bold" mb={4}>
                職種ごとの職員一覧
              </Text>
              <VStack spacing={4} align="stretch">
                {JOB_TYPES.map((jobType) => (
                  <Box key={jobType} p={3} bg={JOB_TYPE_COLORS[jobType]} borderRadius="md">
                    <Text fontFamily="'Kosugi Maru', sans-serif" fontWeight="bold" mb={2}>
                      {jobType}
                    </Text>
                    <Text fontFamily="'Kosugi Maru', sans-serif">
                      {staffByJobType[jobType].length > 0 
                        ? staffByJobType[jobType].join('、')
                        : '該当者なし'}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          </VStack>
        </ScaleFade>
      )}
    </VStack>
  )
} 