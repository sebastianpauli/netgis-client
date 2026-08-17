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
	"layers_url": "",
	
	/**
	 * Sets loaded WMC layers to be removable in the Layer Tree.
	 * @type Boolean
	 */
	"layers_removable": false
};

netgis.WMC.prototype.requestContext = function( url, callback )
{
	this.callback = callback;
	netgis.util.request( url, this.onContextResponse.bind( this ) );
};

netgis.WMC.prototype.onContextResponse = function( data )
{
	// Response JSON
	if ( ! netgis.util.isJSON( data ) )
	{
		console.error( "could not parse WMC response:", data );
		if ( this.callback ) this.callback( { config: null } );
		return;
	}
	
	var json = JSON.parse( data );
	
	// Store Export WMC Data
	this.exportData = json;
	
	// Layers
	var layerIDs = [];
	var layerList = json[ "layerList" ];
	
	if ( layerList )
	{
		for ( var i = 0; i < layerList.length; i++ )
		{
			var layer = layerList[ i ];
			layerIDs.push( layer[ "layerId" ] );
		}
	}
	
	console.info( "Layer IDs:", layerIDs );
	
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
	
	// Store Call Meta Data
	this.metaData = json;
	
	console.info( "WMC Export Data:", this.exportData );
	console.info( "WMC Meta Data:", this.metaData );
	
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
	var wmc = this.exportData[ "wmc" ];
	var layerList = this.exportData[ "layerList" ];
	
	var cfg = ( this.config && this.config[ "wmc" ] ) ? this.config[ "wmc" ] : null;
	
	var defaultFormat = "image/png";
	var defaultRemovable = ( cfg && cfg[ "layers_removable" ] === true );
	
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
	
	// Layer Tree
	var folders = config[ "folders" ] = [];
	var layers = config[ "layers" ] = [];
	
	// Top Folders
	for ( var i = layerList.length - 1; i >= 0; i-- )
	{
		var layer = layerList[ i ];
		
		if ( layer[ "layerParent" ] === null )
		{
			var meta = this.getLayerMetaData( layer[ "layerId" ] );
			
			if ( meta )
			{
				var folder =
				{
					parent: null,

					id: layer[ "layerId" ],
					title: layer[ "layerId" ],

					removable: defaultRemovable,

					data: { order: layerList.length - i }

					//open: ( service[ "isopen" ] === "1" )
				};

				////var meta = this.getLayerMetaData( layer[ "layerId" ] );

				////if ( meta )
				{
					folder.title = meta[ "title" ];
				}

				folders.push( folder );
			}
			else
			{
				// No Folder But Top Level Layer
				/*
				var layer =
				{
					folder: null,

					id: layer[ "layerId" ],
					title: child[ "title" ],

					active: ex[ "active" ],
					query: ( ex[ "layerQueryable" ] === 1 ),
					transparency: ( 1.0 - ex[ "opacity" ] * 0.01 ),

					type: netgis.LayerTypes.WMS,
					url: this.getLayerMapURL( child[ "id" ] ),
					name: child[ "name" ],

					format: defaultFormat, // TODO: meta layer "downloadOptions" "format" ?
					bbox: bbox,

					removable: defaultRemovable,

					data: { order: this.getLayerExportData( child[ "id" ] )[ "layerPos" ] }
				};

				//console.info( "LAYER:", i, j, ex, meta, "=>", layer );

				layers.push( layer );
				*/
			}
		}
	}
	
	// Sub Folders
	var adds = [];
	var tops = [];
	
	for ( var i = 0; i < folders.length; i++ )
	{
		var folder = folders[ i ];
		var meta = this.getLayerMetaData( folder.id );
		
		//console.info( "SUB META:", i, folder.id, meta );
		
		if ( ! meta ) { console.error( "no metadata found for sub folder", folder.id ); continue; }
		else
		{
			// No Folder But Top Level Layer
			////tops.push( folder.id );
		}
		
		var children = meta[ "layer" ];
		
		if ( ! children ) { console.error( "sub folder without children", folder.id ); continue; }
		
		//for ( var j = 0; j < children.length; j++ )
		for ( var j = children.length - 1; j >= 0; j-- )
		{
			var child = children[ j ];
			
			// Skip Child Layers
			if ( ! child[ "layer" ] || child[ "layer" ].length === 0 ) continue;
			
			var sub =
			{
				parent: folder.id,
				
				id: child[ "id" ],
				title: child[ "title" ],
				
				removable: defaultRemovable,
				
				data: { order: this.getLayerExportData( child[ "id" ] )[ "layerPos" ] }
			};
			
			//console.info( "SUB FOLDER:", i, j, child, this.getLayerExportData( child[ "id" ] ), "->", sub );
	
			adds.push( sub );
		}
	}
	
	for ( var i = 0; i < adds.length; i++ )
	{
		folders.push( adds[ i ] );
	}
	
	// Layer Items
	for ( var i = 0; i < folders.length; i++ )
	{
		var folder = folders[ i ];
		var meta = this.getLayerMetaData( folder.id );
		
		if ( ! meta ) { console.error( "no metadata found for layer folder", folder.id ); continue; }
		
		var children = meta[ "layer" ];
		
		if ( ! children ) { console.error( "layer folder without children", folder.id ); continue; }
		
		//for ( var j = 0; j < children.length; j++ )
		for ( var j = children.length - 1; j >= 0; j-- )
		{
			var child = children[ j ];
			
			//console.info( "CHILD LAYER:", i, j, child );
			
			// Skip Folder Layers
			if ( child[ "layer" ] && child[ "layer" ].length > 0 ) continue;
			
			// Create Layer Item
			var ex = this.getLayerExportData( child[ "id" ] );
			
			var bbox = child[ "bbox" ];
	
			if ( bbox )
			{
				bbox = bbox.split( "," );
				for ( var k = 0; k < bbox.length; k++ )
					bbox[ k ] = Number.parseFloat( bbox[ k ] );
			}
			
			var layer =
			{
				folder: folder.id,
				
				id: child[ "id" ],
				title: child[ "title" ],

				active: ex[ "active" ],
				query: ( ex[ "layerQueryable" ] === 1 ),
				transparency: ( 1.0 - ex[ "opacity" ] * 0.01 ),
				
				type: netgis.LayerTypes.WMS,
				url: this.getLayerMapURL( child[ "id" ] ),
				name: child[ "name" ],
				
				format: defaultFormat, // TODO: meta layer "downloadOptions" "format" ?
				bbox: bbox,
				
				removable: defaultRemovable,
				
				data: { order: this.getLayerExportData( child[ "id" ] )[ "layerPos" ] }
			};
			
			//console.info( "LAYER:", i, j, ex, meta, "=>", layer );
			
			layers.push( layer );
		}
	}
	
	// Layer Order
	var self = this;
	
	layers.sort
	(
		function( a, b )
		{
			var ida = a[ "id" ];
			var idb = b[ "id" ];

			var da = self.getLayerExportData( ida );
			var db = self.getLayerExportData( idb );
			
			var pa = da[ "layerPos" ];
			var pb = db[ "layerPos" ];
			
			// RLP: order/layerPos = top -> bottom = 1,2,...
			// SL: order/layerPos = bottom -> top = 1,2,...

			if ( ! cfg[ "layers_inverse" ] )
			{
				if ( pa < pb ) return -1;
				if ( pa > pb ) return 1;
			}
			else
			{
				if ( pa < pb ) return 1;
				if ( pa > pb ) return -1;
			}

			return 0;
		}
	);
	
	// Layer Order
	var order = 1000 + layerList.length;
	
	for ( var i = 0; i < layerList.length; i++ )
	{
		var item = layerList[ i ];
		var id = item[ "layerId" ].toString();
		
		for ( var j = 0; j < layers.length; j++ )
		{
			var layer = layers[ j ];
			if ( layer.id !== id ) continue;
			layer.order = order - i;
		}
	}
	
	// Done
	return config;
};

