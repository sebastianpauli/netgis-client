"use strict";

var netgis = netgis || {};

/**
 * Map Legend Module.
 * @param {JSON} config [Legend.Config]{@link netgis.Legend.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.Legend = function( config )
{
	this.config = config;
	
	this.initElements();
	this.initConfig( config );
};

/**
 * Config Section "legend"
 * @memberof netgis.Legend
 * @enum
 */
netgis.Legend.Config =
{
	/**
	 * Open panel at startup.
	 * @type Boolean
	 */
	"open": false
};

netgis.Legend.prototype.initElements = function()
{
	this.panel = new netgis.Panel( "<i class='netgis-icon fas fa-list-alt'></i><span>Legende</span>" );
	this.panel.content.classList.add( "netgis-legend" );
};

netgis.Legend.prototype.initConfig = function( config )
{
	var cfg = config[ "legend" ];
	
	if ( cfg && cfg[ "open" ] === true ) this.show();
	
	var configLayers = config[ "layers" ];
	
	for ( var i = 0; i < configLayers.length; i++ )
	{
		var layer = configLayers[ i ];
		
		if ( layer[ "active" ] === true )
		{
			this.addLayerLegend( layer[ "id" ] );
		}
		else
		{
			this.removeLayerLegend( layer[ "id" ] );
		}
	}
};

netgis.Legend.prototype.attachTo = function( parent )
{
	this.panel.attachTo( parent );
	
	parent.addEventListener( netgis.Events.CLIENT_CONTEXT_RESPONSE, this.onClientContextResponse.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_TOGGLE, this.onMapLayerToggle.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_CREATE, this.onMapLayerCreate.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_DELETE, this.onMapLayerDelete.bind( this ) );
	
	parent.addEventListener( netgis.Events.LEGEND_TOGGLE, this.onLegendToggle.bind( this ) );
};

netgis.Legend.prototype.show = function()
{
	this.panel.show();
};

netgis.Legend.prototype.hide = function()
{
	this.panel.hide();
};

netgis.Legend.prototype.addSection = function( id, title, content, open )
{
	var html =
	[
		( open === true ) ? "<details data-id='" + id + "' open='open'>" : "<details data-id='" + id + "'>",
		"<summary class='netgis-button netgis-noselect netgis-clip-text netgis-color-d netgis-hover-text-a netgis-hover-d'>",
		title,
		"</summary>",
		"<div class='netgis-border-d'>",
		content,
		"</div>",
		"</details>"
	];
	
	this.panel.content.innerHTML = html.join( "" ) + this.panel.content.innerHTML;
	
	// TODO: create element without html strings
};

netgis.Legend.prototype.addLayerLegend = function( id )
{
	// Find Layer Config
	var layer = null;
	var layers = this.config[ "layers" ];
	
	for ( var i = 0; i < layers.length; i++ )
	{
		var configLayer = layers[ i ];
		
		if ( configLayer[ "id" ] === id )
		{
			layer = configLayer;
			break;
		}
	}
	
	if ( ! layer )
	{
		return;
	}
	
	var url = layer[ "legend" ];
	
	if ( ! url || url === "" )
	{
		// Auto Detect Legend URL By Type
		switch ( layer[ "type" ] )
		{
			case netgis.LayerTypes.WMS:
			case netgis.LayerTypes.WMST:
			{
				url = layer[ "url" ];
				
				if ( url && url.indexOf( "?" ) === -1 ) url += "?";
				
				var params =
				[
					"service=WMS",
					"version=1.1.0",
					"request=GetLegendGraphic",
					"format=image/png",
					"layer=" + layer[ "name" ]
				];
				
				// TODO: config default get legend params ?
				
				url += params.join( "&" );
				
				break;
			}
		}
	}
	
	if ( url && url !== "" )
	{
		this.addSection( id, layer[ "title" ], "<img src='" + url + "'/>", true );
	}
};

netgis.Legend.prototype.removeLayerLegend = function( id )
{
	var items = this.panel.content.getElementsByTagName( "details" );
	
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[ i ];
		var itemID = item.getAttribute( "data-id" );
		
		if ( itemID === id ) item.parentNode.removeChild( item );
	}
};

netgis.Legend.prototype.onClientContextResponse = function( e )
{
	var params = e.detail;
	var config = params.context.config;
	
	this.initConfig( config );
};

netgis.Legend.prototype.onMapLayerToggle = function( e )
{
	var params = e.detail;
	
	if ( params.on )
		this.addLayerLegend( params.id );
	else
		this.removeLayerLegend( params.id );
};

netgis.Legend.prototype.onMapLayerCreate = function( e )
{
	var params = e.detail;
	this.addLayerLegend( params.id );
};

netgis.Legend.prototype.onMapLayerDelete = function( e )
{
	var params = e.detail;
	this.removeLayerLegend( params.id );
};

netgis.Legend.prototype.onLegendToggle = function( e )
{
	this.panel.toggle();
};