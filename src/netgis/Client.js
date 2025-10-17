"use strict";

/**
 * The netgis namespace.
 * @namespace
 */
var netgis = netgis || {};

/**
 * The main NetGIS Client class. 
 * @param {Element} container The HTML element to contain the client app
 * @param {JSON} config The main client config object. Specific section options can be found inside the [Modules]{@link Modules}.<br/>
 * [Client.Output]{@link netgis.Client.Output}<br/>
 *
 * @memberof netgis
 * @name Client
 * @constructor
 */
netgis.Client = function( container, config )
{
	// Legacy Config
	if ( ! config ) config = {};
	container = this.initLegacyConfig( config, container );
	
	// Init
	this.container = this.initContainer( container );
	this.debug = false;
	
	if ( netgis.util.isString( config ) )
	{
		if ( netgis.util.isJSON( config, false ) )
		{
			// Config String
			config = JSON.parse( config );
			this.init( this.container, config );
		}
		else
		{
			// Config URL
			this.showLoader( true );
			netgis.util.request( config, this.onConfigResponse.bind( this ) );
		}
	}
	else
	{
		// Config Object
		this.init( this.container, config );
	}
};

/**
 * Config Section "client"
 * @memberof netgis.Client
 * @enum
 */
netgis.Client.Config =
{
	/**
	 * Text for the main loading indicator.
	 * @type String
	 * @memberof netgis.Client.Config
	 */
	"loading_text": "Geoportal Client wird geladen..."
};

/**
 * Config Section "output" (will be deprecated, use [ "tools" ][ "output_id" ] instead)
 * @memberof netgis.Client
 * @enum
 */
netgis.Client.Output =
{
	/**
	 * Element id to write edit output to (sets the input value)
	 * @type String
	 */
	"id": "netgis-storage"
};

netgis.Client.prototype.init = function( container, config )
{
	this.config = config;
	
	this.initParams( config );
	this.initConfig( config );
	this.initElements( container );
	this.initEvents();
	this.initModules( config );
	this.initOutput( config );
};

