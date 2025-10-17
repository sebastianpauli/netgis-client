"use strict";

var netgis = netgis || {};

netgis.Panel = function( title )
{
	this.initElements( title );
	this.initEvents();
};

netgis.Panel.prototype.initElements = function( title )
{
	var container = document.createElement( "section" );
	container.className = "netgis-panel netgis-resize-right netgis-color-e netgis-shadow";
	
	this.content = document.createElement( "div" );
	container.appendChild( this.content );
	
	this.header = this.addHeader( container, title, this.onHeaderClick.bind( this ) );
	
	this.container = container;
};

netgis.Panel.prototype.initEvents = function()
{
	this.resizeObserver = new ResizeObserver( this.onResize.bind( this ) ).observe( this.container );
};

netgis.Panel.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
	
	parent.addEventListener( netgis.Events.PANEL_TOGGLE, this.onPanelToggle.bind( this ) );
};

netgis.Panel.prototype.addHeader = function( parent, title, handler )
{
	var button = document.createElement( "button" );
	button.className = "netgis-button netgis-clip-text netgis-color-c netgis-gradient-a netgis-shadow";
	button.innerHTML = "<span>" + title + "</span><i class='netgis-icon fas fa-times'></i>";
	button.setAttribute( "type", "button" );
	
	// NOTE: using attribute to save callback ref, but allows only one handler
	if ( handler ) button.onclick = handler;
	
	if ( parent ) parent.appendChild( button );
	
	return button;
};

netgis.Panel.prototype.show = function()
{
	if ( this.container.classList.contains( "netgis-show" ) ) return;
	
	this.container.classList.add( "netgis-show" );
	netgis.util.invoke( this.container, netgis.Events.PANEL_TOGGLE, { container: this.container, visible: true, width: this.container.getBoundingClientRect().width } );
};

netgis.Panel.prototype.hide = function()
{
	if ( ! this.container.classList.contains( "netgis-show" ) ) return;
	
	this.container.classList.remove( "netgis-show" );
	netgis.util.invoke( this.container, netgis.Events.PANEL_TOGGLE, { container: this.container, visible: false } );
};

netgis.Panel.prototype.toggle = function()
{
	this.container.classList.toggle( "netgis-show" );
	
	var visible = this.container.classList.contains( "netgis-show" );
	netgis.util.invoke( this.container, netgis.Events.PANEL_TOGGLE, { container: this.container, visible: visible, width: visible ? this.container.getBoundingClientRect().width : undefined } );
};

netgis.Panel.prototype.visible = function()
{
	return this.container.classList.contains( "netgis-show" );
};

netgis.Panel.prototype.width = function()
{
	var rect = this.container.getBoundingClientRect();
	return rect.width;
};

netgis.Panel.prototype.setTitle = function( title )
{
	this.header.getElementsByTagName( "span" )[ 0 ].innerHTML = title;
};

netgis.Panel.prototype.onHeaderClick = function( e )
{
	this.hide();
};

netgis.Panel.prototype.onResize = function( e )
{
	if ( ! this.container.classList.contains( "netgis-show" ) ) return;
		
	var rect = this.container.getBoundingClientRect();
	netgis.util.invoke( this.container, netgis.Events.PANEL_RESIZE, { width: rect.width } );
};

netgis.Panel.prototype.onPanelToggle = function( e )
{
	var params = e.detail;
	
	// Hide If Other Panel Visible
	if ( params.visible )
	{
		if ( params.container !== this.container )
		{
			this.hide();
		}
	}
};