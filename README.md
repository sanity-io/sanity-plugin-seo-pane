> This is a **Sanity Studio v3** plugin.

## Installation

```sh
npm install sanity-plugin-seo-pane
```

## Usage

# sanity-plugin-seo-pane

Run Yoast's SEO review tools using Sanity data, inside a List View Pane. When set up correctly, it will fetch your rendered front-end, as your Sanity data changes, to give instant SEO feedback on your document.

![seo-pane-sanity-studio-v3](https://user-images.githubusercontent.com/9684022/212726107-7e1199b7-7b76-40e6-be72-2ae30ed34eb9.png)

## Installation

```
sanity install seo-pane
```

This plugin requires a very specific setup to get the full benefit. It is designed to be used as a [Component inside of a View](https://www.sanity.io/docs/structure-builder-reference#c0c8284844b7).

```js
// ./src/deskStructure.js
import { SEOPane } from 'sanity-plugin-seo-pane'

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

### Defining the content area

By default, the plugin will examine all content it finds inside a tag with this attribute: `data-content="main"`.

If this cannot be found it will fall back to content `<main>inside your main tag</main>`.

### Defining the canonical URL

The Search Engine Preview will rely on [retrieving a Canonical tag](https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls), like the one below, make sure your front end includes one.

```html
<link rel="canonical" href="https://example.com/dresses/green-dresses" />
```

### Fetching the front-end

Because the plugin uses Fetch, you're potentially going to run into CORS issues retrieving the front end from the Studio on another URL. Therefore, you may need to do some setup work on your preview URL. If you're using Next.js, adding this to the top of your preview `/api` route will _make fetch happen_.

Some snippets are below, [but here is a full Sanity Preview Next.js API Route for reference](https://gist.github.com/SimeonGriggs/6649dc7f4b0fec974c05d29cae969cbc)

```js
// ./pages/api/preview.js
const corsOrigin =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:3333`
    : `https://your-studio.sanity.studio`

res.setHeader('Access-Control-Allow-Origin', corsOrigin)
res.setHeader('Access-Control-Allow-Credentials', true)
```

### Returning the page HTML as a string

The Component will append a `fetch=true` parameter to the URL. You can use this to make the `/api` route perform its fetch for the markup of the page – not redirect to it – and return the expected object shape.

Making your Preview route actually `fetch` the markup and just return a string will avoid problems with having to pass cookies along from Sanity Studio, to the preview route, to the front end. You will note in the below example that we are deliberately copying the Cookies from the incoming request to the `/api` route and passing them along to the front end.

```js
// ./pages/api/preview.js

// ... CORS enabled stuff, res.setPreviewData, etc

// Fetch the preview-page's HTML and return in an object
if (req?.query?.fetch === 'true') {
  const proto = process.env.NODE_ENV === 'development' ? `http://` : `https://`
  const host = req.headers.host
  const pathname = req?.query?.slug ?? `/`
  const absoluteUrl = new URL(`${proto}${host}${pathname}`).toString()

  const previewHtml = await fetch(absoluteUrl, {
    credentials: `include`,
    headers: {Cookie: req.headers.cookie},
  })
    .then((previewRes) => previewRes.text())
    .catch((err) => console.error(err))

  return res.send(previewHtml)
}
```

### A note on server-side rendering of draft content

If your fetch happens server-side, you'll need to make sure your query with Sanity Client is going to return draft content server-side when preview mode is enabled.

(Client-side, Sanity's usePreviewSubscription hook will take Published content and return a Draft version, but server-side we need to do it ourselves)

It's easy to accidentally configure Next.js and Sanity to query for only published data, and then switch over to draft content client-side.

For example, your GROQ query might look like `*[slug.current == $slug][0]` which will only return one document, and not necessarily the draft.

To solve this with the server-side query, I'll make sure we query for **all documents** that match the slug (as in, draft _and_ published) then use this function to just filter down to the one I want:

```js
filterDataToSingleItem(data, preview) {
  if (!Array.isArray(data)) {
    return data
  }

  return data.length > 1 && preview
    ? data.filter((item) => item._id.startsWith(`drafts.`)).pop()
    : data.pop()
}
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