netgis.Client.prototype.initLegacyConfig = function( config, container )
{
	var legacy = netgis.config;
	
	if ( ! legacy ) return container;
	
	// Container
	if ( legacy[ "MAP_CONTAINER_ID" ] ) container = legacy[ "MAP_CONTAINER_ID" ];
	
	// Modules
	if ( ! config[ "modules" ] ) config[ "modules" ] =
	{
		"menu": true,
		"map": true,
		"controls": true,
		"attribution": true,
		"legend": true,
		"layertree": true,
		"info": true,
		"searchplace": true,
		"geolocation": true
	};
	
	// Map View
	if ( ! config[ "map" ] ) config[ "map" ] = {};
	
	if ( ( legacy[ "INITIAL_CENTER_X" ] || legacy[ "INITIAL_CENTER_X" ] === 0.0 ) && ( legacy[ "INITIAL_CENTER_Y" ] || legacy[ "INITIAL_CENTER_Y" ] === 0.0 ) )
	{
		config[ "map" ][ "center" ] = [ legacy[ "INITIAL_CENTER_X" ], legacy[ "INITIAL_CENTER_Y" ] ];
	}
	
	config[ "map" ][ "scalebar" ] = true;
	
	if ( legacy[ "INITIAL_SCALE" ] ) config[ "map" ][ "scale" ] = legacy[ "INITIAL_SCALE" ];
	if ( legacy[ "MAP_SCALES" ] ) config[ "map" ][ "scales" ] = legacy[ "MAP_SCALES" ];
	if ( legacy[ "MAP_EXTENT" ] ) config[ "map" ][ "extent" ] = legacy[ "MAP_EXTENT" ];
	
	if ( legacy[ "MAX_HISTORY" ] )
	{
		config[ "map" ][ "max_view_history" ] = legacy[ "MAX_HISTORY" ];
	}
	
	// Attibution
	config[ "attribution" ] = { "prefix": "GeoPortal" };
	
	// Projections
	if ( legacy[ "MAP_PROJECTIONS" ] ) config[ "projections" ] = legacy[ "MAP_PROJECTIONS" ];
	
	if ( legacy[ "MAP_PROJECTION" ] ) config[ "map" ][ "projection" ] = legacy[ "MAP_PROJECTION" ];
	
	// Controls
	config[ "controls" ] =
	{
		"buttons":
		[
			{ "id": "zoom_in", "icon": "<i class='fas fa-plus'></i>", "title": "Zoom +" },
			{ "id": "zoom_out", "icon": "<i class='fas fa-minus'></i>", "title": "Zoom -" },
			{ "id": "geolocation", "icon": "<i class='fas fa-crosshairs'></i>", "title": "Gerätestandort" },
			{ "id": "zoom_home", "icon": "<i class='fas fa-home'></i>", "title": "Anfangsausdehung" },
			{ "id": "legend", "icon": "<i class='fas fa-bars'></i>", "title": "Legende" }
		]
	};
	
	// Folders
	if ( ! config[ "folders" ] )
	{
		config[ "folders" ] =
		[
			{ "id": "bg", "title": "Hintergrund", "parent": null, "radio": true }
		];
	}
	
	// Layers
	if ( ! config[ "layers" ] ) config[ "layers" ] = [];
	
	if ( legacy[ "URL_BACKGROUND_HYBRID" ] )
	{
		var url = legacy[ "URL_BACKGROUND_HYBRID" ];
		
		if ( ( url.indexOf( "{x}" ) === -1 ) && ( url.indexOf( "{y}" ) === -1 || url.indexOf( "{-y}" ) === -1 ) && ( url.indexOf( "{z}" ) === -1 ) )
		{
			url += "/{z}/{x}/{-y}.jpeg";
		}
		
		var layer = { "id": "bg_hybrid", "active": true, "folder": "bg", "order": 1, "title": "Hybrid", "type": "TMS", "url": url, "projection": "EPSG:25832", "extent": "map", "scales": "map", "transparency": 0.0 };
		config[ "layers" ].push( layer );
	}
	
	if ( legacy[ "URL_BACKGROUND_AERIAL" ] )
	{
		var url = legacy[ "URL_BACKGROUND_AERIAL" ];
		
		var layer = { "id": "bg_aerial", "folder": "bg", "order": 1, "title": "Luftbild", "type": "WMS", "url": url, "query": false, "transparency": 0.0 };
		config[ "layers" ].push( layer );
	}
	
	if ( legacy[ "URL_HEIGHT_REQUEST" ] )
	{
		var url = legacy[ "URL_HEIGHT_REQUEST" ];
		
		if ( ( url.indexOf( "{x}" ) === -1 ) && url.indexOf( "{y}" ) === -1 )
		{
			url += "&coord={x},{y}";
		}
		
		var layer = { "id": "dem_hidden", "title": "Digitales Höhenmodell", "hidden": true, "active": true, "query": true, "type": "HIDDEN", "query_url": url /*"./proxy.php?https://www.geoportal.rlp.de/mapbender/extensions/mobilemap2/scripts/heightRequest.php?&lang=de&coord={x},{y}"*/ };
		config[ "layers" ].push( layer );
	};
	
	if ( ! config[ "layertree" ] ) config[ "layertree" ] = {};
	
	config[ "layertree" ][ "title" ] = "Ebenen";
	
	// TODO: GeoRSS layer ?
	
	if ( legacy[ "MAP_DEFAULT_OPACITY" ] )
	{
		// TODO: would be overwritten by WMC layers opacity, still necessary to implement ?
	}
	
	// Feature Info
	if ( ! config[ "info" ] ) config[ "info" ] = {};
	
	config[ "info" ][ "default_format" ] = "text/html";
	
	if ( legacy[ "URL_FEATURE_INFO_PROXY" ] && legacy[ "URL_FEATURE_INFO_PROXY" ].length > 0 )
	{
		config[ "info" ][ "proxy" ] = legacy[ "URL_FEATURE_INFO_PROXY" ];
	}
	
	// Menu
	if ( ! config[ "menu" ] )
	{
		config[ "menu" ] =
		{
			"header": "GeoPortal",
			"compact": true,
			"items":
			[
				{
					"title": "<i class='fas fa-tools'></i><span>Tools</span>",
					"items":
					[
						{ "id": "view", "title": "<i class='netgis-icon fas fa-hand-paper'></i><span>Betrachten</span>" },
						{ "id": "zoom_box", "title": "<i class='netgis-icon fas fa-expand'></i><span>Zoom-Rechteck</span>" },
						
						{ "id": "measure_line", "title": "<i class='netgis-icon fas fa-ruler'></i><span>Strecke messen</span>" },
						{ "id": "measure_area", "title": "<i class='netgis-icon fas fa-ruler-combined'></i><span>Fläche messen</span>" },
						{ "id": "measure_clear", "title": "<i class='netgis-icon fas fa-trash-alt'></i><span>Messung löschen</span>" }
					]
				},
				{ "id": "layertree", "title": "<i class='fas fa-layer-group'></i><span>Ebenen</span>" }
			]
		};
		
		if ( legacy[ "MAP_SCALES" ] && legacy[ "MAP_SCALES" ].length > 0 )
		{
			config[ "menu" ][ "items" ].unshift
			(
				{
					"title": "<i class='far fa-eye'></i><span>Ansicht</span>",
					"items":
					[
						{ "id": "view_prev", "title": "<i class='fas fa-step-backward'></i><span>Vorherige</span>" },
						{ "id": "view_next", "title": "<i class='fas fa-step-forward'></i><span>Nächste</span>" },
						{ "id": "scales", "title": "<i class='fas fa-ruler-horizontal'></i><span>Maßstab</span><i class='fas fa-caret-right'></i>", "items": [] }
					]
				}
			);
		}
		
		if ( legacy[ "URL_USAGE_TERMS" ] && legacy[ "URL_USAGE_TERMS" ].length > 0 )
		{
			config[ "menu" ][ "items" ].unshift
			(
				{
					"title": "<i class='fas fa-info-circle'></i><span>Info</span>",
					"items":
					[
						{ "url": legacy[ "URL_USAGE_TERMS" ], "title": "<i class='fas fa-external-link-alt'></i><span>Nutzungsbedingungen</span>" }
					]
				}
			);
		}
	}
	
	// Search
	if ( legacy[ "URL_SEARCH_REQUEST" ] )
	{
		var url = legacy[ "URL_SEARCH_REQUEST" ];
		
		if ( url.indexOf( "{query}" ) === -1 )
		{
			url += "?outputFormat=json&resultTarget=web&searchEPSG=4326&maxResults=5&maxRows=5&featureClass=P&style=full&searchText={query}&name_startsWith={query}";
		}
		
		if ( legacy[ "URL_SEARCH_PROXY" ] && legacy[ "URL_SEARCH_PROXY" ].length > 0 )
		{
			url = legacy[ "URL_SEARCH_PROXY" ] + "?" + url;
		}
		
		config[ "menu" ][ "items" ].unshift( { "id": "searchplace", "title": "<i class='fas fa-search'></i><span>Suche</span>" } );
		
		config[ "searchplace" ] =
		{
			"title": "Suche...",
			"url": url
		};
	}
	
	// WMC Context
	if ( ! config[ "wmc" ] ) config[ "wmc" ] = {};
	
	if ( legacy[ "URL_WMC_REQUEST" ] )
	{
		var url = legacy[ "URL_WMC_REQUEST" ];
		
		if ( url.indexOf( "{id}" ) === -1 )
		{
			var confname = "mobilemap2";
			
			if ( legacy[ "CONF_FILE_NAME" ] && legacy[ "CONF_FILE_NAME" ].length > 0 )
				confname = legacy[ "CONF_FILE_NAME" ];
				
			url += "?confFileName=" + confname + "&epsg=25832&withHierarchy=1&wmc_id={id}";
		}
		
		if ( legacy[ "URL_WMC_PROXY" ] && legacy[ "URL_WMC_PROXY" ].length > 0 )
		{
			url = legacy[ "URL_WMC_PROXY" ] + "?" + url;
		}
		
		config[ "wmc" ][ "url" ] = url;
	}
	
	if ( legacy[ "URL_LAYERS_REQUEST" ] )
	{
		var url = legacy[ "URL_LAYERS_REQUEST" ];
		
		if ( url.indexOf( "{ids}" ) === -1 )
		{
			url += "?languageCode=de&resultTarget=web&maxResults=40&resourceIds={ids}";
		}
		
		if ( legacy[ "URL_LAYERS_PROXY" ] && legacy[ "URL_LAYERS_PROXY" ].length > 0 )
		{
			url = legacy[ "URL_LAYERS_PROXY" ] + "?" + url;
		}
		
		config[ "wmc" ][ "layers_url" ] = url;
	}
	
	return container;
};

