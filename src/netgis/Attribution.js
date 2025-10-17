"use strict";

var netgis = netgis || {};

/**
 * Attribution Module.
 * @param {JSON} config [Attribution.Config]{@link netgis.Attribution.Config}
 * @constructor
 * @memberof netgis
 */
netgis.Attribution = function( config )
{
	this.config = config;
	
	this.client = null;
	this.layers = null;
	this.items = [];
	
	this.initElements( config );
	this.initConfig( config );
};

/**
 * Config Section "attribution"
 * @memberof netgis.Attribution
 * @enum
 */
netgis.Attribution.Config =
{
	/**
	 * Prefix string to prepend
	 * @type String
	 */
	"prefix": "NetGIS"
};

netgis.Attribution.prototype.initElements = function( config )
{
	this.container = document.createElement( "section" );
	this.container.className = "netgis-attribution netgis-text-a";
	
	var self = this;
	window.setTimeout( function() { self.update(); }, 100 );
};

netgis.Attribution.prototype.initConfig = function( config )
{
	if ( ! config ) return;
	
	if ( config[ "attribution" ] && config[ "attribution" ][ "prefix" ] )
		this.items.push( config[ "attribution" ][ "prefix" ] );
	
	var cfg = config[ "layers" ];
	
	if ( ! cfg ) return;
	
	for ( var i = 0; i < cfg.length; i++ )
	{
		var layer = cfg[ i ];
		var attrib = layer[ "attribution" ];
		
		if ( ! attrib ) continue;
		if ( attrib.length === 0 ) continue;
		if ( ! layer[ "active" ] ) continue;
		
		this.items.push( attrib );
	}
};

netgis.Attribution.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
	
	parent.addEventListener( netgis.Events.CLIENT_CONTEXT_RESPONSE, this.onContextUpdate.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_TOGGLE, this.onMapLayerToggle.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_EDIT_LAYER_CHANGE, this.onEditLayerChange.bind( this ) );
};

netgis.Attribution.prototype.update = function()
{
	var html = "&copy; " + this.items.join( ", " );
	
	if ( this.appendix ) html += ", " + this.appendix;
	
	this.container.innerHTML = html;
};

netgis.Attribution.prototype.add = function( str )
{
	for ( var i = 0; i < this.items.length; i++ )
	{
		if ( this.items[ i ] === str ) return;
	}
	
	this.items.push( str );
	
	this.update();
};

netgis.Attribution.prototype.remove = function( str )
{
	for ( var i = 0; i < this.items.length; i++ )
	{
		if ( this.items[ i ] === str )
		{
			this.items.splice( i, 1 );
			break;
		}
	}
	
	this.update();
};

netgis.Attribution.prototype.onMapLayerToggle = function( e )
{
	var params = e.detail;
	
	var layers = this.config[ "layers" ];
	var attrib = null;
	
	for ( var i = 0; i < layers.length; i++ )
	{
		var layer = layers[ i ];

		if ( layer[ "id" ] !== params.id ) continue;

		attrib = layer[ "attribution" ];
	}
	
	if ( ! attrib ) return;
	
	if ( params.on )
		this.add( attrib );
	else
		this.remove( attrib );
};

netgis.Attribution.prototype.onContextUpdate = function( e )
{
	var params = e.detail;
	var config = params.context.config;
	
	this.initConfig( config );
	this.update();
};

netgis.Attribution.prototype.onContextUpdate_01 = function( e )
{
	var context = e;
	
	// TODO: prefix ?
	if ( config[ "attribution" ] && config[ "attribution" ][ "prefix" ] )
		this.items.push( config[ "attribution" ][ "prefix" ] );
	
	// Layers
	this.layers = [];
	
	for ( var l = 0; l < context.layers.length; l++ )
	{
		var item = context.layers[ l ];
		
		if ( item.attribution && item.attribution.length > 0 )
		{
			this.layers[ item.id ] = item.attribution;
		}
	}
	
	for ( var l = 0; l < context.layers.length; l++ )
	{
		var item = context.layers[ l ];
		
		if ( item.active ) this.onLayerShow( { id: item.id } );
	}
};

netgis.Attribution.prototype.onLayerShow = function( e )
{
	var attribution = this.layers[ e.id ];
	
	if ( ! attribution ) return;
	
	for ( var i = 0; i < this.items.length; i++ )
	{
		if ( this.items[ i ] === attribution ) return;
	}
	
	this.items.push( attribution );
	
	this.update();
};

netgis.Attribution.prototype.onLayerHide = function( e )
{
	var attribution = this.layers[ e.id ];
	
	if ( ! attribution ) return;
	
	for ( var i = 0; i < this.items.length; i++ )
	{
		if ( this.items[ i ] === attribution )
		{
			this.items.splice( i, 1 );
			break;
		}
	}
	
	this.update();
};

netgis.Attribution.prototype.onEditLayerChange = function( e )
{
	var params = e.detail;
	var area = params.geojson.area;
	
	// Update Drawing Area
	var areaLabel = "Zeichnungsfläche: ";
	
	for ( var i = 0; i < this.items.length; i++ )
	{
		var item = this.items[ i ];
		
		if ( item.search( areaLabel ) > -1 )
		{
			this.items.splice( i, 1 );
			break;
		}
	}
	
	if ( area && area > 0.0 )
	{
		var areaItem = areaLabel + netgis.util.formatArea( area, true );
		areaItem = "<b>" + areaItem + "</b>";
		this.appendix = areaItem;
	}
	else
	{
		this.appendix = null;
	}
	
	this.update();
};