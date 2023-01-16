import React, {useState} from 'react'
import {Text, Stack, Box, Card, Label, Flex, TabList, Tab, TabPanel, Spinner} from '@sanity/ui'
import {useQuery} from 'react-query'
import {get} from 'lodash-es'

import asyncCall from './lib/asyncCall'
import performSeoReview from './lib/performSeoReview'
import {renderRatingToColor} from './lib/renderRatingToColor'
import {resultsLabels} from './lib/resultsLabels'

import ErrorStack from './ErrorStack.jsx'
import SERPPreview from './SERPPreview.js'
import Feedback from './Feedback'
import {SEOPaneOptions, SEOPaneProps} from './SEOPane'

// @ts-ignore
export default function SEOPaneComponent(props: SEOPaneProps<SEOPaneOptions>) {
  const {document: sanityDocument, options} = props
  const [tab, setTab] = useState('')

  // The `revision` key updates when the document does, refreshing the query
  const {data, isLoading, error} = useQuery(
    [`seoReview`, sanityDocument._rev],
    async () => {
      if (!sanityDocument._id) {
        throw new Error('Document is not published')
      } else if (!options.url) {
        badOption('url')
      }

      // eslint-disable-next-line prefer-const
      let [keywords, synonyms, url] = await Promise.all([
        asyncCall(options.keywords, sanityDocument) as Promise<string>,
        asyncCall(options.synonyms, sanityDocument) as Promise<string>,
        asyncCall(options.url, sanityDocument) as Promise<string>,
      ])

      // Visits document path when strings because the asyncCall will have same value as options
      if (keywords && keywords === options.keywords) keywords = get(sanityDocument, keywords)
      if (synonyms && synonyms === options.synonyms) synonyms = get(sanityDocument, synonyms)

      // Tack on keywords and synonyms to seo review response since we use them.
      return {
        ...(await performSeoReview(url, keywords, synonyms)),
        keywords,
        synonyms,
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

  // Bail out on error
  if (error instanceof Error) {
    return (
      <Feedback isError>
        {error.message} {error.stack ? <ErrorStack stack={error.stack} /> : null}
      </Feedback>
    )
  } else if (!data) {
    return <Feedback isError>Empty response</Feedback>
  }

  const {keywords, meta, permalink, resultsMapped, synonyms} = data as any

  return (
    <Box padding={4}>
      <Flex direction="column">
        {meta?.title && (
          <Card border padding={4} radius={2}>
            <SERPPreview
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
              // space={2}
            />
          ))}
        </TabList>

        {Object.keys(resultsMapped).map((key, panelIndex) => (
          <TabPanel
            aria-labelledby={key}
            hidden={(tab && tab !== key) || Boolean(!tab && panelIndex)}
            key={`${key}-panel`}
            id={`${key}-panel`}
            style={{margin: `0.5rem 0`, padding: `0.5rem 0`}}
          >
            {resultsMapped[key].map((result: any, resultIndex: number) => (
              <Flex key={`result-${resultIndex}`} align="center" style={{margin: `0.5rem 0`}}>
                <div
                  style={{
                    borderRadius: 10,
                    width: 10,
                    height: 10,
                    backgroundColor: renderRatingToColor(result.rating),
                    marginRight: 10,
                    flexShrink: 0,
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

function badOption(key: string) {
  throw new Error(`seo-pane options: ${key} is invalid or missing`)
}
