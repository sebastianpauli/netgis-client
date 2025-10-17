"use strict";

var netgis = netgis || {};

/**
 * Toolbox Module
 * @param {JSON} config [Toolbox.Config]{@link netgis.Toolbox.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.Toolbox = function( config )
{
	this.config = config;
	
	this.bottomPanels = {};
	
	this.initElements( config );
	this.initOptions( config );
	this.initEvents();
	
	this.setActiveButton( netgis.Commands.VIEW );
};

/**
 * Config Section "toolbox"
 * @memberof netgis.Toolbox
 * @enum
 */
netgis.Toolbox.Config =
{
	/**
	 * Open panel at startup
	 * @type Boolean
	 */
	"open": false,
	
	/**
	 * Toolbox button items. See {@link Commands} for special ID values.
	 * <ul>
	 *	<li>Button Items:<br/><code>{ "id": {String}, "title": {String} }</code></li>
	 * </ul>
	 * @type Array
	 */
	"items": [],
	
	/**
	 * Options panel settings for specific tools<br/>
	 * <ul>
	 *	<li><code>"buffer_features": { "title": {String}, "items": {Array} }</code></li>
	 *	<li>Option Items: <code>{ "id": {String}, "type": {String}, "title": {String} }</code></li>
	 *	<li>ID Values: <code>"buffer_radius", "buffer_segments", "buffer_submit"</code></li>
	 *	<li>Type Values: <code>"integer", "button"</code></li>
	 * </ul>
	 * @type Array
	 */
	"options":
	{
		"buffer_features":
		{
			"title": "Buffer",
			"items":
			[
				{ "id": "buffer_radius", "type": "integer", "title": "Radius (Meter)" },
				{ "id": "buffer_segments", "type": "integer", "title": "Segments" },
				{ "id": "buffer_submit", "type": "button", "title": "<i class='netgis-icon netgis-text-a fas fa-arrow-circle-right'></i><span>Akzeptieren</span>" }
			]
		}
	}
};

netgis.Toolbox.prototype.initElements = function( config )
{
	// Panel
	this.panel = new netgis.Panel( "Toolbox" );
	this.panel.content.classList.add( "netgis-toolbox" );
	
	// Top
	this.top = document.createElement( "section" );
	this.panel.content.appendChild( this.top );
	
	// Top Items
	var items = config[ "toolbox" ][ "items" ];
	
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[ i ];
		
		// Skip Edit Tools For Non-Editable Client
		if ( this.config[ "tools" ] && this.config[ "tools" ][ "editable" ] === false )
		{
			switch ( item[ "id" ] )
			{
				case "draw_points": { continue; }
				case "draw_lines": { continue; }
				case "draw_polygons": { continue; }
					
				case "modify_features": { continue; }
				case "delete_features": { continue; }
				case "buffer_features": { continue; }
				case "cut_features": { continue; }
			}
		}
		
		this.addButton( this.top, item[ "id" ], item[ "title" ] );
	}
	
	// Bottom
	this.bottom = document.createElement( "section" );
	this.bottom.className = "netgis-color-e netgis-hide";
	this.panel.content.appendChild( this.bottom );
	
	var header = document.createElement( "button" );
	header.className = "netgis-button netgis-clip-text netgis-color-c netgis-gradient-a";
	header.innerHTML = "<span>Einstellungen</span><i class='netgis-icon fas fa-times'></i>";
	header.setAttribute( "type", "button" );
	header.addEventListener( "click", this.onBottomHeaderClick.bind( this ) );
	this.bottom.appendChild( header );
	
	this.bottomTitle = header.getElementsByTagName( "span" )[ 0 ];
	
	// Initial State
	if ( config[ "toolbox" ] && config[ "toolbox" ][ "open" ] === true ) this.panel.show();
};

