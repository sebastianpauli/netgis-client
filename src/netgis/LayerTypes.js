"use strict";

var netgis = netgis || {};

/**
 * Supported Layer Types
 * 
 * @memberof netgis
 * @enum
 * @readonly
 * @global
 */
netgis.LayerTypes =
{		
	// Raster Layers

	/**
	 * Tile Map Service<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"url": {String} URL containing {x}/{y}/{z} placeholders</code></li>
	 * </ul>
	 */
	TMS: "TMS",

	/** Raster Tiles, see [TMS]{@link LayerTypes.TMS} */
	XYZ: "XYZ",

	/** OpenStreetMap Tiles, see [TMS]{@link LayerTypes.TMS} */
	OSM: "OSM",

	/**
	 * Web Map Tile Service<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"url": {String} Service host URL</code></li>
	 *	<li><code>"name": {String} Service layer name</code></li>
	 * </ul>
	 */
	WMTS: "WMTS",

	/**
	 * Web Map Service<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"url": {String} Service host URL</code></li>
	 *	<li><code>"name": {String} Service layer name</code></li>
	 *	<li><code>"format": {String} Image MIME type</code></li>
	 *	<li><code>"tiled": {Boolean} Request tiled or full image</code></li>
	 *	<li><code>"username": {String} For basic auth if necessary</code></li>
	 *	<li><code>"password": {String} For basic auth if necessary</code></li>
	 * </ul>
	 */
	WMS: "WMS",

	/**
	 * Web Map Service Temporal<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"url": {String} Service host URL</code></li>
	 *	<li><code>"name": {String} Service layer name</code></li>
	 *	<li><code>"format": {String} Image MIME type</code></li>
	 *	<li><code>"tiled": {Boolean} Request tiled or full image</code></li>
	 *	<li><code>"username": {String} For basic auth if necessary</code></li>
	 *	<li><code>"password": {String} For basic auth if necessary</code></li>
	 * </ul>
	 */
	WMST: "WMST",

	// Vector Layers

	/**
	 * GeoJSON<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"data": {JSON} GeoJSON feature or collection</code></li>
	 *	<li><code>"url": {String} Request from URL if no data given</code></li>
	 * </ul>
	 */
	GEOJSON: "GEOJSON",

	/**
	 * Vector Tiles<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"url": {String} Service host URL</code></li>
	 *	<li><code>"extent": {Array} Data extent if not set by server</code></li>
	 * </ul>
	 */
	VTILES: "VTILES",

	/**
	 * Web Feature Service<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"url": {String} Service host URL</code></li>
	 *	<li><code>"name": {String} Service layer type name</code></li>
	 *	<li><code>"format": {String} Response MIME type</code></li>
	 *	<li><code>"username": {String} For basic auth if necessary</code></li>
	 *	<li><code>"password": {String} For basic auth if necessary</code></li>
	 * </ul>
	 */
	WFS: "WFS",

	/**
	 * Geography Markup Language<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"data": {String} GML document</code></li>
	 * </ul>
	 */
	GML: "GML",

	/**
	 * Keyhole Markup Language<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"url": {String} KML document URL</code></li>
	 * </ul>
	 */
	KML: "KML",

	/**
	 * GeoPackage<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"data": {Array} GeoPackage file content</code></li>
	 * </ul>
	 */
	GEOPACKAGE: "GEOPACKAGE",

	/**
	 * Spatialite<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"data": {Array} Spatialite file content</code></li>
	 * </ul>
	 */
	SPATIALITE: "SPATIALITE",

	/**
	 * Shapefile<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"data": {Array} Shapefile file content</code></li>
	 * </ul>
	 */
	SHAPEFILE: "SHAPEFILE",

	/**
	 * Well Known Text<br/>
	 * Parameters:
	 * <ul>
	 *	<li><code>"data": {String} WKT content</code></li>
	 * </ul>
	 */
	WKT: "WKT",

	// Special Layers

	/** Hidden Layer (not visible in [Layer Tree]{@link netgis.LayerTree}, but may be used for feature queries etc.) */
	HIDDEN: "HIDDEN"
};

// TODO: object freeze on this enum