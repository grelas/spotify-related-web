/* 
 * Spotify Related Web
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

 	jq = {},
 	setJqueryMap,
 	searchArtists,
 	fetchTracks,
 	fetchTopTracks,
 	fetchArtist,
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
 			$query: 						 $('#query')
 		};
 	};

 	searchArtists = function( query ){
 		console.log( ' -- Search spotify for artist ' + query );

 		$.ajax({
        url: configMap.api_base + '/search',
        data: {
            q: query,
            type: 'artist',
            limit: 30
        },

        success: function( response ) {
        	var resp       = response,
        			artists    = resp.artists,
        			artist_uri;

        	if( artists.items.length > 0 ) {
        		artist_uri = artists.items[ 0 ].id;
        	} else {
        		console.warn( ' -- No results from search' );
        	}


        	// do something with id
        	if( artist_uri !== undefined ) {
	        	fetchRelatedArtists( artists.items[0].id, function( data ){

	        		var related_artists_arr = data,
		 							related_artists_len = related_artists_arr.length,
		 							i;

		 					if( related_artists_len > 0 ) {
			 					for( i = 0; i < related_artists_len; i++ ) {
				 					fetchTopTracks( related_artists_arr[ i ].id );
				 				}
				 			}

	        	});
	        }
        }
    });
 	};

 	fetchTracks = function( albumId, callback ){
 		console.log( ' -- Fetch tracks from: ' + albumId );

 		$.ajax({
 			url: configMap.api_base + '/albums/' + albumId,
 			success: function( response ) {
 				var resp = response,
 				name = resp.name,
 				artist_name = resp.artists[0].name;

 				console.dir( resp );
 				console.log( name );
 				console.log( artist_name );

 				if( callback && typeof callback === "function" ) {
 					callback( response );
 				}
 			}
 		});
 	};

 	fetchArtist = function( artistId, callback ) {
 		console.log( ' -- Fetch artist: ' + artistId );

 		$.ajax({
 			url: configMap.api_base + '/artists/' + artistId,
 			success: function( response ) {
 				var resp 			  	  = response,
 					artist_name       = resp.name,
 					artist_img_len    = resp.images.length,
 					artist_img_url    = resp.images[ 0 ].url,
 					artist_img_height = resp.images[ 0 ].height,
 					artist_img  	  = $('<img />');

 				console.log(' -- name: ' + artist_name );
 				console.log(' -- img url: ' + artist_img_url );
 				console.log(' -- img height: ' + artist_img_height );

 				artist_img.attr({ 
				    src:    artist_img_url,
				    height: artist_img_height
				});

				jq.$artist_img.append( artist_img );
 				jq.$artist.append( artist_name );

 				fetchRelatedArtists( artistId );

 				if( callback && typeof callback === "function" ) {
 					callback( response );
 				}
 			}
 		});
 	};

 	fetchRelatedArtists = function( artistId, callback ){
 		console.log( ' -- Fetch related artists' );

 		$.ajax({
 			url: configMap.api_base + '/artists/' + artistId + '/related-artists',

 			success: function( response ) {
 				var resp = response,
 					related_artists_arr = resp.artists,
 					related_artists_len = related_artists_arr.length,
 					i;

 				console.dir( related_artists_arr );

 				for( i = 0; i < related_artists_len; i++ ) {
 					fetchTopTracks( related_artists_arr[ i ].id, related_artists_arr[ i ].genres );
 				}

 				if( callback && typeof callback === "function" ) {
 					callback( response );
 				}
 			}
 		});
 	};

 	fetchTopTracks = function( artistId, genreArr ){

 		$.ajax({
 			url: configMap.api_base + '/artists/' + artistId + '/top-tracks?country=US',

 			success: function( response ) {
 				var resp = response,
 					tracks = resp.tracks,
 					tracks_len = tracks.length,
 					genre_arr_list,
 					i;

 					console.log( 'genre count: ' + genreArr.length );

 					if( genreArr.length > 0 ) {

 						if( genreArr.length > configMap.genre_limit ) {

 							// remove other genres
 							genreArr.splice( genreArr[configMap.genre_limit], (genreArr.length - configMap.genre_limit) );
 
 						}

 						genre_arr_list = genreArr.toString();
 						console.log( genreArr );
 					}
 					

 				jq.$top_related_tracks
 					.append( '<li><strong>' + tracks[0].name + '</strong> <span><em>(' + tracks[ 0 ].artists[ 0 ].name + ')</em></span><span>' + genre_arr_list + '</span></li>' );
 			}
 		});
 	};

 	clearResults = function(){
 		console.log(' -- Clear dom results' );

 		jq.$top_related_tracks.empty();
 	};

 	initModule = function( $container ) {
 		console.log('INIT MODULE');

 		stateMap.$container = $container;
 		setJqueryMap();

 		var search_arr = [], 
 				count = 0;

		jq.$search_btn.on('click', function( e ){
			console.log(' -- User clicked search' );

			e.preventDefault();

			var cur_value = jq.$query.val();

			if( !cur_value ) {
				console.warn( ' -- No value entered' );
				return;
			}
			
			/* Save current value in array
			 * This way we can check if the user
			 * didn't change their search (reduces api lookups)
			 */
			search_arr.push( cur_value );

	  	if( count === 0 || cur_value !== search_arr[ count - 1 ] ) {
				console.log(' -- Count is 0 OR current value is different than previous' );
				clearResults();
				searchArtists( cur_value );
	    } else {
	    	console.warn(' -- Current value (' + cur_value + ') is the same as previous ' + '('+ search_arr[ count - 1 ] +')' );
	    }

	    // Increment count
			count += 1;
		});
 	};

 	return {
 		initModule : initModule
 	};
 })();

 $(function(){
 	srw.initModule( $('.srw') );
 });