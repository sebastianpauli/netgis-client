"use strict";

var netgis = netgis || {};

netgis.ContextMenu = function()
{
	this.initElements();
	
	// TODO: config layertree contextmenu items
	// TODO: listen to contextmenu show with items in params
};

netgis.ContextMenu.prototype.initElements = function()
{
	this.container = document.createElement( "div" );
	this.container.className = "netgis-contextmenu netgis-shadow-large netgis-color-e netgis-hide";
};

netgis.ContextMenu.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
	
	parent.addEventListener( netgis.Events.CONTEXTMENU_SHOW, this.onContextMenuShow.bind( this ) );
	
	parent.addEventListener( "click", this.onParentClick.bind( this ) );
	parent.addEventListener( "pointerup", this.onParentClick.bind( this ) ); // TODO: for act on press buttons, instead listen to panel toggle etc.?
	parent.addEventListener( "scroll", this.onParentScroll.bind( this ), true );
	parent.addEventListener( "keydown", this.onParentKeyDown.bind( this ) );
};

netgis.ContextMenu.prototype.clear = function()
{
	this.container.innerHTML = "";
};

netgis.ContextMenu.prototype.addButton = function( id, title )
{
	var button = document.createElement( "button" );
	button.className = "netgis-button netgis-clip-text netgis-hover-d";
	button.innerHTML = title;
	button.setAttribute( "type", "button" );
	button.setAttribute( "data-id", id );
	button.addEventListener( "click", this.onButtonClick.bind( this ) );
	
	this.container.appendChild( button );
	
	return button;
};

netgis.ContextMenu.prototype.addCheckbox = function( id, title, checked )
{
	var label = document.createElement( "label" );
	label.className = "netgis-noselect netgis-hover-d";
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "checkbox" );
	input.setAttribute( "title", title );
	input.setAttribute( "data-id", id );
	input.checked = checked;
	input.addEventListener( "change", this.onCheckboxChange.bind( this ) );
	label.appendChild( input );
	
	var head = document.createElement( "span" );
	head.className = "netgis-clip-text";
	head.innerHTML = title;
	label.appendChild( head );
	
	this.container.appendChild( label );
	
	return input;
};

netgis.ContextMenu.prototype.addSlider = function( id, title, val, min, max, step )
{
	var label = document.createElement( "label" );
	label.className = "netgis-noselect netgis-hover-d";
	
	var head = document.createElement( "span" );
	head.className = "netgis-clip-text";
	head.innerHTML = title;
	label.appendChild( head );
	
	var wrapper = document.createElement( "span" );
	label.appendChild( wrapper );
	
	if ( ! val && val !== 0 ) val = 50;
	if ( ! min && min !== 0 ) min = 0;
	if ( ! max && max !== 0 ) max = 100;
	if ( ! step ) step = 1;
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "range" );
	input.setAttribute( "min", min );
	input.setAttribute( "max", max );
	input.setAttribute( "step", step );
	input.setAttribute( "value", val );
	input.setAttribute( "data-id", id );
	input.setAttribute( "data-title", title );
	input.setAttribute( "title", title + " " + val );
	input.addEventListener( "change", this.onSliderChange.bind( this ) );
	input.addEventListener( "input", this.onSliderChange.bind( this ) );
	wrapper.appendChild( input );
	
	this.container.appendChild( label );
	
	return input;
};

netgis.ContextMenu.prototype.setVisible = function( on )
{
	if ( on )
		this.container.classList.remove( "netgis-hide" );
	else
		this.container.classList.add( "netgis-hide" );
};

netgis.ContextMenu.prototype.setPosition = function( x, y )
{
	// Keep Inside Bounds
	var parent = this.container.parentNode;
	var bounds = parent.getBoundingClientRect();
	var rect = this.container.getBoundingClientRect();
	
	if ( x + rect.width > bounds.width ) x -= rect.width;
	if ( y + rect.height > bounds.height ) y -= rect.height;
	
	// Final Position
	this.container.style.left = x + "px";
	this.container.style.top = y + "px";
};

netgis.ContextMenu.prototype.onContextMenuShow = function( e )
{
	var params = e.detail;
	
	this.clear();
	
	for ( var i = 0; i < params.items.length; i++ )
	{
		var item = params.items[ i ];
		
		switch ( item.type )
		{
			case "slider":
			{
				this.addSlider( item.id, item.title, item.val, item.min, item.max );
				break;
			}
		}
	}
	
	this.setVisible( true );
	this.setPosition( params.x, params.y );
};

netgis.ContextMenu.prototype.onContextMenu = function( e )
{
	e.preventDefault();
	
	var x = e.clientX;
	var y = e.clientY;
	
	// TODO: check if right click was inside already openend context menu ?
	
	this.setVisible( true );
	this.setPosition( x, y );
	
	return false;
};

netgis.ContextMenu.prototype.onParentClick = function( e )
{
	if ( this.container.contains( e.target ) ) return;
	
	this.setVisible( false );
};

netgis.ContextMenu.prototype.onParentScroll = function( e )
{
	this.setVisible( false );
};

netgis.ContextMenu.prototype.onParentKeyDown = function( e )
{
	var keycode = e.keyCode || e.which;
	
	var KEY_ESCAPE = 27;
	
	if ( keycode === KEY_ESCAPE ) this.setVisible( false );
};

netgis.ContextMenu.prototype.onButtonClick = function( e )
{
	var button = e.currentTarget;
	var id = button.getAttribute( "data-id" );
	
	this.setVisible( false );
	
	netgis.util.invoke( button, netgis.Events.CONTEXTMENU_BUTTON_CLICK, { id: id } );
	
	// Buttons With Default Behaviors
	netgis.Client.handleCommand( button, id );
};

netgis.ContextMenu.prototype.onCheckboxChange = function( e )
{
	var input = e.currentTarget;
	var id = input.getAttribute( "data-id" );
	
	netgis.util.invoke( input, netgis.Events.CONTEXTMENU_CHECKBOX_CHANGE, { id: id, checked: input.checked } );
};

netgis.ContextMenu.prototype.onSliderChange = function( e )
{
	var slider = e.currentTarget;
	var id = slider.getAttribute( "data-id" );
	var val = Number.parseFloat( slider.value );
	var title = slider.getAttribute( "data-title" );
	
	slider.setAttribute( "title", title + " " + val );
	
	netgis.util.invoke( slider, netgis.Events.CONTEXTMENU_SLIDER_CHANGE, { id: id, val: val } );
};
