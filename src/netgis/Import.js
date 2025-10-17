"use strict";

var netgis = netgis || {};

/**
 * Import Module.
 * @param {JSON} config [Import.Config]{@link netgis.Import.Config}
 * @constructor
 * @memberof netgis
 */
netgis.Import = function( config )
{
	this.config = config;
	
	this.initElements( config );
	this.initSections( config );
	this.initPreview();
};

/**
 * Config Section "import"
 * @memberof netgis.Import
 * @enum
 */
netgis.Import.Config =
{
	/**
	 * Import modal title
	 * @type String
	 */
	"title": "Import Layer",
	
	/**
	 * Show feature preview for certain formats
	 * @type Boolean
	 */
	"preview": true,
	
	/**
	 * List of string options for the URL input
	 * @type Array
	 */
	"wms_options": [],
	
	/**
	 * List of string options for the URL input
	 * @type Array
	 */
	"wfs_options": [],
	
	/**
	 * Path to a proxy script to prepend for WFS requests
	 * @type String
	 */
	"wfs_proxy": "",
	
	/**
	 * Path to the GeoPackage library
	 * @type String
	 */
	"geopackage_lib": "/libs/geopackage/4.2.3/",
	
	/**
	 * Show Geoportal tab in import modal
	 * @type Boolean
	 * @memberof netgis.Import.Config
	 */
	"geoportal_tab": true,
	
	/**
	 * URL to send search requests to, should contain <code>{query}</code> placeholder
	 * @type String
	 */
	"geoportal_search_url": "",
	
	/**
	 * Enable Geoportal search autocomplete on key press
	 * @type Boolean
	 * @memberof netgis.Import.Config
	 */
	"geoportal_autocomplete": true
};

netgis.Import.prototype.initElements = function( config )
{
	var cfg = config[ "import" ];
	
	// Panel
	this.modal = new netgis.Modal( cfg[ "title" ] ? cfg[ "title" ] : "Import" );
	this.modal.container.classList.add( "netgis-import" );
	
	// Tabs
	var tabs = [ "WMS", "WFS", "GeoJSON", "GML", "GeoPackage", "Spatialite", "Shapefile" ];
	if ( cfg[ "geoportal_tab" ] ) tabs.unshift( "Geoportal" );
		
	this.tabs = new netgis.Tabs( tabs );
	this.tabs.container.style.position = "absolute";
	this.tabs.container.style.left = "0mm";
	this.tabs.container.style.right = "0mm";
	this.tabs.container.style.top = "12mm";
	this.tabs.container.style.bottom = "0mm";
	this.tabs.attachTo( this.modal.content );
};

