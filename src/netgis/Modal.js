"use strict";

var netgis = netgis || {};

/**
 * Modal Module
 * 
 * Notes:
 * - Putting all modals in here for ease of implementation
 * - This may be split up into one class for each modal (?)
 * 
 * @returns {netgis.Modal}
 */
netgis.Modal = function()
{
	this.client = null;
	this.importGeoJSON = null;
	this.importGML = null;
	this.importShapefile = null;
	this.exportPDF = null;
	this.exportJPEG = null;
	this.exportPNG = null;
	this.exportGIF = null;
	this.addService = null;
	
	this.addServiceID = 10000;
};

netgis.Modal.prototype.load = function()
{
	this.root = document.createElement( "section" );
	this.root.className = "netgis-modal";
	this.root.addEventListener( "click", this.onRootClick.bind( this ) );
	
	// Import
	this.importGeoJSON = this.createImportGeoJSON();
	this.root.appendChild( this.importGeoJSON );
	
	this.importGML = this.createImportGML();
	this.root.appendChild( this.importGML );
	
	this.importShapefile = this.createImportShapefile();
	this.root.appendChild( this.importShapefile );
	
	this.importSpatialite = this.createImportSpatialite();
	this.root.appendChild( this.importSpatialite );
	
	this.importGeopackage = this.createImportGeopackage();
	this.root.appendChild( this.importGeopackage );
	
	// Export
	this.exportPDF = this.createExportPDF();
	this.root.appendChild( this.exportPDF );
	
	this.exportJPEG = this.createExportJPEG();
	this.root.appendChild( this.exportJPEG );
	
	this.exportPNG = this.createExportPNG();
	this.root.appendChild( this.exportPNG );
	
	this.exportGIF = this.createExportGIF();
	this.root.appendChild( this.exportGIF );
	
	// Layers
	this.addService = this.createAddService();
	this.root.appendChild( this.addService );
	
	// Done
	this.client.root.appendChild( this.root );
	
	// Events
	this.client.on( netgis.Events.IMPORT_GEOJSON_SHOW, this.onImportGeoJSONShow.bind( this ) );
	this.client.on( netgis.Events.IMPORT_GML_SHOW, this.onImportGMLShow.bind( this ) );
	this.client.on( netgis.Events.IMPORT_SHAPEFILE_SHOW, this.onImportShapefileShow.bind( this ) );
	this.client.on( netgis.Events.IMPORT_SPATIALITE_SHOW, this.onImportSpatialiteShow.bind( this ) );
	this.client.on( netgis.Events.IMPORT_GEOPACKAGE_SHOW, this.onImportGeopackageShow.bind( this ) );
	
	this.client.on( netgis.Events.EXPORT_PDF_SHOW, this.onExportPDFShow.bind( this ) );
	this.client.on( netgis.Events.EXPORT_JPEG_SHOW, this.onExportJPEGShow.bind( this ) );
	this.client.on( netgis.Events.EXPORT_PNG_SHOW, this.onExportPNGShow.bind( this ) );
	this.client.on( netgis.Events.EXPORT_GIF_SHOW, this.onExportGIFShow.bind( this ) );
	
	this.client.on( netgis.Events.ADD_SERVICE_SHOW, this.onAddServiceShow.bind( this ) );
};

netgis.Modal.prototype.createImportGeoJSON = function()
{
	var container = this.createContainer( "Import GeoJSON" );
	
	this.createText( container, "Unterstützte Koordinatensysteme:", "<ul><li>World Geodetic System 1984 (EPSG:4326)</li><li>ETRS89 / UTM zone 32N (EPSG:25832)</li></ul>" );
	this.createInputFile( container, "Datei auswählen / ablegen:", ".geojson,.json", this.onImportGeoJSONChange.bind( this ) );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Importieren", this.onImportGeoJSONAccept.bind( this ) );
	
	return container;
};

