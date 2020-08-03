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

Set this to the base URL of the site for which Wikibase labels should be fetched.

By default, the value is `www.wikidata.org`.

* `wgGlobalWatchlistUseVue`

Set this to true to enable the Vue version of the JavaScript for Special:GlobalWatchlist.

By default, the value is `false`.

## Use

The extension provides two new [special pages](https://www.mediawiki.org/wiki/Special:MyLanguage/Manual:Special_pages).

#### Special:GlobalWatchlist

Visiting Special:GlobalWatchlist with this extension enabled shows the user a basic view of their watchlists on multiple wikis.
Users can choose which wikis to show, as well as apply filters to the changes shown, in Special:GlobalWatchlistSettings.

#### Special:GlobalWatchlistSettings

Visiting Special:GlobalWatchlistSettings with this extension enabled allows users to configure their global watchlist, including which sites to include.
A couple of filter options are available as well:

* Showing only edits made by anonymous users, or excluding such edits
* Showing only edits marked as bot edits, or excluding such edits
* Showing only edits marked as minor edits, or excluding such edits

Not all of the filters available at the normal watchlist ([Special:Watchlist](https://www.mediawiki.org/wiki/Manual:Watchlist)) are implemented in the global watchlist.

User settings are stored in the [`user_properties` database table](https://www.mediawiki.org/wiki/Special:MyLanguage/Manual:User_properties_table) with the preference name `global-watchlist-options`.