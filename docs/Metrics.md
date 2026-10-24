# Metrics collection

## [mw.track](https://www.mediawiki.org/wiki/ResourceLoader/Core_modules#mw.track):

### Special:GlobalWatchlist
Each time [SpecialGlobalWatchlist.php](./../includes/SpecialGlobalWatchlist.php) is loaded, the time it takes
for the watchlist to be first loaded is tracked using `mw.track`. There are four different metric names used:

* `timing.MediaWiki.GlobalWatchlist.firstload.display.normal`
* `timing.MediaWiki.GlobalWatchlist.firstload.display.fastmode`

The use of `normal` or `fastmode` corresponds to whether the user chose to use the fast mode or not.
