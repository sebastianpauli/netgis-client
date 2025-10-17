"use strict";

var netgis = netgis || {};

netgis.Search = function( title )
{
	this.debounce = 400;
	this.autocomplete = true;
	
	this.initElements( title );
	this.initEvents();
};

netgis.Search.prototype.initElements = function( title )
{
	var container = document.createElement( "div" );
	container.className = "netgis-search";
	this.container = container;
	
	var label = document.createElement( "label" );
	container.appendChild( label );
	this.label = label;
	
	var input = document.createElement( "input" );
	input.className = "netgis-round netgis-shadow";
	input.setAttribute( "type", "text" );
	input.setAttribute( "placeholder", title );
	label.appendChild( input );
	this.input = input;
	
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.innerHTML = "<i class='fas fa-search'></i>";
	button.className = "netgis-no-background";
	label.appendChild( button );
	this.button = button;
	
	var closer = document.createElement( "button" );
	closer.setAttribute( "type", "button" );
	closer.className = "netgis-hide netgis-no-background";
	closer.innerHTML = "<i class='fas fa-times'></i>";
	label.appendChild( closer );
	this.closer = closer;
	
	var list = document.createElement( "ul" );
	container.appendChild( list );
	this.results = list;
};

netgis.Search.prototype.initEvents = function()
{
	this.input.addEventListener( "change", this.onInputChange.bind( this ) );
	this.input.addEventListener( "keydown", this.onInputKeyDown.bind( this ) );
	this.input.addEventListener( "keyup", this.onInputKeyUp.bind( this ) );
	
	this.button.addEventListener( "click", this.onButtonClick.bind( this ) );
	this.closer.addEventListener( "click", this.onCloserClick.bind( this ) );
};

netgis.Search.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
};

netgis.Search.prototype.show = function()
{
	this.container.classList.remove( "netgis-hide" );
};

netgis.Search.prototype.hide = function()
{
	this.container.classList.add( "netgis-hide" );
};

netgis.Search.prototype.toggle = function()
{
	this.container.classList.toggle( "netgis-hide" );
};

netgis.Search.prototype.isVisible = function()
{
	return ! this.container.classList.contains( "netgis-hide" );
};

netgis.Search.prototype.minimize = function()
{
	this.container.classList.remove( "netgis-color-e", "netgis-shadow" );
	this.input.classList.add( "netgis-shadow" );
};

netgis.Search.prototype.maximize = function()
{
	this.container.classList.add( "netgis-color-e", "netgis-shadow" );
	this.input.classList.remove( "netgis-shadow" );
};

netgis.Search.prototype.focus = function()
{
	this.input.focus();
};

netgis.Search.prototype.setTitle = function( title )
{
	this.input.setAttribute( "placeholder", title );
};

netgis.Search.prototype.addResult = function( title, data )
{
	var li = document.createElement( "li" );
	
	var button = document.createElement( "button" );
	button.className = "netgis-button netgis-clip-text netgis-color-e netgis-hover-a";
	button.innerHTML = title;
	button.setAttribute( "type", "button" );
	button.setAttribute( "title", button.innerText );
	button.setAttribute( "data-result", data );
	button.addEventListener( "click", this.onResultClick.bind( this ) );
	
	li.appendChild( button );
	
	if ( this.results.childNodes.length === 0 )
	{
		this.showClearButton( true );
	}
	
	this.results.appendChild( li );
	
	this.maximize();
	
	return li;
};

netgis.Search.prototype.clearResults = function()
{
	this.results.innerHTML = "";
	
	this.minimize();
	
	netgis.util.invoke( this.container, netgis.Events.SEARCH_CLEAR, null );
};

netgis.Search.prototype.clearAll = function()
{
	this.clearResults();
	
	this.lastQuery = null;
	
	this.input.value = "";
	
	this.showClearButton( false );
};

netgis.Search.prototype.requestSearch = function( query )
{
	if ( this.lastQuery && this.lastQuery === query ) return;
	
	this.lastQuery = query;
	
	netgis.util.invoke( this.container, netgis.Events.SEARCH_CHANGE, { query: query } );
};

netgis.Search.prototype.showClearButton = function( on )
{
	if ( on === false )
	{
		this.button.classList.remove( "netgis-hide" );
		this.closer.classList.add( "netgis-hide" );
	}
	else
	{
		this.button.classList.add( "netgis-hide" );
		this.closer.classList.remove( "netgis-hide" );
	}
};

netgis.Search.prototype.onInputKeyDown = function( e )
{
	var key = e.keyCode;
	
	if ( key === 13 )
	{
		e.preventDefault();
		return false;
	}
};

netgis.Search.prototype.onInputKeyUp = function( e )
{
	var key = e.keyCode;
	
	switch ( key )
	{
		// Enter
		case 13:
		{
			if ( this.autocomplete )
			{
				// Trigger First Result Click
				var buttons = this.results.getElementsByTagName( "button" );
				if ( buttons.length > 0 ) buttons[ 0 ].click();
			}
			else
			{
				// Trigger Search
				this.onInputTimeout();
			}
			
			break;
		}
		
		// Escape
		case 27:
		{
			this.clearAll();
			break;
		}
		
		default:
		{
			// Trigger Search On Each Key
			if ( this.autocomplete ) this.onInputChange();
			
			break;
		}
	}
};

netgis.Search.prototype.onInputChange = function( e )
{
	if ( this.timeout ) window.clearTimeout( this.timeout );
	this.timeout = window.setTimeout( this.onInputTimeout.bind( this ), this.debounce );
};

netgis.Search.prototype.onInputTimeout = function()
{
	var query = this.input.value;
	query = query.trim();
	
	if ( query.length > 0 )
	{
		this.requestSearch( query );
	}
	else
	{
		this.clearAll();
	}
};

netgis.Search.prototype.onButtonClick = function( e )
{
	this.input.focus();
};

netgis.Search.prototype.onCloserClick = function( e )
{
	this.clearAll();
	this.input.focus();
};

netgis.Search.prototype.onResultClick = function( e )
{
	var item = e.currentTarget;
	var data = item.getAttribute( "data-result" );
	
	netgis.util.invoke( item, netgis.Events.SEARCH_SELECT, { item: item, data: data } );
};