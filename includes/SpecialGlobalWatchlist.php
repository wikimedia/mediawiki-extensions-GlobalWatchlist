<?php

/**
 * Special:GlobalWatchlist is implemented in JavaScript; load the relevant ResourceLoader module.
 *
 * See docs/GlobalWatchlist.md for details of how the JavaScript works.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * http://www.gnu.org/copyleft/gpl.html
 *
 * @file
 * @ingroup SpecialPage
 */

namespace MediaWiki\Extension\GlobalWatchlist;

use Html;
use IBufferingStatsdDataFactory;
use SpecialPage;

/**
 * @ingroup SpecialPage
 * @author DannyS712
 */
class SpecialGlobalWatchlist extends SpecialPage {

	/** @var IBufferingStatsdDataFactory */
	private $statsdDataFactory;

	/**
	 * @param IBufferingStatsdDataFactory $statsdDataFactory
	 */
	public function __construct( IBufferingStatsdDataFactory $statsdDataFactory ) {
		parent::__construct( 'GlobalWatchlist', 'viewmywatchlist' );

		$this->statsdDataFactory = $statsdDataFactory;
	}

	/**
	 * @param string|null $par
	 */
	public function execute( $par ) {
		$this->setHeaders();

		$this->addHelpLink( 'Extension:GlobalWatchlist' );

		$this->requireLogin( 'globalwatchlist-must-login' );

		$config = $this->getConfig();

		// Allow users to override the $wgGlobalWatchlistUseVue setting on a per-view
		// basis by setting the `displayversion` parameter. This will make testing and QA easier.
		// The parameter is considered internal and should not be relied upon by end users.
		// It is only allowed when $wgGlobalWatchlistDevMode is enabled
		$loadVueDisplay = $config->get( 'GlobalWatchlistUseVue' );
		if ( $config->get( 'GlobalWatchlistDevMode' ) ) {
			$displayVersion = $this->getRequest()->getVal( 'displayversion' );
			if ( $displayVersion === 'vue' ) {
				$loadVueDisplay = true;
			} elseif ( $displayVersion === 'normal' ) {
				$loadVueDisplay = false;
			} else {
				// no change, use whatever $wgGlobalWatchlistUseVue says
			}
		}

		$out = $this->getOutput();
		$out->addModules(
			$loadVueDisplay ?
				'ext.globalwatchlist.specialglobalwatchlist.vue' :
				'ext.globalwatchlist.specialglobalwatchlist'
		);

		$out->addJsConfigVars( [
			'wgGlobalWatchlistWikibaseSite' => $config->get( 'GlobalWatchlistWikibaseSite' ),
			'wgGlobalWatchlistDevMode' => $config->get( 'GlobalWatchlistDevMode' )
		] );

		// Until the JavaScript is loaded, show a message explaining that
		// the page requires JavaScript. Once the JavaScript loads, the class is
		// detected and the content is replaced by the actual global watchlist
		$message = Html::rawElement(
			'div',
			[ 'class' => 'ext-globalwatchlist-content' ],
			$this->msg( 'globalwatchlist-javascript-required' )
		);
		$out->addHTML( $message );

		$this->statsdDataFactory->increment( 'globalwatchlist.load_special_page' );
	}

	/**
	 * @return string
	 */
	protected function getGroupName() {
		return 'changes';
	}

	/**
	 * Only shown for logged in users
	 *
	 * @return bool
	 */
	public function isListed() {
		return $this->getUser()->isRegistered();
	}

}
