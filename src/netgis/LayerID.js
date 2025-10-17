"use strict";

var netgis = netgis || {};

/**
 * Default IDs for Built-in Layers
 * 
 * @memberof netgis
 * @enum
 * @readonly
 * @global
 */
netgis.LayerID =
{
	/** "editable-layer" */
	EDITABLE: "editable-layer",

	/** "non-editable-layer" */
	NON_EDITABLE: "non-editable-layer"
};

// TODO: object freeze on this enum