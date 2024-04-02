## This plugin is now deprecated

The Sanity SEO Pane plugin can no longer be recommended for use and is now deprecated. This is due to circumstances outside of our control as the plugin relies on an [outdated dependency produced by a third party](https://github.com/Yoast/wordpress-seo/issues/17899). We apologize for the inconvenience.

This repository and the following documentation will be kept available for reference purposes only.

---

## Usage

Run Yoast's SEO review tools using Sanity data, inside a List View Pane. When set up correctly, it will fetch your rendered front-end, as your Sanity data changes, to give instant SEO feedback on your document.

![seo-pane-sanity-studio-v3](https://user-images.githubusercontent.com/9684022/212726107-7e1199b7-7b76-40e6-be72-2ae30ed34eb9.png)

## Installation

```
sanity install seo-pane
```

This plugin requires a very specific setup to get the full benefit. It is designed to be used as a [Component inside of a View](https://www.sanity.io/docs/structure-builder-reference#c0c8284844b7).

```js
// ./src/deskStructure.js

import {SEOPane} from 'sanity-plugin-seo-pane'

// ...all other list items

S.view
  .component(SEOPane)
  .options({
    // Retrieve the keywords and synonyms at the given dot-notated strings
    keywords: `seo.keywords`,
    synonyms: `seo.synonyms`,
    url: (doc) => resolveProductionUrl(doc),

    // Alternatively, specify functions (may be async) to extract values
    // keywords: doc => doc.seo?.keywords,
    // synonyms: async(doc) => client.fetch('some query to get synonyms', {id: doc._id}),
    // url: async(doc) => client.fetch('some query to construct a url with refs', {id: doc._id})
  })
  .title('SEO')
```

The `.options()` configuration works as follows:

- `keywords` (`string|function(Document):(string|Promise<string>)`, optional) Either a [dot-notated string](https://www.npmjs.com/package/dlv) from the document object to a field containing the keywords/keyphrase, or a function that resolves to the keywords/keyphrase in the document object.
- `synonyms` (`string|function(Document):(string|Promise<string>)`, optional) As above.
- `url` (`function(Document):(string|Promise<string>)`, required) A function that takes in the current document, and resolves to a string with a URL to a preview-enabled front-end. You likely have a function like this already for Live Preview.

### Required: Define a canonical URL on your frontend

The Search Engine Preview will rely on [retrieving a Canonical tag](https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls), like the one below, make sure your front end includes one.

```html
<link rel="canonical" href="https://example.com/dresses/green-dresses" />
```

You can clear the error with a blank canonical tag like this, but it will affect the reporting:

```html
<link rel="canonical" href="/" />
```

### Required: Define the content area

By default, the plugin will examine all content it finds inside a tag with this attribute: `data-content="main"`.

If this cannot be found it will fall back to content `<main>inside your main tag</main>`.

## Fetching the front-end

Because the plugin uses Fetch, you're potentially going to run into CORS issues retrieving the front end from the Studio on another URL. Therefore, you may need to do some setup work on your preview URL. If you're using Next.js, adding this to the top of your preview `/api` route will _make fetch happen_.

Some snippets are below, [but here is a full Sanity Preview Next.js API Route for reference](https://gist.github.com/SimeonGriggs/6649dc7f4b0fec974c05d29cae969cbc)

### Handling CORS if your Studio and frontend are on different URLs

You may need to add some CORS handling to your frontend's preview route if your Studio and front end are on different URLs. This is because the SEO plugin will try to fetch the front end from the Studio, and the browser will block this request.

```ts
// ./pages/api/preview.js

// Is the SEO plugin trying to fetch and return HTML?
// AND is the Studio on a different URL to the website?
if (req.query.fetch) {
  // Allow requests from the Studio's URL
  const corsOrigin = host.includes('localhost') ? STUDIO_URL_DEV : STUDIO_URL_PROD
  res.setHeader('Access-Control-Allow-Origin', corsOrigin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}
```

### Returning the page HTML as a string

The Component will append a `fetch=true` parameter to the URL. You can use this to make the `/api` route perform its fetch for the markup of the page – not redirect to it – and return the page's HTML as a string.

Making your Preview route actually `fetch` the markup and just return a string will avoid problems with having to pass cookies along from Sanity Studio, to the preview route, to the front end. You will note in the below example that we are deliberately copying the Cookies from the incoming request to the `/api` route and passing them along to the front end.

```ts
// ./pages/api/preview.js

// ... CORS enabled stuff, res.setPreviewData, etc

// Initialise preview mode
res.setPreviewData({})

// Return just the HTML if the SEO plugin is requesting it
if (req.query.fetch) {
  // Create preview URL
  const baseOrigin = host.includes('localhost') ? WEBSITE_URL_DEV : WEBSITE_URL_PROD
  const absoluteUrl = new URL(slug, baseOrigin).toString()
  // Create preview headers from the setPreviewData above
  const previewHeader = res.getHeader('Set-Cookie')
  const previewHeaderString =
    typeof previewHeader === 'string' || typeof previewHeader === 'number'
      ? previewHeader.toString()
      : previewHeader?.join('; ')
  const headers = new Headers()
  headers.append('credentials', 'include')
  headers.append('Cookie', previewHeaderString ?? '')
  const previewHtml = await fetch(absoluteUrl, {headers})
    .then((previewRes) => previewRes.text())
    .catch((err) => console.error(err))
  return res.send(previewHtml)
}
```

### Rendering preview content server-side

The fetch above will return HTML as if JavaScript was not enabled. Client-side, [next-sanity](https://github.com/sanity-io/next-sanity) preview mode will query Published content and return a Draft version if it exists – but server-side you might need to do it yourself.

Using the [App Router with Next.js 13](https://beta.nextjs.org/docs/getting-started#introducing-the-app-router) and/or React Server Components may solve this for you. Otherwise, you might need to change how you query content.

A typical single-document query might look like this, fetching a single document by its slug:

```json
// Query for the first document with this slug (draft OR published)
*[slug.current == $slug][0]
```

To solve this with the server-side query, you may query for **all documents** that match the slug (as in, draft _and_ published) then use this function to just filter down to the one I want. Note that this will only solve for top-level documents returned by a query, references will still resolve published versions as usual.

```json
// Query for all documents with this slug
*[slug.current == $slug]
```

```js
// Then post-process the results
filterDataToSingleItem(data, preview) {
  if (!Array.isArray(data)) {
    return data
  }

  return data.length > 1 && preview
    ? [...data].filter((item) => item._id.startsWith(`drafts.`)).pop()
    : [...data].pop()
}
```

## Troubleshooting

The main `yoastseo` package used by this plugin has only recently been updated on NPM and may lead to some compatibility issues. If you have trouble with installation try the following guides below.

### Compatibility with Sanity Studio v3 running on Vite

By default, a new v3 Sanity Studio will use Vite as its build tool. The underlying `yoastseo` package in this plugin requires node.js built-in modules that are not supported by Vite. To get around this, you will need to modify the Studio's Vite config to look somewhat like this

```ts
// ./sanity.cli.ts

import {defineCliConfig} from 'sanity/cli'
// yarn add -D vite-plugin-node-polyfills
import {nodePolyfills} from 'vite-plugin-node-polyfills'

export default defineCliConfig({
  // ... your project's `api` config
  vite: (prev) => ({
    ...prev,
    plugins: [...prev.plugins, nodePolyfills({util: true})],
    define: {
      ...prev.define,
      'process.env': {},
    },
  }),
})
```

### Compatibility with Sanity Studio v3 running in Next.js

With a Studio embedded in a Next.js application, you may need to update your `next.config.mjs` file to set `esmExternals: loose`:

```js
// ./next.config.mjs

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    // ...all other experimental features
    esmExternals: 'loose'
  },
  // ...all other config
```

## License

[MIT](LICENSE) © Sanity.io

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-plugin-seo-pane/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.