netgis.Import.prototype.initSections = function( config )
{
	this.sections = {};
	
	var i = 0;
	
	// Geoportal
	if ( config[ "import" ] && config[ "import" ][ "geoportal_tab" ] === true )
	{
		this.sections.geoportal = this.tabs.getContentSection( i );
		i += 1;
		
		this.sections.geoportal.classList.add( "netgis-geoportal" );
		
		this.geoportalSearch = new netgis.Search( "Thema, Schlagwort..." );
		this.geoportalSearch.autocomplete = config[ "import" ][ "geoportal_autocomplete" ];
		this.geoportalSearch.container.addEventListener( netgis.Events.SEARCH_CHANGE, this.onGeoportalSearchChange.bind( this ) );
		this.geoportalSearch.container.addEventListener( netgis.Events.SEARCH_CLEAR, this.onGeoportalSearchClear.bind( this ) );
		this.geoportalSearch.attachTo( this.sections.geoportal );
		
		var searchLabel = document.createElement( "span" );
		searchLabel.innerHTML = "Suche im Datenkatalog:";
		this.geoportalSearch.label.insertBefore( searchLabel, this.geoportalSearch.label.firstChild );
		
		var searchButton = document.createElement( "button" );
		searchButton.innerHTML = "Suchen";
		searchButton.className = "netgis-color-a netgis-hover-c netgis-round netgis-shadow";
		searchButton.setAttribute( "type", "button" );
		searchButton.addEventListener( "click", this.onGeoportalSearchButtonClick.bind( this ) );
		this.geoportalSearch.label.appendChild( searchButton );
		
		// TODO: refactor and use common loader component (see Client loader)
		
		this.geoportalLoader = document.createElement( "div" );
		this.geoportalLoader.className = "netgis-loader netgis-text-a netgis-hide";
		this.geoportalLoader.innerHTML = "<i class='fas fa-cog'></i>";
		this.sections.geoportal.appendChild( this.geoportalLoader );
		
		this.geoportalResults = new netgis.Tree();
		this.geoportalResults.container.addEventListener( netgis.Events.TREE_ITEM_CHANGE, this.onGeoportalTreeItemChange.bind( this ) );
		this.geoportalResults.attachTo( this.sections.geoportal );
		
		this.geoportalSubmit = this.addButton( this.sections.geoportal, "<i class='netgis-icon fas fa-check'></i><span>Hinzufügen<span class='netgis-count'></span></span>", this.onGeoportalSubmit.bind( this ) );
	}
	
	// WMS
	this.sections.wms = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputText( this.sections.wms, "WMS-URL:", this.config[ "import" ][ "wms_options" ] );
	this.addButton( this.sections.wms, "<i class='netgis-icon fas fa-cloud-download-alt'></i><span>Dienst laden</span>", this.onWMSLoadClick.bind( this ) );
	
	this.addInputText( this.sections.wms, "Bezeichnung:" );
	this.addInputSelect( this.sections.wms, "Ebene:" );
	this.addInputSelect( this.sections.wms, "Format:" );
	this.addButton( this.sections.wms, "<i class='netgis-icon fas fa-check'></i><span>Hinzufügen</span>", this.onWMSAcceptClick.bind( this ) );
	
	this.showDetailsWMS( false );
	
	// WFS
	this.sections.wfs = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputText( this.sections.wfs, "WFS-URL:", this.config[ "import" ][ "wfs_options" ] );
	this.addButton( this.sections.wfs, "<i class='netgis-icon fas fa-cloud-download-alt'></i><span>Dienst laden</span>", this.onWFSLoadClick.bind( this ) );
	
	this.addInputText( this.sections.wfs, "Bezeichnung:" );
	this.addInputSelect( this.sections.wfs, "Ebene:" );
	this.addInputSelect( this.sections.wfs, "Format:" );
	this.addButton( this.sections.wfs, "<i class='netgis-icon fas fa-check'></i><span>Hinzufügen</span>", this.onWFSAcceptClick.bind( this ) );
	
	this.showDetailsWFS( false );
	
	// GeoJSON
	this.sections.geojson = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputFile( this.sections.geojson, "GeoJSON-Datei:", ".geojson,.json" );
	this.addText( this.sections.geojson, "<h3>Unterstützte Koordinatensysteme:</h3><ul><li>Web Mercator (EPSG:3857)</li><li>WGS84 / Lon-Lat (EPSG:4326)</li><li>ETRS89 / UTM Zone 32N (EPSG:25832)</li></ul>" );
	this.addButton( this.sections.geojson, "<i class='netgis-icon fas fa-check'></i><span>Datei laden</span>", this.onGeoJSONAcceptClick.bind( this ) );
	
	// GML
	this.sections.gml = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputFile( this.sections.gml, "GML-Datei:", ".gml,.xml" );
	this.addText( this.sections.gml, "<h3>Unterstützte Koordinatensysteme:</h3><ul><li>Web Mercator (EPSG:3857)</li><li>WGS84 / Lon-Lat (EPSG:4326)</li><li>ETRS89 / UTM Zone 32N (EPSG:25832)</li></ul>" );
	this.addButton( this.sections.gml, "<i class='netgis-icon fas fa-check'></i><span>Datei laden</span>", this.onGMLAcceptClick.bind( this ) );
	
	// GeoPackage
	this.sections.geopackage = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputFile( this.sections.geopackage, "GeoPackage-Datei:", ".gpkg" );
	this.addText( this.sections.geopackage, "<h3>Unterstützte Koordinatensysteme:</h3><ul><li>Web Mercator (EPSG:3857)</li><li>WGS84 / Lon-Lat (EPSG:4326)</li><li>ETRS89 / UTM Zone 32N (EPSG:25832)</li></ul>" );
	this.addButton( this.sections.geopackage, "<i class='netgis-icon fas fa-check'></i><span>Datei laden</span>", this.onGeoPackageAcceptClick.bind( this ) );
	
	// Spatialite
	this.sections.spatialite = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputFile( this.sections.spatialite, "Spatialite-Datei:", ".sqlite" );
	this.addText( this.sections.spatialite, "<h3>Unterstützte Koordinatensysteme:</h3><ul><li>Web Mercator (EPSG:3857)</li><li>WGS84 / Lon-Lat (EPSG:4326)</li><li>ETRS89 / UTM Zone 32N (EPSG:25832)</li></ul>" );
	this.addButton( this.sections.spatialite, "<i class='netgis-icon fas fa-check'></i><span>Datei laden</span>", this.onSpatialiteAcceptClick.bind( this ) );
	
	// Shapefile
	this.sections.shapefile = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputFile( this.sections.shapefile, "Shapefile-Zip-Datei:", ".zip" );
	this.addText( this.sections.shapefile, "<h3>Unterstützte Koordinatensysteme:</h3><ul><li>Web Mercator (EPSG:3857)</li><li>WGS84 / Lon-Lat (EPSG:4326)</li><li>ETRS89 / UTM Zone 32N (EPSG:25832)</li></ul>" );
	this.addButton( this.sections.shapefile, "<i class='netgis-icon fas fa-check'></i><span>Datei laden</span>", this.onShapefileAcceptClick.bind( this ) );
};

netgis.Import.prototype.initPreview = function()
{
	// TODO: import features preview modal with table / tree view and map
	
	this.preview = new netgis.Modal( "Vorschau" );
	this.preview.attachTo( this.modal.content );
	
	this.previewMapContainer = document.createElement( "div" );
	this.previewMapContainer.className = "netgis-preview-map";
	this.preview.content.appendChild( this.previewMapContainer );
	
	if ( ol )
	{
		var mapconfig = this.config[ "map" ];
		
		var viewParams =
		{
			projection: mapconfig[ "projection" ],
			center: mapconfig[ "centerLonLat" ] ? ol.proj.fromLonLat( mapconfig[ "centerLonLat" ] ) : mapconfig.center,
			zoom: mapconfig[ "zoom" ]
		};
		
		this.previewMap = new ol.Map
		(
			{
				target: this.previewMapContainer,
				view: new ol.View( viewParams ),
				pixelRatio: 1.0,
				moveTolerance: 3,
				controls: []
			}
		);

		this.previewMap.getView().padding = [ 10, 10, 10, 10 ];

		this.previewMap.addLayer( new ol.layer.Tile( { source: new ol.source.OSM() } ) );
	}
	
	this.previewTree = new netgis.Tree();
	this.previewTree.container.classList.add( "netgis-preview-tree" );
	this.previewTree.attachTo( this.preview.content );
	
	this.previewTree.container.addEventListener( netgis.Events.TREE_ITEM_CHANGE, this.onPreviewTreeItemChange.bind( this ) );
	
	this.previewSubmit = document.createElement( "button" );
	this.previewSubmit.setAttribute( "type", "button" );
	this.previewSubmit.className = "netgis-import-submit netgis-button netgis-center netgis-color-a netgis-hover-c netgis-shadow";
	this.previewSubmit.innerHTML = "<i class='netgis-icon fas fa-check'></i><span>Hinzufügen</span>";
	this.previewSubmit.addEventListener( "click", this.onPreviewSubmitClick.bind( this ) );
	this.preview.content.appendChild( this.previewSubmit );
};

