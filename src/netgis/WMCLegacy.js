"use strict";

var netgis = netgis || {};

/**
 * Web Map Context Parsing Module.
 * @param {JSON} config [WMC.Config]{@link netgis.WMC.Config}
 * @constructor
 * @memberof netgis
 */
netgis.WMCLegacy = function( config )
{
	// TODO: work in progress
	
	this.config = config;
	
	this.output = { extent: null, entities: [] };
};

/**
 * Config Section "wmc"
 * @memberof netgis.WMC
 * @enum
 */
netgis.WMCLegacy.Config =
{
	/**
	 * Enable legacy WMC parsing logic ported from "mobilemap2" client.
	 * @type Boolean
	 */
	"legacy_mode": true,
	
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

netgis.WMCLegacy.prototype.requestContext = function( url, callback )
{
	this.callback = callback;
	netgis.util.request( url, this.onContextResponse.bind( this ) );
};

netgis.WMCLegacy.prototype.onContextResponse = function( data )
{
	// Response JSON
	if ( ! netgis.util.isJSON( data ) )
	{
		console.error( "could not parse WMC response:", data );
		if ( this.callback ) this.callback( { config: null, output: {} } );
		return;
	}
	
	data = JSON.parse( data );
	
	console.info( "WMC RESPONSE:", data );
	
	// Begin Legacy Code
	
	// WMC Extent
	var bbox = data.wmc.bbox;

	if ( bbox && bbox !== "" && bbox !== ",,," )
	{
		bbox = bbox.split( "," );
		
		for ( var b = 0; b < bbox.length; b++ )
		{
			bbox[ b ] = Number.parseFloat( bbox[ b ] );
		}

		// Parse BBox CRS If Not String
		if ( data.wmc.crs && !( typeof data.wmc.crs === "string" || data.wmc.crs instanceof String ) )
		{
			data.wmc.crs = data.wmc.crs[ 0 ];
		}

		// BBox CRS				
		if ( data.wmc.crs && data.wmc.crs !== this.config[ "map" ][ "projection" ] )
		{					
			var min = proj4( data.wmc.crs, this.config[ "map" ][ "projection" ], [ bbox[ 0 ], bbox[ 1 ] ] );
			var max = proj4( data.wmc.crs, this.config[ "map" ][ "projection" ], [ bbox[ 2 ], bbox[ 3 ] ] );
			
			bbox[ 0 ] = min[ 0 ];
			bbox[ 1 ] = min[ 1 ];
			bbox[ 2 ] = max[ 0 ];
			bbox[ 3 ] = max[ 1 ];
		}
		
		this.output.extent = [ bbox[ 0 ], bbox[ 1 ], bbox[ 2 ], bbox[ 3 ] ];
	}

	// KML Overlay
	var kml = data.wmc.kmloverlay;

	if ( kml && kml.length > 0 )
	{		
		this.output.entities.push
		(
			{
				layer: { id: "kml" },
				title: "KML",
				kml: kml,
				active: true
			}
		);
	}

	// Map Layers
	var ids = [];

	if ( data.layerList )
	{
		for ( var l = 0; l < data.layerList.length; l++ )
		{
			var layer = data.layerList[ l ];

			ids.push( layer.layerId );

			// Layer Entity
			this.output.entities.push
			(
				{
					layer: { id: Number.parseInt( layer.layerId ) },
					position: layer.layerPos,
					active: layer.active,
					opacity: layer.opacity ? ( Number.parseFloat( layer.opacity ) * 0.01 ) : 1.0
				}
			);
		}
	}
	
	this.requestLayers( ids );
	
	// End Legacy Code
};

netgis.WMCLegacy.prototype.requestLayers = function( ids )
{
	console.info( "WMC REQUEST LAYERS:", ids );
	
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

netgis.WMCLegacy.prototype.onLayersResponse = function( data )
{
	data = JSON.parse( data );
	
	var singleLayerRequest = false; // TODO: true if params "layerid"
	
	// Begin Legacy Code
	
	var services = data.wms.srv;
			
	// Services
	for ( var s = 0; s < services.length; s++ )
	{
		var service = services[ s ];

		// Bounds If Not From WMC
		if ( singleLayerRequest )
		{
			var bbox = service.bbox;

			if ( bbox )
			{
				bbox = bbox.split( "," );
				for ( var b = 0; b < bbox.length; b++ ) bbox[ b ] = Number.parseFloat( bbox[ b ] );
				
				this.output.extent = [ bbox[ 0 ], bbox[ 1 ], bbox[ 2 ], bbox[ 3 ] ];
			}
		}

		// Service Group Layer
		var serviceEntity = this.createService( service );

		// Service Layers
		for ( var i = 0; i < service.layer.length; i++ )
		{
			var layer = service.layer[ i ];
			
			var layerEntity = this.createLayer( layer, serviceEntity );

			// TODO: recursive layer adding

			// Child Layers
			if ( layer.layer )
			{
				for ( var j = 0; j < layer.layer.length; j++ )
				{
					var child = layer.layer[ j ];
					
					var childEntity = this.createLayer( child, layerEntity );

					if ( child.layer )
					{
						for ( var k = 0; k < child.layer.length; k++ )
						{
							var child2 = child.layer[ k ];
							
							var child2Entity = this.createLayer( child2, childEntity, true );

							if ( child2.layer )
							{
								for ( var m = 0; m < child2.layer.length; m++ )
								{
									var child3 = child2.layer[ m ];
									
									var child3Entity = this.createLayer( child3, child2Entity, true );
								}
							}
						}
					}
				}
			}

		}

	}
   
	for ( var i = 0; i < this.output.entities.length; i++ )
	{
		var entity = this.output.entities[ i ];
		
		if ( ! entity.layer ) continue;
		//if ( ! entity.active ) continue;
		
		entity.order = this.output.entities.length - 1;
	}

	/*
	// Single Layer Request
	if ( singleLayerRequest )
	{
		var results = netgis.entities.find( netgis.component.Layer, "id", singleLayerRequest );

		if ( results.length > 0 )
		{
			var layer = results[ 0 ];

			layer.toggle( netgis.component.Active );

			netgis.events.call( netgis.events.LAYER_TOGGLE, { id: layer.id } );
			netgis.events.call( netgis.events.LAYER_ZOOM, { id: layer.id } );
		}
	}
	*/
   
	if ( singleLayerRequest )
	{
		// TODO: single layer requests
	}
	
	// End Legacy Code
	
	// Done Loading
	if ( this.callback )
	{
		// TODO: merge context response config with base client config ?
		
		this.callback( { config: this.toConfig(), output: this.output } );
	}
};

netgis.WMCLegacy.prototype.find = function( component, key, value )
{
	return this.output.entities.filter( this.findFilter( component, key, value ) );
};

netgis.WMCLegacy.prototype.findFilter = function( component, key, value )
{
	return function( entity )
	{
		var c = entity[ component ];

		if ( c && c[ key ] === value ) return true;

		return false;
	};
};

netgis.WMCLegacy.prototype.createLayer = function( layerData, parentEntity, prepend )
{			
	// Check if layer entity with this id already exists
	var id = Number.parseInt( layerData.id ); // NOTE: assuming layer id as integer
	var entity = this.find( "layer", "id", id )[ 0 ];

	if ( ! entity )
	{
		entity =
		{
			layer: { id: id }
		};
		
		if ( prepend )
			this.output.entities.unshift( entity );
		else
			this.output.entities.push( entity );
	}

	/*
	entity.set( new netgis.component.Title( layerData.title ) );
	entity.set( new netgis.component.Name( layerData.name ) );
	entity.set( new netgis.component.Parent( parentEntity ) );
	//entity.set( new netgis.component.Position( layerData.layerPos ) );
	*/
	
	entity.title = layerData.title;
	entity.name = layerData.name;
	entity.parent = parentEntity;
	
	if ( layerData.getLegendGraphicUrl && layerData.getLegendGraphicUrlFormat )
		entity.legend = { url: layerData.getLegendGraphicUrl, format: layerData.getLegendGraphicUrlFormat };

	if ( layerData.legendUrl )
		entity.legend = { url: window.decodeURIComponent( layerData.legendUrl ), format: layerData.getLegendGraphicUrlFormat };

	if ( layerData.layerQueryable === 1 || layerData.queryable === 1 ) // NOTE: these two props should have the same name!
		entity.queryable = true;

	if ( layerData.bbox )
	{
		var bbox = layerData.bbox.split( "," );

		for ( var i = 0; i < bbox.length; i++ )
			bbox[ i ] = Number.parseFloat( bbox[ i ] );
		
		entity.extent = [ bbox[ 0 ], bbox[ 1 ], bbox[ 2 ], bbox[ 3 ] ];
	}

	return entity;
};

netgis.WMCLegacy.prototype.createService = function( serviceData, prepend )
{
	var serviceEntity =
	{
		service: { id: serviceData.id },
		title: serviceData.title,
		url: serviceData.getMapUrl
	};

	return serviceEntity;
};

netgis.WMCLegacy.prototype.toConfig = function()
{
	// TODO: ?
};