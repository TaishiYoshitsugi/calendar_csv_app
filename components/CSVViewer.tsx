import { Box, Table, Thead, Tbody, Tr, Th, Td, Text } from '@chakra-ui/react'

interface CSVViewerProps {
  csvData: string[][]
}

const CSVViewer: React.FC<CSVViewerProps> = ({ csvData }) => {
  if (!csvData || csvData.length === 0) return null

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" mb={4} overflowX="auto">
      <Text fontSize="xl" fontWeight="bold" mb={4} fontFamily="Kosugi Maru">
        CSVファイルの内容
      </Text>
      <Table variant="simple">
        <Thead>
          <Tr>
            {csvData[0].map((header, index) => (
              <Th key={index} fontFamily="Kosugi Maru" bg="blue.50">
                {header}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {csvData.slice(1).map((row, rowIndex) => (
            <Tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <Td key={cellIndex} fontFamily="Kosugi Maru">
                  {cell}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}

export default CSVViewer 