netgis.Import.prototype.attachTo = function( parent )
{
	parent.appendChild( this.modal.container );
	
	parent.addEventListener( netgis.Events.IMPORT_LAYER_SHOW, this.onImportShow.bind( this ) );
	parent.addEventListener( netgis.Events.IMPORT_LAYER_PREVIEW_FEATURES, this.onImportPreviewFeatures.bind( this ) );
};

netgis.Import.prototype.addText = function( parent, text )
{
	var div = document.createElement( "div" );
	div.innerHTML = text;
	
	parent.appendChild( div );
	
	return div;
};

netgis.Import.prototype.addButton = function( parent, title, handler )
{
	var button = document.createElement( "button" );
	button.className = "netgis-button netgis-center netgis-color-a netgis-hover-c netgis-shadow";
	button.setAttribute( "type", "button" );
	button.innerHTML = title;
	
	if ( handler ) button.onclick = handler;
	
	parent.appendChild( button );
	
	return button;
};

netgis.Import.prototype.addInputText = function( parent, title, options )
{
	var label = document.createElement( "label" );
	label.innerHTML = title;
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "text" );
	label.appendChild( input );
	
	if ( options )
	{
		var listID = "list-" + netgis.util.stringToID( title );
		
		var datalist = document.createElement( "datalist" );
		datalist.setAttribute( "id", listID );
		
		for ( var i = 0; i < options.length; i++ )
		{
			var option = document.createElement( "option" );
			option.setAttribute( "value", options[ i ] );
			datalist.appendChild( option );
		}
		
		parent.appendChild( datalist );
		input.setAttribute( "list", listID );
	}
	
	parent.appendChild( label );
	
	return input;
};

netgis.Import.prototype.addInputSelect = function( parent, title, options )
{
	var label = document.createElement( "label" );
	label.innerHTML = title;
	
	var select = document.createElement( "select" );
	label.appendChild( select );
	
	parent.appendChild( label );
	
	return select;
};

netgis.Import.prototype.addInputFile = function( parent, title, accept )
{
	var label = document.createElement( "label" );
	label.innerHTML = title;
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "file" );
	input.setAttribute( "accept", accept );
	label.appendChild( input );
	
	parent.appendChild( label );
	
	return input;
};

netgis.Import.prototype.getLayerOrder = function()
{
	return 10000; // TODO: increase by imported layer count to match tree order?
};

netgis.Import.prototype.showDetailsWMS = function( on )
{
	var section = this.sections.wms;
	var labels = section.getElementsByTagName( "label" );
	var buttons = section.getElementsByTagName( "button" );
	
	if ( on )
	{
		labels[ 1 ].classList.remove( "netgis-hide" );
		labels[ 2 ].classList.remove( "netgis-hide" );
		labels[ 3 ].classList.remove( "netgis-hide" );
		buttons[ 1 ].classList.remove( "netgis-hide" );
	}
	else
	{
		labels[ 1 ].classList.add( "netgis-hide" );
		labels[ 2 ].classList.add( "netgis-hide" );
		labels[ 3 ].classList.add( "netgis-hide" );
		buttons[ 1 ].classList.add( "netgis-hide" );
	}
};

netgis.Import.prototype.showDetailsWFS = function( on )
{
	var section = this.sections.wfs;
	var labels = section.getElementsByTagName( "label" );
	var buttons = section.getElementsByTagName( "button" );
	
	if ( on )
	{
		labels[ 1 ].classList.remove( "netgis-hide" );
		labels[ 2 ].classList.remove( "netgis-hide" );
		labels[ 3 ].classList.remove( "netgis-hide" );
		buttons[ 1 ].classList.remove( "netgis-hide" );
	}
	else
	{
		labels[ 1 ].classList.add( "netgis-hide" );
		labels[ 2 ].classList.add( "netgis-hide" );
		labels[ 3 ].classList.add( "netgis-hide" );
		buttons[ 1 ].classList.add( "netgis-hide" );
	}
};

netgis.Import.prototype.submitImportLayer = function( params )
{
	if ( this.config[ "import" ][ "preview" ] === true )
	{
		netgis.util.invoke( this.modal.container, netgis.Events.IMPORT_LAYER_PREVIEW, params );
	}
	else
	{
		this.config[ "layers" ].push( params );
		netgis.util.invoke( this.modal.container, netgis.Events.IMPORT_LAYER_ACCEPT, params );
		this.modal.hide();
	}
};

netgis.Import.prototype.onImportShow = function( e )
{
	this.modal.show();
	this.tabs.updateHeaderScroll();
};