netgis.Toolbox.prototype.initOptions = function( config )
{
	// Options From Config
	var options = config[ "toolbox" ][ "options" ];
	
	if ( options )
	{
		for ( var id in options )
		{
			var params = options[ id ];
			
			// TODO
		}
	}
	
	// Default Option Panels
	var toolsConfig = config[ "tools" ];
	var snapInputs = [];
	
	if ( toolsConfig )
	{
		if ( ! toolsConfig[ "buffer" ] ) toolsConfig[ "buffer" ] = {};

		this.bottomPanels.drawPoints = document.createElement( "div" );
		snapInputs.push( this.addCheckbox( this.bottomPanels.drawPoints, "Einrasten", this.onDrawSnapToggle.bind( this ) ) );
		this.addCheckbox( this.bottomPanels.drawPoints, "Puffern", this.onDrawBufferToggle.bind( this ) );
		this.addInputNumber( this.bottomPanels.drawPoints, "Radius (Meter):", toolsConfig[ "buffer" ][ "default_radius" ], this.onDrawBufferChange.bind( this ) );
		this.addInputNumber( this.bottomPanels.drawPoints, "Segmente:", toolsConfig[ "buffer" ][ "default_segments" ], this.onDrawBufferChange.bind( this ) );
		this.bottom.appendChild( this.bottomPanels.drawPoints );

		this.bottomPanels.drawLines = document.createElement( "div" );
		snapInputs.push( this.addCheckbox( this.bottomPanels.drawLines, "Einrasten", this.onDrawSnapToggle.bind( this ) ) );
		this.addCheckbox( this.bottomPanels.drawLines, "Puffern", this.onDrawBufferToggle.bind( this ) );
		this.addInputNumber( this.bottomPanels.drawLines, "Radius (Meter):", toolsConfig[ "buffer" ][ "default_radius" ], this.onDrawBufferChange.bind( this ) );
		this.addInputNumber( this.bottomPanels.drawLines, "Segmente:", toolsConfig[ "buffer" ][ "default_segments" ], this.onDrawBufferChange.bind( this ) );
		this.bottom.appendChild( this.bottomPanels.drawLines );

		this.showDrawBufferOptions( false );

		this.bottomPanels.drawPolygons = document.createElement( "div" );
		snapInputs.push( this.addCheckbox( this.bottomPanels.drawPolygons, "Einrasten", this.onDrawSnapToggle.bind( this ) ) );
		this.bottom.appendChild( this.bottomPanels.drawPolygons );

		this.bottomPanels.bufferFeatures = document.createElement( "div" );
		this.addInputNumber( this.bottomPanels.bufferFeatures, "Radius (Meter):", toolsConfig[ "buffer" ][ "default_radius" ], this.onBufferFeaturesChange.bind( this ) );
		this.addInputNumber( this.bottomPanels.bufferFeatures, "Segmente:", toolsConfig[ "buffer" ][ "default_segments" ], this.onBufferFeaturesChange.bind( this ) );
		this.addCheckbox( this.bottomPanels.bufferFeatures, "Mehrfach-Auswahl", this.onSelectMultipleChange.bind( this ) );
		this.addButton( this.bottomPanels.bufferFeatures, null, "<i class='netgis-icon netgis-text-a fas fa-arrow-circle-right'></i><span>Akzeptieren</span>", this.onBufferFeaturesAccept.bind( this ) );
		this.bottom.appendChild( this.bottomPanels.bufferFeatures );
		
		this.bottomPanels.cutFeatures = document.createElement( "div" );
		this.addCheckbox( this.bottomPanels.cutFeatures, "Mehrfach-Auswahl", this.onSelectMultipleChange.bind( this ) );
		this.bottom.appendChild( this.bottomPanels.cutFeatures );

		this.bottomPanels.modifyFeatures = document.createElement( "div" );
		snapInputs.push( this.addCheckbox( this.bottomPanels.modifyFeatures, "Einrasten", this.onDrawSnapToggle.bind( this ) ) );
		this.bottom.appendChild( this.bottomPanels.modifyFeatures );
	}
	
	// Snapping Options
	if ( toolsConfig && toolsConfig[ "snapping" ] )
	{
		if ( toolsConfig[ "snapping" ][ "show" ] === false )
		{
			for ( var i = 0; i < snapInputs.length; i++ )
			{
				snapInputs[ i ].parentNode.classList.add( "netgis-hide" );
			}
		}

		if ( toolsConfig[ "snapping" ][ "active" ] === true )
		{		
			for ( var i = 0; i < snapInputs.length; i++ )
			{
				snapInputs[ i ].checked = true;
			}

			var self = this;

			window.setTimeout
			(
				function()
				{
					netgis.util.invoke( self.panel.container, netgis.Events.MAP_SNAP_TOGGLE, { on: true } );
				},
				100
			);
		}
	}
};

