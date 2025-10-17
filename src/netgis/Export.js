"use strict";

var netgis = netgis || {};

/**
 * Export Module.
 * @param {JSON} config [Export.Config]{@link netgis.Export.Config}
 * @constructor
 * @memberof netgis
 */
netgis.Export = function( config )
{
	this.config = config;
	
	this.initElements( config );
	this.initSections();
};

/**
 * Config Section "export"
 * @memberof netgis.Export
 * @enum
 */
netgis.Export.Config =
{
	/**
	 * Modal title
	 * @type String
	 */
	"title": "Export",
	
	/**
	 * Exported image logo
	 * @type String
	 */
	"logo": "",
	
	/**
	 * Path to GIFJS web worker script
	 * @type String
	 */
	"gif_worker": "/libs/gifjs/0.2.0/gif.worker.js",
	
	/**
	 * Default exported file name
	 * @type String
	 */
	"default_filename": "Export",
	
	/**
	 * Default exported image margin
	 * @type Number
	 */
	"default_margin": 10
};

netgis.Export.prototype.initElements = function( config )
{
	var cfg = config[ "export" ];
	
	// Modal
	this.modal = new netgis.Modal( cfg[ "title" ] ? cfg[ "title" ] : "Export" );
	this.modal.container.classList.add( "netgis-export" );
	
	// Tabs
	var tabs = [ "PDF", "JPEG", "PNG", "GIF", "GeoJSON" ];
		
	this.tabs = new netgis.Tabs( tabs );
	this.tabs.container.style.position = "absolute";
	this.tabs.container.style.left = "0mm";
	this.tabs.container.style.right = "0mm";
	this.tabs.container.style.top = "12mm";
	this.tabs.container.style.bottom = "0mm";
	this.tabs.attachTo( this.modal.content );
};

netgis.Export.prototype.initSections = function()
{
	this.sections = {};
	
	var i = 0;
	
	// PDF
	this.sections.pdf = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputNumber( this.sections.pdf, "Breite (Pixel):", 1600, 0 );
	this.addInputNumber( this.sections.pdf, "Höhe (Pixel):", 900, 0 );
	this.addInputNumber( this.sections.pdf, "Seitenränder (Millimeter):", 10, 0 );
	this.addCheckbox( this.sections.pdf, "Querformat", true );
	this.addButton( this.sections.pdf, "<i class='netgis-icon fas fa-save'></i><span>Exportieren</span>", this.onExportClickPDF.bind( this ) );
	
	// JPEG
	this.sections.jpeg = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputNumber( this.sections.jpeg, "Breite (Pixel):", 1600, 0 );
	this.addInputNumber( this.sections.jpeg, "Höhe (Pixel):", 900, 0 );
	this.addCheckbox( this.sections.jpeg, "Querformat", true );
	this.addButton( this.sections.jpeg, "<i class='netgis-icon fas fa-save'></i><span>Exportieren</span>", this.onExportClickJPEG.bind( this ) );
	
	// PNG
	this.sections.png = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputNumber( this.sections.png, "Breite (Pixel):", 1600, 0 );
	this.addInputNumber( this.sections.png, "Höhe (Pixel):", 900, 0 );
	this.addCheckbox( this.sections.png, "Querformat", true );
	this.addButton( this.sections.png, "<i class='netgis-icon fas fa-save'></i><span>Exportieren</span>", this.onExportClickPNG.bind( this ) );
	
	// GIF
	this.sections.gif = this.tabs.getContentSection( i );
	i += 1;
	
	this.addInputNumber( this.sections.gif, "Breite (Pixel):", 1600, 0 );
	this.addInputNumber( this.sections.gif, "Höhe (Pixel):", 900, 0 );
	this.addCheckbox( this.sections.gif, "Querformat", true );
	this.addButton( this.sections.gif, "<i class='netgis-icon fas fa-save'></i><span>Exportieren</span>", this.onExportClickGIF.bind( this ) );
	
	// GeoJSON
	this.sections.geojson = this.tabs.getContentSection( i );
	i += 1;
	
	this.addCheckbox( this.sections.geojson, "Nicht-Editierbare Geometrien einbeziehen", false );	
	this.addButton( this.sections.geojson, "<i class='netgis-icon fas fa-save'></i><span>Exportieren</span>", this.onExportClickGeoJSON.bind( this ) );
};

