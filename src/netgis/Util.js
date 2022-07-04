var netgis = netgis || {};

/**
 * General purpose pure static utility functions.
 */
netgis.util =
(
	function ()
	{
		"use strict";
		
		// Methods
		var isDefined = function( v )
		{
			return ( typeof v !== "undefined" );
		};
		
		var isString = function( v )
		{
			return ( typeof v === "string" || v instanceof String );
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
			// Get Template: $( "#template-" + name ).text();
			
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
		var request = function( url, callback )
		{
			var request = new XMLHttpRequest();
			request.onload = function() { callback( this.responseText ); };
			request.open( "GET", url, true );
			request.send();
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

		// Public Interface
		var iface =
		{
			isDefined: isDefined,
			isString: isString,
			replace: replace,
			foreach: foreach,
			template: template,
			newlines: newlines,
			create: create,
			size: size,
			request: request,
			padstr: padstr,
			merge: merge
		};

		return iface;
	}
)();