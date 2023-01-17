import {SanityDocument} from 'sanity'
import React, {ComponentProps} from 'react'
import {QueryClientProvider, QueryClient} from 'react-query'
import {UserViewComponent} from 'sanity/desk'

export type SEOPaneOptions = {
  keywords: string
  synonyms: string
  url: (doc: SanityDocument) => string
}
export type SEOPaneProps = ComponentProps<UserViewComponent<SEOPaneOptions>>

import SEOPaneComponent from './SEOPaneComponent'

const queryClient = new QueryClient()

export function SEOPane(props: SEOPaneProps) {
  const {
    document: {displayed},
    options,
  } = props

  return (
    <QueryClientProvider client={queryClient}>
      <SEOPaneComponent document={displayed} options={options} />
    </QueryClientProvider>
  )
}
