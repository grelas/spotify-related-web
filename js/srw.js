/* 
 * Spotify Related Web
 */

 var srw = (function(){
 	var configMap = {
 		api_base: 'https://api.spotify.com/v1'
 	},

 	stateMap = {
 		$container : null
 	},

 	jq = {},
 	setJqueryMap,
 	fetchTracks,
 	fetchTopTracks,
 	fetchArtist,
 	fetchRelatedArtists,
 	initModule;

 	setJqueryMap = function(){
 		console.log( ' -- cache jquery collections' );

 		var $container = stateMap.$container;

 		jq = {
 			$container :  $container,
 			$artist:      $('.artist'),
 			$artist_img:  $('.artist-img'),
 			$related_artists: $('.related-artists'),
 			$top_related_tracks: $('.top-related-tracks')
 		};
 	};

 	fetchTracks = function( albumId, callback ){
 		$.ajax({
 			url: configMap.api_base + '/albums/' + albumId,
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

 	fetchArtist = function( artistId, callback ) {
 		$.ajax({
 			url: configMap.api_base + '/artists/' + artistId,
 			success: function( response ) {
 				var resp 			  = response,
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

 				if( callback !== undefined ) {
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
 					related_artists_len = related_artists_arr.length;

 				console.dir( related_artists_arr );

 				for( var i = 0; i < related_artists_len; i++ ) {
 					console.log( related_artists_arr[ i ].name );
 					//jq.$related_artists.append( '<p>' + (i + 1) + ': ' + related_artists_arr[ i ].name + '</p>' );

 					fetchTopTracks( related_artists_arr[ i ].id );
 				}

 				if( callback !== undefined ) {
 					callback( response );
 				}
 			}
 		});
 	};

 	fetchTopTracks = function( artistId ){
 		$.ajax({
 			url: configMap.api_base + '/artists/' + artistId + '/top-tracks?country=US',

 			success: function( response ) {
 				var resp = response,
 					tracks = resp.tracks,
 					tracks_len = tracks.length,
 					i;

 				console.dir( tracks );
 				console.log( tracks[0].name );

 				jq.$top_related_tracks.append( '<li><strong>' + tracks[0].name + '</strong> <span><em>(' + tracks[0].artists[0].name + ')</em></span></li>' );

 				// for( i = 0; i < tracks_len; i++ ) {
 				// 	console.log( tracks[ i ].name );
 				// 	//jq.$top_related_tracks.append('<li>' + tracks[ i ].name + '</li>')
 				// }

 			}
 		});
 	};

 	initModule = function( $container ) {
 		console.log('INIT MODULE');

 		stateMap.$container = $container;

 		setJqueryMap();

 		// fetchTracks( '4Chn7XF8fzngf9GPfTMXLz', function( data ){
 		// 	console.log(' -- do something');
 		// 	console.log(data);
 		// });

		fetchArtist( '11FY888Qctoy6YueCpFkXT' );
 	};

 	return {
 		initModule : initModule
 	};
 })();

 $(function(){
 	srw.initModule( $('.srw') );
 });