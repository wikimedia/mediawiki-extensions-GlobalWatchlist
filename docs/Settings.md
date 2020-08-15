# GlobalWatchlist user settings

On `Special:GlobalWatchlistSettings`, users can configure their global watchlist. Not all of the
options that are available on the [normal watchlist](https://www.mediawiki.org/wiki/Help:Watchlist) are available
at this point. These settings are converted to serialized json, and then saved as user preferences.

Available options:

* Choose which sites to include
* Choose which types of changes to include: edits, log entries, or new pages
* Showing only edits made by anonymous users, or excluding such edits
* Showing only edits marked as bot edits, or excluding such edits
* Showing only edits marked as minor edits, or excluding such edits
* Fast mode (see below)

User settings are stored in the [`user_properties` database table](https://www.mediawiki.org/wiki/Special:MyLanguage/Manual:User_properties_table)
with the preference name `global-watchlist-options`.

Users can also manually set their preferences via the standard [options API](https://www.mediawiki.org/wiki/API:Options).
However, doing so may result in invalid settings being stored. If a user has settings stored,
but the settings are invalid, the default settings are used, and the user is alerted to the fact
that their settings were invalid and that the defaults were used.

## Fast mode

The "Fast mode" option allows users to reduce the amount of information that is fetched from the server,
speeding up display. When enabled, rather than fetching all changes made to pages on a user's watchlist,
the extension only fetches the latest changes. It is akin to the option to only fetch the latest
revision.

Additionally, when enabled, information about who made edits, the edit summaries used, and associated
tags is not included, and wikibase labels are not fetched.

## Defaults

By default, the list of sites to display is limited to the local site, and the following options
are used:

* Include all changes (edits, log entries, and new pages)
* Show all edits, regardless of whether they were made by anonymous users or bots, or where marked as minor
* Fast mode is disabled
