"use strict";

var netgis = netgis || {};

netgis.Popup = function( options )
{
	if ( ! options )
	{
		options =
		{
			direction: "down"
		};
	}
	
	this.options = options;
	
	this.initElements();
};

netgis.Popup.prototype.initElements = function()
{
	// TODO: remove this on destroy ?
	document.body.addEventListener( "pointerdown", this.onDocumentPointerDown.bind( this ) );
	
	this.container = document.createElement( "div" );
	this.container.className = "netgis-popup";
	this.container.addEventListener( "pointerdown", this.onPointerDown.bind( this ) );
	
	this.content = document.createElement( "div" );
	this.content.className = "netgis-content netgis-color-e netgis-round";
	this.container.appendChild( this.content );
	
	// Prevent Mouse Movement Propagation To Map Below
	this.content.addEventListener( "pointermove", function( e ) { e.stopPropagation(); } );
	
	switch ( this.options[ "direction" ] )
	{
		default:
		case "down":
		{
			this.container.classList.add( "netgis-dir-down" );
			break;
		}
		
		case "right":
		{
			this.container.classList.add( "netgis-dir-right" );
			break;
		}
	}
	
	this.arrow = document.createElement( "div" );
	this.arrow.className = "netgis-arrow";
	this.container.appendChild( this.arrow );
	
	// Closer
	this.closer = document.createElement( "button" );
	this.closer.setAttribute( "type", "button" );
	this.closer.className = "netgis-closer netgis-color-e netgis-text-a";
	this.closer.innerHTML = "<span></span><i class='fas fa-times'></i>";
	this.closer.onclick = this.onCloserClick.bind( this );
	this.content.appendChild( this.closer );
	
	// Loader
	this.loader = document.createElement( "div" );
	this.loader.className = "netgis-loader netgis-color-e netgis-text-a";
	this.loader.innerHTML = "<i class='netgis-icon netgis-anim-spin fas fa-sync-alt'></i>";
	
	// Wrapper
	this.wrapper = document.createElement( "div" );
	this.wrapper.className = "netgis-wrapper";
	this.content.appendChild( this.wrapper );
};

netgis.Popup.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
};

netgis.Popup.prototype.show = function()
{
	this.container.classList.add( "netgis-show" );
	
	// Update Width On Small Screens
	if ( netgis.util.isMobile() )
	{
		this.container.style.width = ( document.body.getBoundingClientRect().width - 10 ) + "px";
	}
};

netgis.Popup.prototype.hide = function()
{
	this.container.classList.remove( "netgis-show" );
};

netgis.Popup.prototype.isVisible = function()
{
	return this.container.classList.contains( "netgis-show" );
};

netgis.Popup.prototype.showLoader = function()
{
	this.content.appendChild( this.loader );
};

netgis.Popup.prototype.hideLoader = function()
{
	if ( this.loader.parentNode !== this.content ) return;
	
	this.content.removeChild( this.loader );
};

/**
 * Set the arrow tip pixel coordinates inside the container.
 * Make sure to call show before this to allow bounds checking.
 * @param {Number} x
 * @param {Number} y
 */
netgis.Popup.prototype.setPosition = function( x, y )
{
	// Point Bounds
	var parent = this.container.parentNode;
	var bounds = parent.getBoundingClientRect();
	var arrow = this.arrow.getBoundingClientRect();
	
	if ( x > bounds.width - arrow.width ) x = bounds.width - arrow.width;
	if ( x < arrow.width ) x = arrow.width;
	
	// Point Position
	switch ( this.options[ "direction" ] )
	{
		default:
		case "down":
		{
			this.container.style.left = x + "px";
			this.container.style.top = y + "px";
			break;
		}
		
		case "right":
		{
			this.container.style.right = ( bounds.width - x ) + "px";
			this.container.style.top = y + "px";
			break;
		}
	}
	
	// Keep Popup Content Inside Bounds
	this.content.style.left = "";
	
	var rect = this.content.getBoundingClientRect();
	
	if ( rect.x < 0 )
	{
		this.content.style.left = -rect.x + "px";
	}
	else if ( rect.x + rect.width > bounds.width )
	{
		this.content.style.left = -( rect.x + rect.width - bounds.width ) + "px";
	}
};

netgis.Popup.prototype.setHeader = function( title )
{
	var span = this.closer.getElementsByTagName( "span" )[ 0 ];
	span.innerHTML = title;
};

netgis.Popup.prototype.setContent = function( html )
{
	this.wrapper.innerHTML = html;
};

netgis.Popup.prototype.clearContent = function()
{
	this.wrapper.innerHTML = "";
};

netgis.Popup.prototype.addContent = function( html )
{
	this.wrapper.innerHTML += html;
};

netgis.Popup.prototype.onDocumentPointerDown = function( e )
{
};

netgis.Popup.prototype.onPointerDown = function( e )
{
	e.stopPropagation();
};

netgis.Popup.prototype.onCloserClick = function( e )
{	
	this.hide();
};