netgis.Import.prototype.onWMSLoadClick = function( e )
{
	this.showDetailsWMS( false );
	
	var section = this.sections.wms;
	var inputs = section.getElementsByTagName( "input" );
	
	// Input URL
	var url = inputs[ 0 ].value;
	url = url.trim();
	
	if ( url.length < 1 ) return;
	
	// Get Base URL
	var parsedURL = netgis.util.parseURL( url );
	var baseURL = parsedURL.base;
	var params = parsedURL.parameters;
	
	params.push( "request=GetCapabilities" );
	params = params.join( "&" );
	
	if ( params.search( "service=" ) === -1 ) params += "&service=WMS";
	
	// Capabilities URL
	var capsURL = baseURL + "?" + params;
	netgis.util.request( capsURL, this.onWMSCapsResponse.bind( this ) );
};

netgis.Import.prototype.onWMSCapsResponse = function( data )
{
	var parser = new DOMParser();
	var xml = parser.parseFromString( data, "text/xml" );
	var caps = xml.documentElement;
	
	// Check For Parsing Errors
	var errors = xml.getElementsByTagName( "parsererror" );
	
	for ( var i = 0; i < errors.length; i++ )
	{
		console.error( "WMS caps parser error:", errors[ i ].textContent );
	}
	
	if ( errors.length > 0 ) alert( data.length > 0 ? data : errors[ 0 ].textContent );
   
	// Inputs
	var section = this.sections.wms;
	var inputs = section.getElementsByTagName( "input" );
	var selects = section.getElementsByTagName( "select" );
	
	var selectLayer = selects[ 0 ];
	var selectFormat = selects[ 1 ];
   
	for ( var i = selectLayer.options.length - 1; i >= 0; i-- ) selectLayer.options.remove( i );
	for ( var i = selectFormat.options.length - 1; i >= 0; i-- ) selectFormat.options.remove( i );
	
	switch ( caps.nodeName )
	{
		default:
		case "HTML":
		{
			console.warn( "could not detect WMS service", caps );
			break;
		}
		
		// WMS
		case "WMS_Capabilities":
		case "WMT_MS_Capabilities":
		{
			var version = caps.getAttribute( "version" );
			var service = caps.getElementsByTagName( "Service" )[ 0 ];
			var title = service.getElementsByTagName( "Title" )[ 0 ].textContent;
			inputs[ 1 ].value = title;
			
			var layerItems = caps.getElementsByTagName( "Layer" );
			var layers = [];
			
			for ( var l = 0; l < layerItems.length; l++ )
			{
				var item = layerItems[ l ];
				var layerName = item.getElementsByTagName( "Name" )[ 0 ].textContent;
				var layerTitle = item.getElementsByTagName( "Title" )[ 0 ].textContent;
				
				layers.push( { name: layerName, title: layerTitle } );
				
				var option = document.createElement( "option" );
				option.text = layerTitle;
				option.value = layerName;
				selectLayer.options.add( option ); 
			}
			
			var getMap = caps.getElementsByTagName( "GetMap" )[ 0 ];
			var formatItems = getMap.getElementsByTagName( "Format" );
			var formats = [];
			
			for ( var f = 0; f < formatItems.length; f++ )
			{
				var item = formatItems[ f ];
				var format = item.textContent;
				
				if ( format.search( "image" ) === -1 ) continue;
				
				formats.push( format );
				
				var option = document.createElement( "option" );
				option.text = format;
				option.value = format;
				selectFormat.options.add( option );
			}
			
			break;
		}
	}
	
	this.showDetailsWMS( true );
};

netgis.Import.prototype.onWMSAcceptClick = function( e )
{
	// Inputs
	var section = this.sections.wms;
	var inputs = section.getElementsByTagName( "input" );
	var selects = section.getElementsByTagName( "select" );
	
	var id = "import_" + netgis.util.getTimeStamp( true );
	var serviceURL = inputs[ 0 ].value;
	var serviceTitle = inputs[ 1 ].value;
	var layerTitle = selects[ 0 ].selectedOptions[ 0 ].innerText;
	var layerName = selects[ 0 ].value;
	var layerFormat = selects[ 1 ].value;
	
	serviceURL = netgis.util.replace( serviceURL, "request=", "oldrequest=" );
	serviceURL = netgis.util.replace( serviceURL, "Request=", "oldrequest=" );
	
	// Get Base URL
	var parsedURL = netgis.util.parseURL( serviceURL );
	var baseURL = parsedURL.base;
	var params = parsedURL.parameters;
	
	params = params.join( "&" );
	if ( params.search( "service=" ) === -1 ) params += "&service=WMS";
	
	serviceURL = baseURL + "?" + params;
	
	// Final Layer Params
	var params =
	{
		id: id,
		folder: null,
		active: true,
		query: true, // TODO: add dialog checkbox for queryable ? check caps for get feature info command support ?
		order: this.getLayerOrder(),
		
		type: netgis.LayerTypes.WMS,
		url: serviceURL,
		title: layerTitle,
		name: layerName,
		format: layerFormat,
		tiled: true
	};
	
	this.config[ "layers" ].push( params );
	
	netgis.util.invoke( section, netgis.Events.IMPORT_LAYER_ACCEPT, params );
	
	this.modal.hide();
};

