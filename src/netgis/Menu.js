"use strict";

var netgis = netgis || {};

/**
 * Menu Bar Module.
 * @param {JSON} config [Menu.Config]{@link netgis.Menu.Config}
 * @constructor
 * @memberof netgis
 */
netgis.Menu = function( config )
{
	this.config = config;
	
	this.initElements();
	this.initConfig( config );
};

/**
 * Config Section "menu"
 * @memberof netgis.Menu
 * @enum
 */
netgis.Menu.Config =
{	
	/**
	 * HTML content for the logo area in the top left.
	 * @type String
	 */
	"header": "<a href='.' target='_self'>NetGIS Client</a>",
	
	/**
	 * An array of menu items. See {@link Commands} for special ID values.
	 * <ul>
	 *	<li>Basic Items:<br/><code>{ "id": {String}, "title": {String} }</code></li>
	 *	<li>Nested Items:<br/><code>{ "title": {String}, "items": {Array} }</code></li>
	 * </ul>
	 * @type Array
	 */
	"items": [],
	
	/**
	 * Display smaller sub items in dropdowns.
	 * @type Boolean
	 */
	"compact": true
};

netgis.Menu.prototype.initElements = function()
{
	this.container = document.createElement( "nav" );
	this.container.className = "netgis-menu netgis-noselect netgis-color-a netgis-gradient-a netgis-shadow-large";
	
	this.toggle = document.createElement( "button" );
	this.toggle.setAttribute( "type", "button" );
	this.toggle.addEventListener( "click", this.onToggleClick.bind( this ) );
	this.toggle.className = "netgis-menu-toggle netgis-hover-c";
	this.toggle.innerHTML = "<i class='fas fa-bars'></i>";
	this.container.appendChild( this.toggle );
};

netgis.Menu.prototype.initConfig = function( config )
{
	var cfg = config[ "menu" ];
	
	if ( ! cfg ) return;
	
	// Header
	if ( cfg[ "header" ] ) this.addHeader( cfg[ "header" ] );
	
	// Items
	if ( cfg[ "compact" ] === true ) this.container.classList.add( "netgis-compact" );
	
	if ( cfg[ "items" ] )
	{
		var items = cfg[ "items" ];

		for ( var i = 0; i < items.length; i++ )
		{
			var item = items[ i ];

			if ( item[ "items" ] )
			{
				// Dropdown
				var subitems = item[ "items" ];
				
				if ( item[ "id" ] === "scales" )
				{
					var scales = this.getScaleItems();
		
					for ( var s = 0; s < scales.length; s++ ) subitems.push( scales[ s ] );
				}
				
				this.addDropdown( item[ "title" ], subitems );
			}
			else if ( item[ "url" ] && item[ "url" ].length > 0 )
			{
				// Link
				this.addLink( item[ "url" ], item[ "title" ] );
			}
			else if ( item[ "options" ] )
			{
				// Select
				var options;
				var val;

				if ( item[ "options" ] === "scales" )
				{
					// Map Scales Options
					options = {};

					options[ 0 ] = "1:X";

					for ( var s = 0; s < config.map.scales.length; s++ )
					{
						options[ config[ "map" ][ "scales" ][ s ] ] = "1:" + config[ "map" ][ "scales" ][ s ];
					}

					val = config[ "map" ][ "default_scale" ];

					var select = this.addSelect( item[ "id" ], item[ "title" ], options, val );
					select.options[ 0 ].classList.add( "netgis-hide" );
				}
				else
				{
					// Config Options
					options = item[ "options" ];

					if ( item[ "value" ] )
					{
						val = item[ "value" ];
					}
					else
					{
						for ( var k in options )
						{
							val = k;
							break;
						}
					}

					this.addSelect( item[ "id" ], item[ "title" ], options, val );
				}
			}
			else
			{
				// Button
				this.addButton( item[ "id" ], item[ "title" ] );
			}

			// TODO: menu items type config ?
		}
	}
};

netgis.Menu.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
	
	parent.addEventListener( netgis.Events.MAP_VIEW_CHANGE, this.onMapViewChange.bind( this ) );
};

netgis.Menu.prototype.addHeader = function( title )
{
	var h1 = document.createElement( "h1" );
	h1.className = "netgis-hover-c";
	h1.innerHTML = title;
	
	this.container.appendChild( h1 );
	
	return h1;
};

netgis.Menu.prototype.addButton = function( id, title )
{
	var button = this.createButton( id, title );
	this.container.appendChild( button );
	
	return button;
};

netgis.Menu.prototype.addLink = function( url, title )
{
	var link = this.createLink( url, title );
	this.container.appendChild( link );
	
	return link;
};