netgis.Modal.prototype.createImportGML = function()
{
	var container = this.createContainer( "Import GML" );
	
	this.createText( container, "Unterstützte Koordinatensysteme:", "<ul><li>World Geodetic System 1984 (EPSG:4326)</li><li>ETRS89 / UTM zone 32N (EPSG:25832)</li></ul>" );
	this.createInputFile( container, "Datei auswählen / ablegen:", ".gml,.xml", this.onImportGMLChange.bind( this ) );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Importieren", this.onImportGMLAccept.bind( this ) );
	
	return container;
};

netgis.Modal.prototype.createImportShapefile = function()
{
	var container = this.createContainer( "Import Shapefile" );
	
	this.createText( container, "Unterstützte Koordinatensysteme:", "<ul><li>World Geodetic System 1984 (EPSG:4326)</li><li>ETRS89 / UTM zone 32N (EPSG:25832)</li></ul>" );
	this.createInputFile( container, "Datei auswählen / ablegen:", "application/zip", this.onImportShapefileChange.bind( this ) );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Importieren", this.onImportShapefileAccept.bind( this ) );
	
	return container;
};

netgis.Modal.prototype.createImportSpatialite = function()
{
	var container = this.createContainer( "Import Spatialite" );
	
	this.createText( container, "Unterstützte Koordinatensysteme:", "<ul><li>World Geodetic System 1984 (EPSG:4326)</li><li>ETRS89 / UTM zone 32N (EPSG:25832)</li></ul>" );
	this.createInputFile( container, "Datei auswählen / ablegen:", ".sqlite", this.onImportSpatialiteChange.bind( this ) );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Importieren", this.onImportSpatialiteAccept.bind( this ) );
	
	return container;
};

netgis.Modal.prototype.createImportGeopackage = function()
{
	var container = this.createContainer( "Import GeoPackage" );
	
	this.createText( container, "Unterstützte Koordinatensysteme:", "<ul><li>World Geodetic System 1984 (EPSG:4326)</li><li>ETRS89 / UTM zone 32N (EPSG:25832)</li></ul>" );
	this.createInputFile( container, "Datei auswählen / ablegen:", ".gpkg", this.onImportGeopackageChange.bind( this ) );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Importieren", this.onImportGeopackageAccept.bind( this ) );
	
	return container;
};

netgis.Modal.prototype.createExportPDF = function()
{
	var container = this.createContainer( "Export PDF" );
	
	this.createInputInteger( container, "Breite (Pixel):", 800, 0, 4096 );
	this.createInputInteger( container, "Höhe (Pixel):", 600, 0, 4096 );
	this.createInputInteger( container, "Seitenränder (Millimeter):", 10, 0, 100 );
	this.createInputCheckbox( container, "Querformat:", true );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Exportieren", this.onExportPDFAccept.bind( this ) );

	return container;
};

netgis.Modal.prototype.createExportJPEG = function()
{
	var container = this.createContainer( "Export JPEG" );
	
	this.createInputInteger( container, "Breite (Pixel):", 800, 0, 4096 );
	this.createInputInteger( container, "Höhe (Pixel):", 600, 0, 4096 );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Exportieren", this.onExportJPEGAccept.bind( this ) );

	return container;
};

netgis.Modal.prototype.createExportPNG = function()
{
	var container = this.createContainer( "Export PNG" );
	
	this.createInputInteger( container, "Breite (Pixel):", 800, 0, 4096 );
	this.createInputInteger( container, "Höhe (Pixel):", 600, 0, 4096 );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Exportieren", this.onExportPNGAccept.bind( this ) );

	return container;
};

netgis.Modal.prototype.createExportGIF = function()
{
	var container = this.createContainer( "Export GIF" );
	
	this.createInputInteger( container, "Breite (Pixel):", 800, 0, 4096 );
	this.createInputInteger( container, "Höhe (Pixel):", 600, 0, 4096 );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Exportieren", this.onExportGIFAccept.bind( this ) );

	return container;
};