netgis.Client.prototype.initContainer = function( container )
{
	// Client Container Element
	if ( netgis.util.isString( container ) )
		container = document.getElementById( container );
	
	container.classList.add( "netgis-client", "netgis-font" );
	
	return container;
};

netgis.Client.prototype.initParams = function( config )
{
	// Get Parameters
	var params = window.location.search.substr( 1 );
	params = params.split( "&" );
	
	this.params = {};
	
	for ( var i = 0; i < params.length; i++ )
	{
		var p = params[ i ].split( "=" );
		var k = p[ 0 ].toLowerCase();
		var v = p[ 1 ];
		
		if ( ! k || k === "" ) continue;
		
		this.params[ k ] = v;
	}
	
	// Apply Params To Config
	for ( var k in this.params )
	{
		var v = this.params[ k ];
		
		switch ( k )
		{
			// WMC ID
			case "wmc_id":
			{
				if ( config[ "wmc" ] )
				{
					config[ "wmc" ][ "id" ] = v;
				}
				
				break;
			}
			
			// Layer ID
			case "layerid":
			{
				if ( config && config[ "wmc" ] && config[ "wmc" ][ "layers_url" ] )
				{
					var url = config[ "wmc" ][ "layers_url" ];
					url = netgis.util.replace( url, "{ids}", v );
					
					netgis.util.request( url, this.onContextResponseLayer.bind( this ) );
				}
				
				break;
			}
		}
	}
};