netgis.Menu.prototype.addSelect = function( id, title, options, val )
{
	var wrapper = document.createElement( "span" );
	wrapper.className = "netgis-wrapper netgis-hover-c";
	
	var select = document.createElement( "select" );
	select.setAttribute( "data-id", id );
	
	for ( var key in options )
	{
		var label = options[ key ];
		
		var option = document.createElement( "option" );
		option.setAttribute( "value", key );
		option.innerHTML = label;
		select.appendChild( option );
	}
	
	select.value = val;
	select.addEventListener( "change", this.onSelectChange.bind( this ) );
	wrapper.appendChild( select );
	
	if ( title )
	{
		var span = document.createElement( "span" );
		span.className = "netgis-icon";
		span.innerHTML = title;
		wrapper.appendChild( span );
	}
	
	this.container.appendChild( wrapper );
	
	return select;
};

netgis.Menu.prototype.addDropdown = function( title, items )
{
	var wrapper = document.createElement( "div" );
	wrapper.className = "netgis-dropdown netgis-hover-c";
	
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.addEventListener( "click", this.onDropdownClick.bind( this ) );
	button.innerHTML = title;
	wrapper.appendChild( button );
	
	var list = document.createElement( "ul" );
	list.className = "netgis-color-e netgis-shadow";
	wrapper.appendChild( list );
	
	for ( var i = 0; i < items.length; i++ )
	{
		list.appendChild( this.createMenuItem( items[ i ] ) );
	}

	this.container.appendChild( wrapper );
			
	return wrapper;
};

netgis.Menu.prototype.getScaleItems = function()
{
	var items = [];
	
	if ( ! this.config ) return items;
	if ( ! this.config[ "map" ] ) return items;
	if ( ! this.config[ "map" ][ "scales" ] ) return items;
	
	var scales = this.config[ "map" ][ "scales" ];
		
	for ( var i = 0; i < scales.length; i++ )
	{
		var scale = scales[ i ];
		items.push( { id: netgis.Commands.ZOOM_SCALE, title: "1:" + scale } );

		// TODO: set scale value as element data attribute ?
	}
	
	return items;
};

netgis.Menu.prototype.createMenuItem = function( item )
{
	var li = document.createElement( "li" );
	li.className = "netgis-hover-c";
	
	var subitems = item[ "items" ];
	
	if ( item[ "id" ] === "scales" )
	{
		var scales = this.getScaleItems();
		
		for ( var i = 0; i < scales.length; i++ ) subitems.push( scales[ i ] );
		
		/*
		var scales = this.config[ "map" ][ "scales" ];
		
		for ( var i = 0; i < scales.length; i++ )
		{
			var scale = scales[ i ];
			subitems.push( { id: netgis.Commands.ZOOM_SCALE, title: "1:" + scale } );
			
			// TODO: set scale value as element data attribute ?
		}
		*/
	}
	
	if ( subitems && subitems.length > 0 )
	{
		// Dropdown
		var menu = this.createMenu( item[ "title" ], subitems );
		li.appendChild( menu.button );
		li.appendChild( menu.list );
	}
	else if ( item[ "type" ] )
	{
		switch ( item[ "type" ] )
		{
			case "checkbox":
			{
				var checkbox = this.createCheckbox( item[ "id" ], item[ "title" ], item[ "value" ] );
				li.appendChild( checkbox );
				break;
			}
			
			default:
			{
				console.error( "unhandled menu item type", item[ "type" ], "for", item[ "id" ] );
				break;
			}
		}
	}
	else if ( item[ "url" ] )
	{
		// Link
		var link = this.createLink( item[ "url" ], item[ "title" ] );
		li.appendChild( link );
	}
	else
	{
		// Button
		var button = this.createButton( item[ "id" ], item[ "title" ] );
		li.appendChild( button );
	}
	
	return li;
};

netgis.Menu.prototype.createMenu = function( title, items )
{
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.addEventListener( "pointerdown", this.onButtonClick.bind( this ) );
	button.innerHTML = title;
	
	var list = document.createElement( "ul" );
	list.className = "netgis-color-e netgis-shadow";

	for ( var i = 0; i < items.length; i++ )
	{
		list.appendChild( this.createMenuItem( items[ i ] ) );
	}
	
	return { button: button, list: list };
};

netgis.Menu.prototype.createLink = function( url, title )
{
	var link = document.createElement( "a" );
	link.setAttribute( "href", url );
	link.setAttribute( "target", "_blank" );
	link.className = "netgis-button netgis-text-e netgis-hover-c";
	link.innerHTML = title;
	
	return link;
};

netgis.Menu.prototype.createButton = function( id, title )
{
	var button = document.createElement( "button" );
	button.className = "netgis-text-e netgis-hover-c";
	button.setAttribute( "type", "button" );
	button.setAttribute( "data-id", id );
	button.addEventListener( "click", this.onButtonClick.bind( this ) );
	button.innerHTML = title;
	
	return button;
};

