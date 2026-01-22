/**
 * Handle getting labels for wikibase items
 *
 * Caller is responsible for determining if this should be used
 *
 * @class GlobalWatchlistWikibaseHandler
 * @constructor
 *
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug Debugger instance to log to
 * @param {mw.ForeignApi} api Instance of mw.ForeignApi to use
 * @param {string} userLang Language to fetch labels in
 * @param {number[]} namespaces All the namespaces with wikibase default content model
 * @param {string[]} nsNames All the names of namespaces with wikibase default content model
 */
function GlobalWatchlistWikibaseHandler( globalWatchlistDebug, api, userLang, namespaces, nsNames ) {
	// Logger to send debug info to
	this.debugLogger = globalWatchlistDebug;

	// api for the wikibase repo site
	this.api = api;

	// Language to fetch the labels in
	this.userLang = userLang;

	// Wikibase namespaces
	this.namespaces = namespaces;

	// Wikibase namespaces names
	this.nsNames = nsNames;
}

/**
 * Shortcut for sending information to the debug logger
 *
 * @param {string} msg Message for debug entry
 * @param {string} [extraInfo] Extra information for the debug entry
 */
GlobalWatchlistWikibaseHandler.prototype.debug = function ( msg, extraInfo ) {
	this.debugLogger.info( 'wikibase:' + msg, extraInfo );
};

/**
 * Fetch the labels for all of the ids given
 *
 * Since the api is usually limited to 50 ids at a time, called recursively
 * until all ids are processed. No special handling for users with `apihighlimits`,
 * still only fetch 50 at a time
 *
 * The returned promise resolves to an object with each of the entity ids being a key
 * to the relevant information. To help visualize, below is a partial result of the
 * wbgetentities query[1] performed on wikidata for Q5, P10, and L2, with the exception
 * that the `forms` and `senses` for L2 are not included.
 *
 * ```json
 *    {
 *        "Q5": {
 *            "type": "item",
 *            "id": "Q5",
 *            "labels": {
 *                "en": {
 *                    "language": "en",
 *                    "value": "human"
 *                }
 *            }
 *        },
 *        "P10": {
 *            "type": "property",
 *            "datatype": "commonsMedia",
 *            "id": "P10",
 *            "labels": {
 *                "en": {
 *                    "language": "en",
 *                    "value": "video"
 *                }
 *            }
 *        },
 *        "L2": {
 *            "type": "lexeme",
 *            "id": "L2",
 *            "lemmas": {
 *                "en": {
 *                    "language": "en",
 *                    "value": "first"
 *                }
 *            },
 *            "lexicalCategory": "Q1084",
 *            "language": "Q1860",
 *            "forms": [ ... ],
 *            "senses": [ ... ]
 *        }
 *    }
 * ```
 *
 *
 * [1] See:
 * https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q5|P10|L2&languages=en&props=labels&formatversion=2
 *
 * @see {@link GlobalWatchlistWikibaseHandler#cleanupRawLabels #cleanupRawLabels} for converting
 * to a more usable form
 *
 * @param {Array} entityIds The ids to get labels for
 * @return {Promise} Promise of api result
 */
GlobalWatchlistWikibaseHandler.prototype.getRawLabels = function ( entityIds ) {
	const that = this;

	return new Promise( ( resolve ) => {
		const query = {
			action: 'wbgetentities',
			formatversion: 2,
			ids: entityIds.slice( 0, 50 ),
			languages: that.userLang,
			props: 'labels',
			languagefallback: 1
		};
		that.api.get( query ).then( ( response ) => {
			that.debug( 'getRawLabels - api response', response );
			const labels = response.entities;
			if ( entityIds.length > 50 ) {
				// Recursive processing
				that.getRawLabels( entityIds.slice( 50 ) ).then( ( extraLabels ) => {
					const bothLabels = Object.assign( {}, labels, extraLabels );
					that.debug( 'getRawLabels - bothLabels', bothLabels );
					resolve( bothLabels );
				} );
			} else {
				// No need for further processing, either had less than 50 to
				// begin with or this was the final recursive call
				that.debug( 'getRawLabels - last', labels );
				resolve( labels );
			}
		} );
	} );
};

