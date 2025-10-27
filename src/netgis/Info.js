"use strict";

var netgis = netgis || {};

/**
 * Feature Info Module.
 * @param {JSON} config [Info.Config]{@link netgis.Info.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.Info = function( config )
{
	this.config = config;
	
	this.queryLayers = {};
	
	this.popup = new netgis.Popup();
	this.popup.setHeader( "Abfrage" );
	
	this.initConfig( config );
};

/**
 * Config Section "info"
 * @memberof netgis.Info
 * @enum
 */
netgis.Info.Config =
{
	/**
	 * Default MIME type for Get Feature Info requests
	 * @type String
	 */
	"default_format": "text/plain",
	
	/**
	 * Default proxy for all Feature Info requests
	 * @type String
	 */
	"proxy": ""
};

netgis.Info.prototype.initConfig = function( config )
{
	// Add Active Layers (Top To Bottom Order)
	var configLayers = config[ "layers" ];
	
	for ( var i = configLayers.length - 1; i >= 0; i-- )
	{
		var layer = configLayers[ i ];
		
		if ( layer[ "active" ] === true && this.isLayerQueryable( layer ) )
		{
			this.queryLayers[ layer[ "id" ] ] = layer;
		}
		else if ( this.queryLayers[ layer[ "id" ] ] )
		{
			delete this.queryLayers[ layer[ "id" ] ];
		}
	}
};

netgis.Info.prototype.attachTo = function( parent )
{
	this.popup.attachTo( parent );
	
	parent.addEventListener( netgis.Events.CLIENT_CONTEXT_RESPONSE, this.onClientContextResponse.bind( this ) );
	parent.addEventListener( netgis.Events.CLIENT_SET_MODE, this.onClientSetMode.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_LAYER_TOGGLE, this.onMapLayerToggle.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_CREATE, this.onMapLayerCreate.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_DELETE, this.onMapLayerDelete.bind( this ) );
	parent.addEventListener( netgis.Events.IMPORT_LAYER_ACCEPT, this.onImportLayerAccept.bind( this ) );
	parent.addEventListener( netgis.Events.IMPORT_GEOPORTAL_SUBMIT, this.onImportGeoportalSubmit.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_CLICK, this.onMapClick.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_FEATURE_CLICK, this.onMapFeatureClick.bind( this ) );
};

/**
 * @ignore
 * 
 * Checks for a queryable layer.
 * Does not check layer active state.
 * @param {object} layer Layer Config Parameters
 * @returns {Boolean}
 */
netgis.Info.prototype.isLayerQueryable = function( layer )
{
	var queryable = false;
	
	if ( layer[ "query" ] === true )
	{
		// Queryable Config Layers
		queryable = true;
	}
	else if ( layer[ "query" ] !== false )
	{
		// Default Query Behavior For WMS
		switch ( layer[ "type" ] )
		{
			case netgis.LayerTypes.WMS:
			case netgis.LayerTypes.WMST:
			{
				queryable = true;
				break;
			}
		}
	}
	
	return queryable;
};

/**
 * @ignore
 * 
 * @param {string} title
 * @param {string} content HTML
 */
netgis.Info.prototype.addSection = function( title, content, open )
{
	var html =
	[
		( open === true ) ? "<details open='open'>" : "<details>",
		"<summary class='netgis-button netgis-noselect netgis-clip-text netgis-color-d netgis-hover-text-a netgis-hover-d'>",
		title,
		"</summary>",
		"<div class='netgis-border-d'>",
		content,
		"</div>",
		"</details>"
	];
	
	this.popup.addContent( html.join( "" ) );
	
	// TODO: create element without html strings
};

netgis.Info.prototype.onClientContextResponse = function( e )
{
	var params = e.detail;
	this.initConfig( params.context.config );
};

netgis.Info.prototype.onClientSetMode = function( e )
{
	this.popup.hide();
};

