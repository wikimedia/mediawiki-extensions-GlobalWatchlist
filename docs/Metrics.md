# Metrics collection

The GlobalWatchlist extension currently tracks four metrics using the `StatsdDataFactory` service:

## Special:GlobalWatchlist
Each time [SpecialGlobalWatchlist.php](./../includes/SpecialGlobalWatchlist.php) is executed, the
`globalwatchlist.load_special_page` metric is incremented.

## Special:GlobalWatchlistSettings

When users submit options via [SpecialGlobalWatchlistSettings.php](./../includes/SpecialGlobalWatchlistSettings.php),
one of two different metrics is incremented. If the user has existing settings saved in the database,
the `globalwatchlist.settings.change` metric is incremented. If not, and the user is saving their settings
for the first time, the `globalwatchlist.settings.new` metric is incremented.

## Options api

In addition to being able to use Special:GlobalWatchlistSettings to modify their preferences, users
can also manually set their preferences via the [options API](https://www.mediawiki.org/wiki/API:Options).
When the options API is used to modify the global watchlist preferences, the `globalwatchlist.settings.manualchange`
metric is incremented.
