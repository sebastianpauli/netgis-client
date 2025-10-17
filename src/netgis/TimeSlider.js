"use strict";

var netgis = netgis || {};

/**
 * Time Slider Module for [WMST Layers]{@link LayerTypes}.
 * @param {JSON} config [TimeSlider.Config]{@link netgis.TimeSlider.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.TimeSlider = function( config )
{
	// TODO: work in progress
	
	this.config = config;
	
	this.insertTop = true;
	
	this.initElements();
	
	// Test
	/*for ( var i = 1900; i <= 2000; i++ )
	{
		this.addTimeStep( "test_" + i, i + " n.Chr." );
	}*/
	
	var self = this;
	window.setTimeout( function() { self.container.scrollLeft = 0; }, 1 );
};

/**
 * Config Section "timeslider"
 * @memberof netgis.TimeSlider
 * @enum
 */
netgis.TimeSlider.Config =
{
};

netgis.TimeSlider.prototype.initElements = function()
{
	this.container = document.createElement( "section" );
	this.container.className = "netgis-timeslider netgis-footer netgis-noselect netgis-color-e netgis-hide";
	document.addEventListener( "pointermove", this.onPointerMove.bind( this ) );
	document.addEventListener( "pointerup", this.onPointerUp.bind( this ) );
	
	this.header = document.createElement( "button" );
	this.header.className = "netgis-header netgis-button netgis-clip-text netgis-color-a netgis-hover-c netgis-shadow";
	this.header.innerHTML = "<i class='netgis-icon fas fa-clock'></i><span>" + "TimeSlider" + "</span><i class='netgis-icon fas fa-times'></i>";
	this.header.setAttribute( "type", "button" );
	this.header.addEventListener( "click", this.onHeaderClick.bind( this ) );
	this.container.appendChild( this.header );
	
	this.wrapper = document.createElement( "div" );
	this.wrapper.className = "netgis-wrapper";
	this.wrapper.addEventListener( "pointerdown", this.onPointerDown.bind( this ) );
	this.container.appendChild( this.wrapper );
	
	this.table = document.createElement( "table" );
	this.wrapper.appendChild( this.table );
	
	this.top = document.createElement( "tr" );
	this.table.appendChild( this.top );
	
	this.bottom = document.createElement( "tr" );
};

netgis.TimeSlider.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
	
	parent.addEventListener( netgis.Events.TIMESLIDER_SHOW, this.onTimeSliderShow.bind( this ) );
	parent.addEventListener( netgis.Events.TIMESLIDER_HIDE, this.onTimeSliderHide.bind( this ) );
};

netgis.TimeSlider.prototype.setVisible = function( visible )
{
	if ( visible )
	{
		this.container.classList.remove( "netgis-hide" );
		this.container.parentNode.classList.add( "netgis-footer" );
	}
	else
	{
		this.container.classList.add( "netgis-hide" );
		this.container.parentNode.classList.remove( "netgis-footer" );
	}
};

netgis.TimeSlider.prototype.setTitle = function( title )
{
	this.header.getElementsByTagName( "span" )[ 0 ].innerHTML = title;
};

netgis.TimeSlider.prototype.clearTimeSteps = function()
{
	this.top.innerHTML = "";
};

netgis.TimeSlider.prototype.addTimeStep = function( id, title )
{
	var cell = document.createElement( "td" );
	cell.setAttribute( "data-id", id );
	
	var button = document.createElement( "button" );
	button.className = "netgis-button netgis-color-e netgis-hover-d";
	button.innerHTML = "<i class='netgis-icon netgis-text-a far fa-calendar'></i><span>" + title + "</span>";
	button.setAttribute( "type", "button" );
	button.addEventListener( "click", this.onTimeStepClick.bind( this ) );
	cell.appendChild( button );
	
	this.top.appendChild( cell );
};

netgis.TimeSlider.prototype.addTimeStep_01 = function( id, title )
{
	var top = document.createElement( "td" );
	var bottom = document.createElement( "td" );
	
	if ( this.insertTop )
	{
		top.innerHTML = title;
	}
	else
	{
		bottom.innerHTML = title;
	}
	
	this.top.appendChild( top );
	this.bottom.appendChild( bottom );
	
	this.insertTop = ! this.insertTop;
};

