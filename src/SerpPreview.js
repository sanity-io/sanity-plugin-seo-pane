import React from 'react'
import PropTypes from 'prop-types'
import {Box, Inline, Stack, Text} from '@sanity/ui'

const MAX_CHARACTERS = 145

function splitUrl(url) {
  const urlObj = new URL(url)
  const urlParts = [urlObj.origin]

  if (urlObj.pathname) {
    urlParts.push(...urlObj.pathname.split(`/`).filter(Boolean))
  }

  // Remove last part if it's long-ish
  // This is my guess as to what Google does
  if (urlParts[urlParts.length - 1].length > 30) {
    urlParts.pop()
  }

  return urlParts
}

export default function SerpPreview({title, metaDescription, url}) {
  return (
    <Stack space={3} style={{maxWidth: 600}}>
      {url ? (
        <Inline space={2}>
          {splitUrl(url).map((part, index) => (
            <Text muted={index !== 0} size={1}>
              {index === 0 ? part : `› ${part}`}
            </Text>
          ))}
        </Inline>
      ) : null}
      {title ? (
        <Text size={3} style={{color: '#1a0dab'}}>
          {title}
        </Text>
      ) : null}
      {metaDescription ? (
        <Text size={1}>
          {metaDescription.length > MAX_CHARACTERS
            ? metaDescription.slice(0, MAX_CHARACTERS) + '...'
            : metaDescription}
        </Text>
      ) : null}
    </Stack>
  )
}

SerpPreview.propTypes = {
  metaDescription: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
}