netgis.Info.prototype.onMapLayerToggle = function( e )
{
	var params = e.detail;
	var id = params.id;
	
	if ( params.on )
	{
		// Get Layer By ID
		var layers = this.config[ "layers" ];
		var layer = null;

		for ( var i = 0; i < layers.length; i++ )
		{
			if ( layers[ i ][ "id" ] === id )
			{
				layer = layers[ i ];
				break;
			}
		}

		// Add Queryable Layer
		if ( layer )
		{
			if ( this.isLayerQueryable( layer ) ) this.queryLayers[ id ] = layer;
		}
	}
	else
	{
		// Remove Queryable Layer
		delete this.queryLayers[ id ];
	}
};

netgis.Info.prototype.onMapLayerCreate = function( e )
{
	var layer = e.detail;
	if ( this.isLayerQueryable( layer ) ) this.queryLayers[ layer.id ] = layer;
};

netgis.Info.prototype.onMapLayerDelete = function( e )
{
	var params = e.detail;
	delete this.queryLayers[ params.id ];
};

netgis.Info.prototype.onImportLayerAccept = function( e )
{
	var layer = e.detail;
	if ( this.isLayerQueryable( layer ) ) this.queryLayers[ layer.id ] = layer;
};

netgis.Info.prototype.onImportGeoportalSubmit = function( e )
{
	var params = e.detail;
	
	// TODO: make imported layers queryable
};

netgis.Info.prototype.onMapClick = function( e )
{
	var params = e.detail;
	
	if ( params.mode === netgis.Modes.SEARCH_PARCEL )
	{
		this.popup.clearContent();
		this.popup.hide();
		return;
	}
	
	if ( params.mode !== netgis.Modes.VIEW ) return;
	
	var cfg = this.config[ "info" ];
	
	// Popup
	if ( this.popup.container !== params.overlay )
	{
		this.popup.attachTo( params.overlay );
	}
	
	this.popup.clearContent();
	
	// Query Layers
	var count = 0;
	
	for ( var id in this.queryLayers )
	{
		var layer = this.queryLayers[ id ];
		
		// WMS Feature Info
		if ( params.info && params.info[ id ] )
		{
			var url = params.info[ id ];
			
			if ( cfg && cfg[ "proxy" ] && cfg[ "proxy" ].length > 0 ) url = cfg[ "proxy" ] + url;
			
			netgis.util.request( url, this.onLayerResponseWMS.bind( this ), { title: layer[ "title" ] } );

			// TODO: handle wms query error responses

			count += 1;
			
			continue;
		}
		
		// Auto Query For WMS With Undefined Config
		if ( ! layer[ "query_url" ] || layer[ "query_url" ] === "" )
		{
			switch ( layer[ "type" ] )
			{
				case netgis.LayerTypes.WMS:
				case netgis.LayerTypes.WMST:
				{
					var url = layer[ "url" ];
					
					// TODO: layer config query url template params replace

					var request =
					[
						"SERVICE=WMS",
						"VERSION=1.1.1",
						"REQUEST=GetFeatureInfo",
						"STYLES=",
						"LAYERS=" + window.encodeURIComponent( layer[ "name" ] ),
						"QUERY_LAYERS=" + window.encodeURIComponent( layer[ "name" ] ),
						"BBOX=" + params.view.bbox.join( "," ),
						"SRS=" + params.view.projection,
						"WIDTH=" + params.view.width,
						"HEIGHT=" + params.view.height,
						"X=" + Math.round( params.pixel[ 0 ] ),
						"Y=" + Math.round( params.pixel[ 1 ] ),
						"INFO_FORMAT=" + ( cfg && cfg[ "default_format" ] ? cfg[ "default_format" ] : "text/plain" )
					];

					url = url + ( url.indexOf( "?" ) === -1 ? "?" : "" ) + request.join( "&" );
					
					if ( cfg && cfg[ "proxy" ] && cfg[ "proxy" ].length > 0 ) url = cfg[ "proxy" ] + url;
					
					netgis.util.request( url, this.onLayerResponseWMS.bind( this ), { title: layer[ "title" ] } );

					// TODO: handle wms query error responses

					count += 1;

					break;
				}
			}
		}
	   
		// Query Using Config URL
		var url = layer[ "query_url" ];
		
		if ( url && url !== "" )
		{
			url = netgis.util.replace( url, "{bbox}", params.view.bbox.join( "," ) );
			url = netgis.util.replace( url, "{proj}", params.view.projection );
			url = netgis.util.replace( url, "{width}", params.view.width );
			url = netgis.util.replace( url, "{height}", params.view.height );
			url = netgis.util.replace( url, "{x}", params.coords[ 0 ] );
			url = netgis.util.replace( url, "{y}", params.coords[ 1 ] );
			url = netgis.util.replace( url, "{px}", params.pixel[ 0 ] );
			url = netgis.util.replace( url, "{py}", params.pixel[ 1 ] );
			url = netgis.util.replace( url, "{lon}", params.lon );
			url = netgis.util.replace( url, "{lat}", params.lat );
			
			if ( cfg && cfg[ "proxy" ] && cfg[ "proxy" ].length > 0 ) url = cfg[ "proxy" ] + url;

			netgis.util.request( url, this.onLayerResponseWMS.bind( this ), { title: layer[ "title" ] } );

			count += 1;
		}
	   
		// TODO: handle vector feature info on map feature click ?
	}
	
	if ( count > 0 )
	{
		this.popup.showLoader();
		this.popup.show();
	}
	else
	{
		this.popup.hide();
	}
};