netgis.TimeSlider.prototype.setActiveTimeStep = function( i )
{
	var steps = this.top.getElementsByTagName( "td" );
	
	var step = steps[ i ];
	var id = step.getAttribute( "data-id" );
	
	for ( var j = 0; j < steps.length; j++ )
	{
		var other = steps[ j ];
		var icon = other.getElementsByClassName( "netgis-icon" )[ 0 ];
		
		if ( j === i )
		{
			other.classList.add( "netgis-active" );
			icon.classList.remove( "fa-calendar" );
			icon.classList.add( "fa-calendar-check" );
		}
		else
		{
			other.classList.remove( "netgis-active" );
			icon.classList.add( "fa-calendar" );
			icon.classList.remove( "fa-calendar-check" );
		}
	}
	
	step.scrollIntoView();
	
	netgis.util.invoke( step, netgis.Events.TIMESLIDER_SELECT, { layer: this.layerID, time: id } );
};

netgis.TimeSlider.prototype.requestServiceWMST = function( url, id )
{
	// TODO: refactor WMS URL building with import module ?
	
	url = url.trim();
	
	if ( url.length < 1 ) return;
	
	// TODO: get base URL not working with proxy string
	
	// Get Base URL
	//var qmark = url.indexOf( "?" );
	/*
	var qmark = url.lastIndexOf( "?" );
	var baseURL = ( qmark > -1 ) ? url.substr( 0, qmark ) : url;
	
	// Get Params
	var params = [ "request=GetCapabilities" ];
	
	if ( qmark > -1 )
	{
		// Existing Params
		var parts = url.substr( qmark + 1 );
		parts = parts.split( "&" );
		
		for ( var p = 0; p < parts.length; p++ )
		{
			var part = parts[ p ];
			part = part.toLowerCase();
			
			if ( part.search( "service" ) > -1 ) { params.push( part ); continue; }
			if ( part.search( "version" ) > -1 ) { params.push( part ); continue; }
		}
	}
	
	params = params.join( "&" );
	
	if ( params.search( "service=" ) === -1 ) params += "&service=WMS";
	
	// Capabilities URL
	var capsURL = baseURL + "?" + params;
	console.info( "Caps URL:", url, capsURL );
	*/
	
	if ( url.indexOf( "GetCapabilities" ) === -1 )
		url += "&REQUEST=GetCapabilities";
	
	var capsURL = url;
	
	netgis.util.request( capsURL, this.onServiceResponseWMST.bind( this ), { id: id } );
};

