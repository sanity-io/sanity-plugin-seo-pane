import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Text, Stack, Box, Card, Label, Flex, TabList, Tab, TabPanel, Spinner} from '@sanity/ui'
import {useQuery} from 'react-query'
import delve from 'dlv'
import SerpPreview from 'react-serp-preview'

import asyncCall from './lib/asyncCall'
import performSeoReview from './lib/performSeoReview'
import {renderRatingToColor} from './lib/renderRatingToColor'
import {resultsLabels} from './lib/resultsLabels'

import Feedback from './Feedback'

export default function SeoPaneComponent({document, options}) {
  const [tab, setTab] = useState('')

  // The `revision` key updates when the document does, refreshing the query
  const {data, isLoading, error} = useQuery(
    [`seoReview`, document._rev],
    async () => {
      if (!document._id) throw new Error('Document is not published')
      else if (!options.keywords) badOption('keywords')
      else if (!options.url) badOption('url')

      let [keywords, synonyms, url] = await Promise.all([
        asyncCall(options.keywords, document),
        asyncCall(options.synonyms, document),
        asyncCall(options.url, document),
      ])

      // Visits document path when strings because the asyncCall will have same value as options
      if (keywords && keywords === options.keywords) keywords = delve(keywords, document)
      if (synonyms && synonyms === options.synonyms) synonyms = delve(synonyms, document)

      // Tack on keywords and synonyms to seo review response since we use them.
      return {
        ...(await performSeoReview(url, keywords, synonyms)),
        keywords,
        synonyms
      }
    },
    {keepPreviousData: true}
  )

  // Will only show on the first render because of `keepPreviousData` above
  if (isLoading) {
    return (
      <Flex align="center" justify="center" padding={4}>
        <Spinner muted />
      </Flex>
    )
  }

  // Bail out on error. Unfortunately can't JSON.stringify(Error) to get the stack/message.
  let errorMessage;
  if (error instanceof Error) errorMessage = error.stack ? <pre>{error.stack}</pre> : error.message;
  else if (!data) errorMessage = 'Empty response';
  else if (data.error) errorMessage = <pre>{JSON.stringify(data.error)}</pre>;

  if (errorMessage) {
    return <Feedback isError>Error: {errorMessage}</Feedback>;
  }

  const {keywords, meta, permalink, resultsMapped, synonyms} = data
  return (
    <Box padding={4}>
      <Flex direction="column">
        {meta?.title && (
          <Card border padding={3}>
            <SerpPreview
              title={meta?.title}
              metaDescription={meta?.description ?? ``}
              url={permalink}
            />
          </Card>
        )}

        <Flex paddingY={4}>
          <Stack space={3}>
            <Label muted size={1}>
              Keywords
            </Label>
            <Text size={2}>{keywords ? `"${keywords}"` : `Not Defined`}</Text>
          </Stack>
          <Stack space={3} marginLeft={6}>
            <Label muted size={1}>
              Synonyms
            </Label>
            <Text size={2}>{synonyms ? `"${synonyms}"` : `Not Defined`}</Text>
          </Stack>
        </Flex>

        <TabList space={1}>
          {Object.keys(resultsMapped).map((key, tabIndex) => (
            <Tab
              aria-controls={key}
              key={`${key}-button`}
              id={`${key}-button`}
              label={`${resultsMapped[key].length} ${
                resultsMapped[key].length === 1
                  ? resultsLabels[key].single
                  : resultsLabels[key].plural
              }`}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => setTab(key)}
              selected={tab === key || (!tab && !tabIndex)}
              space={2}
            />
          ))}
        </TabList>

        {Object.keys(resultsMapped).map((key, panelIndex) => (
          <TabPanel
            aria-labelledby={key}
            hidden={(tab && tab !== key) || (!tab && panelIndex)}
            key={`${key}-panel`}
            id={`${key}-panel`}
            style={{margin: `0.5rem 0`, padding: `0.5rem 0`}}
          >
            {resultsMapped[key].map((result, resultIndex) => (
              <Flex key={`result-${resultIndex}`} alignItems="center" style={{margin: `0.5rem 0`}}>
                <div
                  style={{
                    borderRadius: 10,
                    width: 10,
                    height: 10,
                    backgroundColor: renderRatingToColor(result.rating),
                    marginRight: 10,
                    flexShrink: 0,
                    transform: `translateY(6px)`,
                  }}
                />
                {result?.text && <div dangerouslySetInnerHTML={{__html: result.text}} />}
              </Flex>
            ))}
          </TabPanel>
        ))}
      </Flex>
    </Box>
  )
}

SeoPaneComponent.propTypes = {
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

function badOption (key) {
  throw new Error(`seo-pane options: ${key} is invalid or missing`)
}
