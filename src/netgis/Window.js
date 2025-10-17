"use strict";

var netgis = netgis || {};

netgis.Window = function( title )
{
	this.dragging = false;
	this.resizing = false;
	this.px = 0;
	this.py = 0;
	
	this.initElements( title );
	this.initEvents();
	
	// Reset Position Values For Bottom Right Resizing
	var self = this;
	
	window.setTimeout
	(
		function()
		{
			var rect = self.container.getBoundingClientRect();
			
			self.container.style.right = "auto";
			self.container.style.bottom = "auto";
			
			self.container.style.left = rect.left + "px";
			self.container.style.top = rect.top + "px";
		},
		100
	);
};

netgis.Window.prototype.initElements = function( title )
{
	this.container = document.createElement( "section" );
	this.container.className = "netgis-window netgis-shadow";
	
	this.header = document.createElement( "button" );
	this.header.setAttribute( "type", "button" );
	this.header.className = "netgis-mover netgis-button netgis-clip-text netgis-color-c netgis-gradient-a netgis-shadow";
	this.header.innerHTML = title;
	this.container.appendChild( this.header );
	
	this.closer = document.createElement( "button" );
	this.closer.className = "netgis-closer netgis-button netgis-text-e";
	this.closer.innerHTML = '<i class="netgis-icon fas fa-times"></i>';
	this.closer.setAttribute( "type", "button" );
	this.container.appendChild( this.closer );
	
	this.content = document.createElement( "div" );
	this.content.className = "netgis-content";
	this.container.appendChild( this.content );
};

netgis.Window.prototype.initEvents = function()
{
	this.closer.addEventListener( "click", this.onCloserClick.bind( this ) );
	this.header.addEventListener( "pointerdown", this.onPointerDown.bind( this ) );
	
	document.addEventListener( "pointermove", this.onDocPointerMove.bind( this ) );
	document.addEventListener( "pointerup", this.onDocPointerUp.bind( this ) );
	
	this.observer = new ResizeObserver( this.onResizeObserve.bind( this ) );
	this.observer.observe( this.container, { attributes: true } );
};

netgis.Window.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
};

netgis.Window.prototype.show = function()
{
	this.container.classList.remove( "netgis-hide" );
};

netgis.Window.prototype.hide = function()
{
	this.container.classList.add( "netgis-hide" );
};

netgis.Window.prototype.toggle = function()
{
	this.container.classList.toggle( "netgis-hide" );
	
	// TODO: invoke window toggle events
};

netgis.Window.prototype.isVisible = function()
{
	return ( ! this.container.classList.contains( "netgis-hide" ) );
};

netgis.Window.prototype.onCloserClick = function( e )
{
	this.hide();
};

netgis.Window.prototype.onPointerDown = function( e )
{
	var rect = this.container.getBoundingClientRect();
	
	this.dragging = true;
	
	this.px = e.clientX - rect.left;
	this.py = e.clientY - rect.top;
	
	this.container.classList.add( "netgis-dragging" );
};

netgis.Window.prototype.onDocPointerMove = function( e )
{
	var x = e.clientX;
	var y = e.clientY;
	var rect = this.container.getBoundingClientRect();
	
	if ( this.resizing ) return;
	
	if ( this.dragging )
	{
		x -= this.px;
		y -= this.py;
	
		// Constrains
		var area = this.container.parentNode.getBoundingClientRect();
		
		if ( x < 0 ) { x = 0; this.px = e.clientX - rect.left; }
		if ( y < 40 ) { y = 40; this.py = e.clientY - rect.top; }
		if ( x + rect.width > area.right ) { x = area.width - rect.width; this.px = e.clientX - rect.left; }
		if ( y + rect.height > area.bottom ) { y = area.height - rect.height; this.py = e.clientY - rect.top; }
		
		this.container.style.left = x + "px";
		this.container.style.top = y + "px";
		this.container.style.right = "auto";
		this.container.style.bottom = "auto";
	}
};

netgis.Window.prototype.onDocPointerUp = function( e )
{
	this.dragging = false;
	this.resizing = false;
	
	this.container.classList.remove( "netgis-dragging" );
};

netgis.Window.prototype.onResizeObserve = function( e )
{
	if ( this.dragging )
	{
		this.dragging = false;
		this.resizing = true;
	}
	
	var rect = this.container.getBoundingClientRect();
	
	netgis.util.invoke( this.container, netgis.Events.WINDOW_RESIZE, { x: rect.x, y: rect.y, w: rect.width, h: rect.height } );
};