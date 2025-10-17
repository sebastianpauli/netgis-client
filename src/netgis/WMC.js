"use strict";

var netgis = netgis || {};

/**
 * Web Map Context Parsing Module.
 * @param {JSON} config [WMC.Config]{@link netgis.WMC.Config}
 * @constructor
 * @memberof netgis
 */
netgis.WMC = function( config )
{
	// TODO: work in progress
	
	this.config = config;
};

/**
 * Config Section "wmc"
 * @memberof netgis.WMC
 * @enum
 */
netgis.WMC.Config =
{
	/**
	 * URL to a WMC document to load at startup.
	 * Should contain a <code>{id}</code> placeholder.
	 * @type String
	 */
	"url": "",
	
	/**
	 * URL to a service for delivering WMC layers in JSON format.
	 * Should contain a <code>{ids}</code> placeholder.
	 * @type String
	 */
	"layers_url": ""
};

// NOTE: https://www.geoportal.rlp.de/mapbender/extensions/mobilemap2/index.html?wmc_id=27581

netgis.WMC.prototype.requestContext = function( url, callback )
{
	this.callback = callback;
	netgis.util.request( url, this.onContextResponse.bind( this ) );
};

netgis.WMC.prototype.onContextResponse = function( data )
{
	var json = JSON.parse( data );
	
	this.data = json;
	
	// Layers
	var layerIDs = [];
	var layerList = json[ "layerList" ];
	
	for ( var i = 0; i < layerList.length; i++ )
	{
		var layer = layerList[ i ];
		layerIDs.push( layer[ "layerId" ] );
	}
	
	this.requestLayers( layerIDs );
};

netgis.WMC.prototype.requestLayers = function( ids )
{
	var cfg = this.config[ "wmc" ];
	
	if ( ! cfg )
	{
		console.error( "no config[ 'wmc' ] found, skipping WMC layer loading" );
		return;
	}
	
	var url = cfg[ "layers_url" ];
	url = netgis.util.replace( url, "{ids}", ids.join( "," ) );
	
	netgis.util.request( url, this.onLayersResponse.bind( this ) );
};

netgis.WMC.prototype.onLayersResponse = function( data )
{
	var json = JSON.parse( data );
	
	this.layers = json;
	console.info( "WMC Layers Response:", json );
	
	// Done Loading
	if ( this.callback )
	{
		// TODO: merge context response config with base client config ?
		
		this.callback( { config: this.toConfig() } );
	}
};

netgis.WMC.prototype.toConfig = function()
{
	// Input Data
	var wmc = this.data[ "wmc" ];
	var layerList = this.data[ "layerList" ];
	var services = this.layers[ "wms" ][ "srv" ];
	
	// Build Config
	var config = {};
	
	// Base Config	
	var bbox = wmc[ "bbox" ];
	bbox = bbox.split( "," );
	for ( var i = 0; i < bbox.length; i++ ) bbox[ i ] = Number.parseFloat( bbox[ i ] );
	
	config[ "map" ] =
	{
		"projection": wmc[ "crs" ],
		"bbox": bbox
	};
	
	if ( ! config[ "attribution" ] ) config[ "attribution" ] = {};
	
	if ( config[ "attribution" ][ "prefix" ] )
		config[ "attribution" ][ "prefix" ] = wmc[ "title" ] + ", " + config[ "attribution" ][ "prefix" ];
	else
		config[ "attribution" ][ "prefix" ] = wmc[ "title" ];
	
	// Layers
	var folders = config[ "folders" ] = [];
	var layers = config[ "layers" ] = [];
	
	// Parse Service Layers
	this.parseServiceLayers( services, layerList, folders, layers );
	
	// Set Layer Order
	var order = 1000;
	
	for ( var f = 0; f < folders.length; f++ )
	{
		var folder = folders[ f ];
		
		for ( var l = layers.length - 1; l >= 0; l-- )
		{
			var layer = layers[ l ];
			
			if ( layer.folder !== folder.id ) continue;
				
			layer.order = order;
			order += 1;
		}
	}
	
	// Done
	return config;
};

