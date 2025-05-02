'use client'

import { useState, useEffect } from 'react'
import { Box, Container, VStack, Spinner } from '@chakra-ui/react'
import CSVUploader from '../components/CSVUploader'
import Calendar from '../components/Calendar'
import { UserSchedule } from '../types/schedule'
import Header from '../components/Header'
import { JobType } from '../types/jobType'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [schedules, setSchedules] = useState<UserSchedule>({})
  const [selectedUser, setSelectedUser] = useState('')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [filterText, setFilterText] = useState('')
  const [staffJobTypes, setStaffJobTypes] = useState<Record<string, JobType>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleUpload = (data: UserSchedule, jobTypes: Record<string, JobType>) => {
    setSchedules(data)
    setStaffJobTypes(jobTypes)
    const users = Object.keys(data)
    if (users.length > 0) {
      setSelectedUser(users[0])
    }
  }

  if (!mounted) {
    return (
      <Box minH="100vh" bg="#fdf6eb" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="#fdf6eb">
      <Header />
      <Box p={6}>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch" fontFamily="Courier">
            <CSVUploader onUpload={handleUpload} />
            <Calendar
              schedules={schedules}
              selectedUser={selectedUser}
              onUserSelect={setSelectedUser}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              filterText={filterText}
              onFilterChange={setFilterText}
              staffJobTypes={staffJobTypes}
            />
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}