netgis.Modal.prototype.createAddService = function()
{
	var container = this.createContainer( "Dienst hinzufügen" );
	
	this.createInputText( container, "WMS/WFS URL:" );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-cloud-download-alt'></i>Dienst laden", this.onAddServiceLoad.bind( this ) );
	
	/*var details = document.createElement( "div" );
	details.className = "netgis-hide";
	container.appendChild( details );*/
	
	this.createSpace( container );
	this.createInputHidden( container );
	this.createInputHidden( container );
	this.createText( container, "Bezeichnung:", "" );
	this.createInputSelect( container, "Kartenebene:", [] );
	this.createInputSelect( container, "Format:", [] );
	this.createSpace( container );
	this.createButton( container, "<i class='fas fa-check'></i>Dienst hinzufügen", this.onAddServiceAccept.bind( this ) );
	
	return container;
};

netgis.Modal.prototype.show = function( container )
{
	this.root.classList.add( "netgis-show" );
	
	// Active Container
	var containers = this.root.getElementsByClassName( "netgis-dialog" );
	for ( var i = 0; i < containers.length; i++ )
	{
		containers[ i ].classList.remove( "netgis-show" );
	}
	
	container.classList.add( "netgis-show" );
};

netgis.Modal.prototype.hide = function()
{
	this.root.classList.remove( "netgis-show" );
};

netgis.Modal.prototype.createContainer = function( title )
{
	var container = document.createElement( "section" );
	container.className = "netgis-dialog netgis-shadow";
	
	/*var header = document.createElement( "header" );
	header.className = "netgis-primary";
	*/
	
	var header = document.createElement( "header" );
	
	var headerButton = document.createElement( "button" );
	headerButton.setAttribute( "type", "button" );
	headerButton.className = "netgis-primary netgis-hover-primary";
	headerButton.innerHTML = "<h3>" + title + "</h3>";
	headerButton.addEventListener( "click", this.onHeaderClick.bind( this ) );
	header.appendChild( headerButton );
	
	var headerIcon = document.createElement( "span" );
	headerIcon.innerHTML = "<i class='fas fa-times'></i>";
	headerButton.appendChild( headerIcon );
	
	container.appendChild( header );
	
	var content = document.createElement( "div" );
	content.className = "netgis-modal-content";
	container.appendChild( content );
	
	var table = document.createElement( "table" );
	content.appendChild( table );
	
	return container;
};

netgis.Modal.prototype.createSpace = function( container )
{
	var row = document.createElement( "tr" );
	row.className = "netgis-space";
	
	var cell = document.createElement( "td" );
	cell.setAttribute( "colspan", 100 );
	row.appendChild( cell );
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return cell;
};

netgis.Modal.prototype.createButton = function( container, title, callback )
{
	var row = document.createElement( "tr" );
	
	var cell = document.createElement( "td" );
	cell.setAttribute( "colspan", 100 );
	row.appendChild( cell );
	
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.className = "netgis-primary netgis-hover-primary";
	button.innerHTML = title;
	if ( callback ) button.addEventListener( "click", callback );
	cell.appendChild( button );
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return button;
};

netgis.Modal.prototype.createInputHidden = function( container )
{
	var row = document.createElement( "tr" );
	row.className = "netgis-hidden";
	
	var cell = document.createElement( "td" );
	row.appendChild( cell );
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "hidden" );
	cell.appendChild( input );
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return input;
};

netgis.Modal.prototype.createInputText = function( container, title )
{
	var row = document.createElement( "tr" );
	//row.className = "netgis-hover-light";
	
	var head = document.createElement( "th" );
	head.className = "netgis-padding";
	
	var label = document.createElement( "label" );
	label.innerHTML = title;
	head.appendChild( label );
	row.appendChild( head );
	
	var cell = document.createElement( "td" );
	cell.className = "netgis-padding";
	row.appendChild( cell );
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "text" );
	cell.appendChild( input );
	
	label.htmlFor = input;
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return input;
};

