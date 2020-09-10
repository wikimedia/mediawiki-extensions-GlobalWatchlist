# JavaScript for Special:GlobalWatchlist

## Backend
The Vue and non-Vue display versions share the code for retrieving and organizing the watchlist content.

[SiteBase.js](./SiteBase.js.html) is responsible for retrieving and displaying the content for a specific site.
It is extended by both [SiteDisplay.js](./SiteDisplay.js.html) (for the non-Vue) version, and [SiteVue.js](./SiteVue.js.html)
(for the Vue version).

[MultiSiteWrappper](./MultiSiteWrapper.js.html) is used to manage multiple sites at once. Whichever frontend
module is being used creates a MultiSiteWrapper, specifying the class for the sites to be represented with
(either SiteDisplay or SiteVue) and the user's settings, including which sites should be included.

The MultiSiteWrapper then creates an instance of the specified site class for each of the sites the user
includes in their watchlists. The frontend then calls the `getAllWatchlists` method.

`getAllWatchlists` is a wrapper to return a Promise when each of the multiple sites it controls has
completed fetching the relevant watchlist, retrieved via the `getWatchlist` in SiteBase.js. `getWatchlist`
is the core of the backend for retrieving the changes to show.

### getWatchlist
`getWatchlist` works as follows:

1. Retrieve the actual changes to a user's watchlist, as returned from the [watchlist API](https://www.mediawiki.org/wiki/API:Watchlist),
using `actuallyGetWatchlist`, which repeatedly invokes the watchlist API until no more results are available.
2. Convert the "raw" changes from the API into a clearer summary of the changes, using [watchlistUtils.js](./ext.globalwatchlist.watchlistUtils.js.html),
including grouping results by page (when the user chooses to do so), converting links in edit summaries from local links to external links, etc.
3. Call `makeWikidataList` which will, if the site in question matches the one specified in `$wgGlobalWatchlistWikibaseSite`,
update the display text for entities, properties, and lexemes to use the item's label instead of id (see [Wikibase.js](./ext.globalwatchlist.wikibase.js.html))
4. Call `getTagList` to ensure that the information for any tags associated with edits is loaded
5. Call `renderWatchlist`, which is implemented in SiteDisplay.js and SiteVue.js, to actually create
the display.

**NOTE**: The Promise returned by `getWatchlist` is a promise that the watchlist was retrieved,
and does not resolve to the watchlist content itself.

## Frontend

### Components
Though implemented differently, both frontends include the following components:
- A toolbar, which holds to the buttons at the top of the page
that control the overall functionality
- A loading bar that is conditionally shown when the display is being refreshed
- When relevant, a label showing when the display was last refreshed
- The output of each site, including
 - A heading noting the site, linking to Special:Watchlist on the site
 - A button to mark all changes on that site as seen
 - A toggle to collapse/expand the site output
- When there are sites that have no changes to display, they are noted at the bottom

### Non-Vue version
The non-Vue version of the frontend uses OOUI and jQuery to create the elements for displaying the overall
global watchlist and each site's output. Additionally, HTML templating (using Mustache) is used
for a few elements.

### Vue version
The Vue version of the frontend uses custom components, and a few "base" components. The "base" components
will eventually be replaced with uses of shared components (see [T249840](https://phabricator.wikimedia.org/T249840)).

## JavaScript classes

* [GlobalWatchlistDebugger](GlobalWatchlistDebugger.html)
* [GlobalWatchlistLinker](GlobalWatchlistLinker.html)
* [GlobalWatchlistMultiSiteWrapper](GlobalWatchlistMultiSiteWrapper.html)
* [GlobalWatchlistSiteBase](GlobalWatchlistSiteBase.html)
    * [GlobalWatchlistSiteDisplay](GlobalWatchlistSiteDisplay.html)
    * [GlobalWatchlistSiteVue](GlobalWatchlistSiteVue.html)
* [GlobalWatchlistWikibaseHandler](GlobalWatchlistWikibaseHandler.html)
* [watchlistUtils](watchlistUtils.html)
