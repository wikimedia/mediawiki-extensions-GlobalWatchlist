# GlobalWatchlist

The [GlobalWatchlist extension](https://www.mediawiki.org/wiki/Extension:GlobalWatchlist) provides a basic interface to view one's watchlists on multiple wikis at once.

It is being developed as part of a [grant from the Wikimedia Foundation](https://meta.wikimedia.org/wiki/Grants:Project/DannyS712/Create_a_global_watchlist_extension).

## Installation

To install the extension, download the code from this repository and put it in the `extensions/` folder of a Mediawiki installation.
Then add the following code to the [LocalSettings.php](https://www.mediawiki.org/wiki/Special:MyLanguage/Manual:LocalSettings.php) file.

```php
wfLoadExtension( 'GlobalWatchlist' );
```

## Configuration

The extension currently defines the following configuration values:

* `wgGlobalWatchlistWikibaseSite`

Set this to the base URL of the site for which Wikibase labels should be fetched, or false for not trying to fetch Wikibase labels from any site.

By default, the value is `false`.

* `wgGlobalWatchlistEnableGuidedTour`

Set this to true to enable a GuidedTour to be loaded on Special:GlobalWatchlistSettings if the user has
no existing settings saved and the GuidedTour extension is enabled.

By default, the value is `false`.

* `wgGlobalWatchlistSiteLimit`

This is used to limit the number of different sites that a user can include in their global watchlist.
If set to 0, no limit is imposed. Limits are imposed at the time of submitting the form at Special:GlobalWatchlistSettings.

By default, the value is `5`.

## Use

The extension provides two new [special pages](https://www.mediawiki.org/wiki/Special:MyLanguage/Manual:Special_pages).

#### Special:GlobalWatchlist

Visiting Special:GlobalWatchlist with this extension enabled shows the user a basic view of their watchlists on multiple wikis.
Users can choose which wikis to show, as well as apply filters to the changes shown, in Special:GlobalWatchlistSettings.
Further documentation is available at [docs/GlobalWatchlist.md](./docs/GlobalWatchlist.md).

#### Special:GlobalWatchlistSettings

Visiting Special:GlobalWatchlistSettings with this extension enabled allows users to configure their global watchlist, including which sites to include.
Further documentation is available at [docs/Settings.md](./docs/Settings.md).