netgis.Modal.prototype.createInputSelect = function( container, title, keyValues )
{
	var row = document.createElement( "tr" );
	//row.className = "netgis-hover-light";
	
	var head = document.createElement( "th" );
	head.className = "netgis-padding";
	
	var label = document.createElement( "label" );
	label.innerHTML = title;
	head.appendChild( label );
	row.appendChild( head );
	
	var cell = document.createElement( "td" );
	cell.className = "netgis-padding";
	row.appendChild( cell );
	
	var input = document.createElement( "select" );
	cell.appendChild( input );
	
	label.htmlFor = input;
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return input;
};

netgis.Modal.prototype.createInputInteger = function( container, title, value, min, max )
{
	var row = document.createElement( "tr" );
	//row.className = "netgis-hover-light";
	
	var head = document.createElement( "th" );
	head.className = "netgis-padding";
	
	var label = document.createElement( "label" );
	label.innerHTML = title;
	head.appendChild( label );
	row.appendChild( head );
	
	var cell = document.createElement( "td" );
	cell.className = "netgis-padding";
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "number" );
	input.setAttribute( "min", min );
	input.setAttribute( "max", max );
	input.value = Number.parseInt( value );
	cell.appendChild( input );
	row.appendChild( cell );
	
	label.htmlFor = input;
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return input;
};

netgis.Modal.prototype.createInputCheckbox = function( container, title, checked )
{
	var row = document.createElement( "tr" );
	//row.className = "netgis-hover-light";
	
	var head = document.createElement( "th" );
	head.className = "netgis-padding";
	
	var label = document.createElement( "label" );
	label.innerHTML = title;
	head.appendChild( label );
	row.appendChild( head );
	
	var cell = document.createElement( "td" );
	cell.className = "netgis-padding";
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "checkbox" );
	input.checked = checked;
	cell.appendChild( input );
	row.appendChild( cell );
	
	label.htmlFor = input;
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return input;
};

netgis.Modal.prototype.createInputFile = function( container, title, filetypes, callback )
{
	var row = document.createElement( "tr" );
	//row.className = "netgis-hover-light";
	
	var head = document.createElement( "th" );
	head.className = "netgis-padding";
	
	var label = document.createElement( "label" );
	label.innerHTML = title;
	head.appendChild( label );
	row.appendChild( head );
	
	var cell = document.createElement( "td" );
	cell.className = "netgis-padding";
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "file" );
	input.setAttribute( "accept", filetypes );
	if ( callback ) input.addEventListener( "change", callback );
	cell.appendChild( input );
	row.appendChild( cell );
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return input;
};

netgis.Modal.prototype.createText = function( container, title, text )
{
	var row = document.createElement( "tr" );
	//row.className = "netgis-padding";
	
	var head = document.createElement( "th" );
	head.className = "netgis-padding";
	head.innerHTML = title;
	row.appendChild( head );
	
	var cell = document.createElement( "td" );
	cell.className = "netgis-padding";
	cell.innerHTML = text;
	row.appendChild( cell );
	
	var content = container.getElementsByClassName( "netgis-modal-content" )[ 0 ];
	var table = content.getElementsByTagName( "table" )[ 0 ];
	table.appendChild( row );
	
	return cell;
};

netgis.Modal.prototype.onRootClick = function( e )
{
	if ( e.target !== this.root ) return;
	
	this.hide();
};

netgis.Modal.prototype.onHeaderClick = function( e )
{
	this.hide();
};

netgis.Modal.prototype.onImportGeoJSONShow = function( e )
{
	var input = this.importGeoJSON.getElementsByTagName( "input" )[ 0 ];
	var button = this.importGeoJSON.getElementsByTagName( "button" )[ 1 ];
	input.value = "";
	button.disabled = true;
	
	this.show( this.importGeoJSON );
};

netgis.Modal.prototype.onImportGeoJSONChange = function( e )
{
	var input = this.importGeoJSON.getElementsByTagName( "input" )[ 0 ];
	var button = this.importGeoJSON.getElementsByTagName( "button" )[ 1 ];
	
	if ( input.value && input.value.length > 0 )
	{
		button.disabled = false;
	}
	else
	{
		button.disabled = true;
	}
};

