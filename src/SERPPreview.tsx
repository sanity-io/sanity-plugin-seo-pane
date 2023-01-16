import React from 'react'
import {Inline, Stack, Text, useTheme} from '@sanity/ui'

import Feedback from './Feedback'

const MAX_CHARACTERS = 145

function splitUrl(url: string) {
  if (!url) return []

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

type SERPPreviewProps = {
  metaDescription: string
  title: string
  url: string
}

export default function SERPPreview({title, metaDescription, url}: SERPPreviewProps) {
  const isDarkMode = useTheme().sanity.color.dark

  return (
    <Stack space={3} style={{maxWidth: 600}}>
      {url ? (
        <Inline space={2}>
          {splitUrl(url).map((part, index) => (
            <Text key={part} muted={index !== 0}>
              {index === 0 ? part : `› ${part}`}
            </Text>
          ))}
        </Inline>
      ) : (
        <Feedback padding={0}>
          URL not found, your frontend may be missing a <code>canonical</code> tag
        </Feedback>
      )}
      {title ? (
        <Text size={3} style={{color: isDarkMode ? '#8ab4f8' : '#1a0dab'}}>
          {title}
        </Text>
      ) : null}
      {metaDescription ? (
        <Text size={1}>
          {metaDescription.length > MAX_CHARACTERS
            ? `${metaDescription.slice(0, MAX_CHARACTERS)}...`
            : metaDescription}
        </Text>
      ) : null}
    </Stack>
  )
}
