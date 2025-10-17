"use strict";

var netgis = netgis || {};

/**
 * Plugins Module.
 * @param {JSON} config [Plugins.Config]{@link netgis.Plugins.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.Plugins = function( config )
{
	// TODO: work in progress
	
	this.config = config;
	
	this.plugins = {};
	
	this.initConfig( config );
};

/**
 * Config Section "plugins"
 * @memberof netgis.Plugins
 * @enum
 */
netgis.Plugins.Config =
{
	// TODO: config docs
};

netgis.Plugins.prototype.initConfig = function( config )
{
	var configPlugins = config[ "plugins" ];
	
	if ( ! configPlugins ) return;
	
	for ( var i = 0; i < configPlugins.length; i++ )
	{
		var cfg = configPlugins[ i ];
		var plugin = {};
		
		var wrapper;
		
		switch ( cfg[ "type" ] )
		{
			case "panel":
			{
				var panel = new netgis.Panel( cfg[ "title" ] );
				panel.container.classList.add( "netgis-plugin" );
				
				if ( cfg[ "active" ] ) panel.show();
				
				plugin.panel = panel;
				wrapper = panel;
				
				break;
			}
			
			case "window":
			{
				var window = new netgis.Window( cfg[ "title" ] );
				window.container.classList.add( "netgis-plugin" );
				
				if ( cfg[ "active" ] ) window.show();
				
				plugin.window = window;
				wrapper = window;
				
				break;
			}
		}
		
		if ( wrapper )
		{
			wrapper.container.setAttribute( "data-id", cfg[ "id" ] );
			
			if ( cfg[ "url" ] && cfg[ "url" ].length > 0 )
			{
				var iframe = document.createElement( "iframe" );
				iframe.setAttribute( "name", cfg[ "id" ] );
				iframe.setAttribute( "title", cfg[ "title" ] );
				iframe.setAttribute( "src", cfg[ "url" ] );
				iframe.setAttribute( "data-id", cfg[ "id" ] );

				iframe.onload = this.onIFrameLoad.bind( this );

				plugin.iframe = iframe;
				
				wrapper.content.appendChild( iframe );
				
				// NOTE: https://stackoverflow.com/questions/47080168/listen-to-events-inside-iframe
				// NOTE: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
			}
		}
		
		this.plugins[ cfg[ "id" ] ] = plugin;
	}
};

netgis.Plugins.prototype.attachTo = function( parent )
{
	for ( var id in this.plugins )
	{
		var plugin = this.plugins[ id ];
		
		if ( plugin.panel ) plugin.panel.attachTo( parent );
		if ( plugin.window ) plugin.window.attachTo( parent );
	}
	
	parent.addEventListener( netgis.Events.PLUGIN_TOGGLE, this.onPluginToggle.bind( this ) );
	parent.addEventListener( netgis.Events.PANEL_TOGGLE, this.onPanelToggle.bind( this ) );
	
	for ( var key in netgis.Events )
	{
		var val = netgis.Events[ key ];
		
		parent.addEventListener( val, this.onClientEvent.bind( this ) );
	}
};

netgis.Plugins.prototype.onPluginToggle = function( e )
{
	var params = e.detail;
	var plugin = this.plugins[ params.id ];
	
	if ( plugin.panel ) plugin.panel.toggle();
	if ( plugin.window ) plugin.window.toggle();
	
	// TODO: how invoke events on plugin document ?
};

netgis.Plugins.prototype.onIFrameLoad = function( e )
{
	var iframe = e.target;
	
	// TODO: listen to all netgis events keys
	
	for ( var key in netgis.Events )
	{
		var val = netgis.Events[ key ];
		
		iframe.contentDocument.addEventListener( val, function( e ) { this.onIFrameEvent( e, iframe.getAttribute( "data-id" ) ); }.bind( this ) );
	}
};

netgis.Plugins.prototype.onIFrameMessage = function( e )
{
	console.info( "IFrame Message:", e );
};

netgis.Plugins.prototype.onIFrameEvent = function( e, id )
{
	var src = e.explicitOriginalTarget;
	var params = e.detail;
	
	var plugin = this.plugins[ id ];
	
	/*
	// TODO: is e.explicitOriginalEvent inside iframe document or coming from client ?
	if ( src === plugin.iframe.contentDocument ) console.info( "FROM IFRAME DOC!" );
	if ( plugin.panel.container.parentNode.contains( src ) ) console.info( "FROM INSIDE CLIENT!" );
	*/
	
	// Plugin Events Should Originate From Client
	if ( plugin.panel && ! plugin.panel.container.parentNode.contains( src ) ) netgis.util.invoke( plugin.panel.container, e.type, params );
	if ( plugin.window && ! plugin.window.container.parentNode.contains( src ) ) netgis.util.invoke( plugin.window.container, e.type, params );
};

netgis.Plugins.prototype.onClientEvent = function( e )
{
	var src = e.srcElement;
	var evt = e.type;
	var params = e.detail;
	
	// Client Events Should Not Originate From Plugin
	if ( src.classList.contains( "netgis-plugin" ) ) return;
	
	//console.info( "Plugin Client Event:", e, src, evt, params );
	
	for ( var id in this.plugins )
	{
		var plugin = this.plugins[ id ];
		
		// Client Events Should Not Originate From Plugin
		if ( plugin.panel && plugin.panel.container === src ) continue;
		if ( plugin.window && plugin.window.container === src ) continue;
		
		//console.info( "Plugin Event Dispatch:", id, src, evt, params );
		
		netgis.util.invoke( plugin.iframe.contentDocument, evt, params );
	}
};

netgis.Plugins.prototype.onPanelToggle = function( e )
{
	var params = e.detail;
	
	// Hide Plugin Panels If Other Panel Visible
	if ( params.visible )
	{
		for ( var id in this.plugins )
		{
			var plugin = this.plugins[ id ];
			
			if ( plugin.panel && ( params.container !== plugin.panel.container ) )
			{
				plugin.panel.hide();
			}
		}
	}
};