netgis.Import.prototype.onWFSLoadClick = function( e )
{
	this.showDetailsWFS( false );
	
	var section = this.sections.wfs;
	var inputs = section.getElementsByTagName( "input" );
	
	// Input URL
	var url = inputs[ 0 ].value;
	url = url.trim();
	
	if ( url.length < 1 ) return;
	
	// Get Base URL
	var qmark = url.indexOf( "?" );
	var baseURL = ( qmark > -1 ) ? url.substr( 0, qmark ) : url;
	
	// Get Params
	var params = [ "request=GetCapabilities" ];
	
	if ( qmark > -1 )
	{
		// Existing Params
		var parts = url.substr( qmark + 1 );
		parts = parts.split( "&" );
		
		for ( var p = 0; p < parts.length; p++ )
		{
			var part = parts[ p ];
			part = part.toLowerCase();
			
			if ( part.search( "service" ) > -1 ) { params.push( part ); continue; }
			if ( part.search( "version" ) > -1 ) { params.push( part ); continue; }
			if ( part.search( "request" ) > -1 ) { continue; }
			
			params.push( part );
		}
	}
	
	params = params.join( "&" );
	
	if ( params.search( "service=" ) === -1 ) params += "&service=WFS";
	
	// Capabilities URL
	var capsURL = baseURL + "?" + params;
	
	if ( this.config[ "import" ][ "wfs_proxy" ] )
		capsURL = this.config[ "import" ][ "wfs_proxy" ] + capsURL;
	
	netgis.util.request( capsURL, this.onWFSCapsResponse.bind( this ) );
};

netgis.Import.prototype.onWFSCapsResponse = function( data )
{
	var parser = new DOMParser();
	var xml = parser.parseFromString( data, "text/xml" );
	var caps = xml.documentElement;
	
	// Check For Parsing Errors
	var errors = xml.getElementsByTagName( "parsererror" );
	
	for ( var i = 0; i < errors.length; i++ )
	{
		console.error( "WFS caps parser error:", errors[ i ].textContent );
	}
	
	if ( errors.length > 0 ) alert( data.length > 0 ? data : errors[ 0 ].textContent );
   
	// Inputs
	var section = this.sections.wfs;
	var inputs = section.getElementsByTagName( "input" );
	var selects = section.getElementsByTagName( "select" );
	
	var selectLayer = selects[ 0 ];
	var selectFormat = selects[ 1 ];
   
	for ( var i = selectLayer.options.length - 1; i >= 0; i-- ) selectLayer.options.remove( i );
	for ( var i = selectFormat.options.length - 1; i >= 0; i-- ) selectFormat.options.remove( i );
	
	switch ( caps.nodeName )
	{
		default:
		case "HTML":
		{
			console.error( "could not detect WFS service", caps );
			break;
		}
		
		case "WFS_Capabilities":
		case "wfs:WFS_Capabilities":
		{
			var version = caps.getAttribute( "version" );
			var service = caps.getElementsByTagName( "ows:ServiceIdentification" )[ 0 ];
			var title = service.getElementsByTagName( "ows:Title" )[ 0 ].textContent;
			inputs[ 1 ].value = title;
			
			var featureTypeItems = caps.getElementsByTagName( "FeatureType" );
			var types = [];
			
			for ( var l = 0; l < featureTypeItems.length; l++ )
			{
				var item = featureTypeItems[ l ];
				var typeName = item.getElementsByTagName( "Name" )[ 0 ].textContent;
				var typeTitle = item.getElementsByTagName( "Title" )[ 0 ].textContent;
				
				types.push( { name: typeName, title: typeTitle } );
				
				var option = document.createElement( "option" );
				option.text = typeTitle;
				option.value = typeName;
				selectLayer.options.add( option ); 
			}
			
			var operations = caps.getElementsByTagName( "ows:Operation" );
			var getFeature = null;
			
			for ( var o = 0; o < operations.length; o++ )
			{
				if ( operations[ o ].getAttribute( "name" ) === "GetFeature" )
				{
					getFeature = operations[ o ];
					break;
				}
			}
			
			var preferredFormat = null;
			
			if ( getFeature )
			{
				var parameters = getFeature.getElementsByTagName( "ows:Parameter" );
				
				for ( var p = 0; p < parameters.length; p++ )
				{
					var parameter = parameters[ p ];
					
					if ( parameter.getAttribute( "name" ) === "outputFormat" )
					{
						var formatItems = parameter.getElementsByTagName( "ows:Value" );

						for ( var f = 0; f < formatItems.length; f++ )
						{
							var item = formatItems[ f ];
							var format = item.textContent;

							var option = document.createElement( "option" );
							option.text = format;
							option.value = format;
							selectFormat.options.add( option );
							
							if ( format.search( "json" ) > -1 ) preferredFormat = format;
						}
						
						break;
					}
				}
			}
			
			if ( preferredFormat ) selectFormat.value = preferredFormat;
			
			break;
		}
	}
	
	this.showDetailsWFS( true );
};

netgis.Import.prototype.onWFSAcceptClick = function( e )
{
	// Inputs
	var section = this.sections.wfs;
	var inputs = section.getElementsByTagName( "input" );
	var selects = section.getElementsByTagName( "select" );
	
	var id = "import_" + netgis.util.getTimeStamp( true );
	var serviceURL = inputs[ 0 ].value;
	var serviceTitle = inputs[ 1 ].value;
	var layerTitle = selects[ 0 ].selectedOptions[ 0 ].innerText;
	var layerName = selects[ 0 ].value;
	var layerFormat = selects[ 1 ].value;
	
	serviceURL = netgis.util.replace( serviceURL, "request=", "oldrequest=" );
	serviceURL = netgis.util.replace( serviceURL, "Request=", "oldrequest=" );
	
	if ( this.config[ "import" ][ "wfs_proxy" ] )
		serviceURL = this.config[ "import" ][ "wfs_proxy" ] + serviceURL;
	
	var params =
	{
		id: id,
		folder: null,
		active: true,
		order: this.getLayerOrder(),
		style: this.config[ "styles" ][ "import" ],
		
		title: layerTitle,
		type: netgis.LayerTypes.WFS,
		url: serviceURL,
		name: layerName,
		format: layerFormat
	};
	
	this.config[ "layers" ].push( params );
	
	netgis.util.invoke( section, netgis.Events.IMPORT_LAYER_ACCEPT, params );
	
	this.modal.hide();
};