netgis.Modal.prototype.onImportGeoJSONAccept = function( e )
{
	var input = this.importGeoJSON.getElementsByTagName( "input" )[ 0 ];
	var file = input.files[ 0 ];
	this.client.invoke( netgis.Events.IMPORT_GEOJSON, file );
	
	this.hide();
};

netgis.Modal.prototype.onImportGMLShow = function( e )
{
	var input = this.importGML.getElementsByTagName( "input" )[ 0 ];
	var button = this.importGML.getElementsByTagName( "button" )[ 1 ];
	input.value = "";
	button.disabled = true;
	
	this.show( this.importGML );
};

netgis.Modal.prototype.onImportGMLChange = function( e )
{
	var input = this.importGML.getElementsByTagName( "input" )[ 0 ];
	var button = this.importGML.getElementsByTagName( "button" )[ 1 ];
	
	if ( input.value && input.value.length > 0 )
	{
		button.disabled = false;
	}
	else
	{
		button.disabled = true;
	}
};

netgis.Modal.prototype.onImportGMLAccept = function( e )
{
	var input = this.importGML.getElementsByTagName( "input" )[ 0 ];
	var file = input.files[ 0 ];
	this.client.invoke( netgis.Events.IMPORT_GML, file );
	
	this.hide();
};

netgis.Modal.prototype.onImportShapefileShow = function( e )
{
	var input = this.importShapefile.getElementsByTagName( "input" )[ 0 ];
	var button = this.importShapefile.getElementsByTagName( "button" )[ 1 ];
	input.value = "";
	button.disabled = true;
	
	this.show( this.importShapefile );
};

netgis.Modal.prototype.onImportShapefileChange = function( e )
{
	var input = this.importShapefile.getElementsByTagName( "input" )[ 0 ];
	var button = this.importShapefile.getElementsByTagName( "button" )[ 1 ];
	
	if ( input.value && input.value.length > 0 )
	{
		button.disabled = false;
	}
	else
	{
		button.disabled = true;
	}
};

netgis.Modal.prototype.onImportShapefileAccept = function( e )
{
	var input = this.importShapefile.getElementsByTagName( "input" )[ 0 ];
	var file = input.files[ 0 ];
	this.client.invoke( netgis.Events.IMPORT_SHAPEFILE, file );
	
	this.hide();
};

netgis.Modal.prototype.onImportSpatialiteShow = function( e )
{
	var input = this.importShapefile.getElementsByTagName( "input" )[ 0 ];
	var button = this.importShapefile.getElementsByTagName( "button" )[ 1 ];
	input.value = "";
	button.disabled = true;
	
	this.show( this.importSpatialite );
};

netgis.Modal.prototype.onImportSpatialiteChange = function( e )
{
	var input = this.importSpatialite.getElementsByTagName( "input" )[ 0 ];
	var button = this.importSpatialite.getElementsByTagName( "button" )[ 1 ];
	
	if ( input.value && input.value.length > 0 )
	{
		button.disabled = false;
	}
	else
	{
		button.disabled = true;
	}
};

netgis.Modal.prototype.onImportSpatialiteAccept = function( e )
{
	var input = this.importSpatialite.getElementsByTagName( "input" )[ 0 ];
	var file = input.files[ 0 ];
	this.client.invoke( netgis.Events.IMPORT_SPATIALITE, file );
	
	this.hide();
};

netgis.Modal.prototype.onImportGeopackageShow = function( e )
{
	var input = this.importGeopackage.getElementsByTagName( "input" )[ 0 ];
	var button = this.importGeopackage.getElementsByTagName( "button" )[ 1 ];
	input.value = "";
	button.disabled = true;
	
	this.show( this.importGeopackage );
};

netgis.Modal.prototype.onImportGeopackageChange = function( e )
{
	var input = this.importGeopackage.getElementsByTagName( "input" )[ 0 ];
	var button = this.importGeopackage.getElementsByTagName( "button" )[ 1 ];
	
	if ( input.value && input.value.length > 0 )
	{
		button.disabled = false;
	}
	else
	{
		button.disabled = true;
	}
};

