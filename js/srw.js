/* 
 * Spotify Related Web
 * Returns a list of an artist's top related artists' top tracks
 */

 $.fn.wait = function( ms, callback ) {
    return this.each(function() {
        window.setTimeout((function( self ) {
            return function() {
                callback.call( self );
            }
        }( this )), ms );
    });
};

 var srw = (function(){

 	// store config 
 	var configMap = {
 		api_base: 'https://api.spotify.com/v1',
 		genre_limit: 5,
 		fade_delay: 50
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
 			$search_btn: 				 $('.js-search'),
 			$query: 						 $('.search-form .form-control'),
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
 				limit: 10
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

 		return $.ajax({
 			url: configMap.api_base + '/artists/' + artistId + '/top-tracks?country=US',
 		}).promise();

 	};

 	clearResults = function(){
 		console.log(' -- Clear dom results' );
 		jq.$message.empty();
 		jq.$top_related_tracks.empty();
 	};

 	displayTracks = function( data, genreData ){
 		console.log(' -- Insert tracks in DOM' );

 		var tracks = [],
 				data_len = data.length,
 				i;

 		for( i = 0; i < data_len; i++ ) {
			tracks.push( data[ i ][ 0 ].tracks[ 0 ] );
			tracks[ i ][ "genres" ] = genreData[ i ];
 		}

 		console.log( ' -- Hide loading gif' );
 		jq.$loading.hide();

 		console.log( ' -- Append tracks to handlebars template.' );
 		jq.$top_related_tracks
	 		.append( template( tracks ) )
	 		.find('.track')
	 		.each( function( i ){
	 			var $self = $(this);
	 			$self.wait( ( i++ ) * configMap.fade_delay, function() {
					$self.addClass( 'fadeInDown' );
				});
	 		});
	 		

 		console.log( ' -- Bind click handler to new search btn.' );
 		$('.js-new-search').on('click', function(){
			var new_search = $(this).data('artist-name');
			console.log( ' -- New search: ' + new_search );

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

				displayTracks( cache[ artistId ], cache[ artistId ].genres );

 			} else {

 				if( results.artists.items.length > 0 ) {
 					console.log(' -- Artists founds' );

 					searched_artist_id = results.artists.items[ 0 ].id;

 					console.log( ' -- Not cached, execute api calls' );
	 				var related_artists = fetchRelatedArtists( searched_artist_id );

	 				related_artists.done( function( results ){
	 					var dfds = [],
	 							artists_arr = results.artists, 
	 							artists_len = artists_arr.length,
	 							genres = artists_arr.genres,
	 							genres_arr = [],
	 							filteredTracks = [],
	 							i;

	 					for( i = 0; i < artists_len; i++ ) {
	 						dfds.push( fetchTopTracks( artists_arr[ i ].id ) );
	 						genres_arr.push( results.artists[ i ].genres );
	 					}
	 					
	 					
	 					$.when.apply( $, dfds ).done(function(){

	 						// Returns a new array which has filtered
	 						// out any artists with 0 tracks
	 						// We must also remove the corresponding index
	 						// from the genres_arr
	 						filteredTracks = $.grep(arguments,function(val, idx){

	 							if( val[0]['tracks'].length == 0 ) {
	 								genres_arr.splice(idx,1);
	 								return false;
	 							}
	 							return true;
	 						});

	 						displayTracks( filteredTracks, genres_arr );

	 						// Add that search to the cache
	 						cache[ artistId ] = filteredTracks;
	 						cache[ artistId ]["genres"] = genres_arr;

	 						console.log( 'CACHE' );
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