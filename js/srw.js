/* 
 * Spotify Related Web
 * Returns a list of an artist's top related artists' top tracks
 */

 var srw = (function(){

 	// store config 
 	var configMap = {
 		api_base: 'https://api.spotify.com/v1',
 		genre_limit: 5
 	},

 	// store state
 	stateMap = {
 		$container : null
 	},

 	templateSource = $('#results-template').html(),
  template = Handlebars.compile( templateSource ),
  cache = {},

 	jq = {},
 	setJqueryMap,
 	searchArtists,
 	fetchTopTracks,
 	startRelatedTracks,
 	fetchRelatedArtists,
 	initModule;

 	setJqueryMap = function(){
 		console.log( ' -- Cache jquery collections' );

 		var $container = stateMap.$container;

 		jq = {
 			$container:  	 		   $container,
 			$artist:      			 $('.artist'),
 			$artist_img:  			 $('.artist-img'),
 			$related_artists: 	 $('.related-artists'),
 			$top_related_tracks: $('.top-related-tracks'),
 			$results_container:  $('.results'),
 			$search_form: 			 $('.search-form'),
 			$search_btn: 				 $('#search'),
 			$query: 						 $('#query'),
 			$message: 					 $('.message'),
 			$loading: 					 $('.loading')
 		};
 	};

 	searchArtists = function( query ){
 		console.log( ' -- Search spotify for artist ' + query );

 		return $.ajax({
 			url: configMap.api_base + '/search',
 			data: {
 				q: query,
 				type: 'artist',
 				limit: 30
 			},
 		}).promise();

 	};

 	fetchRelatedArtists = function( artistId ){
 		console.log( ' -- Fetch related artists from ' + artistId );

 		return $.ajax({
 			url: configMap.api_base + '/artists/' + artistId + '/related-artists',
 		}).promise();

 	};

 	fetchTopTracks = function( artistId ){
 		//console.log( ' -- Fetch top tracks from artistId ' );

 		return $.ajax({
 			url: configMap.api_base + '/artists/' + artistId + '/top-tracks?country=US',
 		}).promise();

 	};

 	clearResults = function(){
 		console.log(' -- Clear dom results' );
 		jq.$message.empty();
 		jq.$top_related_tracks.empty();
 	};

 	displayTracks = function( data ){
 		console.log(' -- Insert tracks in DOM' );
 		console.dir( data );

 		var tracks = [], i;

 		for( i = 0; i < data.length; i++ ) {
 			tracks.push( data[i][0].tracks[0] );
 		}

 		console.dir(tracks);
 		console.log( ' -- Hide loading gif' );
 		jq.$loading.hide();

 		jq.$top_related_tracks.append( template( tracks ) );

 		$('.js-new-search').on('click', function(){
			var new_search = $(this).data('artist-name');
			console.log(' -- New search: ' + new_search);

			// update val in search
			jq.$query.val( new_search );
			startRelatedTracks( new_search );
		});
 	};

 	startRelatedTracks = function( artistId ){
 		
 		jq.$loading.show();
 		jq.$artist.text( artistId );

 		var search = searchArtists( artistId );

 		search.done( function( results ){
 			var searched_artist_id;

 			clearResults();

 			if( cache[ artistId ] ) {
 				console.log( ' -- Already cached that artist' );

				displayTracks( cache[ artistId ] );

 			} else {

 				if( results.artists.items.length > 0 ) {
 					console.log(' -- Artists founds' );

 					searched_artist_id = results.artists.items[ 0 ].id;
 					console.log( ' -- Not cached, execute api calls' );
	 				var related_artists = fetchRelatedArtists( searched_artist_id );

	 				related_artists.done( function( results ){
	 					var dfds = [], i;

	 					console.log( results );

	 					//var genre_arr = [];

	 					for( i = 0; i < results.artists.length; i++ ) {
	 						dfds.push( fetchTopTracks( results.artists[ i ].id ) );
	 						//genre_arr.push( results.artists[ i ].genres );
	 					}

	 					//console.log( genre_arr );

	 					$.when.apply( $, dfds ).done(function(){
	 						cache[ artistId ] = arguments;
	 						displayTracks( arguments );
	 						console.log( cache );
	 					});

	 				});
 				} else {
 					console.log(' -- No artists found ' );
 				}
 			}

 		});
 	};

 	initModule = function( $container ) {
 		console.log('INIT MODULE');

 		stateMap.$container = $container;
 		setJqueryMap();

 		jq.$loading.hide();

		jq.$search_btn.on('click', function( e ){
			console.log(' -- User clicked search' );
			e.preventDefault();
			
			var cur_value = jq.$query.val();
			startRelatedTracks( cur_value );
		});

		Handlebars.registerHelper("formatDuration", function( duration_ms ){
		  var minutes = Math.floor(duration_ms / 60000),
		  		seconds = ((duration_ms % 60000) / 1000).toFixed(0);

		  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
		});

 	};

 	return {
 		initModule : initModule
 	};
 })();

 $(function(){
 	srw.initModule( $('.srw') );
 });