# Metrics collection

The GlobalWatchlist extension currently tracks four counter metrics using the `StatsdDataFactory` service,
and four timing metrics using [mw.track](https://www.mediawiki.org/wiki/ResourceLoader/Core_modules#mw.track):

## PHP StatsdDataFactory metrics

### Special:GlobalWatchlist
Each time [SpecialGlobalWatchlist.php](./../includes/SpecialGlobalWatchlist.php) is executed, the
`globalwatchlist.load_special_page` metric is incremented.

### Special:GlobalWatchlistSettings

When users submit options via [SpecialGlobalWatchlistSettings.php](./../includes/SpecialGlobalWatchlistSettings.php),
one of two different metrics is incremented. If the user has existing settings saved in the database,
the `globalwatchlist.settings.change` metric is incremented. If not, and the user is saving their settings
for the first time, the `globalwatchlist.settings.new` metric is incremented.

### Options api

In addition to being able to use Special:GlobalWatchlistSettings to modify their preferences, users
can also manually set their preferences via the [options API](https://www.mediawiki.org/wiki/API:Options).
When the options API is used to modify the global watchlist preferences, the `globalwatchlist.settings.manualchange`
metric is incremented.

## Special:GlobalWatchlist - mw.track timing
Each time [SpecialGlobalWatchlist.php](./../includes/SpecialGlobalWatchlist.php) is loaded, the time it takes
for the watchlist to be first loaded is tracked using `mw.track`. There are four different metric names used:

* `timing.MediaWiki.GlobalWatchlist.firstload.display.normal`
* `timing.MediaWiki.GlobalWatchlist.firstload.display.fastmode`

The use of `normal` or `fastmode` corresponds to whether the user chose to use the fast mode or not.