netgis.Client.prototype.initConfig = function( config )
{
	// WMC
	if ( config && config[ "wmc" ] && config[ "wmc" ][ "url" ] )
	{
		this.requestContextWMC( config[ "wmc" ][ "url" ], config[ "wmc" ][ "id" ] );
	}
	
	// OWS
	if ( config && config[ "ows" ] && config[ "ows" ][ "url" ] )
	{
		this.requestContextOWS( config[ "ows" ][ "url" ] );
	}
};

netgis.Client.prototype.initElements = function( container )
{	
	// Container Attributes
	if ( container.hasAttribute( "data-lon" ) )
	{
		var lon = Number.parseFloat( container.getAttribute( "data-lon" ) );
		
		if ( ! this.config[ "map" ][ "center_lonlat" ] ) this.config[ "map" ][ "center_lonlat" ] = [];
		this.config[ "map" ][ "center_lonlat" ][ 0 ] = lon;
	}
	
	if ( container.hasAttribute( "data-lat" ) )
	{
		var lat = Number.parseFloat( container.getAttribute( "data-lat" ) );
		
		if ( ! this.config[ "map" ][ "center_lonlat" ] ) this.config[ "map" ][ "center_lonlat" ] = [];
		this.config[ "map" ][ "center_lonlat" ][ 1 ] = lat;
	}
	
	if ( container.hasAttribute( "data-zoom" ) )
	{
		var zoom = Number.parseFloat( container.getAttribute( "data-zoom" ) );
		this.config[ "map" ][ "zoom" ] = zoom;
	}
	
	if ( container.hasAttribute( "data-bounds" ) )
	{
		var bounds = container.getAttribute( "data-bounds" );
		this.config[ "tools" ][ "bounds" ] = bounds;
	}
	
	if ( container.hasAttribute( "data-editable" ) )
	{
		var editable = ( container.getAttribute( "data-editable" ) === "true" );
		
		if ( ! this.config[ "tools" ] ) this.config[ "tools" ] = {};
		this.config[ "tools" ][ "editable" ] = editable;
	}
};

