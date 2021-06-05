# sanity-plugin-seo-pane

Run Yoast's SEO review tools using Sanity data, inside a List View Pane. When setup correctly, it will fetch your rendered front-end, as your Sanity data changes, to give instant SEO feedback on your document.

**Important**: This plugin is very early, overly complex and it some ways convoluted. In future, it should become more simplified.

## Installation

```
sanity install seo-pane
```

This plugin requires a very specific setup in order to get the full benefit. It is designed to be used as a [Component inside of a View](https://www.sanity.io/docs/structure-builder-reference#c0c8284844b7).

```js
// ./src/deskStructure.js
import SeoPane from 'sanity-plugin-seo-pane'

// ...all other list items

S.view
  .component(SeoPane)
  .options({
    keywords: `seo.keywords`,
    synonyms: `seo.synonyms`,
    url: (doc) => resolveProductionUrl(doc),
  })
  .title('SEO')
```

The `.options()` configuration works as follows:

- `keywords` (string, required) A dot-notated string from the document object to a field containing the keywords/keyphrase
- `synonyms` (string, optional) As above
- `url` (function, required) A function that takes in the current document, and should return a string with a URL to a preview-enabled front-end.

### Fetching the front-end

Because the plugin uses Fetch, you're likely to run into CORS issues retrieving the front end from the Studio. Therefore, you may need to do some setup work on your preview URL. If you're using Next.js, adding this to the top of of your preview `/api` route will _make fetch happen_.

```js
// ./pages/api/preview.js
const corsOrigin =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:3333`
    : `https://your-studio.sanity.studio`

res.setHeader('Access-Control-Allow-Origin', corsOrigin)
res.setHeader('Access-Control-Allow-Credentials', true)
```

### Returning a string

...but that's not all. The plugin expects your preview route to actually return an object with two keys:

```js
{
  resUrl: // string – the actual, final URL of the page (not the preview route you used to fetch it)
  html: // string – the HTML markup of the page, for analysis
}
```

So, in my personal usage my `resolveProductionUrl()` function will append `fetch=true` to the route when used for the SEO plugin. And this will prompt the `/api` route to actually perform its own fetch for the markup of the page – not redirect to it – and return the expected object shape.

```js
// ./pages/api/preview.js

// Fetch the preview-page's HTML and return in an object
if (req?.query?.fetch === 'true') {
  const proto = process.env.NODE_ENV === 'development' ? `http://` : `https://`
  const {host} = req.headers
  const absoluteUrl = new URL(`${proto}${host}${pathname}`).toString()

  const previewHtml = await fetch(absoluteUrl, {
    credentials: `include`,
    headers: {
      Cookie: req.headers.cookie,
    },
  })
    .then(async (previewRes) => ({
      resUrl: absoluteUrl,
      html: await previewRes.text(),
    }))
    .catch((err) => console.error(err))

  // We send JSON instead of Text so that the res URL can be passed back
  return res.json(previewHtml)
}
```

### A note on server-side rendering of draft content

As a final, Next.js specific note. Because this is going to fetch server-side, you'll need to make sure your `getStaticProps()` is actually going to return draft content.

It's easy to accidentally configure Next.js with Sanity previews to query for only published data, and then switch over to draft content client-side.

To solve this with the server side query, I'll make sure we query for as many documents as match the slug (as in, draft AND published) then use this function to just filter down to the one I want:

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

It's that easy!

## License

MIT © Simeon Griggs
See LICENSE