netgis.Toolbox.prototype.initEvents = function()
{
	this.resizeObserver = new ResizeObserver( this.onTopResize.bind( this ) ).observe( this.top );
};

netgis.Toolbox.prototype.attachTo = function( parent )
{
	this.panel.attachTo( parent );
	
	parent.addEventListener( netgis.Events.CLIENT_SET_MODE, this.onClientSetMode.bind( this ) );
	parent.addEventListener( netgis.Events.TOOLBOX_TOGGLE, this.onToolboxToggle.bind( this ) );
	
	parent.addEventListener( netgis.Events.SELECT_MULTI_TOGGLE, this.onSelectMultiToggle.bind( this ) );
};

netgis.Toolbox.prototype.addButton = function( parent, id, title, handler )
{
	var button = document.createElement( "button" );
	button.className = "netgis-button netgis-clip-text netgis-color-e netgis-hover-d";
	button.innerHTML = title;
	button.setAttribute( "type", "button" );
	button.setAttribute( "data-id", id );
	
	// NOTE: using attribute to save callback ref, but allows only one handler
	
	if ( handler )
		button.onclick = handler;
	else
		button.addEventListener( "click", this.onButtonClick.bind( this ) );
	
	if ( parent ) parent.appendChild( button );
	
	return button;
};


netgis.Toolbox.prototype.addCheckbox = function( parent, title, handler )
{
	var label = document.createElement( "label" );
	label.className = "netgis-noselect netgis-color-e netgis-hover-d";
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "checkbox" );
	label.appendChild( input );
	
	var span = document.createElement( "span" );
	span.innerHTML = title;
	label.appendChild( span );
	
	if ( handler ) input.onchange = handler;
	
	if ( parent ) parent.appendChild( label );
	
	return input;
};

netgis.Toolbox.prototype.addInputNumber = function( parent, title, val, handler )
{
	var label = document.createElement( "label" );
	label.className = "netgis-noselect netgis-color-e netgis-hover-d";
	
	var span = document.createElement( "span" );
	span.innerHTML = title;
	label.appendChild( span );
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "number" );
	input.setAttribute( "min", 0 );
	input.value = val;
	label.appendChild( input );
	
	if ( handler )
	{
		input.onchange = handler;
		input.onkeyup = handler;
	}
	
	if ( parent ) parent.appendChild( label );
	
	return input;
};

netgis.Toolbox.prototype.showBottom = function( panel, title )
{
	this.top.classList.add( "netgis-resize-bottom" );
	this.top.style.height = "50%";
	this.top.style.bottom = "auto";
	
	this.bottom.classList.remove( "netgis-hide" );
	
	this.bottomTitle.innerHTML = title;
	
	// TODO: refactor into panel ? see search parcel
	
	if ( ! panel ) return;
	
	for ( var key in this.bottomPanels )
	{
		var bottomPanel = this.bottomPanels[ key ];
		
		if ( bottomPanel === panel )
			bottomPanel.classList.remove( "netgis-hide" );
		else
			bottomPanel.classList.add( "netgis-hide" );
	}
};

