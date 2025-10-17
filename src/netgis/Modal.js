"use strict";

var netgis = netgis || {};

netgis.Modal = function( title )
{
	this.initElements( title );
	this.initEvents();
};

netgis.Modal.prototype.initElements = function( title )
{
	this.container = document.createElement( "div" );
	this.container.className = "netgis-modal";
	this.container.addEventListener( "click", this.onContainerClick.bind( this ) );
	
	this.content = document.createElement( "div" );
	this.content.className = "netgis-color-e netgis-shadow";
	this.container.appendChild( this.content );
	
	this.header = this.addHeader( this.content, title, this.onHeaderClick.bind( this ) );
};

netgis.Modal.prototype.initEvents = function()
{
};

netgis.Modal.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
};

netgis.Modal.prototype.show = function()
{
	this.container.classList.add( "netgis-show" );
};

netgis.Modal.prototype.hide = function()
{
	this.container.classList.remove( "netgis-show" );
};

netgis.Modal.prototype.addHeader = function( parent, title, handler )
{
	var button = document.createElement( "button" );
	button.className = "netgis-button netgis-clip-text netgis-color-c netgis-gradient-a";
	button.innerHTML = "<span>" + title + "</span><i class='netgis-icon fas fa-times'></i>";
	button.setAttribute( "type", "button" );
	
	if ( handler ) button.onclick = handler;
	
	if ( parent ) parent.appendChild( button );
	
	return button;
};

netgis.Modal.prototype.onHeaderClick = function( e )
{
	this.hide();
};

netgis.Modal.prototype.onContainerClick = function( e )
{
	if ( e.target === this.container )
	{
		this.hide();
	}
};