netgis.Client.prototype.initOutput = function( config )
{
	var id;
	var name;
	
	if ( config[ "output" ] && config[ "output" ][ "id" ] )
	{
		id = config[ "output" ][ "id" ];
		console.warn( 'config[ "output" ][ "id" ] is deprecated, use config[ "tools" ][ "output_id" ] instead' );
	}
	
	if ( config[ "tools" ] )
	{
		if ( config[ "tools" ][ "output_id" ] ) id = config[ "tools" ][ "output_id" ];
		if ( config[ "tools" ][ "output_name" ] ) name = config[ "tools" ][ "output_name" ];
	}
	
	if ( id )
	{
		var output = document.getElementById( id );

		if ( output && output.value && output.value.length > 0 )
		{
			var geojson = JSON.parse( output.value );
			netgis.util.invoke( this.container, netgis.Events.MAP_EDIT_LAYER_LOADED, { geojson: geojson } );
		}	
		
		this.output = output;
	}
	
	if ( ! this.output )
	{
		this.output = document.createElement( "input" );
		this.output.className = "netgis-storage";
		this.output.setAttribute( "type", "hidden" );
		
		if ( id ) this.output.setAttribute( "id", id );
		if ( name ) this.output.setAttribute( "name", name );
		
		this.container.appendChild( this.output );
	}
};

netgis.Client.prototype.initModules = function( config )
{	
	this.modules = {};
	
	var configModules = config[ "modules" ];
	
	if ( ! configModules ) return;
	
	if ( configModules[ "map" ] ) this.addModule( "map", netgis.Map );
	if ( configModules[ "controls" ] ) this.addModule( "controls", netgis.Controls );
	if ( configModules[ "attribution" ] ) this.addModule( "attribution", netgis.Attribution );
	if ( configModules[ "legend" ] ) this.addModule( "legend", netgis.Legend );
	if ( configModules[ "geolocation" ] ) this.addModule( "geolocation", netgis.Geolocation );
	if ( configModules[ "info" ] ) this.addModule( "info", netgis.Info );
	if ( configModules[ "menu" ] ) this.addModule( "menu", netgis.Menu );
	if ( configModules[ "layertree" ] ) this.addModule( "layertree", netgis.LayerTree );
	if ( configModules[ "searchplace" ] ) this.addModule( "searchplace", netgis.SearchPlace );
	if ( configModules[ "searchparcel" ] ) this.addModule( "searchparcel", netgis.SearchParcel );
	if ( configModules[ "toolbox" ] ) this.addModule( "toolbox", netgis.Toolbox );
	if ( configModules[ "import" ] ) this.addModule( "import", netgis.Import );
	if ( configModules[ "export" ] ) this.addModule( "export", netgis.Export );
	if ( configModules[ "timeslider" ] ) this.addModule( "timeslider", netgis.TimeSlider );
	if ( configModules[ "plugins" ] ) this.addModule( "plugins", netgis.Plugins );
	
	// TODO: automate module loading from config ?
	// TODO: config modules script constructors ?
};

netgis.Client.prototype.initEvents = function()
{
	// Check For Event Errors
	this.container.addEventListener( undefined, function( e ) { console.error( "undefined event invoked", e ); } );
	
	// Listen To All Client Events
	for ( var key in netgis.Events )
	{
		var val = netgis.Events[ key ];		
		this.container.addEventListener( val, this.handleEvent.bind( this ) );
	}
	
	this.container.addEventListener( netgis.Events.MAP_EDIT_LAYER_CHANGE, this.onMapEditLayerChange.bind( this ) );
};

netgis.Client.prototype.showLoader = function( on )
{
	if ( ! this.loader )
	{
		this.loader = document.createElement( "div" );
		this.loader.className = "netgis-loader netgis-color-e netgis-text-a";
		this.loader.innerHTML = "<i class='fas fa-cog'></i>";
		
		if ( this.config && this.config[ "client" ] && this.config[ "client" ][ "loading_text" ] )
		{
			this.loader.innerHTML += "<h2>" + this.config[ "client" ][ "loading_text" ] + "</h2>";
		}
		
		this.container.appendChild( this.loader );
	}
	
	if ( on === false )
	{
		this.loader.classList.add( "netgis-fade" );
		
		this.loaderTimeout = window.setTimeout( function() { this.loader.classList.add( "netgis-hide" ); this.loaderTimeout = null; }.bind( this ), 600 );
	}
	else
	{
		this.loader.classList.remove( "netgis-hide" );
		this.loader.classList.remove( "netgis-fade" );
		
		if ( this.loaderTimeout )
		{
			window.clearTimeout( this.loaderTimeout );
			this.loaderTimeout = null;
		}
	}
};