netgis.Export.prototype.attachTo = function( parent )
{
	parent.appendChild( this.modal.container );
	
	parent.addEventListener( netgis.Events.EXPORT_SHOW, this.onExportShow.bind( this ) );
	parent.addEventListener( netgis.Events.EXPORT_END, this.onExportEnd.bind( this ) );
};

netgis.Export.prototype.addText = function( parent, text )
{
	var div = document.createElement( "div" );
	div.innerHTML = text;
	
	parent.appendChild( div );
	
	return div;
};

netgis.Export.prototype.addButton = function( parent, title, handler )
{
	var button = document.createElement( "button" );
	button.className = "netgis-button netgis-center netgis-color-a netgis-hover-c netgis-shadow";
	button.setAttribute( "type", "button" );
	button.innerHTML = title;
	
	if ( handler ) button.onclick = handler;
	
	parent.appendChild( button );
	
	return button;
};

netgis.Export.prototype.addInputText = function( parent, title, options )
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

netgis.Export.prototype.addInputNumber = function( parent, title, value, min, max )
{
	var label = document.createElement( "label" );
	label.innerHTML = title;
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "number" );
	if ( min || min === 0 ) input.setAttribute( "min", min );
	if ( max ) input.setAttribute( "max", max );
	input.setAttribute( "value", value );
	label.appendChild( input );
	
	parent.appendChild( label );
	
	return input;
};

netgis.Export.prototype.addCheckbox = function( parent, title, checked )
{
	var label = document.createElement( "label" );
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "checkbox" );
	input.checked = checked;
	label.appendChild( input );
	
	var span = document.createElement( "span" );
	span.innerHTML = title;
	label.appendChild( span );
	
	parent.appendChild( label );
	
	return input;
};

netgis.Export.prototype.onExportShow = function( e )
{
	this.modal.show();
};

netgis.Export.prototype.onExportClickPDF = function( e )
{
	var inputs = this.sections.pdf.getElementsByTagName( "input" );
	
	var params =
	{
		format: "pdf",
		width: Number.parseInt( inputs[ 0 ].value ),
		height: Number.parseInt( inputs[ 1 ].value ),
		padding: Number.parseInt( inputs[ 2 ].value ),
		landscape: inputs[ 3 ].checked
	};
	
	netgis.util.invoke( e.target, netgis.Events.EXPORT_BEGIN, params );
};

netgis.Export.prototype.onExportClickJPEG = function( e )
{
	var inputs = this.sections.pdf.getElementsByTagName( "input" );
	
	var params =
	{
		format: "jpeg",
		width: Number.parseInt( inputs[ 0 ].value ),
		height: Number.parseInt( inputs[ 1 ].value ),
		landscape: inputs[ 3 ].checked
	};
	
	netgis.util.invoke( e.target, netgis.Events.EXPORT_BEGIN, params );
};

netgis.Export.prototype.onExportClickPNG = function( e )
{
	var inputs = this.sections.pdf.getElementsByTagName( "input" );
	
	var params =
	{
		format: "png",
		width: Number.parseInt( inputs[ 0 ].value ),
		height: Number.parseInt( inputs[ 1 ].value ),
		landscape: inputs[ 3 ].checked
	};
	
	netgis.util.invoke( e.target, netgis.Events.EXPORT_BEGIN, params );
};

netgis.Export.prototype.onExportClickGIF = function( e )
{
	var inputs = this.sections.pdf.getElementsByTagName( "input" );
	
	var params =
	{
		format: "gif",
		width: Number.parseInt( inputs[ 0 ].value ),
		height: Number.parseInt( inputs[ 1 ].value ),
		landscape: inputs[ 3 ].checked
	};
	
	netgis.util.invoke( e.target, netgis.Events.EXPORT_BEGIN, params );
};

netgis.Export.prototype.onExportClickGeoJSON = function( e )
{
	var inputs = this.sections.geojson.getElementsByTagName( "input" );
	
	var params =
	{
		format: "geojson",
		nonEdits: inputs[ 0 ].checked
	};
	
	netgis.util.invoke( e.target, netgis.Events.EXPORT_BEGIN, params );
};

netgis.Export.prototype.onExportEnd = function( e )
{
	this.modal.hide();
};