"use strict";

/**
 * The netgis namespace.
 * @namespace
 */
var netgis = netgis || {};

/**
 * The main NetGIS Client class. 
 * @param {Element} container
 * @param {JSON} config
 * @returns {netgis.Client}
 */
netgis.Client = function( container, config )
{
	this.build = "20220704";
	this.debug = false;
	
	if ( netgis.util.isString( container ) )
		container = document.getElementById( container );
	
	this.container = container;
	
	this.editable = true;
	this.root = null;
	
	this.modules = [];
	this.callbacks = {};
	
	this.config = this.createDefaultConfig();
	
	this.create();
	
	if ( netgis.util.isDefined( config ) )
	{
		if ( netgis.util.isString( config ) )
		{
			// Config From Url
			var self = this;

			netgis.util.request
			(
				config,
				function( data )
				{
					var json = JSON.parse( data );
					
					netgis.util.merge( self.config, json );

					self.createModules();
					self.load();
					self.invoke( netgis.Events.CONTEXT_UPDATE, self.config );

					self.hideLoader();
				}
			);
		}
		else
		{
			// Config From Object
			netgis.util.merge( this.config, config );

			this.createModules();
			this.load();
			this.invoke( netgis.Events.CONTEXT_UPDATE, this.config );

			this.hideLoader();
		}
	}
	else
	{
		// No Config Given
		this.createModules();
		this.load();
		this.invoke( netgis.Events.CONTEXT_UPDATE, this.config );

		this.hideLoader();
	}
	
	//TODO: config module to handle params, existance, defaults, etc. ?
};

netgis.Client.prototype.createDefaultConfig = function()
{
	var config =
	{
		map:
		{
			projection: "EPSG:3857",
			center: [ 1113194.0, 6621293.0 ],
			minZoom: 0,
			maxZoom: 20,
			zoom: 6,
			attribution: "NetGIS"
		},
		projections:
		[
		],
		layers:
		[
			{ folder: 0, type: netgis.LayerTypes.OSM, title: "Open Street Map", attribution: "OSM Contributors", active: true }
		],
		folders:
		[
			{ title: "Hintergrund", parent: -1 }
		],
		styles:
		{
			editLayer: { fill: "rgba( 255, 0, 0, 0.5 )", stroke: "#ff0000", strokeWidth: 3, pointRadius: 6 },
			select: { fill: "rgba( 0, 127, 255, 0.5 )", stroke: "#007fff", strokeWidth: 3, pointRadius: 6 },
			sketch: { fill: "rgba( 0, 127, 0, 0.5 )", stroke: "#007f00", strokeWidth: 3, pointRadius: 6 },
			modify: { fill: "rgba( 0, 127, 0, 0.5 )", stroke: "#007f00", strokeWidth: 3, pointRadius: 6 }
		}
	};
	
	//TODO: advanced config merge, so it's easier to extend layers, styles etc. without replacing the whole array
	
	return config;
};

/**
 * Creates the core HTML elements for this client.
 */
netgis.Client.prototype.create = function()
{
	this.root = document.createElement( "section" );
	this.root.className = "netgis-client";
	
	this.loader = document.createElement( "div" );
	this.loader.className = "netgis-loader netgis-dialog netgis-text-primary";
	this.loader.innerHTML = "<i class='fas fa-spinner'></i>";
	this.root.appendChild( this.loader );
	
	this.container.appendChild( this.root );
};

/**
 * Create and add all modules to this client.
 */
netgis.Client.prototype.createModules = function()
{
	// Editable
	this.editable = true;
	
	if ( this.container.hasAttribute( "contenteditable" ) )
	{
		if ( this.container.getAttribute( "contenteditable" ) === "false" )
		{
			this.editable = false;
		}
	}
	
	if ( this.container.hasAttribute( "data-editable" ) )
	{
		this.editable = this.container.getAttribute( "data-editable" ) === "true" ? true : false;
	}
	
	// Modules
	this.add( this.map = new netgis.MapOpenLayers() ); //TODO: how to properly store module references ?
	this.add( new netgis.Controls() );
	this.add( new netgis.Attribution() );
	this.add( new netgis.LayerTree() );
	this.add( new netgis.Toolbar() );
	this.add( new netgis.Menu() );
	this.add( new netgis.SearchPlace() );
	this.add( new netgis.Modal() );
};