netgis.Import.prototype.onGeoJSONAcceptClick = function( e )
{
	// Inputs
	var section = this.sections.geojson;
	var inputs = section.getElementsByTagName( "input" );
	
	var file = inputs[ 0 ].files[ 0 ];
	
	if ( ! file )
	{
		alert( "No file selected!" );
		return;
	}
	
	var reader = new FileReader();
	reader.title = file.name;
	reader.onload = this.onGeoJSONLoad.bind( this );
	reader.readAsText( file );
};

netgis.Import.prototype.onGeoJSONLoad = function( e )
{
	var section = this.sections.geojson;
	var reader = e.target;
	
	var title = reader.title;
	var data = reader.result;
	
	var id = "import_" + netgis.util.getTimeStamp( true );
	
	var params =
	{
		id: id,
		folder: null,
		active: true,
		order: this.getLayerOrder(),
		style: this.config[ "styles" ][ "import" ],
		
		title: title,
		type: netgis.LayerTypes.GEOJSON,
		data: data
	};
	
	this.submitImportLayer( params );
};

netgis.Import.prototype.onGMLAcceptClick = function( e )
{
	// Inputs
	var section = this.sections.gml;
	var inputs = section.getElementsByTagName( "input" );
	
	var file = inputs[ 0 ].files[ 0 ];
	
	if ( ! file )
	{
		alert( "No file selected!" );
		return;
	}
	
	var reader = new FileReader();
	reader.title = file.name;
	reader.onload = this.onGMLLoad.bind( this );
	reader.readAsText( file );
};

netgis.Import.prototype.onGMLLoad = function( e )
{
	var section = this.sections.gml;
	var reader = e.target;
	var data = reader.result;
	
	var id = "import_" + netgis.util.getTimeStamp( true );
	var title = reader.title;
	
	var params =
	{
		id: id,
		folder: null,
		active: true,
		order: this.getLayerOrder(),
		style: this.config[ "styles" ][ "import" ],
		
		title: title,
		type: netgis.LayerTypes.GML,
		data: data
	};
	
	this.submitImportLayer( params );
};

netgis.Import.prototype.onGeoPackageAcceptClick = function( e )
{
	// Inputs
	var section = this.sections.geopackage;
	var inputs = section.getElementsByTagName( "input" );
	
	var file = inputs[ 0 ].files[ 0 ];
	
	if ( ! file )
	{
		alert( "No file selected!" );
		return;
	}
	
	var reader = new FileReader();
	reader.title = file.name;
	reader.onload = this.onGeoPackageLoad.bind( this );
	reader.readAsArrayBuffer( file );
};

netgis.Import.prototype.onGeoPackageLoad = function( e )
{
	var section = this.sections.geopackage;
	var reader = e.target;
	var data = reader.result;
	
	var id = "import_" + netgis.util.getTimeStamp( true );
	var title = reader.title;
	
	var params =
	{
		id: id,
		folder: null,
		active: true,
		order: this.getLayerOrder(),
		style: this.config[ "styles" ][ "import" ],
		
		title: title,
		type: netgis.LayerTypes.GEOPACKAGE,
		data: data
	};
	
	this.submitImportLayer( params );
};

netgis.Import.prototype.onSpatialiteAcceptClick = function( e )
{
	// Inputs
	var section = this.sections.spatialite;
	var inputs = section.getElementsByTagName( "input" );
	
	var file = inputs[ 0 ].files[ 0 ];
	
	if ( ! file )
	{
		alert( "No file selected!" );
		return;
	}
	
	var reader = new FileReader();
	reader.title = file.name;
	reader.onload = this.onSpatialiteLoad.bind( this );
	reader.readAsArrayBuffer( file );
};

netgis.Import.prototype.onSpatialiteLoad = function( e )
{
	var section = this.sections.spatialite;
	var reader = e.target;
	var data = reader.result;
	
	var id = "import_" + netgis.util.getTimeStamp( true );
	var title = reader.title;
	
	var params =
	{
		id: id,
		folder: null,
		active: true,
		order: this.getLayerOrder(),
		style: this.config[ "styles" ][ "import" ],
		
		title: title,
		type: netgis.LayerTypes.SPATIALITE,
		data: data
	};
	
	this.submitImportLayer( params );
};

netgis.Import.prototype.onShapefileAcceptClick = function( e )
{
	// Inputs
	var section = this.sections.shapefile;
	var inputs = section.getElementsByTagName( "input" );
	
	var file = inputs[ 0 ].files[ 0 ];
	
	if ( ! file )
	{
		alert( "No file selected!" );
		return;
	}
	
	var reader = new FileReader();
	reader.title = file.name;
	reader.onload = this.onShapefileLoad.bind( this );
	reader.readAsArrayBuffer( file );
};

