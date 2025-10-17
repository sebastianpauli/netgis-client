"use strict";

var netgis = netgis || {};

/**
 * Map Controls Module.
 * @param {JSON} config [Controls.Config]{@link netgis.Controls.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.Controls = function( config )
{
	this.config = config;
	
	this.initElements( config );
	this.initConfig( config );
};

/**
 * Config Section "controls"
 * @memberof netgis.Controls
 * @enum
 */
netgis.Controls.Config =
{
	/**
	 * Map control buttons. See {@link Commands} for special ID values.
	 * <ul>
	 *	<li>Button Items:<br/><code>{ "id": {String}, "icon": {String}, "title": {String} }</code></li>
	 * </ul>
	 * @type Array
	 */
	"buttons": []
};

netgis.Controls.prototype.initElements = function( config )
{
	this.container = document.createElement( "section" );
	this.container.className = "netgis-controls netgis-color-e netgis-text-a netgis-shadow netgis-round";
	
	// Geolocation Popup
	if ( config && config[ "modules" ] && config[ "modules" ][ "geolocation" ] === true )
	{
		this.popupGeoloc = new netgis.Popup( { direction: "right" } );
		this.popupGeoloc.container.style.width = "60mm";
		
		this.popupGeoloc.setHeader( "Geräte-Standort" );

		// Checkbox Active
		var label = document.createElement( "label" );
		label.className = "netgis-hover-d netgis-clip-text netgis-clickable netgis-noselect";

		var input = document.createElement( "input" );
		input.setAttribute( "type", "checkbox" );
		input.addEventListener( "change", this.onInputGeolocActiveChange.bind( this ) );
		label.appendChild( input );
		
		this.inputGeolocActive = input;

		var span = document.createElement( "span" );
		span.innerHTML = "Aktiviert";
		label.appendChild( span );
		
		this.popupGeoloc.wrapper.appendChild( label );

		// Checkbox Centered
		label = document.createElement( "label" );
		label.className = "netgis-hover-d netgis-clip-text netgis-clickable netgis-noselect";

		input = document.createElement( "input" );
		input.setAttribute( "type", "checkbox" );
		input.addEventListener( "change", this.onInputGeolocCenterChange.bind( this ) );
		label.appendChild( input );
		
		this.inputGeolocCenter = input;

		span = document.createElement( "span" );
		span.innerHTML = "Zentriert";
		label.appendChild( span );
		
		this.popupGeoloc.wrapper.appendChild( label );
	}
};

netgis.Controls.prototype.initConfig = function( config )
{
	var cfg = config[ "controls" ];
	
	if ( ! cfg ) return;
	
	var buttons = cfg[ "buttons" ];
	
	if ( ! buttons ) return;
	
	for ( var i = 0; i < buttons.length; i++ )
	{
		var button = buttons[ i ];
		this.addButton( button[ "id" ], button[ "icon" ], button[ "title" ] );
	}
};

netgis.Controls.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
	
	if ( this.popupGeoloc ) this.popupGeoloc.attachTo( parent );
	
	parent.addEventListener( netgis.Events.GEOLOCATION_SHOW_OPTIONS, this.onGeolocShowOptions.bind( this ) );
	parent.addEventListener( netgis.Events.GEOLOCATION_TOGGLE_ACTIVE, this.onGeolocToggleActive.bind( this ) );
	parent.addEventListener( netgis.Events.GEOLOCATION_TOGGLE_CENTER, this.onGeolocToggleCenter.bind( this ) );
	
	parent.addEventListener( "pointerdown", this.onParentPointerDown.bind( this ) );
};

netgis.Controls.prototype.addButton = function( id, icon, title )
{	
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.setAttribute( "data-id", id );
	button.className = "netgis-hover-a";
	button.innerHTML = icon;
	button.title = title;
	
	// Act On Press
	button.addEventListener( "pointerdown", this.onButtonClick.bind( this ) );
	
	this.container.appendChild( button );
	
	return button;
};

netgis.Controls.prototype.onButtonClick = function( e )
{
	var button = e.currentTarget;
	var id = button.getAttribute( "data-id" );
	
	switch ( id )
	{
		case "zoom_in":
		{
			netgis.util.invoke( button, netgis.Events.MAP_ZOOM, { delta: 1.0 } );
			break;
		}
		
		case "zoom_out":
		{
			netgis.util.invoke( button, netgis.Events.MAP_ZOOM, { delta: -1.0 } );
			break;
		}
		
		case "zoom_home":
		{
			netgis.util.invoke( button, netgis.Events.MAP_ZOOM_HOME, null );
			break;
		}
		
		default:
		{
			netgis.Client.handleCommand( button, id );
			break;
		}
	}
};

netgis.Controls.prototype.onGeolocShowOptions = function( e )
{
	var buttons = this.container.getElementsByTagName( "button" );
	var button = null;
	
	for ( var i = 0; i < buttons.length; i++ )
	{
		var id = buttons[ i ].getAttribute( "data-id" );
		
		if ( ! id ) continue;
		
		if ( id.toUpperCase() === netgis.Commands.GEOLOCATION )
		{
			button = buttons[ i ];
			break;
		}
	}
	
	if ( ! button ) return;
	
	if ( this.popupGeoloc.isVisible() )
	{
		this.popupGeoloc.hide();
		return;
	}
	
	this.popupGeoloc.show();
	
	var rect = button.getBoundingClientRect();
	this.popupGeoloc.setPosition( rect.x + 4, rect.y + rect.height * 0.3 );
};

netgis.Controls.prototype.onParentPointerDown = function( e )
{
	if ( netgis.util.insideElement( this.container, e.clientX, e.clientY ) ) return;
	
	if ( this.popupGeoloc ) this.popupGeoloc.hide();
};

netgis.Controls.prototype.onInputGeolocActiveChange = function( e )
{
	var input = e.currentTarget;
	netgis.util.invoke( input, netgis.Events.GEOLOCATION_TOGGLE_ACTIVE, { on: input.checked } );
};

netgis.Controls.prototype.onInputGeolocCenterChange = function( e )
{
	var input = e.currentTarget;
	netgis.util.invoke( input, netgis.Events.GEOLOCATION_TOGGLE_CENTER, { on: input.checked } );
};

netgis.Controls.prototype.onGeolocToggleActive = function( e )
{
	if ( e.target === this.inputGeolocActive ) return;
	
	var params = e.detail;
	
	this.inputGeolocActive.checked = params.on;
};

netgis.Controls.prototype.onGeolocToggleCenter = function( e )
{
	if ( e.target === this.inputGeolocCenter ) return;
	
	var params = e.detail;
	
	this.inputGeolocCenter.checked = params.on;
};