netgis.Toolbox.prototype.hideBottom = function()
{
	this.top.classList.remove( "netgis-resize-bottom" );
	this.top.style.height = "auto";
	this.top.style.bottom = "0mm";
	
	this.bottom.classList.add( "netgis-hide" );
	
	// TODO: refactor into panel ? see search parcel
};

netgis.Toolbox.prototype.showDrawBufferOptions = function( on )
{
	var pointInputs = this.bottomPanels.drawPoints.getElementsByTagName( "label" );
	var lineInputs = this.bottomPanels.drawLines.getElementsByTagName( "label" );
	
	pointInputs[ 1 ].getElementsByTagName( "input" )[ 0 ].checked = on;
	lineInputs[ 1 ].getElementsByTagName( "input" )[ 0 ].checked = on;
	
	if ( on )
	{
		pointInputs[ 2 ].classList.remove( "netgis-hide" );
		pointInputs[ 3 ].classList.remove( "netgis-hide" );
		
		lineInputs[ 2 ].classList.remove( "netgis-hide" );
		lineInputs[ 3 ].classList.remove( "netgis-hide" );
	}
	else
	{
		pointInputs[ 2 ].classList.add( "netgis-hide" );
		pointInputs[ 3 ].classList.add( "netgis-hide" );
		
		lineInputs[ 2 ].classList.add( "netgis-hide" );
		lineInputs[ 3 ].classList.add( "netgis-hide" );
	}
};

netgis.Toolbox.prototype.setActiveButton = function( id )
{	
	var buttons = this.top.getElementsByTagName( "button" );
	
	// NOTE: this.top.querySelectorAll( '[data-id="' + params.mode + '"]' )[ 0 ].classList.add( "netgis-active" );
	
	var target = null;
	
	for ( var i = 0; i < buttons.length; i++ )
	{
		var button = buttons[ i ];
		
		if ( id && button.getAttribute( "data-id" ) === id.toLowerCase() )
		{
			target = button;
			
			button.classList.remove( "netgis-color-e" );
			button.classList.add( "netgis-active", "netgis-color-d" );
		}
		else
		{
			button.classList.remove( "netgis-active", "netgis-color-d" );
			button.classList.add( "netgis-color-e" );
		}
	}
	
	if ( target )
	{
		// Scroll Active Button Into View
		var self = this;
		window.setTimeout( function() { self.top.scrollTo( { top: target.offsetTop, behavior: "smooth" } ); }, 10 );
	}
};

netgis.Toolbox.prototype.onToolboxToggle = function( e )
{   
	this.panel.toggle();
};

