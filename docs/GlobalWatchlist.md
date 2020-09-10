# Special:GlobalWatchlist

Special:GlobalWatchlist is based almost entirely in JavaScript. The limited PHP code in
SpecialGlobalWatchlist.php is limited to:

- Registering the special page
- Setting the relevant JavaScript configuration variables based on site configuration
- Loading the correct JavaScript module for the display, either `ext.globalwatchlist.specialglobalwatchlist`
or `ext.globalwatchlist.specialglobalwatchlist.vue`, depending on the site's configuration

To view the JavaScript documentation, please see https://doc.wikimedia.org/GlobalWatchlist/master/js/.
