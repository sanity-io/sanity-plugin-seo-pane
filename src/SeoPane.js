import React from 'react'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import PropTypes from 'prop-types'
import delve from 'dlv'
import {QueryClientProvider, QueryClient} from 'react-query'

import SeoPaneComponent from './SeoPaneComponent'
import Feedback from './Feedback'

const queryClient = new QueryClient()

function ThemeWrapper({children}) {
  return <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
}

function SeoPane({document: sanityDocument, options}) {
  const {displayed} = sanityDocument
  const {_id, _rev} = displayed

  if (!_id) {
    return (
      <ThemeWrapper>
        <Feedback isError>Document is not Published</Feedback>
      </ThemeWrapper>
    )
  }

  if (!options.keywords) {
    return (
      <ThemeWrapper>
        <Feedback isError>Keyword is not defined</Feedback>
      </ThemeWrapper>
    )
  }

  const keywords = delve(displayed, options.keywords)
  const synonyms = delve(displayed, options.synonyms)

  if (!options.url) {
    return (
      <ThemeWrapper>
        <Feedback isError>URL is not defined</Feedback>
      </ThemeWrapper>
    )
  }

  const url = options.url(displayed)

  return (
    <ThemeWrapper>
      <QueryClientProvider client={queryClient}>
        <SeoPaneComponent revision={_rev} keywords={keywords} synonyms={synonyms} url={url} />
      </QueryClientProvider>
    </ThemeWrapper>
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
    keywords: PropTypes.string,
    synonyms: PropTypes.string,
    url: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  }).isRequired,
}

export default SeoPane
