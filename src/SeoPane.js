import React from 'react'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import PropTypes from 'prop-types'
import {QueryClientProvider, QueryClient} from 'react-query'

import SeoPaneComponent from './SeoPaneComponent'

const queryClient = new QueryClient()

export default function SeoPane({document: {displayed}, options}) {
  return (
    <ThemeProvider theme={studioTheme}>
      <QueryClientProvider client={queryClient}>
        <SeoPaneComponent document={displayed} options={options} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

SeoPane.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.shape({
      _id: PropTypes.string,
      _rev: PropTypes.string,
    }),
  }).isRequired,
  options: PropTypes.shape({
    keywords: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    synonyms: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    url: PropTypes.func.isRequired,
  }).isRequired,
}
