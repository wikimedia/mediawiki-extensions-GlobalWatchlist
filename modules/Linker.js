/**
 * Utility to create and update links to foreign wikis
 *
 * @class GlobalWatchlistLinker
 * @constructor
 *
 * @param {string} site The url for the foreign wiki
 */
function GlobalWatchlistLinker( site ) {
	this.site = site;

	// Avoid checking with mw.config each time, shouldn't change
	this.wgArticlePath = mw.config.get( 'wgArticlePath' );
	this.wgScript = mw.config.get( 'wgScript' );
}

/**
 * Watchlist api returns parsed comments, but the links in those comments reflect the site
 * environment, and can be local. Ensure that they work as foreign links by adding the site.
 *
 * @param {string} comment The original comment with local links
 * @return {string} Updated comment with foreign links
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
 * @param {string} page The title of the page to link to
 * @return {string} Url for the link
 */
GlobalWatchlistLinker.prototype.linkPage = function ( page ) {
	return '//' + this.site + this.wgArticlePath.replace( '$1', page );
};

/**
 * Construct a link to index.php with query parameters (eg /index.php?title=Foo&action=history)
 *
 * @param {string} query Query parameters to append to the base link
 * @return {string} Url for the link
 */
GlobalWatchlistLinker.prototype.linkQuery = function ( query ) {
	return '//' + this.site + this.wgScript + '?' + query;
};

module.exports = GlobalWatchlistLinker;
