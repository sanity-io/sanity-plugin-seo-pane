import React from 'react'
import {Box, Card, Text} from '@sanity/ui'

type FeedbackProps = {
  children: React.ReactNode
  isError?: boolean
  padding?: number
}

export default function Feedback(props: FeedbackProps) {
  const {children, isError = false, padding = 3} = props

  return (
    <Box padding={padding}>
      <Card padding={3} radius={2} shadow={1} tone={isError ? `critical` : `caution`}>
        <Text size={2}>{children}</Text>
      </Card>
    </Box>
  )
}
