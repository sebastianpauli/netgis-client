"use strict";

var netgis = netgis || {};

netgis.Menu = function()
{
	this.client = null;
	this.root = null;
	this.sections = [];
};

netgis.Menu.prototype.load = function()
{
	this.root = document.createElement( "header" );
	this.root.className = "netgis-menu netgis-primary netgis-shadow";
	
	//TODO: refactor into abstract bar class (see toolbar) ?
	var wrapper = document.createElement( "div" );
	this.root.appendChild( wrapper );
	
	var toggle = this.createButton( 'Ebenen<i class="fab fa-buffer"></i>', true );
	toggle.addEventListener( "click", this.onToggleClick.bind( this ) );
	////this.root.appendChild( toggle );
	wrapper.appendChild( toggle );
	
	var search = this.createButton( 'Suche<i class="fas fa-search" style="position: relative; top: 0.3mm;"></i>', true );
	search.addEventListener( "click", this.onSearchPlaceClick.bind( this ) );
	////this.root.appendChild( search );
	wrapper.appendChild( search );
	
	/*var title = this.createButton( '<span>GeoPortal</span>', false );
	title.classList.remove( "netgis-hover-primary" ); //TODO: createText function?
	//title.style.padding = "0mm";
	this.root.appendChild( title );*/
	
	if ( this.client.editable )
	{
		// Draw Menu
		var draw = this.createMenu( '<i class="fas fa-caret-down"></i>Zeichnen' );
		var drawItems = draw.getElementsByTagName( "ul" )[ 0 ];
		////this.root.appendChild( draw );
		wrapper.appendChild( draw );

		drawItems.appendChild( this.createMenuItem( '<i class="fas fa-map-marker-alt"></i>Punkte', this.onDrawPointClick.bind( this ) ) );
		drawItems.appendChild( this.createMenuItem( '<i class="fas fa-minus"></i>Linien', this.onDrawLineClick.bind( this ) ) );
		drawItems.appendChild( this.createMenuItem( '<i class="fas fa-vector-square"></i>Polygone', this.onDrawPolygonClick.bind( this ) ) );

		// Edit Menu
		var edit = this.createMenu( '<i class="fas fa-caret-down"></i>Bearbeiten' );
		var editItems = edit.getElementsByTagName( "ul" )[ 0 ];
		////this.root.appendChild( edit );
		wrapper.appendChild( edit );

		editItems.appendChild( this.createMenuItem( '<i class="fas fa-cut"></i>Ausschneiden', this.onCutFeatureClick.bind( this ) ) );
		editItems.appendChild( this.createMenuItem( '<i class="fas fa-arrows-alt"></i>Verschieben', this.onModifyFeaturesClick.bind( this ) ) );
		editItems.appendChild( this.createMenuItem( '<i class="fas fa-eraser"></i>Löschen', this.onDeleteFeaturesClick.bind( this ) ) );
		editItems.appendChild( this.createMenuItem( '<i class="far fa-dot-circle"></i>Puffern', this.onBufferFeatureClick.bind( this ) ) );
		
		// Import Menu
		var importMenu = this.createMenu( '<i class="fas fa-caret-down"></i>Import' );
		//this.root.appendChild( importMenu );
		wrapper.appendChild( importMenu );

		//fileItems.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>OWS-Context', this.onImportOWSClick.bind( this ) ) );

		var importItem = importMenu.getElementsByTagName( "ul" )[ 0 ];
		importItem.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>GeoJSON', this.onImportGeoJSONClick.bind( this ) ) );
		//fileItems.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>KML', this.onImportKMLClick.bind( this ) ) );
		importItem.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>GML', this.onImportGMLClick.bind( this ) ) );
		importItem.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>Shapefile', this.onImportShapefileClick.bind( this ) ) );
		
		// Export
		var exportMenu = this.createMenu( '<i class="fas fa-caret-down"></i>Export' );
		////this.root.appendChild( exportMenu );
		wrapper.appendChild( exportMenu );

		var exportItems = exportMenu.getElementsByTagName( "ul" )[ 0 ];
		exportItems.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>PDF', this.onExportPDFClick.bind( this ) ) );
		exportItems.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>JPEG', this.onExportJPEGClick.bind( this ) ) );
		exportItems.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>PNG', this.onExportPNGClick.bind( this ) ) );
		exportItems.appendChild( this.createMenuItem( '<i class="fas fa-file"></i>GIF', this.onExportGIFClick.bind( this ) ) );
	}
	
	// Search Menu
	/*var search = this.createMenu( '<i class="fas fa-caret-down"></i>Suche' );
	var searchItems = search.getElementsByTagName( "ul" )[ 0 ];
	this.root.appendChild( search );
	
	searchItems.appendChild( this.createMenuItem( '<i class="fas fa-search"></i>Ortssuche', this.onSearchPlaceClick.bind( this ) ) );
	searchItems.appendChild( this.createMenuItem( '<i class="fas fa-search"></i>Datensuche', this.onSearchDataClick.bind( this ) ) );*/
	
	// Right Buttons
	/*
	var settings = this.createButton( '<i class="fas fa-cog"></i>', true );
	this.root.appendChild( settings );
	
	var help = this.createButton( '<i class="fas fa-question"></i>', true );
	this.root.appendChild( help );
	*/
	
	this.client.root.appendChild( this.root );
};