netgis.Import.prototype.onShapefileLoad = function( e )
{
	var section = this.sections.shapefile;
	var reader = e.target;
	var data = reader.result;
	
	var id = "import_" + netgis.util.getTimeStamp( true );
	var title = reader.title;
	
	var params =
	{
		id: id,
		folder: null,
		active: true,
		order: this.getLayerOrder(),
		style: this.config[ "styles" ][ "import" ],
		
		title: title,
		type: netgis.LayerTypes.SHAPEFILE,
		data: data
	};
	
	this.submitImportLayer( params );
};

netgis.Import.prototype.onImportPreviewFeatures = function( e )
{
	var params = e.detail;
	var layer = params.layer;
	
	// Clear All
	this.previewTree.clear();
	
	var layers = this.previewMap.getLayers().getArray();
	for ( var i = 1; i < layers.length; i++ ) this.previewMap.removeLayer( layers[ i ] );
	
	// TODO: get preview map renderer from config
	if ( ! ol ) { console.error( "import preview only supported with OL map renderer", layer ); return; }
	
	var styleConfig = config[ "styles" ][ "import" ];
	
	var style = new ol.style.Style
	(
		{
			fill: new ol.style.Fill( { color: styleConfig[ "fill" ] } ),
			stroke: new ol.style.Stroke( { color: styleConfig[ "stroke" ], width: styleConfig[ "width" ] } )
		}
	);
	
	layer.setStyle( style );
	
	this.previewMap.addLayer( layer );
	
	var folder = this.previewTree.addFolder( null, params.id, params.title );
	
	// Delay Showing Features Until Fully Loaded	
	var features = layer.getSource().getFeatures();
	
	if ( features.length === 0 )
	{
		// Delayed Feature Loading
		var self = this;
		
		layer.getSource().on
		(
			"addfeature",
			function( e )
			{			
				if ( self.featureLoadTimeout ) window.clearTimeout( self.featureLoadTimeout );

				self.featureLoadTimeout = window.setTimeout
				(
					function()
					{					
						var features = layer.getSource().getFeatures();
						self.updatePreviewFeatures( features, folder, layer, params );
						self.featureLoadTimeout = null;
					},
					100
				);
			}
		);
	}
	else
	{
		// Direct Feature Loading
		this.updatePreviewFeatures( features, folder, layer, params );
	}
};

netgis.Import.prototype.updatePreviewFeatures = function( features, folder, layer, params )
{
	// TODO: passing all params necessary ?
	
	for ( var i = 0; i < features.length; i++ )
	{
		var feature = features[ i ];
		var id = feature.getId();
		var props = feature.getProperties();

		if ( ! id )
		{
			id = i + 1;
			feature.setId( id );
		}

		var title = null;

		for ( var key in props )
		{
			switch ( key.toLowerCase() )
			{
				case "name": { title = props[ key ]; break; }
				case "title": { title = props[ key ]; break; }
				case "id": { title = props[ key ]; break; }
				case "gid": { title = props[ key ]; break; }
				case "oid": { title = props[ key ]; break; }
				case "objectid": { title = props[ key ]; break; }
			}
		}

		if ( ! title ) title = id;
		
		// Append Length / Area
		var geom = feature.getGeometry();
		
		if ( geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon )
		{
			title += " (" + netgis.util.formatArea( geom.getArea() ) + ")";
		}
		else if ( geom instanceof ol.geom.LineString )
		{
			title += " (" + netgis.util.formatArea( geom.getLength() ) + ")";
		}
		else if ( geom instanceof ol.geom.MultiLineString )
		{
			var len = 0.0;
			var parts = geom.getLineStrings();
			
			for ( var j = 0; j < parts.length; j++ )
				len += parts[ j ].getLength();
			
			title += " (" + netgis.util.formatArea( len ) + ")";
		}

		// Create Checkbox
		this.previewTree.addCheckbox( folder, id, "Feature " + title, true );
	}

	this.previewTree.setFolderOpen( params.id, true );
	this.previewTree.updateFolderChecks();

	this.preview.show();

	this.previewMap.updateSize();
	this.previewMap.getView().fit( layer.getSource().getExtent() );
};

netgis.Import.prototype.onPreviewSubmitClick = function( e )
{
	var folder = this.previewTree.container.getElementsByClassName( "netgis-folder" )[ 0 ];
	var layerID = folder.getAttribute( "data-id" );
	var layerTitle = folder.getElementsByTagName( "span" )[ 0 ].innerText;
	
	var items = this.previewTree.container.getElementsByTagName( "input" );
	
	var layer = this.previewMap.getLayers().getArray()[ 1 ];
	var source = layer.getSource();
	var features = [];
	
	for ( var i = 1; i < items.length; i++ )
	{
		var item = items[ i ];
		var checked = item.checked;
		
		if ( ! checked ) continue;
		
		var id = item.getAttribute( "data-id" );
		var feature = source.getFeatureById( id );
		
		features.push( feature );
	}
	
	var format = new ol.format.GeoJSON();
	var geojson = format.writeFeaturesObject( features );
	
	// Projection not set automatically, assume the same as Map View
	var proj = this.previewMap.getView().getProjection().getCode();
	geojson[ "crs" ] = { "type": "name", "properties": { "name": "urn:ogc:def:crs:" + proj.replace( ":", "::" ) } };
	
	var params =
	{
		id: layerID,
		folder: null,
		active: true,
		order: this.getLayerOrder(),
		style: this.config[ "styles" ][ "import" ],
		
		title: layerTitle,
		type: netgis.LayerTypes.GEOJSON,
		data: geojson
	};
	
	this.config[ "layers" ].push( params );
	
	netgis.util.invoke( this.preview.container, netgis.Events.IMPORT_LAYER_ACCEPT, params );
	
	this.preview.hide();
	this.modal.hide();
};