netgis.Info.prototype.onMapFeatureClick = function( e )
{
	var params = e.detail;
	var props = params.properties;
	
	if ( params.mode === netgis.Modes.SEARCH_PARCEL )
	{
		this.popup.clearContent();
		this.popup.hide();
		return;
	}
	
	var open = false;
	var show = false;
	
	// Filter Feature Properties
	var title = null;
	var filtered = [];
	var blacklist = [ "geometry", "fill", "fill-opacity", "stroke", "stroke-opacity", "stroke-width", "styleUrl" ];
	
	for ( var k in props )
	{
		if ( blacklist.indexOf( k ) > -1 ) continue;
		
		var v = props[ k ];
		filtered.push( [ k, v ] );
		
		if ( ! title )
		{
			if ( k === "name" && v !== "" ) title = v;
			else if ( k === "title" && v !== "" ) title = v;
			else if ( k === "id" && v ) title = v;
		}
	}
		
	// Build Title
	if ( ! title && params.id ) title = params.id;
	title = title ? 'Feature "' + title + '"' : "Feature";
	
	if ( params.id === "geolocation" )
	{
		title = this.config[ "geolocation" ][ "marker_title" ];
		if ( ! title || title === "" ) title = "Geolocation";
		
		filtered.push( [ "Längengrad (Lon.)", params.lon ] );
		filtered.push( [ "Breitengrad (Lat.)", params.lat ] );
	}

	// Build Table
	var html = [];

	if ( filtered.length > 0 )
	{
		html.push( "<table>" );

		for ( var i = 0; i < filtered.length; i++ )
		{
			var item = filtered[ i ];
			var k = item[ 0 ];
			var v = item[ 1 ];

			html.push( "<tr class='netgis-hover-d'>" );
			html.push( "<th>" + k + "</th>" );
			html.push( "<td>" + v + "</td>" );
			html.push( "</tr>" );
		}

		html.push( "</table>" );
	}
	else
	{
		html.push( "<i>Keine Eigenschaften vorhanden...</i>" );
	}

	html = html.join( "" );

	// Add To Popup Content
	this.addSection( title, html, open );
	show = true;
	
	if ( ! this.popup.isVisible() && show )
	{
		this.popup.show();
	}
};

netgis.Info.prototype.onLayerResponseWMS = function( data, requestData, request )
{
	var title = requestData.title;
	var content = data;
	
	// Nothing Returned
	if ( ! data || data === "" ) data = "<p style='padding: 0mm 2mm;'><i>Keine Daten gefunden...</i></p>";
	
	// Check Content Type
	var contentType = request.getResponseHeader( "Content-Type" );
	
	if ( contentType )
	{
		switch ( contentType.split( ";" )[ 0 ] )
		{
			case "text/plain":
			{
				content = "<pre>" + content + "</pre>";
				break;
			}
		}
	}
	
	// Add To Content
	this.popup.hideLoader();
	this.addSection( title, content, false );
};