netgis.Toolbox.prototype.onClientSetMode = function( e )
{
	var params = e.detail;
	
	// Leave
	this.hideBottom();
	
	// Enter
	switch ( params.mode )
	{
		default:
		{
			this.setActiveButton( null );
			break;
		}
		
		case netgis.Modes.VIEW:
		{
			this.setActiveButton( netgis.Commands.VIEW );
			break;
		}
		
		case netgis.Modes.ZOOM_BOX:
		{
			this.setActiveButton( netgis.Commands.ZOOM_BOX );
			break;
		}
		
		case netgis.Modes.MEASURE_LINE:
		{
			this.setActiveButton( netgis.Commands.MEASURE_LINE );
			break;
		}
		
		case netgis.Modes.MEASURE_AREA:
		{
			this.setActiveButton( netgis.Commands.MEASURE_AREA );
			break;
		}
		
		case netgis.Modes.DRAW_POINTS:
		{
			this.setActiveButton( netgis.Commands.DRAW_POINTS );
			this.showBottom( this.bottomPanels.drawPoints, "Punkte zeichnen" );
			break;
		}
		
		case netgis.Modes.DRAW_LINES:
		{
			this.setActiveButton( netgis.Commands.DRAW_LINES );
			this.showBottom( this.bottomPanels.drawLines, "Linien zeichnen" );
			break;
		}
		
		case netgis.Modes.DRAW_POLYGONS:
		{
			this.setActiveButton( netgis.Commands.DRAW_POLYGONS );
			this.showBottom( this.bottomPanels.drawPolygons, "Polygone zeichnen" );
			break;
		}
		
		case netgis.Modes.MODIFY_FEATURES:
		{
			this.setActiveButton( netgis.Commands.MODIFY_FEATURES );
			this.showBottom( this.bottomPanels.modifyFeatures, "Verschieben" );
			break;
		}
		
		case netgis.Modes.DELETE_FEATURES:
		{
			this.setActiveButton( netgis.Commands.DELETE_FEATURES );
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURES:
		{
			this.setActiveButton( netgis.Commands.BUFFER_FEATURES );
			this.showBottom( this.bottomPanels.bufferFeatures, "Puffern" );
			this.onBufferFeaturesChange();
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURES_EDIT:
		{
			this.setActiveButton( netgis.Commands.BUFFER_FEATURES );
			this.showBottom( this.bottomPanels.bufferFeatures, "Puffern" );
			this.onBufferFeaturesChange();
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURES_DYNAMIC:
		{
			this.setActiveButton( netgis.Commands.BUFFER_FEATURES );
			this.showBottom( this.bottomPanels.bufferFeatures, "Puffern" );
			this.onBufferFeaturesChange();
			break;
		}
		
		case netgis.Modes.CUT_FEATURES:
		{
			// TODO: hack to reset multi select because cut options panel not done
			netgis.util.invoke( this.panel.container, netgis.Events.SELECT_MULTI_TOGGLE, { on: false } );
			
			this.setActiveButton( netgis.Commands.CUT_FEATURES );
			//this.showBottom( this.bottomPanels.cutFeatures, "Ausschneiden" ); // TODO: show options with accept button ?
			break;
		}
		
		case netgis.Modes.CUT_FEATURES_DRAW:
		{
			this.setActiveButton( netgis.Commands.CUT_FEATURES );
			break;
		}
	}
};

netgis.Toolbox.prototype.onTopResize = function( e )
{
	if ( this.bottom.classList.contains( "netgis-hide" ) ) return;
	
	var rect = this.top.getBoundingClientRect();
	var parent = this.top.parentNode.getBoundingClientRect();
	var top = rect.bottom - parent.top;
	
	this.bottom.style.top = top + "px";
	
	// TODO: refactor into panel ? see search parcel
};

netgis.Toolbox.prototype.onBottomHeaderClick = function( e )
{
	netgis.util.invoke( this.panel.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.VIEW } );
};

netgis.Toolbox.prototype.onButtonClick = function( e )
{
	var button = e.currentTarget;
	var id = button.getAttribute( "data-id" );
	
	netgis.util.invoke( button, netgis.Events.TOOLBOX_BUTTON_CLICK, { id: id } );
	
	// Buttons With Default Behaviors
	netgis.Client.handleCommand( button, id );
};

netgis.Toolbox.prototype.onDrawSnapToggle = function( e )
{
	// Get Params From Bottom Panel Inputs
	var input = e.currentTarget;
	var label = input.parentNode;
	var panel = label.parentNode;
	var on = input.checked;
	
	netgis.util.invoke( input, netgis.Events.MAP_SNAP_TOGGLE, { on: on } );
	
	// Update Other Panels Inputs
	var others = [];
	
	if ( panel === this.bottomPanels.drawPoints )
	{
		others.push( this.bottomPanels.drawLines );
		others.push( this.bottomPanels.drawPolygons );
		others.push( this.bottomPanels.modifyFeatures );
	}
	
	if ( panel === this.bottomPanels.drawLines )
	{
		others.push( this.bottomPanels.drawPoints );
		others.push( this.bottomPanels.drawPolygons );
		others.push( this.bottomPanels.modifyFeatures );
	}
	
	if ( panel === this.bottomPanels.drawPolygons )
	{
		others.push( this.bottomPanels.drawPoints );
		others.push( this.bottomPanels.drawLines );
		others.push( this.bottomPanels.modifyFeatures );
	}
	
	if ( panel === this.bottomPanels.modifyFeatures )
	{
		others.push( this.bottomPanels.drawPoints );
		others.push( this.bottomPanels.drawLines );
		others.push( this.bottomPanels.drawPolygons );
	}
	
	for ( var i = 0; i < others.length; i++ )
	{
		var inputs = others[ i ].getElementsByTagName( "input" );
		inputs[ 0 ].checked = on;
	}
};

netgis.Toolbox.prototype.onDrawBufferToggle = function( e )
{
	var checkbox = e.currentTarget;
	var on = checkbox.checked;
	
	this.showDrawBufferOptions( on );
	
	var inputs = this.bottomPanels.drawPoints.getElementsByTagName( "input" );
	var radius = Number.parseFloat( inputs[ 2 ].value );
	var segments = Number.parseInt( inputs[ 3 ].value );
	
	netgis.util.invoke( checkbox, netgis.Events.DRAW_BUFFER_TOGGLE, { on: on, radius: radius, segments: segments } );
};

netgis.Toolbox.prototype.onDrawBufferChange = function( e )
{
	// Get Params From Bottom Panel Inputs
	var input = e.currentTarget;
	var label = input.parentNode;
	var panel = label.parentNode;
	
	var inputs = panel.getElementsByTagName( "input" );
	
	var on = inputs[ 1 ].checked;
	var radius = Number.parseFloat( inputs[ 2 ].value );
	var segments = Number.parseInt( inputs[ 3 ].value );
	
	netgis.util.invoke( this.bottomPanels.drawPoints, netgis.Events.DRAW_BUFFER_CHANGE, { on: on, radius: radius, segments: segments } );
	
	// Update Other Panels Inputs
	var other;
	
	if ( panel === this.bottomPanels.drawPoints ) other = this.bottomPanels.drawLines;
	if ( panel === this.bottomPanels.drawLines ) other = this.bottomPanels.drawPoints;
	
	if ( other )
	{
		inputs = other.getElementsByTagName( "input" );
		inputs[ 1 ].checked = on;
		inputs[ 2 ].value = radius;
		inputs[ 3 ].value = segments;
	}
};

netgis.Toolbox.prototype.onBufferFeaturesChange = function( e )
{
	var inputs = this.bottomPanels.bufferFeatures.getElementsByTagName( "input" );
	var radius = Number.parseFloat( inputs[ 0 ].value );
	var segments = Number.parseInt( inputs[ 1 ].value );
	
	netgis.util.invoke( this.bottomPanels.bufferFeatures, netgis.Events.BUFFER_CHANGE, { radius: radius, segments: segments } );
};

netgis.Toolbox.prototype.onSelectMultipleChange = function( e )
{
	var on = e.currentTarget.checked;
	netgis.util.invoke( this.bottomPanels.bufferFeatures, netgis.Events.SELECT_MULTI_TOGGLE, { on: on } );
};

netgis.Toolbox.prototype.onSelectMultiToggle = function( e )
{
	var params = e.detail;
	
	var input = this.bottomPanels.bufferFeatures.getElementsByTagName( "input" )[ 2 ];
	input.checked = params.on;
};

netgis.Toolbox.prototype.onBufferFeaturesAccept = function( e )
{
	var inputs = this.bottomPanels.bufferFeatures.getElementsByTagName( "input" );
	var radius = Number.parseFloat( inputs[ 0 ].value );
	var segments = Number.parseInt( inputs[ 1 ].value );
	
	netgis.util.invoke( this.bottomPanels.bufferFeatures, netgis.Events.BUFFER_ACCEPT, { radius: radius, segments: segments } );
	netgis.util.invoke( this.bottomPanels.bufferFeatures, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.VIEW } );
};