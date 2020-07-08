<?php

/**
 * Implements Special:GlobalWatchlist
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
use SpecialPage;

/**
 * Doesn't do anything other than show a message for now
 *
 * @ingroup SpecialPage
 * @author DannyS712
 */
class SpecialGlobalWatchlist extends SpecialPage {

	public function __construct() {
		parent::__construct( 'GlobalWatchlist', 'viewmywatchlist' );
	}

	/**
	 * @param string|null $par
	 */
	public function execute( $par ) {
		$this->setHeaders();

		$this->addHelpLink( 'Extension:GlobalWatchlist' );

		$this->requireLogin( 'globalwatchlist-must-login' );

		$out = $this->getOutput();
		$out->addModules( 'ext.globalwatchlist.specialglobalwatchlist' );

		$out->addJsConfigVars(
			'wgGlobalWatchlistWikibaseSite',
			$this->getConfig()->get( 'GlobalWatchlistWikibaseSite' )
		);

		// Class is for JS to detect and replace
		$message = Html::rawElement(
			'div',
			[ 'class' => 'globalwatchlist-content' ],
			$this->msg( 'globalwatchlist-javascript-required' )
		);
		$out->addHTML( $message );
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
		return $this->getUser()->isLoggedIn();
	}

}
