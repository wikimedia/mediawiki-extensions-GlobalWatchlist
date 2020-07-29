/**
 * Utility to create and update links to foreign wikis
 *
 * @class GlobalWatchlistLinker
 * @constructor
 *
 * @param {string} site
 */
function GlobalWatchlistLinker( site ) {
	this.site = site;
}

/**
 * Watchlist api returns parsed comments, but the links in those comments reflect the site environment,
 * and can be local. Ensure that they work as foreign links by adding the site
 *
 * @param {string} comment
 * @return {string}
 */
GlobalWatchlistLinker.prototype.fixLocalLinks = function ( comment ) {
	// Only recognizes links in the edit summary if that wiki's settings are set to
	// use /wiki/$1 and /w/index.php?
	return comment.replace(
		/<a href="(\/wiki\/|\/w\/index\.php\?)/g,
		'<a href="//' + this.site + '$1'
	);
};

/**
 * Construct a link to a page with no extra query parameters (eg /wiki/$1)
 *
 * @param {string} page
 * @return {string}
 */
GlobalWatchlistLinker.prototype.linkPage = function ( page ) {
	return '//' + this.site + mw.config.get( 'wgArticlePath' ).replace( '$1', page );
};

/**
 * Construct a link to index.php with extra query parameters (eg /index.php?title=Foo&action=history
 *
 * @param {string} query
 * @return {string}
 */
GlobalWatchlistLinker.prototype.linkQuery = function ( query ) {
	return '//' + this.site + mw.config.get( 'wgScript' ) + '?' + query;
};

module.exports = GlobalWatchlistLinker;
