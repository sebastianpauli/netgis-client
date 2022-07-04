var netgis = netgis || {};

//NOTE: https://portal.ogc.org/files/?artifact_id=22364 p. 53

netgis.SLD =
(
	function ()
	{
		"use strict";

		// Variables

		// Methods
		var read = function( data, client )
		{
			var parser = new DOMParser();
			var xml = parser.parseFromString( data, "text/xml" );
			
			var style = {};
			
			// Layers
			var layers = xml.getElementsByTagName( "NamedLayer" );
			
			for ( var i = 0; i < layers.length; i++ )
			{
				var layer = layers[ i ];
				var name = layer.getElementsByTagName( "se:Name" )[ 0 ].innerHTML;
				
				console.info( "Layer:", name );
				
				// Type Styles
				var typestyles = layer.getElementsByTagName( "se:FeatureTypeStyle" );
				
				for ( var j = 0; j < typestyles.length; j++ )
				{
					var typestyle = typestyles[ j ];
					
					// Rules
					var rules = typestyle.getElementsByTagName( "se:Rule" );
					
					for ( var k = 0; k < rules.length; k++ )
					{
						var rule = rules[ k ];
						var rulename = rule.getElementsByTagName( "se:Name" )[ 0 ].innerHTML;
						
						console.info( "Rule:", rulename );
						
						// Polygon Symbolizer
						var polysymbol = rule.getElementsByTagName( "se:PolygonSymbolizer" )[ 0 ];
						var polyfill = polysymbol.getElementsByTagName( "se:Fill" )[ 0 ];
						var polystroke = polysymbol.getElementsByTagName( "se:Stroke" )[ 0 ];
						
						style[ "polygon" ] =
						{
							//fill: polyfill.getElementsByTagName( "se:SvgParameter" )
							fill: polyfill.querySelector( "[name='fill']" ).innerHTML,
							stroke: polystroke.querySelector( "[name='stroke']" ).innerHTML,
							strokeWidth: Number.parseFloat( polystroke.querySelector( "[name='stroke-width']" ).innerHTML )
						};
					}
				}
			}
			
			console.info( "SLD:", style );
			
			client.invoke( netgis.Events.MAP_UPDATE_STYLE, style );
			
			return style;
		};

		// Public Interface
		var iface =
		{
			read: read
		};

		return iface;
	}
)();