netgis.Menu.prototype.createButton = function( label, right )
{
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.className = "netgis-primary netgis-hover-primary";
	if ( right ) button.className += " netgis-right";
	button.innerHTML = label;
	
	return button;
};

netgis.Menu.prototype.createMenu = function( title )
{
	var menu = document.createElement( "div" );
	menu.className = "netgis-dropdown";
	
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.className = "netgis-primary netgis-hover-primary";
	button.innerHTML = title;
	menu.appendChild( button );
	
	var content = document.createElement( "ul" );
	content.className = "netgis-dropdown-content netgis-dialog netgis-shadow";
	menu.appendChild( content );
	
	return menu;
};

netgis.Menu.prototype.createMenuItem = function( title, callback )
{
	var item = document.createElement( "li" );
	item.className = "netgis-hover-light";
	
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.innerHTML = title;
	button.addEventListener( "click", callback );
	item.appendChild( button );
	
	return item;
};

netgis.Menu.prototype.onToggleClick = function( e )
{
	this.client.invoke( netgis.Events.LAYER_LIST_TOGGLE, null );
};

netgis.Menu.prototype.onDrawPointClick = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.DRAW_POINTS );
};

netgis.Menu.prototype.onDrawLineClick = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.DRAW_LINES );
};

netgis.Menu.prototype.onDrawPolygonClick = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.DRAW_POLYGONS );
};

netgis.Menu.prototype.onCutFeatureClick = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.CUT_FEATURE_BEGIN );
};

netgis.Menu.prototype.onModifyFeaturesClick = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.MODIFY_FEATURES );
};

netgis.Menu.prototype.onDeleteFeaturesClick = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.DELETE_FEATURES );
};

netgis.Menu.prototype.onBufferFeatureClick = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.BUFFER_FEATURE_BEGIN );
};

netgis.Menu.prototype.onSearchPlaceClick = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.SEARCH_PLACE );
};

netgis.Menu.prototype.onSearchDataClick = function( e )
{
	alert( "TODO: data search interface" );
};

netgis.Menu.prototype.onImportOWSClick = function( e )
{
	alert( "TODO: ows import interface, try setting url parameter '?ows=<url>'" );
};

netgis.Menu.prototype.onImportShapefileClick = function( e )
{
	this.client.invoke( netgis.Events.IMPORT_SHAPEFILE_SHOW, null );
};

netgis.Menu.prototype.onImportGeoJSONClick = function( e )
{
	this.client.invoke( netgis.Events.IMPORT_GEOJSON_SHOW, null );
};

netgis.Menu.prototype.onImportKMLClick = function( e )
{
	alert( "TODO: kml import interface" );
};

netgis.Menu.prototype.onImportGMLClick = function( e )
{
	this.client.invoke( netgis.Events.IMPORT_GML_SHOW, null );
};

netgis.Menu.prototype.onExportPDFClick = function( e )
{
	this.client.invoke( netgis.Events.EXPORT_PDF_SHOW, null );
};

netgis.Menu.prototype.onExportJPEGClick = function( e )
{
	this.client.invoke( netgis.Events.EXPORT_JPEG_SHOW, null );
};

netgis.Menu.prototype.onExportPNGClick = function( e )
{
	this.client.invoke( netgis.Events.EXPORT_PNG_SHOW, null );
};

netgis.Menu.prototype.onExportGIFClick = function( e )
{
	this.client.invoke( netgis.Events.EXPORT_GIF_SHOW, null );
};