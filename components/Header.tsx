import { Box, Text, Image, HStack } from '@chakra-ui/react'

const Header = () => {
  return (
    <Box
      as="header"
      bg="#fdf6eb"
      color="black"
      boxShadow="md"
      height="70px"
      position="relative"
    >
      <HStack 
        justify="space-between" 
        align="center" 
        height="100%" 
        px={6}
      >
        <Text
          fontSize="2xl"
          fontWeight="bold"
          fontFamily="KosugiMaru"
          color="#bf000a"
          ml={6}
        >
          利用者カレンダー
        </Text>
        <Box 
          height="70px" 
          width="auto" 
          display="flex" 
          alignItems="center"
        >
          <Image
            src="/images/logo_trimming.png"
            alt="ロゴ"
            height="70px"
            width="auto"
            objectFit="contain"
          />
        </Box>
      </HStack>
    </Box>
  )
}

export default Header 