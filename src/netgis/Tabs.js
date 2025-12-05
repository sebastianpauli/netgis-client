"use strict";

var netgis = netgis || {};

netgis.Tabs = function( titles )
{
	this.activeSection = null;
	
	this.initElements( titles );
	this.setActiveTab( 0 );
};

netgis.Tabs.prototype.initElements = function( titles )
{
	this.container = document.createElement( "div" );
	this.container.className = "netgis-tabs";
	
	this.header = document.createElement( "div" );
	this.header.className = "netgis-header netgis-color-d";
	this.container.appendChild( this.header );
	
	this.content = document.createElement( "div" );
	this.content.className = "netgis-content netgis-color-e";
	this.container.appendChild( this.content );
	
	for ( var i = 0; i < titles.length; i++ )
	{
		var button = document.createElement( "button" );
		button.setAttribute( "type", "button" );
		button.addEventListener( "click", this.onHeaderButtonClick.bind( this ) );
		button.className = "netgis-button netgis-color-d";
		button.innerHTML = titles[ i ];
		this.header.appendChild( button );
		
		var section = document.createElement( "section" );
		section.className = "netgis-color-e netgis-form";
		this.content.appendChild( section );
	}
};

netgis.Tabs.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
};

netgis.Tabs.prototype.setActiveTab = function( t )
{
	var buttons = this.header.getElementsByClassName( "netgis-button" );
	var sections = this.content.getElementsByTagName( "section" );
	
	this.activeSection = null;
	
	for ( var i = 0; i < buttons.length; i++ )
	{
		var button = buttons[ i ];
		var section = sections[ i ];
		
		if ( i === t )
		{
			// Visible
			button.classList.add( "netgis-color-e" );
			button.classList.add( "netgis-text-a" );
			button.classList.add( "netgis-bar-a" );
			button.classList.add( "netgis-active" );
			button.scrollIntoView( { behavior: "smooth" } );
			
			section.classList.remove( "netgis-hide" );
			section.scrollTop = 0;
			
			this.activeSection = section;
		}
		else
		{
			// Hidden
			button.classList.remove( "netgis-color-e" );
			button.classList.remove( "netgis-text-a" );
			button.classList.remove( "netgis-bar-a" );
			button.classList.remove( "netgis-active" );
			
			section.classList.add( "netgis-hide" );
		}
	}
	
	netgis.util.invoke( this.container, netgis.Events.TABS_CHANGE, { index: t, section: this.activeSection } );
};

netgis.Tabs.prototype.getContentSection = function( t )
{
	var sections = this.content.getElementsByTagName( "section" );
	return sections[ t ];
};

netgis.Tabs.prototype.appendContent = function( t, el )
{
	var sections = this.content.getElementsByTagName( "section" );
	sections[ t ].appendChild( el );
};

netgis.Tabs.prototype.updateHeaderScroll = function()
{
	var width = 0;
	
	var buttons = this.header.getElementsByTagName( "button" );
	
	for ( var i = 0; i < buttons.length; i++ )
	{
		var button = buttons[ i ];
		
		width += button.getBoundingClientRect().width;
		
		if ( button.classList.contains( "netgis-active" ) ) button.scrollIntoView();
	}
	
	var max = this.header.getBoundingClientRect().width;
	
	if ( width > max )
	{
		this.container.classList.add( "netgis-scroll" );
	}
	else
	{
		this.container.classList.remove( "netgis-scroll" );
	}
};

netgis.Tabs.prototype.onHeaderButtonClick = function( e )
{
	var button = e.currentTarget;
	var buttons = this.header.getElementsByClassName( "netgis-button" );
	var tabindex = 0;
	
	for ( var i = 0; i < buttons.length; i++ )
	{
		if ( buttons[ i ] === button )
		{
			tabindex = i;
			break;
		}
	}
	
	this.setActiveTab( tabindex );
};