/**
 * Finally load this client and its modules.
 */
netgis.Client.prototype.load = function()
{	
	// Modules
	for ( var m = 0; m < this.modules.length; m++ )
	{
		this.modules[ m ].load();
	}
	
	// Output Element
	if ( netgis.util.isDefined( this.config.output ) )
	{
		if ( netgis.util.isDefined( this.config.output.id ) )
		{
			this.output = document.getElementById( this.config.output.id );

			if ( this.output.value && this.output.value.length > 0 )
			{
				var json = JSON.parse( this.output.value );
				this.invoke( netgis.Events.EDIT_FEATURES_LOADED, json );
			}
		}
		
	}
	else
	{
		this.output = document.createElement( "input" );
		this.output.setAttribute( "type", "hidden" );
		this.output.className = "netgis-edit-output";
		this.root.appendChild( this.output );
	}
	
	// Default Interaction
	this.invoke( netgis.Events.SET_MODE, netgis.Modes.VIEW );
	
	// Events
	this.on( netgis.Events.EXPORT_BEGIN, this.onMapExportBegin.bind( this ) );
	this.on( netgis.Events.EXPORT_END, this.onMapExportEnd.bind( this ) );
	this.on( netgis.Events.EDIT_FEATURES_CHANGE, this.onEditFeaturesChange.bind( this ) );
};

netgis.Client.prototype.add = function( module )
{
	module.client = this;
	this.modules.push( module );
};

netgis.Client.prototype.on = function( evt, callback )
{
	if ( ! netgis.util.isDefined( this.callbacks[ evt ] ) )
	{
		this.callbacks[ evt ] = [];
	}

	this.callbacks[ evt ].push( callback );
};

netgis.Client.prototype.off = function( evt, callback )
{
	if ( netgis.util.isDefined( this.callbacks[ evt ] ) )
	{
		if ( netgis.util.isDefined( callback ) )
		{
			// Remove Specific Callback
			for ( var i = 0; i < this.callbacks[ evt ].length; i++ )
			{
				if ( this.callbacks[ evt ][ i ] === callback )
				{
					this.callbacks[ evt ].splice( i, 1 );
					break;
				}
			}
			
			if ( this.callbacks[ evt ].length < 1 ) delete this.callbacks[ evt ];
		}
		else
		{
			// Remove All Callbacks
			delete this.callbacks[ evt ];
		}
	}
};

netgis.Client.prototype.invoke = function( evt, params )
{
	if ( this.debug ) console.info( "EVENT:", evt, params );
			
	if ( netgis.util.isDefined( this.callbacks[ evt ] ) )
	{
		for ( var i = 0; i < this.callbacks[ evt ].length; i++ )
		{
			this.callbacks[ evt ][ i ]( params );
		}
	}
};

netgis.Client.prototype.showLoader = function()
{
	this.loader.classList.remove( "netgis-hide" );
};

netgis.Client.prototype.hideLoader = function()
{
	this.loader.classList.add( "netgis-hide" );
};

netgis.Client.prototype.onHtmlResponse = function( data )
{
	this.root = netgis.util.create( data );
	this.container.appendChild( this.root );
};

netgis.Client.prototype.onEditFeaturesChange = function( e )
{
	var geojson = JSON.stringify( e );
	this.output.value = geojson;
};

netgis.Client.prototype.onMapExportBegin = function( e )
{
	this.showLoader();
};

netgis.Client.prototype.onMapExportEnd = function( e )
{
	this.hideLoader();
};