netgis.Import.prototype.onPreviewTreeItemChange = function( e )
{
	var params = e.detail;
	
	var layer = this.previewMap.getLayers().getArray()[ 1 ];
	var feature = layer.getSource().getFeatureById( params.id );
	
	if ( params.checked )
	{
		feature.setStyle( null );
	}
	else
	{
		feature.setStyle( new ol.style.Style( {} ) );
	}
};

netgis.Import.prototype.onGeoportalSearchKeyUp = function( e )
{
	var key = e.keyCode;
	
	switch ( key )
	{
		// Enter
		case 13:
		{
			break;
		}
		
		// Escape
		case 27:
		{
			break;
		}
		
		default:
		{
			this.onGeoportalSearchChange();
			break;
		}
	}
};

netgis.Import.prototype.onGeoportalSearchChange = function( e )
{
	var params = e.detail;
	var query = params.query;
	
	if ( query.length > 0 )
	{
		this.geoportalLoader.classList.remove( "netgis-hide" );
		
		query = netgis.util.replace( query, " ", "," );
		
		var url = this.config[ "import" ][ "geoportal_search_url" ];
		url = netgis.util.replace( url, "{query}", window.encodeURIComponent( query ) );
		
		netgis.util.request( url, this.onGeoportalSearchResponse.bind( this ) );
		
		this.geoportalSearch.showClearButton( true );
	}
};

netgis.Import.prototype.onGeoportalSearchClear = function( e )
{
	this.geoportalResults.clear();
};

netgis.Import.prototype.onGeoportalSearchResponse = function( data )
{
	var json = JSON.parse( data );
	
	this.geoportalResults.clear();
	
	var searchResults = json[ "wms" ][ "srv" ];
	
	this.geoportalDataRaw = searchResults;
			
	if ( searchResults.length > 0 )
	{
		//layerResultsPanel.collapse( "show" );
	}

	var total = json[ "wms" ][ "md" ][ "nresults" ];

	if ( total > 40 )
	{
		//layerResultsAlert.toggleClass( "hidden", false );
		//layerResultsAlert.find( "#layer-results-total" ).text( total );
	}
	else
	{
		//layerResultsAlert.toggleClass( "hidden", true );
	}

	var children;

	function recursive( layer )
	{
		if ( layer && layer.layer )
		{
			for ( var c = 0; c < layer.layer.length; c++ )
				recursive( layer.layer[ c ] );
		}
		else if ( layer )
		{
			children.push( layer );
		}

		return children.length;
	}
	
	this.geoportalData = [];

	for ( var l = 0; l < searchResults.length; l++ )
	{
		var layer = searchResults[ l ];
		
		// Get children recursively
		children = [];
		var count = recursive( layer );
		
		// Service Folder
		var title = layer[ "title" ] + " (" + count + ")";
		
		var folder = this.geoportalResults.addFolder( null, l, title );
		folder.setAttribute( "title", layer[ "abstract" ] );
		
		for ( var c = 0; c < children.length; c++ )
		{
			var child = children[ c ];
			
			// Layer Item
			this.geoportalResults.addCheckbox( folder, c, child[ "title" ] );
		}
		
		layer.children = children;
		this.geoportalData.push( layer );
	}

	//TODO: add click handler for layer result child
	
	this.geoportalLoader.classList.add( "netgis-hide" );
};

netgis.Import.prototype.onGeoportalSearchButtonClick = function( e )
{
	this.geoportalSearch.onInputTimeout();
};

netgis.Import.prototype.onGeoportalTreeItemChange = function( e )
{
	var params = e.detail;
	
	// Update Checked Count
	var items = this.geoportalResults.container.getElementsByClassName( "netgis-item" );
	var count = 0;
	var total = items.length;
	
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[ i ];
		var input = item.getElementsByTagName( "input" )[ 0 ];
		
		if ( input.checked ) count += 1;
	}
	
	var span = this.geoportalSubmit.getElementsByClassName( "netgis-count" )[ 0 ];
	
	if ( count === 0 )
	{
		span.innerHTML = "";
	}
	else
	{
		span.innerHTML = " (" + count + ")";
	}
};

netgis.Import.prototype.onGeoportalSubmit = function( e )
{
	var items = this.geoportalResults.container.getElementsByClassName( "netgis-item" );
	
	var count = 0;
	
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[ i ];
		var input = item.getElementsByTagName( "input" )[ 0 ];
		
		if ( ! input.checked ) continue;
		
		count += 1;
		
		var id = input.getAttribute( "data-id" );
		
		var list = item.parentNode;
		var details = list.parentNode;
		var folder = details.parentNode;
		
		var fid = folder.getAttribute( "data-id" );
		
		var fdata = this.geoportalData[ fid ];
		var data = fdata.children[ id ];
		
		var ftitle = fdata[ "title" ];
		var url = fdata[ "getMapUrl" ];
		var name = data[ "name" ];
		var title = data[ "title" ];
		var abstract = data[ "abstract" ];
		var queryable = ( data[ "queryable" ] === 1 );
		
		fid = "geoportal_" + fid;
		id = fid + "_" + id;
		
		var params =
		{
			folder: { id: fid, title: ftitle },
			layer: { id: id, url: url, name: name, title: title }
		};
		
		netgis.util.invoke( this.sections.geoportal, netgis.Events.IMPORT_GEOPORTAL_SUBMIT, params );
	}
	
	if ( count > 0 ) this.modal.hide();
};