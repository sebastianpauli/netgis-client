var netgis = netgis || {};

/**
 * OWS Context Parsing Module.
 * @param {JSON} config [OWS.Config]{@link netgis.OWS.Config}
 * @constructor
 * @memberof netgis
 */
netgis.OWS =
(
	// TODO: work in progress

	function ()
	{
		"use strict";

		// Variables

		// Methods
		var read = function( json, client )
		{
			console.info( "OWS READ:", json );
			
			// Properties
			var properties = json[ "properties" ];
			readProperties( properties );
			
			// Features
			var features = json[ "features" ];
			
			for ( var f = 0; f < features.length; f++ )
			{
				var feature = features[ f ];
				
				console.info( "OWS FEATURE:", f, feature );
				readFeature( feature );
			}
		};
		
		var readProperties = function( properties )
		{
			console.info( "OWS PROPS:", properties );
		};
		
		var readFeature = function( feature )
		{
			var props = feature[ "properties" ];

			switch ( feature[ "type" ] )
			{
				case "Feature":
				{
					var title = props[ "title" ];
					var abstract = props[ "abstract" ];
					var folder = props[ "folder" ];

					var minScale = props[ "minScaleDenominator" ];
					var maxScale = props[ "maxScaleDenominator" ];

					console.info( "TITLE:", title, "FOLDER:", folder );
					console.info( "MIN/MAX SCALE:", minScale, maxScale );
					
					var offerings = props[ "offerings" ];
					
					for ( var o = 0; o < offerings.length; o++ )
					{
						var offering = offerings[ o ];
						
						console.info( "OFFERING:", o, offering );
						readOffering( offering );
					}

					break;
				}
				
				default:
				{
					console.error( "OWS: unknown feature type '" + feature[ "type" ] + "'", feature );
					break;
				}
			}
		};
		
		var readOffering = function( offering )
		{
			var code = offering[ "code" ];
			var content = offering[ "content" ];
			
			switch ( code )
			{
				// KML
				case "http://www.opengis.net/spec/owc-atom/1.0/req/kml":
				{
					for ( var c = 0; c < content.length; c++ )
					{
						var contentItem = content[ c ];
						
						switch ( contentItem[ "type" ] )
						{
							// KML
							case "application/vnd.google-earth.kml+xml":
							{
								var kml = contentItem[ "content" ];
								
								// TODO: add kml layer
								
								break;
							}
							
							default:
							{
								console.error( "OWS: unknown offering content type '" + contentItem[ "type" ] + "'", contentItem );
								break;
							}
						}
					}
					
					break;
				}
				
				default:
				{
					console.error( "OWS: unknown offering code '" + code + "'", offering );
					break;
				}
			}
		};

		// Public Interface
		var iface =
		{
			read: read
		};

		return iface;
	}
)();