netgis.WMC.prototype.getLayerExportData = function( id )
{
	var list = this.exportData[ "layerList" ];
	
	for ( var i = 0; i < list.length; i++ )
	{
		var item = list[ i ];
		
		// Expecting String IDs
		if ( item[ "layerId" ].toString() === id ) return item;
	}
	
	return null;
};

netgis.WMC.prototype.getLayerMetaData = function( id, list )
{
	if ( ! list ) list = this.metaData[ "wms" ][ "srv" ];
	
	for ( var i = 0; i < list.length; i++ )
	{
		var item = list[ i ];
		
		// Recursion
		if ( item[ "layer" ] )
		{
			var sub = this.getLayerMetaData( id, item[ "layer" ] );
			if ( sub ) return sub;
		}
		
		if ( item[ "id" ] === id ) return item;
	}
	
	return null;
};

netgis.WMC.prototype.getLayerMapURL = function( id, list, result )
{
	if ( ! list ) list = this.metaData[ "wms" ][ "srv" ];
	
	for ( var i = 0; i < list.length; i++ )
	{
		var item = list[ i ];
		
		if ( item[ "getMapUrl" ] && item[ "getMapUrl" ] !== "" )
		{
			result = item[ "getMapUrl" ];
		}
		
		// Recursion
		if ( item[ "layer" ] )
		{
			var sub = this.getLayerMapURL( id, item[ "layer" ], result );
			if ( sub ) return sub;
		}
		
		if ( item[ "id" ] === id ) return result;
	}
	
	return null;
};