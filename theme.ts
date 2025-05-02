import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: "'Kosugi Maru', sans-serif",
    body: "'Kosugi Maru', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: '#fdf6eb',
        color: 'gray.800',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: "'Kosugi Maru', sans-serif",
      },
    },
    Text: {
      baseStyle: {
        fontFamily: "'Kosugi Maru', sans-serif",
      },
    },
  },
})

export default theme 