netgis.TimeSlider.prototype.onServiceResponseWMST = function( data, requestData )
{
	var parser = new DOMParser();
	var xml = parser.parseFromString( data, "text/xml" );
	var caps = xml.documentElement;
	
	var layers = caps.getElementsByTagName( "Layer" );
	var layerData;
	
	for ( var i = 0; i < layers.length; i++ )
	{
		var layer = layers[ i ];
		var name = layer.getElementsByTagName( "Name" )[ 0 ].textContent;
		
		if ( name === requestData.id )
		{
			// Metadata
			layerData =
			{
				name: name,
				title: layer.getElementsByTagName( "Title" )[ 0 ].textContent,
				abstract: layer.getElementsByTagName( "Abstract" )[ 0 ].textContent,
				queryable: ( layer.getAttribute( "queryable" ) === "1" ),
				opaque: ( layer.getAttribute( "opaque" ) === "1" )
			};
			
			// Projection
			var srs = layer.getElementsByTagName( "SRS" ); // WMS 1.1.1
			if ( srs.length > 0 ) layerData[ "projection" ] = srs[ 0 ].textContent;
			
			var crs = layer.getElementsByTagName( "CRS" ); // WMS 1.3.0
			if ( crs.length > 0 ) layerData[ "projection" ] = crs[ 0 ].textContent;
			
			// Bounding Box
			var bbox = layer.getElementsByTagName( "BoundingBox" )[ 0 ];
			
			layerData[ "bbox" ] =
			[
				Number.parseFloat( bbox.getAttribute( "minx" ) ),
				Number.parseFloat( bbox.getAttribute( "miny" ) ),
				Number.parseFloat( bbox.getAttribute( "maxx" ) ),
				Number.parseFloat( bbox.getAttribute( "maxy" ) )
			];
			
			// Dimensions
			var time;
			var dimensions = layer.getElementsByTagName( "Dimension" );
			
			for ( var j = 0; j < dimensions.length; j++ )
			{
				var dimension = dimensions[ j ];
				
				if ( dimension.getAttribute( "name" ) === "time" )
				{
					time =
					{
						defaultTime: dimension.getAttribute( "default" ), // WMS 1.3.0
						extent: dimension.textContent.split( "/" ) // WMS 1.3.0
					};
					
					break;
				}
			}
			
			var extents = layer.getElementsByTagName( "Extent" );
			
			for ( var j = 0; j < extents.length; j++ )
			{
				var extent = extents[ j ];
				
				if ( extent.getAttribute( "name" ) === "time" )
				{
					time[ "defaultTime" ] = extent.getAttribute( "default" ); // WMS 1.1.1
					time[ "extent" ] = extent.textContent.split( "/" ); // WMS 1.1.1
					
					break;
				}
			}
			
			layerData[ "time" ] = time;
			
			break;
		}
	}
	
	// Render Layer
	this.setTitle( layerData.title );
	
	if ( layerData.time.extent )
	{
		// NOTE: https://plainenglish.io/blog/how-to-loop-through-a-date-range-with-javascript-e88951d4f6c
		// NOTE: https://www.codeply.com/go/fVMtEP6yNw/javascript-loop-date-months
		// NOTE: https://devncoffee.com/create-date-range-in-javascript/
		
		var min = new Date( layerData.time.extent[ 0 ] );
		var max = new Date( layerData.time.extent[ 1 ] );
		var step = layerData.time.extent[ 2 ];
		
		var steps = [];
		
		switch ( step )
		{
			case "P1D":
			{
				while ( min <= max )
				{
					steps.push( new Date( min ) );
					min.setDate( min.getDate() + 1 );
				}
				
				break;
			}
			
			default:
			{
				console.error( "unsupported WMST date range", step, min, max );
			}
		}
		
		for ( var i = 0; i < steps.length; i++ )
		{
			var step = steps[ i ];
			var iso = step.toISOString();
			
			var title = iso;
			title = title.replace( "T", ", " );
			title = title.replace( "Z", "" );
			
			this.addTimeStep( iso, title );
		}
		
		// Done
		this.setActiveTimeStep( steps.length - 1 );
	}
};

netgis.TimeSlider.prototype.onTimeSliderShow = function( e )
{
	var params = e.detail;
	
	this.layerID = params.layer;
	
	this.setTitle( params.title );
	this.clearTimeSteps();
	this.requestServiceWMST( params.url, params.name );
	
	this.setVisible( true );
};

netgis.TimeSlider.prototype.onTimeSliderHide = function( e )
{
	this.setVisible( false );
};

netgis.TimeSlider.prototype.onHeaderClick = function( e )
{
	this.setVisible( false );
};

netgis.TimeSlider.prototype.onPointerDown = function( e )
{
	var x = e.pageX - this.wrapper.offsetLeft;
	
	this.down = true;
	this.downX = x;
	this.downScroll = this.wrapper.scrollLeft;
	
	this.container.classList.add( "netgis-active" );
	
	// TODO: mouse cursor not changing on mouse/pointer events ?
};

netgis.TimeSlider.prototype.onPointerMove = function( e )
{
	if ( ! this.down ) return;
	
	e.preventDefault();
	
	var x = e.pageX - this.wrapper.offsetLeft;
	var scroll = x - this.downX;
	this.wrapper.scrollLeft = this.downScroll - scroll;
};

netgis.TimeSlider.prototype.onPointerUp = function( e )
{
	if ( this.down ) e.preventDefault();
	
	this.down = false;
	
	this.container.classList.remove( "netgis-active" );
};

netgis.TimeSlider.prototype.onTimeStepClick = function( e )
{
	var button = e.currentTarget;
	var cell = button.parentNode;
	var id = cell.getAttribute( "data-id" );
	
	var scroll = Math.abs( this.wrapper.scrollLeft - this.downScroll );
	
	// Click Move Tolerance
	if ( scroll > 5 ) return;
	
	var steps = this.top.getElementsByTagName( "td" );
	var index = -1;
	
	for ( var i = 0; i < steps.length; i++ )
	{
		if ( steps[ i ] === cell )
		{
			index = i;
			break;
		}
	}
	
	this.setActiveTimeStep( index );
};