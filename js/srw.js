/* 
 * Spotify Related Web
 */

var srw = (function(){
	var configMap = {},

			stateMap = {
				$container : null
			},

			jq = {},
			setJqueryMap,
			fetchTracks,
			initModule;

	setJqueryMap = function(){
		console.log( ' -- cache jquery collections' );

		var $container = stateMap.$container;

		jq = {
			$container : $container
		};
	};

	fetchTracks = function( albumId, callback ){
	    $.ajax({
	        url: 'https://api.spotify.com/v1/albums/' + albumId,
	        success: function( response ) {
	        	var resp = response,
	        			name = resp.name,
	        			artist_name = resp.artists[0].name;

	        	console.dir( resp );
	        	console.log( name );
	        	console.log( artist_name );

	          callback( response );
	        }
	    });
	};

	initModule = function( $container ) {
		console.log('INIT MODULE');

		stateMap.$container = $container;
		$container.html('Hello World');

		setJqueryMap();

		fetchTracks( '4Chn7XF8fzngf9GPfTMXLz', function( data ){
			console.log(' -- do something');
			console.log(data);
		});
	};

	return {
		initModule : initModule
	};
})();

$(function(){
	srw.initModule( $('.srw') );
});