netgis.Modal.prototype.onImportGeopackageAccept = function( e )
{
	var input = this.importGeopackage.getElementsByTagName( "input" )[ 0 ];
	var file = input.files[ 0 ];
	this.client.invoke( netgis.Events.IMPORT_GEOPACKAGE, file );
	
	this.hide();
};

netgis.Modal.prototype.onExportPDFShow = function( e )
{
	var inputs = this.exportPDF.getElementsByTagName( "input" );
	inputs[ 0 ].value = this.client.map.getWidth();
	inputs[ 1 ].value = this.client.map.getHeight();
	inputs[ 2 ].value = this.client.config.export.defaultMargin;
	inputs[ 3 ].checked = true;
	
	//TODO: refactor into single export modal with format select?
	
	this.show( this.exportPDF );
};

netgis.Modal.prototype.onExportJPEGShow = function( e )
{
	var inputs = this.exportJPEG.getElementsByTagName( "input" );
	inputs[ 0 ].value = this.client.map.getWidth();
	inputs[ 1 ].value = this.client.map.getHeight();
	
	//TODO: refactor into single export modal with format select?
	
	this.show( this.exportJPEG );
};

netgis.Modal.prototype.onExportPNGShow = function( e )
{
	var inputs = this.exportPNG.getElementsByTagName( "input" );
	inputs[ 0 ].value = this.client.map.getWidth();
	inputs[ 1 ].value = this.client.map.getHeight();
	
	//TODO: refactor into single export modal with format select?
	
	this.show( this.exportPNG );
};

netgis.Modal.prototype.onExportGIFShow = function( e )
{
	var inputs = this.exportGIF.getElementsByTagName( "input" );
	inputs[ 0 ].value = this.client.map.getWidth();
	inputs[ 1 ].value = this.client.map.getHeight();
	
	//TODO: refactor into single export modal with format select?
	
	this.show( this.exportGIF );
};

netgis.Modal.prototype.onExportPDFAccept = function( e )
{
	var inputs = this.exportPDF.getElementsByTagName( "input" );
	var resx = Number.parseInt( inputs[ 0 ].value );
	var resy = Number.parseInt( inputs[ 1 ].value );
	var margin = Number.parseInt( inputs[ 2 ].value );
	var mode = inputs[ 3 ].checked;
	this.client.invoke( netgis.Events.EXPORT_PDF, { resx: resx, resy: resy, mode: mode, margin: margin } );
	
	this.hide();
};

netgis.Modal.prototype.onExportJPEGAccept = function( e )
{
	var inputs = this.exportJPEG.getElementsByTagName( "input" );
	var resx = Number.parseInt( inputs[ 0 ].value );
	var resy = Number.parseInt( inputs[ 1 ].value );
	this.client.invoke( netgis.Events.EXPORT_JPEG, { resx: resx, resy: resy } );
	
	this.hide();
};

netgis.Modal.prototype.onExportPNGAccept = function( e )
{
	var inputs = this.exportPNG.getElementsByTagName( "input" );
	var resx = Number.parseInt( inputs[ 0 ].value );
	var resy = Number.parseInt( inputs[ 1 ].value );
	this.client.invoke( netgis.Events.EXPORT_PNG, { resx: resx, resy: resy } );
	
	this.hide();
};

netgis.Modal.prototype.onExportGIFAccept = function( e )
{
	var inputs = this.exportGIF.getElementsByTagName( "input" );
	var resx = Number.parseInt( inputs[ 0 ].value );
	var resy = Number.parseInt( inputs[ 1 ].value );
	this.client.invoke( netgis.Events.EXPORT_GIF, { resx: resx, resy: resy } );
	
	this.hide();
};

netgis.Modal.prototype.onAddServiceShow = function( e )
{
	//this.addService.getElementsByTagName( "input" )[ 0 ].value = "";
	
	this.show( this.addService );
	
	// Hide Details
	var rows = this.addService.getElementsByTagName( "tr" );
	
	for ( var r = 3; r < rows.length; r++ )
	{
		rows[ r ].classList.add( "netgis-hide" );
	}
};

