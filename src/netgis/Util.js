var netgis = netgis || {};

/**
 * General Purpose Pure Static Utility Functions
 * 
 * @global
 * @memberof netgis
 */
netgis.util =
(
	function ()
	{
		"use strict";
		
		var isDefined = function( v )
		{
			return ( typeof v !== "undefined" );
		};
		
		var isObject = function( v )
		{
			if ( typeof v === "object" && ! Array.isArray( v ) && v !== null ) return true;
			
			return false;
		};
		
		var isString = function( v )
		{
			return ( typeof v === "string" || v instanceof String );
		};
		
		var isJSON = function( str, strict )
		{
			if ( strict === true )
			{
				// Strict Test (only accepts completly valid JSON)
				var val = ( typeof str !== "string" ) ? JSON.stringify( str ) : str;

				try
				{
					val = JSON.parse( val );
				}
				catch ( e )
				{
					return false;
				}

				return ( typeof val === "object" ) && ( val !== null );
			}
			else
			{
				// Very Basic Test (fast, but could be inaccurate)
				var trimmed = str.trim();
				var first = trimmed.charAt( 0 );
				var last = trimmed.charAt( trimmed.length - 1 );
				
				if ( first === '{' && last === '}' ) return true;
				if ( first === '[' && last === ']' ) return true;
				
				return false;
			}
		};
		
		var isMobile = function( container )
		{
			if ( ! container )
				return ( document.body.getBoundingClientRect().width < 600 );
			else
				return ( container.getBoundingClientRect().width < 600 );
		};
		
		var clone = function( obj )
		{
			return JSON.parse( JSON.stringify( obj ) );
		};
		
		var stringToID = function( str, seperator )
		{
			if ( ! seperator ) seperator = "-";
			
			// TODO: constant blacklist array of forbidden characters ?
			
			var id = str.trim();
			id = id.toLowerCase();
			
			id = this.replace( id, " ", seperator );
			id = this.replace( id, "\n", seperator );
			id = this.replace( id, "\t", seperator );
			id = this.replace( id, "\\.", seperator );
			id = this.replace( id, "\\,", seperator );
			id = this.replace( id, "\\!", seperator );
			id = this.replace( id, "\\?", seperator );
			id = this.replace( id, ":", seperator );
			id = this.replace( id, ";", seperator );
			id = this.replace( id, "\"", seperator );
			id = this.replace( id, "\'", seperator );
			id = this.replace( id, "\\§", seperator );
			id = this.replace( id, "\\$", seperator );
			id = this.replace( id, "\\%", seperator );
			id = this.replace( id, "\\&", seperator );
			id = this.replace( id, "\\/", seperator );
			id = this.replace( id, "\\\\", seperator );
			id = this.replace( id, "\\(", seperator );
			id = this.replace( id, "\\)", seperator );
			id = this.replace( id, "\\{", seperator );
			id = this.replace( id, "\\}", seperator );
			id = this.replace( id, "\\[", seperator );
			id = this.replace( id, "\\]", seperator );
			id = this.replace( id, "=", seperator );
			id = this.replace( id, "\\+", seperator );
			id = this.replace( id, "\\*", seperator );
			id = this.replace( id, "\\~", seperator );
			id = this.replace( id, "\\^", seperator );
			id = this.replace( id, "\\°", seperator );
			id = this.replace( id, "²", seperator );
			id = this.replace( id, "³", seperator );
			id = this.replace( id, "\\#", seperator );
			id = this.replace( id, "\\<", seperator );
			id = this.replace( id, "\\>", seperator );
			id = this.replace( id, "\\|", seperator );
			id = this.replace( id, "\\@", seperator );
			id = this.replace( id, "€", seperator );
			id = this.replace( id, "µ", seperator );
			
			id = this.trim( id, seperator );
			
			id = this.replace( id, "ä", "ae" );
			id = this.replace( id, "ö", "oe" );
			id = this.replace( id, "ü", "ue" );
			id = this.replace( id, "ß", "ss" );
			
			id = this.replace( id, "á", "a" );
			id = this.replace( id, "à", "a" );
			id = this.replace( id, "â", "a" );
			id = this.replace( id, "é", "e" );
			id = this.replace( id, "è", "e" );
			id = this.replace( id, "ê", "e" );
			id = this.replace( id, "í", "i" );
			id = this.replace( id, "ì", "i" );
			id = this.replace( id, "î", "i" );
			id = this.replace( id, "ó", "o" );
			id = this.replace( id, "ò", "o" );
			id = this.replace( id, "ô", "o" );
			id = this.replace( id, "ú", "u" );
			id = this.replace( id, "ù", "u" );
			id = this.replace( id, "û", "u" );
			
			return id;
		};
		
		/**
		 * Replace all string occurences.
		 * @param {String} str
		 * @param {String} find
		 * @param {String} newstr
		 * @returns {String}
		 */
		var replace = function( str, find, newstr )
		{
			return str.replace( new RegExp( find, "g" ), newstr );
		};
		
		var trim = function( str, char )
		{
			// NOTE: https://masteringjs.io/tutorials/fundamentals/trim
			
			str = str.replace( new RegExp( "^" + char + "+" ), "" );
			str = str.replace( new RegExp( char + "+$" ), "" );
			
			return str;
		};
		
		var foreach = function( obj, fn )
		{
			for ( var k in obj )
			{
				if ( obj.hasOwnProperty( k ) )
				{
					fn( k, obj[ k ] );
				}
			}
		};
		
		/**
		 * Replace template strings in html string.
		 * @param {type} html String with "{key}" placeholders.
		 * @param {type} data Object of key value pairs to insert.
		 * @returns {String} The modified html string.
		 */
		var template = function( html, data )
		{
			foreach
			(
				data,
				function( key, value )
				{
					html = html.replace( new RegExp( "{" + key + "}", "g" ), value );
				}
			);
	
			return html;
		};
		
		/**
		 * Create HTML element from string.
		 * @param {String} html
		 * @returns {Element}
		 */
		var create = function( html )
		{
			var temp = document.createElement( "tbody" );
			temp.innerHTML = html;
			
			return temp.children[ 0 ];
		};
		
		var insideElement = function( container, x, y )
		{
			var bounds = container.getBoundingClientRect();
			
			if ( x < bounds.left ) return false;
			if ( y < bounds.top ) return false;
			if ( x > bounds.right ) return false;
			if ( y > bounds.bottom ) return false;
			
			return true;
		};
		
		/**
		 * Replace new line characters with HTML line breaks.
		 * @param {String} str
		 * @returns {String}
		 */
		var newlines = function( str )
		{
			return str.replace( new RegExp( "\n", "g" ), "<br />" );
		};
		
		/**
		 * Calculate the byte size of an object.
		 * @param {Object} json
		 * @returns {Object} Object with size info ( bytes, kilobytes, megabytes )
		 */
		var size = function( json )
		{
			var bytes = new TextEncoder().encode( JSON.stringify( json ) ).length;
			var kilobytes = bytes / 1024;
			var megabytes = kilobytes / 1024;
			
			return { bytes: bytes, kilobytes: kilobytes, megabytes: megabytes };
		};
		
		/**
		 * Send async GET request.
		 * @param {String} url
		 * @param {function} callback
		 */
		var request = function( url, callback, requestData, request )
		{
			// NOTE: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials
			
			var request = new XMLHttpRequest();
			if ( requestData ) request._requestData = requestData;
			
			request.onload = function() { callback( this.responseText, this._requestData, this ); };
			request.withCredentials = false;
			request.open( "GET", url, true );
			request.send();
			
			return request;
		};
		
		var downloadJSON = function( exportObj, exportName )
		{
			var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent( JSON.stringify( exportObj ) );
			
			var downloadAnchorNode = document.createElement( 'a' );
			downloadAnchorNode.setAttribute( "href", dataStr );
			downloadAnchorNode.setAttribute( "download", exportName );
			document.body.appendChild( downloadAnchorNode );
			
			downloadAnchorNode.click();
			downloadAnchorNode.remove();
		};
		
		/**
		 * Pad string with leading zeros.
		 * @param {String} s The string to pad.
		 * @param {Integer} n Minimum number of digits.
		 * @returns {String} The padded string.
		 */
		var padstr = function( s, n )
		{
			var o = s.toString();
			while ( o.length < n ) o = "0" + o;
			
			return o;
		};
		
		/**
		 * Merge object properties.
		 * @param {Object} target Merged object properties will be written to this.
		 * @param {Object} other The object to append to the target object.
		 * @returns {Object} The modified target object.
		 */
		var merge = function( target, other )
		{
			return Object.assign( target, other );
		};
		
		/**
		 * @param {Boolean} ymd If true format to YYYYMMDD_HHMMSS, pretty locale otherwise
		 * @returns {String} Formatted Date Time String (German Locale)
		 */
		var getTimeStamp = function( ymd )
		{
			var timestamp;
			var date = new Date();
			
			if ( ymd === true )
			{
				var yyyy = date.getFullYear();
				var mm = date.getMonth() + 1;
				var dd = date.getDate();
				var hh = date.getHours();
				var mi = date.getMinutes();
				var ss = date.getSeconds();
				
				if ( mm < 10 ) mm = "0" + mm;
				if ( dd < 10 ) dd = "0" + dd;
				if ( hh < 10 ) hh = "0" + hh;
				if ( mi < 10 ) mi = "0" + mi;
				if ( ss < 10 ) ss = "0" + ss;
				
				timestamp = [ yyyy, mm, dd, "_", hh, mi, ss ].join( "" );
			}
			else
			{
				timestamp = date.getDate() + "." + ( date.getMonth() + 1 ) + "." + date.getFullYear();
				timestamp += " " + date.getHours() + ":" + date.getMinutes();
			}
			
			return timestamp;
		};
		
		/**
		 * @returns {String} The users language locale string (defaults to German)
		 */
		var getUserLanguage = function()
		{
			var lang = navigator.language || "de-DE";
			
			return lang;
		};
		
		/**
		 * @param {String} path
		 * @returns {String} file extension or empty string if none found
		 */
		var getFileExtension = function( path )
		{
			var parts = path.split( "." );
			return ( parts.length <= 1 ) ? "" : parts[ parts.length - 1 ];
		};
		
		var parseURL = function( url )
		{
			// Get Base URL
			var qmark = url.indexOf( "?" );
			var baseURL = ( qmark > -1 ) ? url.substr( 0, qmark ) : url;

			// Get Params
			var params = [];

			if ( qmark > -1 )
			{
				// Existing Params
				var parts = url.substr( qmark + 1 );
				parts = parts.split( "&" );

				for ( var p = 0; p < parts.length; p++ )
				{
					var part = parts[ p ];
					part = part.toLowerCase();

					//if ( part.search( "service" ) > -1 ) { params.push( part ); continue; }
					//if ( part.search( "version" ) > -1 ) { params.push( part ); continue; }
					if ( part.search( "request" ) > -1 ) { continue; }

					params.push( part );
				}
			}
		   
			return { base: baseURL, parameters: params };
		};
		
		var formatDistance = function( distance )
		{
			var output;
			
			if ( distance > 100 )
				output = ( Math.round( distance / 1000 * 100 ) / 100 ) + " km";
			else
				output = ( Math.round( distance * 100 ) / 100 ) + " m";
			
			return output;
		};
		
		var formatLength = function( len, decimals )
		{
			var output;
			
			// Normal / Large Value
			var threshold = 1000;
			var large = ( len > threshold );
			
			// Round Value
			var i = 0;
			
			if ( large )
			{
				var METERS_PER_KILOMETER = 1000;
				
				if ( decimals )
					i = Math.round( len / METERS_PER_KILOMETER * 1000 ) / 1000;
				else
					i = Math.round( len / METERS_PER_KILOMETER );
			}
			else
			{
				if ( decimals )
					i = Math.round( len * 100 ) / 100;
				else
					i = Math.round( len );
			}
			
			if ( i === 0 ) large = false;
			
			// Thousands Seperators
			/*seperate = seperate || false;
			if ( seperate ) i = i.toLocaleString( getUserLanguage() );*/
			
			// Build String
			output = i + ( large ? " km" : " m" );
			
			// NOTE: HTML Superscript / Unicode (&sup2; etc.) not supported in OL Labels
			
			return output;
		};
		
		/*
		 * @param {Number} area Raw Area in Square Meters
		 * @param {Boolean} decimals Output Rounded Decimals
		 * @param {Number} threshold Threshold for normal (square meters) vs. large (square kilometers) values
		 * @param {Boolean} seperate Use thousands seperators
		 * @returns {String} Formatted Area String (Square Meters/Square Kilometers)
		 */
		var formatArea = function( area, decimals, threshold, seperate )
		{
			var output;
			
			// Normal / Large Value
			threshold = threshold || 100000;
			var large = ( area > threshold );
			
			// Round Value
			var i = 0;
			
			if ( large )
			{
				var METERS_PER_KILOMETER = 1000000;
				
				if ( decimals )
					i = Math.round( area / METERS_PER_KILOMETER * 1000 ) / 1000;
				else
					i = Math.round( area / METERS_PER_KILOMETER );
			}
			else
			{
				if ( decimals )
					i = Math.round( area * 100 ) / 100;
				else
					i = Math.round( area );
			}
			
			if ( i === 0 ) large = false;
			
			// Thousands Seperators
			seperate = seperate || true;
			if ( seperate ) i = i.toLocaleString( getUserLanguage() );
			
			// Build String
			output = i + ( large ? " km²" : " m²" );
			
			// NOTE: HTML Superscript / Unicode (&sup2; etc.) not supported in OL Labels
			
			return output;
		};
		
		var hexToRGB = function( hex )
		{
			if ( hex.charAt( 0 ) === "#" ) hex = hex.substr( 1 );
				
			var i = Number.parseInt( hex, 16 );
			
			var rgb =
			[
				( i >> 16 ) & 255,
				( i >> 8 ) & 255,
				i & 255
			];
			
			return rgb;
		};
		
		var invoke = function( src, type, params )
		{
			src.dispatchEvent( new CustomEvent( type, { bubbles: true, detail: params } ) );
		};
		
		/**
		 * Returns a default unbound event handler / callback function.
		 * @param {netgis.Events} type
		 * @param {Object} params
		 * @returns {Function}
		 */
		var handler = function( type, params )
		{
			return function( e )
			{
				if ( ! params ) params = e;
				netgis.util.invoke( this, type, params );
			};
		};

		// Public Interface
		var iface =
		{
			isDefined: isDefined,
			isObject: isObject,
			isString: isString,
			isJSON: isJSON,
			isMobile: isMobile,
			clone: clone,
			stringToID: stringToID,
			replace: replace,
			trim: trim,
			foreach: foreach,
			template: template,
			newlines: newlines,
			create: create,
			insideElement: insideElement,
			size: size,
			request: request,
			downloadJSON: downloadJSON,
			padstr: padstr,
			merge: merge,
			getTimeStamp: getTimeStamp,
			getUserLanguage: getUserLanguage,
			getFileExtension: getFileExtension,
			parseURL: parseURL,
			formatDistance: formatDistance,
			formatLength: formatLength,
			formatArea: formatArea,
			hexToRGB: hexToRGB,
			invoke: invoke,
			handler: handler
		};

		return iface;
	}
)();