"use strict";

var netgis = netgis || {};

netgis.Attribution = function()
{
	this.client = null;
	this.layers = null;
	this.items = [];
};

netgis.Attribution.prototype.load = function()
{
	this.root = document.createElement( "section" );
	this.root.className = "netgis-attribution netgis-text-primary";
	
	if ( netgis.util.isDefined( this.client.config.map ) )
		if ( netgis.util.isDefined( this.client.config.map.attribution ) )
			this.items.push( this.client.config.map.attribution );
	
	this.update();
	
	this.client.root.appendChild( this.root );
	
	// Events
	this.client.on( netgis.Events.CONTEXT_UPDATE, this.onContextUpdate.bind( this ) );
	this.client.on( netgis.Events.LAYER_SHOW, this.onLayerShow.bind( this ) );
	this.client.on( netgis.Events.LAYER_HIDE, this.onLayerHide.bind( this ) );
};

netgis.Attribution.prototype.update = function()
{
	this.root.innerHTML = "&copy; " + this.items.join( ", " );
};

netgis.Attribution.prototype.onContextUpdate = function( e )
{
	var context = e;
	
	// Layers
	this.layers = [];
	
	for ( var l = 0; l < context.layers.length; l++ )
	{
		var item = context.layers[ l ];
		
		if ( item.attribution && item.attribution.length > 0 )
		{
			this.layers[ l ] = item.attribution;
		}
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