var netgis = netgis || {};

netgis.OWS =
(
	function ()
	{
		"use strict";

		// Variables

		// Methods
		var read = function( json, client )
		{
			var config =
			{
				layers: [],
				folders: []
			};
			
			// Properties
			if ( netgis.util.isDefined( json.properties ) )
			{
				// BBox
				var bbox = json.properties.bbox;

				/*if ( netgis.util.isDefined( bbox ) )
				{
					client.invoke( netgis.Events.MAP_SET_EXTENT, { minx: bbox[ 0 ], miny: bbox[ 1 ], maxx: bbox[ 2 ], maxy: bbox[ 3 ] } );
				}*/
				
				config.bbox = bbox;
			}
			
			// Folders
			var features = json.features;
			
			for ( var i = 0; i < features.length; i++ )
			{
				var feature = features[ i ];

				if ( feature.type === "Feature" )
				{
					// Feature Properties
					var props = feature.properties;
					var path = props.folder;
					
					// Check Existing					
					var found = false;
					
					for ( var f = 0; f < config.folders.length; f++ )
					{
						if ( config.folders[ f ].id === path )
						{
							found = true;
							break;
						}
					}
					
					if ( found ) continue;
					
					// Path Parts
					var partsRaw = path.split( "/" );
					var parts = [];
					
					for ( var p = 0; p < partsRaw.length; p++ )
					{
						var part = partsRaw[ p ];
						if ( part.length > 0 ) parts.push( part );
					}
					
					// Find Parent
					var parent = -1;
					
					for ( var p = 0; p < parts.length; p++ )
					{
						var part = parts[ p ];
						var partpath = "/" + parts.slice( 0, p + 1 ).join( "/" );
						
						// Existing Folder
						var exists = false;
						
						for ( var f = 0; f < config.folders.length; f++ )
						{
							if ( config.folders[ f ].path === partpath )
							{
								parent = f;
								exists = true;
								break;
							}
						}
						
						if ( exists ) continue;
						
						// Create New Folder
						var index = config.folders.length;
						
						config.folders.push
						(
							{
								title: part,
								parent: parent,
								path: partpath
							}
						);
				
						parent = index;
					}
				}
			}
			
			// Features / Layers			
			for ( var i = 0; i < features.length; i++ )
			{
				var feature = features[ i ];

				if ( feature.type === "Feature" )
				{
					//TODO: refactor to read feature function

					// Feature Properties
					var props = feature.properties;
					
					// Folder
					var folderIndex = -1;
								
					for ( var f = 0; f < config.folders.length; f++ )
					{
						if ( config.folders[ f ].path === props.folder )
						{
							folderIndex = f;
							break;
						}
					}

					// Offerings
					var offers = props.offerings;

					for ( var o = 0; o < offers.length; o++ )
					{
						var offer = offers[ o ];
						
						// Operationos
						var ops = offer.operations;

						// Types
						switch ( offer.code )
						{
							// WMS
							case "http://www.opengis.net/spec/owc-geojson/1.0/req/wms":
							{
								var getCaps = ops[ 0 ];
								var url = getCaps.href;
								
								config.layers.push
								(
									{
										folder: folderIndex,
										type: netgis.LayerTypes.WMS,
										url: url,
										title: props.title,
										attribution: props.rights,
										active: props.active
									}
								);
								
								break;
							}
							
							// XYZ
							case "http://www.opengis.net/spec/owc-geojson/1.0/req/xyz":
							{
								var getTile = ops[ 0 ];
								
								config.layers.push
								(
									{
										folder: folderIndex,
										type: netgis.LayerTypes.XYZ,
										url: getTile.href,
										title: props.title,
										attribution: props.rights,
										active: props.active
									}
								);

								break;
							}

							// OSM / XYZ
							case "http://www.opengis.net/spec/owc-geojson/1.0/req/osm":
							{
								// Operations
								/*for ( var oi = 0; oi < ops.length; oi++ )
								{
									var op = ops[ oi ];

									switch ( op.code )
									{
										case ""
									}
								}*/

								var getTile = ops[ 0 ];
								
								config.layers.push
								(
									{
										folder: folderIndex,
										type: netgis.LayerTypes.XYZ,
										url: getTile.href,
										title: props.title,
										attribution: props.rights,
										active: props.active
									}
								);

								break;
							}
						}
					}

				}
				
			} // end for each feature
			
			client.invoke( netgis.Events.CONTEXT_UPDATE, config );
		};

		// Public Interface
		var iface =
		{
			read: read
		};

		return iface;
	}
)();