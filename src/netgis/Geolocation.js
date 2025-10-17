"use strict";

var netgis = netgis || {};

/**
 * Geolocation Module.
 * @param {JSON} config [Geolocation.Config]{@link netgis.Geolocation.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.Geolocation = function( config )
{
	this.config = config;
	
	this.active = false;
	this.center = false;
};

/**
 * Config Section "geolocation"
 * @memberof netgis.Geolocation
 * @enum
 */
netgis.Geolocation.Config =
{
	/**
	 * Marker color
	 * @type String
	 */
	"marker_color": "#3480eb",
	
	/**
	 * Marker title
	 * @type String
	 */
	"marker_title": "Geolocation",
	
	"timeout": 10000
};

netgis.Geolocation.prototype.initConfig = function( config )
{
};

netgis.Geolocation.prototype.attachTo = function( parent )
{
	this.container = parent;
	
	parent.addEventListener( netgis.Events.GEOLOCATION_TOGGLE_ACTIVE, this.onGeolocToggleActive.bind( this ) );
	parent.addEventListener( netgis.Events.GEOLOCATION_TOGGLE_CENTER, this.onGeolocToggleCenter.bind( this ) );
};

netgis.Geolocation.prototype.setActive = function( on, silent )
{
	var cfg = this.config[ "geolocation" ];
	
	if ( on )
	{
		if ( navigator.geolocation )
		{
			this.watch = navigator.geolocation.watchPosition
			(
				this.onPositionChange.bind( this ),
				this.onPositionError.bind( this ),
				{
					timeout: ( cfg && cfg[ "timeout" ] ) ? cfg[ "timeout" ] * 1000 : 10000,
					maximumAge: 0,
					enableHighAccuracy: true
				}
			);
			
			if ( ! silent )
				netgis.util.invoke( this.container, netgis.Events.GEOLOCATION_TOGGLE_ACTIVE, { on: true } );
		}
		else
		{
			this.error( "Geolocation not supported by this device!" );
		}
	}
	else
	{
		if ( this.watch )
		{
			navigator.geolocation.clearWatch( this.watch );
			this.watch = null;
		}
		
		if ( ! silent )
			netgis.util.invoke( this.container, netgis.Events.GEOLOCATION_TOGGLE_ACTIVE, { on: false } );
	}
	
	this.active = on;
};

netgis.Geolocation.prototype.isActive = function()
{
	return this.active;
};

netgis.Geolocation.prototype.error = function( message )
{
	console.error( message );
	
	if ( this.watch )
	{
		navigator.geolocation.clearWatch( this.watch );
		this.watch = null;
	}
	
	netgis.util.invoke( this.container, netgis.Events.GEOLOCATION_TOGGLE_ACTIVE, { on: false } );
};

netgis.Geolocation.prototype.onActiveChange = function( e )
{
	var on = e.currentTarget.checked;	
	this.setActive( on );
};

netgis.Geolocation.prototype.onCenterChange = function( e )
{
	var on = e.currentTarget.checked;
};

netgis.Geolocation.prototype.onPositionChange = function( e )
{
	var lon = e.coords.longitude;
	var lat = e.coords.latitude;
	
	netgis.util.invoke( this.container, netgis.Events.GEOLOCATION_CHANGE, { lon: lon, lat: lat, center: this.center } );
};

netgis.Geolocation.prototype.onPositionError = function( e )
{
	this.error( "Geolocation: " + e.message + " (" + e.code + ")" );
};

netgis.Geolocation.prototype.onGeolocToggleActive = function( e )
{
	if ( e.target === this.container ) return;
	
	var params = e.detail;
	
	this.setActive( params.on );
};

netgis.Geolocation.prototype.onGeolocToggleCenter = function( e )
{
	if ( e.target === this.container ) return;
	
	var params = e.detail;
	
	this.center = params.on;
};