netgis.Client.prototype.handleEvent = function( e )
{
	var type = e.type;
	var params = e.detail;
	
	if ( this.debug === true ) console.info( "EVENT:", type, params );
};

netgis.Client.prototype.addModule = function( id, construct )
{
	var module = new construct( this.config );
	
	if ( module.attachTo ) module.attachTo( this.container );
	
	this.modules[ id ] = module;
	
	return module;
};

netgis.Client.prototype.isMobile = function()
{
	return netgis.util.isMobile( this.container );
};

netgis.Client.prototype.onConfigResponse = function( data )
{
	var config = JSON.parse( data );
	
	this.init( this.container, config );
	this.showLoader( false );
};

netgis.Client.prototype.requestContextWMC = function( url, id )
{
	if ( url.indexOf( "{id}" ) > -1 )
	{
		if ( ! id )
		{
			console.warn( "No WMC id set in config for url", url );
			return;
		}
		else
		{
			url = netgis.util.replace( url, "{id}", id );
		}
	}

	var wmc = new netgis.WMC( this.config );
	wmc.requestContext( url, this.onContextResponseWMC.bind( this ) );
	
	this.showLoader( true );
};

netgis.Client.prototype.onContextResponseWMC = function( context )
{
	console.info( "WMC Response:", context );
	
	// TODO: pass only final config instead of context ?
	
	// Apply Changes To Current Config
	for ( var i = 0; i < context.config.layers.length; i++ )
	{
		var layer = context.config.layers[ i ];
		this.config[ "layers" ].push( layer );
	}
	
	if ( context.config[ "map" ][ "bbox" ] )
	{
		this.config[ "map" ][ "bbox" ] = context.config[ "map" ][ "bbox" ];
	}
	
	// Update Modules
	netgis.util.invoke( this.container, netgis.Events.CLIENT_CONTEXT_RESPONSE, { context: context } );
	
	this.showLoader( false );
};

netgis.Client.prototype.onContextResponseLayer = function( data )
{
	var json = JSON.parse( data );
	
	console.info( "Layer Response:", json );
	
	var wmc = new netgis.WMC();
	
	var srv = json[ "wms" ][ "srv" ];
	var layer = srv[ 0 ];
	
	var result = wmc.parseServiceLayer( layer[ "id" ].toString(), layer, null, layer.layer[ 0 ], null );
	
	this.config.layers.push( result );
	
	netgis.util.invoke( this.container, netgis.Events.MAP_LAYER_CREATE, result );
};

netgis.Client.prototype.requestContextOWS = function( url )
{
	console.info( "Request OWS:", url );
	
	netgis.util.request( url, this.onContextResponseOWS.bind( this ) );
};

netgis.Client.prototype.onContextResponseOWS = function( data )
{
	var json = JSON.parse( data );
	
	console.info( "OWS Response:", json );
	
	var config = netgis.OWS.read( json, this );
	
	console.info( "OWS Config:", config );
};

netgis.Client.prototype.onMapEditLayerChange = function( e )
{
	var params = e.detail;
	var geojson = JSON.stringify( params.geojson );
	
	this.output.value = geojson;
};