netgis.WMC.prototype.parseServiceLayers = function( srv, layerList, folders, layers )
{
	if ( ! folders ) folders = [];
	if ( ! layers ) layers = [];
	
	for ( var s = 0; s < srv.length; s++ )
	{
		var service = srv[ s ];
		
		// Service Layers
		for ( var l = 0; l < service[ "layer" ].length; l++ )
		{	
			var layer = service[ "layer" ][ l ];
			
			if ( layer[ "isRoot" ] )
			{
				// Service Folder
				var folder =
				{
					id: layer[ "id" ],
					title: layer[ "title" ],
					open: ( service[ "isopen" ] === "1" )
				};

				folders.push( folder );
			}
			
			// Child Layers
			var serviceLayers = layer[ "layer" ];
			
			if ( serviceLayers )
			{
				// Sort By Position
				if ( layerList )
				{
					serviceLayers.sort
					(
						function( a, b )
						{
							var ida = a[ "id" ];
							var idb = b[ "id" ];

							var la = null;
							var lb = null;

							for ( var i = 0; i < layerList.length; i++ )
							{
								var layer = layerList[ i ];
								if ( layer[ "layerId" ].toString() === ida ) la = layer;
								if ( layer[ "layerId" ].toString() === idb ) lb = layer;
							}

							var va = la[ "layerPos" ];
							var vb = lb[ "layerPos" ];

							if ( va < vb ) return -1;
							if ( va > vb ) return 1;

							return 0;
						}
					);
				}
				
				for ( var i = serviceLayers.length - 1; i >= 0; i-- )
				{
					var child = serviceLayers[ i ];
					var cid = child[ "id" ];
					var meta = null;
					
					if ( layerList )
					{
						for ( var m = 0; m < layerList.length; m++ )
						{
							if ( layerList[ m ][ "layerId" ].toString() === cid )
							{
								meta = layerList[ m ];
								break;
							}
						}
					}
					
					var item = this.parseServiceLayer( cid, service, layer[ "id" ], child, meta );

					layers.push( item );
				}
			}
		}
	}
	
	return { folders: folders, layers: layers };
};

netgis.WMC.prototype.parseServiceLayer = function( id, service, folder, serviceLayer, meta )
{
	var defaultOrder = 1000;
	
	var item =
	{
		id: id,
		folder: folder,
		title: serviceLayer[ "title" ],

		active: meta ? meta[ "active" ] : true,
		query: ( serviceLayer[ "queryable" ] === 1 ),
		transparency: meta ? ( 1.0 - meta[ "opacity" ] * 0.01 ) : 0.0,
		order: defaultOrder,

		type: netgis.LayerTypes.WMS,
		url: service[ "getMapUrl" ],
		name: serviceLayer[ "name" ],
		format: meta ? meta[ "currentFormat" ] : "image/png"
	};
	
	return item;
};

netgis.WMC.prototype.parseLayer = function( layer, parentID, items )
{
	var item = null;
			
	for ( var k = 0; k < items.length; k++ )
	{
		if ( items[ k ].id === Number.parseInt( layer[ "id" ] ) ) // NOTE: assuming integer ids
		{
			item = items[ k ];
			break;
		}
	}

	if ( ! item )
	{
		item =
		{
			id: Number.parseInt( layer[ "id" ] ),
			type: "layer"
		};
		
		items.push( item );
	}

	item.title = layer[ "title" ];
	item.name = layer[ "name" ];
	item.parent = parentID;
	
	if ( layer[ "getLegendGraphicUrl" ] && layer[ "getLegendGraphicUrlFormat" ] )
	{
		item.legendURL = layer[ "getLegendGraphicUrl" ];
		item.legendFormat = layer[ "getLegendGraphicUrlFormat" ];
	}	

	if ( layer[ "legendUrl" ] )
	{
		item.legendURL = window.decodeURIComponent( layer[ "legendUrl" ] );
		item.legendFormat = layer[ "getLegendGraphicUrlFormat" ];
	}

	if ( layer[ "layerQueryable" ] === 1 || layer[ "queryable" ] === 1 ) // NOTE: these two props should have the same name !
		item.queryable = true;
	else
		item.queryable = false;

	if ( layer.bbox )
	{
		var bbox = layer.bbox.split( "," );

		for ( var i = 0; i < bbox.length; i++ )
			bbox[ i ] = parseFloat( bbox[ i ] );

		item.bbox = [ bbox[ 0 ], bbox[ 1 ], bbox[ 2 ], bbox[ 3 ] ];
	}
	
	return item;
};