netgis.Modal.prototype.onAddServiceLoad = function( e )
{
	var inputs = this.addService.getElementsByTagName( "input" );
	var url = inputs[ 0 ].value;
	
	// Get Base URL
	var qmark = url.indexOf( "?" );
	var baseURL = ( qmark > -1 ) ? url.substr( 0, qmark ) : url;
	var inputBaseURL = inputs[ 2 ];
	inputBaseURL.value = baseURL;
	
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
		}
	}
	
	// Capabilities URL
	var getCaps = baseURL + "?" + params.join( "&" );
	
	netgis.util.request( getCaps, this.onAddServiceCapsResponse.bind( this ) );
};

netgis.Modal.prototype.onAddServiceCapsResponse = function( e )
{
	var parser = new DOMParser();
	var xml = parser.parseFromString( e, "text/xml" );
	var caps = xml.documentElement;
	
	var rows = this.addService.getElementsByTagName( "tr" );
	var rowTitle = rows[ 6 ];
	
	var inputs = this.addService.getElementsByTagName( "input" );
	var inputType = inputs[ 1 ];
	
	var selects = this.addService.getElementsByTagName( "select" );
	var selectLayer = selects[ 0 ];
	var selectFormat = selects[ 1 ];
	
	for ( var i = selectLayer.options.length - 1; i >= 0; i-- ) selectLayer.options.remove( i );
	for ( var i = selectFormat.options.length - 1; i >= 0; i-- ) selectFormat.options.remove( i );
	
	switch ( caps.nodeName )
	{
		// WMS
		case "WMS_Capabilities":
		case "WMT_MS_Capabilities":
		{
			inputType.value = "wms";
			
			var version = caps.getAttribute( "version" );
			var service = caps.getElementsByTagName( "Service" )[ 0 ];
			var title = service.getElementsByTagName( "Title" )[ 0 ].textContent;
			rowTitle.children[ 1 ].innerHTML = title;
			
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
				
				formats.push( format );
				
				var option = document.createElement( "option" );
				option.text = format;
				option.value = format;
				selectFormat.options.add( option );
			}
			
			break;
		}
		
		// WFS
		case "WFS_Capabilities":
		case "wfs:WFS_Capabilities":
		{
			inputType.value = "wfs";
			
			var version = caps.getAttribute( "version" );
			var service = caps.getElementsByTagName( "ows:ServiceIdentification" )[ 0 ];
			var title = service.getElementsByTagName( "ows:Title" )[ 0 ].textContent;
			rowTitle.children[ 1 ].innerHTML = title;
			
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
						}
						
						break;
					}
				}
			}
			
			selectFormat.value = "application/json";
			
			break;
		}
	}
	
	// Show Details
	var rows = this.addService.getElementsByTagName( "tr" );
	
	for ( var r = 3; r < rows.length; r++ )
	{
		rows[ r ].classList.remove( "netgis-hide" );
	}
};

netgis.Modal.prototype.onAddServiceAccept = function( e )
{
	var inputs = this.addService.getElementsByTagName( "input" );
	var selects = this.addService.getElementsByTagName( "select" );
	
	var url = inputs[ 0 ].value;
	var type = inputs[ 1 ].value;
	var baseURL = inputs[ 2 ].value;
	
	var selectLayer = selects[ 0 ];
	var selectFormat = selects[ 1 ];
	
	var layerOption = selectLayer.options.item( selectLayer.options.selectedIndex );
	var formatOption = selectFormat.options.item( selectFormat.options.selectedIndex );
	
	var id = this.addServiceID++;
	
	var params =
	{
		id: id,
		url: baseURL,
		title: layerOption.text,
		name: layerOption.value,
		format: formatOption.value
	};
	
	switch ( type )
	{
		case "wms":
		{
			this.client.invoke( netgis.Events.ADD_SERVICE_WMS, params );
			break;
		}
		
		case "wfs":
		{
			this.client.invoke( netgis.Events.ADD_SERVICE_WFS, params );
			break;
		}
	}
	
	this.hide();
};