/**
 * Convert the messy object returned from getRawLabels to something clearer
 *
 * Resulting object has the following form (see documentation in
 * {@link GlobalWatchlistWikibaseHandler#getRawLabels #getRawLabels} for the original)
 *
 *```json
 *    {
 *        "Q5": "human",
 *        "P10": "video",
 *        "L2": "first"
 *    }
 *```
 *
 * @param {Object} rawLabels Labels in the format returns from the api
 * @return {Object} Labels in a more usable format
 */
GlobalWatchlistWikibaseHandler.prototype.cleanupRawLabels = function ( rawLabels ) {
	this.debug( 'cleanupRawLabels - starting (raw)', rawLabels );

	const cleanedLabels = {};
	const entityIds = Object.keys( rawLabels );
	const that = this;
	let entityInfo,
		labelKey;

	entityIds.forEach( ( entityId ) => {
		// Object.keys -> known to be a valid key
		entityInfo = rawLabels[ entityId ];

		// Lexemes have `lemmas`, items and properties have `labels`
		if ( entityInfo.type === 'lexeme' ) {
			labelKey = 'lemmas';
		} else {
			labelKey = 'labels';
		}

		if ( entityInfo[ labelKey ] &&
			entityInfo[ labelKey ][ that.userLang ] &&
			entityInfo[ labelKey ][ that.userLang ].value
		) {
			cleanedLabels[ entityId ] = entityInfo[ labelKey ][ that.userLang ].value;
		}
	} );
	this.debug( 'cleanupRawLabels - ending (clean)', cleanedLabels );

	return cleanedLabels;
};

/**
 * Set entities' $titleMsg (title without the `Property:` or `Lexeme:` prefix) and
 * get a list of the ids to fetch in the form of Q1/P2/L3
 *
 * @param {GlobalWatchlistEntryBase[]} entries Original summary entries
 * @return {Object} updated entries and ids
 */
GlobalWatchlistWikibaseHandler.prototype.getEntityIds = function ( entries ) {
	const ids = [];

	entries.forEach( ( entry ) => {
		if ( this.namespaces.includes( entry.ns ) ) {
			const prefix = this.nsNames.find( ( name ) => entry.title.startsWith( name + ':' ) );
			const titleMsgRaw = prefix ? entry.title.slice( prefix.length + 1 ) : entry.title;
			entry.$titleMsg = $( document.createTextNode( titleMsgRaw ) );
			if ( !ids.includes( titleMsgRaw ) ) {
				ids.push( titleMsgRaw );
			}
		}
	} );

	return {
		entries: entries,
		ids: ids
	};
};

/**
 * Entry point - alter the entities given to have $titleMsg that reflects the labels
 *
 * Promise resolves to the summary entries with updated info
 *
 * @param {GlobalWatchlistEntryBase[]} summaryEntries Original summary, entries have $titleMsg as
 *   just the plain title (Q1, P2, L3, etc.)
 * @return {Promise} Promise of updated summary, with labels
 */
GlobalWatchlistWikibaseHandler.prototype.addWikibaseLabels = function ( summaryEntries ) {
	const that = this;

	return new Promise( ( resolve ) => {
		const extractedInfo = that.getEntityIds( summaryEntries );
		that.debug( 'addLabels - extractedInfo', extractedInfo );

		const updatedEntries = extractedInfo.entries;
		const entityIds = extractedInfo.ids;

		if ( entityIds.length === 0 ) {
			// Nothing to fetch
			resolve( updatedEntries );
			return;
		}

		that.getRawLabels( entityIds ).then( ( rawLabels ) => {
			const cleanedLabels = that.cleanupRawLabels( rawLabels );

			updatedEntries.forEach( ( entry ) => {
				const titleMsgRaw = entry.$titleMsg.text();
				entry.$titleMsg = $( '<span>' ).append(
					entry.$titleMsg,
					cleanedLabels[ titleMsgRaw ] ?
						[ ' (', $( '<bdi>' ).text( cleanedLabels[ titleMsgRaw ] ), ')' ] : [] );
			} );

			resolve( updatedEntries );
		} );
	} );
};

module.exports = GlobalWatchlistWikibaseHandler;
