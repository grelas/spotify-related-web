/* 
 * Spotify Related Web
 * Returns a list of an artist's top related artists' top tracks
 */

 var srw = (function(){

 	// store config 
 	var configMap = {
		api_base: 'https://api.spotify.com/v1',
		default_search: 'Pixies',
		fade_delay: 50,
		anchor_schema_map : {
			search : true
		}
 	},

 	// store state
 	stateMap = {
 		$container : null,
 		cache      : {},
 		anchor_map : {} // Store the current anchor values in a map
 	},

	templateSource = $('#results-template').html(),
	template = Handlebars.compile( templateSource ),

 	jq = {},
 	updateText,
 	setJqueryMap,
 	copyAnchorMap,
 	changeAnchorPart,
 	onHashchange,
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
 			$loading: 					 $('.loading'),
 			$lazy: 							 $('.lazy')
 		};
 	};

 	// Returns a copy of stored anchor map (minimizes overhead)
 	copyAnchorMap = function(){
 		return $.extend( true, {}, stateMap.anchor_map );
 	};

 	/*
   * Utility to update the anchor
 	 * Purpose: Changes part of the URI anchor components
   * Arguments: 
   			* arg_map - The map describing what part of the URI anchor we want changed
   * Returns
   			* true - the Anchor portion of the URI was updated
   			* false - the Anchor portion of the URI could not be updated
   * Action
       The current anchor rep stored in stateMap.anchor_map
       This method
           * Creates a copy of this map using copyAnchorMap()
           * Modifies the key-values using arg_map
           * Attempts to change the URI using uriAnchor
           * Returns true on success, and false on failure.
 	*/
 	changeAnchorPart = function( arg_map ){
 		var anchor_map_revise = copyAnchorMap(),
 				bool_return = true,
 				key_name;

 		console.log('');
		console.log('anchor stuff');

		console.log( arg_map );
 		console.log( anchor_map_revise );
 		console.log( stateMap.anchor_map );

 		// Begin merge changes into anchor map
 		for( key_name in arg_map ){

 			if( arg_map.hasOwnProperty( key_name ) ) {

 			  // update independent key value
 				anchor_map_revise[ key_name ] = arg_map[ key_name ];

 				console.log( arg_map );
 				console.log( anchor_map_revise ); // has new value as 'search'
 				console.log( stateMap.anchor_map );

 			}
 		}

 		//attempt to update URI
 		try {
 			console.log('attempt to update URI');
 			$.uriAnchor.setAnchor( anchor_map_revise );

 		} catch( error ) {
 			console.log( error );

 			// replace URL with existing state
 			$.uriAnchor.setAnchor( stateMap.anchor_map, null, true );
 			bool_return = false;
 		}
 		console.log( 'bool_return: ' + bool_return );
 		console.log( 'end anchor stuff');
 		console.log( '' );
 		return bool_return;
 	};

	/*
   * Purpose: Handles the hashchange event
   * Arguments
   			* event - jQuery event object
   * Action
   			* Parses the URI anchor component
   			* Comapres proposed application state with current
   			* Adjust the application only where proposed state differs from existing
	 */
 	onHashchange = function( event ){
 		var anchor_map_previous = copyAnchorMap(),
 				anchor_map_proposed,
 				_s_search_previous,
 				_s_search_proposed,
 				s_search_proposed;

 		console.log('');
 		console.log( 'ON HASHCHANGE' );
 		console.log( ' -- (initial) stateMap.anchor_map' );
 		console.log( stateMap.anchor_map );
 		console.log('');
 		console.log( ' -- anchor_map_previous' );
 		console.log( anchor_map_previous );
 		console.log('');

 		try {
 			anchor_map_proposed = $.uriAnchor.makeAnchorMap();
 			console.log(' -- Proposed anchor (what we want to search for)');
 			console.log( anchor_map_proposed );
 			console.log('');

 		} catch ( error ) {
 			console.log( error );
 			// set to previous

 			$.uriAnchor.setAnchor( anchor_map_previous, null, true );
 			return false;
 		}
 		// set the anchor_map to what we want to search for
 		stateMap.anchor_map = anchor_map_proposed;
 		console.log( '(after) stateMap.anchor_map' );
 		console.log( stateMap.anchor_map );
 		console.log('');

 		_s_search_previous = anchor_map_previous._s_search;
 		_s_search_proposed = anchor_map_proposed._s_search;

 		console.log( ' -- _s_search_previous: ' + _s_search_previous );
 		console.log( ' -- _s_search_proposed: ' + _s_search_proposed );


 		if( !anchor_map_previous || _s_search_previous !== _s_search_proposed ) {
 			s_search_proposed = anchor_map_proposed.search;
 			console.log( ' -- s_search_proposed: ' + s_search_proposed );

 			// perform search
 			console.log('')
 			console.log( 'PERFORM SEARCH FOR ' + s_search_proposed );
 			if( s_search_proposed !== '' ){
 				startRelatedTracks( s_search_proposed );
 			} else {
 				console.log('trying to search for blank')
 				$.uriAnchor.setAnchor({
 					search : configMap.default_search
 				});
 			}
 		}

 		return false;
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
					$self.addClass( 'bounceInUp' );
				});

	 			console.log( ' -- Lazy load images' );
				$self.find('img.lazy').unveil(100, function(){
					var $img = $(this);
					$img.load(function(){
						$img.addClass('img--shown');
					});
				});

				
	 		});
	 	jq.$new_search = $('.js-new-search');

 		console.log( ' -- Bind click handler to new search btn.' );

 		jq.$new_search.on('click', function(){
			var new_search = $(this).data('artist-name');
			console.log( ' -- New search: ' + new_search );

			changeAnchorPart({
				search : new_search
			});

			return false;
		});

 	};

 	updateText = function( artist ) {
 		console.log( ' -- Update artist text' );

 		jq.$artist.text( artist );
 		jq.$query.val( artist );
 	};

 	startRelatedTracks = function( artistId ){

 		// show loading text
 		jq.$loading.show();

 		// update text on screen
 		updateText( artistId );

 		var search = searchArtists( artistId );

 		search.done( function( results ){
 			var searched_artist_id;

 			clearResults();

 			if( stateMap.cache[ artistId ] ) {
 				console.log( ' -- Already cached that artist' );

				displayTracks( stateMap.cache[ artistId ], stateMap.cache[ artistId ].genres );

 			} else {

 				if( results.artists.items.length > 0 ) {
 					console.log(' -- Artists found' );

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
	 						stateMap.cache[ artistId ] = filteredTracks;
	 						stateMap.cache[ artistId ]["genres"] = genres_arr;

	 						//console.log( 'CACHE' );
	 						//console.log( stateMap.cache );

	 					});

	 				});
 				} else {
 					console.log(' -- No artists found ' );
 					return false;
 				}
 			}

 		});
 	};

 	initModule = function( $container ) {
 		console.log('INIT SRW');

 		stateMap.$container = $container;
 		setJqueryMap();

 		jq.$loading.hide();

 		console.log( ' -- Insert default search' );
 		updateText( configMap.default_search );

		jq.$search_btn.on('click', function( e ){
			console.log(' -- User clicked search' );
			var cur_value = jq.$query.val();

			changeAnchorPart({
				search : cur_value
			});

			return false;
		});

		Handlebars.registerHelper("formatDuration", function( duration_ms ){
		  var minutes = Math.floor(duration_ms / 60000),
		  		seconds = ((duration_ms % 60000) / 1000).toFixed(0);

		  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
		});

		$.uriAnchor.configModule({
			schema_map : configMap.anchor_schema_map
		});
		// Bind the hashchange event handler and immediately trigger
		// it so the module considers the bookmark on initial load
		$(window)
			.on( 'hashchange', onHashchange )
			.trigger( 'hashchange' );
 	};

 	return {
 		initModule : initModule
 	};
 })();


 $(function(){
 	srw.initModule( $('.srw') );
 });