netgis.Client.handleCommand = function( src, command )
{
	// TODO: having a common event invoke scheme for buttons, inputs, items etc. would get rid of this ?
	
	// Command With Parameter String
	var parts = command.split( ":" );
	command = parts[ 0 ];
	
	// Translate Command IDs To Events
	switch ( command.toUpperCase() )
	{
		case netgis.Commands.PLUGIN:
		{
			var id = parts[ 1 ];
			
			if ( ! id ) { console.error( "missing second command parameter id", parts ); break; }
			
			netgis.util.invoke( src, netgis.Events.PLUGIN_TOGGLE, { id: id } );
			
			break;
		}
		
		case netgis.Commands.LAYERTREE:
		{
			if ( netgis.util.isMobile() )
				netgis.util.invoke( src, netgis.Events.LAYERTREE_TOGGLE, { on: true } );
			else
				netgis.util.invoke( src, netgis.Events.LAYERTREE_TOGGLE, null );
			
			break;
		}
		
		case netgis.Commands.SEARCHPLACE:
		{
			if ( netgis.util.isMobile() )
				netgis.util.invoke( src, netgis.Events.SEARCHPLACE_TOGGLE, { on: true } );
			else
				netgis.util.invoke( src, netgis.Events.SEARCHPLACE_TOGGLE, null );
			
			break;
		}
		
		case netgis.Commands.SEARCHPARCEL:
		{
			if ( netgis.util.isMobile() )
				netgis.util.invoke( src, netgis.Events.SEARCHPARCEL_TOGGLE, { on: true } );
			else
				netgis.util.invoke( src, netgis.Events.SEARCHPARCEL_TOGGLE, null );
			
			break;
		}
		
		case netgis.Commands.TOOLBOX:
		{
			if ( netgis.util.isMobile() )
				netgis.util.invoke( src, netgis.Events.TOOLBOX_TOGGLE, { on: true } );
			else
				netgis.util.invoke( src, netgis.Events.TOOLBOX_TOGGLE, null );
			
			break;
		}
		
		case netgis.Commands.LEGEND:
		{
			if ( netgis.util.isMobile() )
				netgis.util.invoke( src, netgis.Events.LEGEND_TOGGLE, { on: true } );
			else
				netgis.util.invoke( src, netgis.Events.LEGEND_TOGGLE, null );
			
			break;
		}
		
		case netgis.Commands.VIEW_PREV:
		{
			netgis.util.invoke( src, netgis.Events.MAP_VIEW_PREV, null );
			break;
		}
		
		case netgis.Commands.VIEW_NEXT:
		{
			netgis.util.invoke( src, netgis.Events.MAP_VIEW_NEXT, null );
			break;
		}
		
		case netgis.Commands.VIEW:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.VIEW } );
			break;
		}
		
		case netgis.Commands.ZOOM_BOX:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.ZOOM_BOX } );
			break;
		}
		
		case netgis.Commands.ZOOM_SCALE:
		{
			var text = src.innerText;
			var scale = Number.parseInt( text.split( ":" )[ 1 ] );
			netgis.util.invoke( src, netgis.Events.MAP_ZOOM_SCALE, { scale: scale, anim: true } );
			break;
		}
		
		case netgis.Commands.MEASURE_LINE:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.MEASURE_LINE } );
			break;
		}
		
		case netgis.Commands.MEASURE_AREA:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.MEASURE_AREA } );
			break;
		}
		
		case netgis.Commands.MEASURE_CLEAR:
		{
			netgis.util.invoke( src, netgis.Events.MEASURE_CLEAR, null );
			break;
		}
		
		case netgis.Commands.DRAW_POINTS:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.DRAW_POINTS } );
			break;
		}
		
		case netgis.Commands.DRAW_LINES:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.DRAW_LINES } );
			break;
		}
		
		case netgis.Commands.DRAW_POLYGONS:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.DRAW_POLYGONS } );
			break;
		}
		
		case netgis.Commands.MODIFY_FEATURES:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.MODIFY_FEATURES } );
			break;
		}
		
		case netgis.Commands.DELETE_FEATURES:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.DELETE_FEATURES } );
			break;
		}
		
		case netgis.Commands.BUFFER_FEATURES:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.BUFFER_FEATURES_DYNAMIC } );
			break;
		}
		
		case netgis.Commands.CUT_FEATURES:
		{
			netgis.util.invoke( src, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.CUT_FEATURES } );
			break;
		}
		
		case netgis.Commands.IMPORT_LAYER:
		{
			netgis.util.invoke( src, netgis.Events.IMPORT_LAYER_SHOW, null );
			break;
		}
		
		case netgis.Commands.EXPORT:
		{
			netgis.util.invoke( src, netgis.Events.EXPORT_SHOW, null );
			break;
		}
		
		case netgis.Commands.GEOLOCATION:
		{
			netgis.util.invoke( src, netgis.Events.GEOLOCATION_SHOW_OPTIONS, null );
			break;
		}
		
		default:
		{
			console.error( "unhandled command id", command );
			break;
		}
	}
};