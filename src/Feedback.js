import React from 'react'
import PropTypes from 'prop-types'
import {Box, Card, Text} from '@sanity/ui'

export default function Feedback({children, isError, padding}) {
  return (
    <Box padding={padding}>
      <Card padding={3} radius={2} shadow={1} tone={isError ? `critical` : `caution`}>
        <Text size={2}>{children}</Text>
      </Card>
    </Box>
  )
}

Feedback.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  isError: PropTypes.bool,
  padding: PropTypes.number,
}

Feedback.defaultProps = {
  isError: false,
  padding: 3,
}