netgis.Menu.prototype.createCheckbox = function( id, title, checked )
{
	var label = document.createElement( "label" );
	label.className = "netgis-button";
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "checkbox" );
	input.setAttribute( "data-id", id );
	input.addEventListener( "change", this.onCheckboxChange.bind( this ) );
	input.checked = checked;
	label.appendChild( input );
	
	var span = document.createElement( "span" );
	span.innerHTML = title;
	label.appendChild( span );
	
	return label;
};

netgis.Menu.prototype.onToggleClick = function( e )
{
	this.container.classList.toggle( "netgis-menu-large" );
};

netgis.Menu.prototype.onButtonClick = function( e )
{
	var button = e.currentTarget;
	var id = button.getAttribute( "data-id" );
	
	// TODO: when to auto close responsive menu ?
	this.container.classList.remove( "netgis-menu-large" );
	this.container.scrollTop = 0;
	
	netgis.util.invoke( button, netgis.Events.MENU_BUTTON_CLICK, { id: id } );
	
	// Buttons With Default Behaviors
	netgis.Client.handleCommand( button, id );
};

netgis.Menu.prototype.onCheckboxChange = function( e )
{
	var input = e.currentTarget;
	var id = input.getAttribute( "data-id" );
	var checked = input.checked;
	
	netgis.util.invoke( input, netgis.Events.MENU_CHECKBOX_CHANGE, { id: id, checked: checked } );
	
	// Inputs With Default Behaviors
	switch ( id )
	{
		case netgis.Menu.ItemID.SNAP_TOGGLE:
		{
			netgis.util.invoke( input, netgis.Events.MAP_SNAP_TOGGLE, { on: checked } );
			break;
		}
		
		default:
		{
			console.error( "unhandled menu item id", id );
			break;
		}
	}
};

netgis.Menu.prototype.onSelectChange = function( e )
{
	var select = e.currentTarget;
	var id = select.getAttribute( "data-id" );
	var val = select.value;
	
	netgis.util.invoke( select, netgis.Events.MENU_SELECT_CHANGE, { id: id, value: val } );
	
	switch ( id )
	{
		case "scales":
		{
			netgis.util.invoke( select, netgis.Events.MAP_ZOOM_SCALE, { scale: Number.parseInt( val ) } );
			break;
		}
	}
};

netgis.Menu.prototype.onMapViewChange = function( e )
{
	var params = e.detail;
	var scale = params.scale;
	
	// Scale Menu Items
	var items = this.container.getElementsByTagName( "button" );
	
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[ i ];
		
		if ( item.getAttribute( "data-id" ) !== "zoom_scale" ) continue;
		
		if ( Number.parseInt( item.innerText.split( ":" )[ 1 ] ) === scale )
			item.classList.add( "netgis-bold" );
		else
			item.classList.remove( "netgis-bold" );
	}
	
	// Scale Select Inputs
	var selects = this.container.getElementsByTagName( "select" );
	
	for ( var i = 0; i < selects.length; i++ )
	{
		var select = selects[ i ];
		
		if ( ! select.getAttribute( "data-id" ) === "scales" ) return;
		
		// Find Existing Scale Option
		var found = false;
		var scales = this.config[ "map" ][ "scales" ];
		
		for ( var j = 0; j < scales.length; j++ )
		{
			if ( scales[ j ] === scale )
			{
				found = true;
				break;
			}
		}
		
		if ( found )
		{
			select.options[ 0 ].classList.add( "netgis-hide" );
		}
		else
		{
			select.options[ 0 ].setAttribute( "value", params.scale );
			select.options[ 0 ].innerHTML = "1:" + params.scale;
			select.options[ 0 ].classList.remove( "netgis-hide" );
		}
		
		/*if ( ! found )
		{
			// Set Current Scale Option
			if ( ! this.scaleOption )
			{
				this.scaleOption = document.createElement( "option" );
				select.insertBefore( this.scaleOption, select.firstChild );
			}
			
			this.scaleOption.setAttribute( "value", params.scale );
			this.scaleOption.innerHTML = "1:" + params.scale;
			
			// TODO: manage multiple scales history items ?
		}
		else if ( this.scaleOption )
		{
			// Remove Non-Config Scale Option
			select.removeChild( this.scaleOption );
			this.scaleOption = null;
		}*/
		
		select.value = scale;
	}
};

netgis.Menu.prototype.onDropdownClick = function( e )
{
	var button = e.currentTarget;
	var dropdown = button.parentNode;
	
	dropdown.classList.toggle( "netgis-active" );
};
