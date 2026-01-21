"use strict";

var netgis = netgis || {};

netgis.Events =
{
	// Client
	CLIENT_CONTEXT_RESPONSE: "client-context-response",
	CLIENT_SET_MODE: "client-set-mode",

	// Plugins
	PLUGIN_TOGGLE: "plugin-toggle",

	// Controls
	CONTROLS_BUTTON_CLICK: "controls-button-click",

	// Map
	MAP_ZOOM: "map-zoom",
	MAP_ZOOM_HOME: "map-zoom-home",
	MAP_ZOOM_LONLAT: "map-zoom-lonlat",
	MAP_ZOOM_SCALE: "map-zoom-scale",
	MAP_ZOOM_LAYER: "map-zoom-layer",
	MAP_ZOOM_LEVEL: "map-zoom-level",
	MAP_LAYER_CREATE: "map-layer-create",
	MAP_LAYER_TOGGLE: "map-layer-toggle",
	MAP_LAYER_TRANSPARENCY: "map-layer-transparency",
	MAP_LAYER_ORDER: "map-layer-order",
	MAP_LAYER_DELETE: "map-layer-delete",
	MAP_VIEW_CHANGE: "map-view-change",
	MAP_VIEW_NEXT: "map-view-next",
	MAP_VIEW_PREV: "map-view-prev",
	MAP_CLICK: "map-click",
	MAP_FEATURE_ENTER: "map-feature-enter",
	MAP_FEATURE_CLICK: "map-feature-click",
	MAP_FEATURE_LEAVE: "map-feature-leave",
	MAP_SNAP_TOGGLE: "map-snap-toggle",
	MAP_EDIT_LAYER_CHANGE: "map-edit-layer-change",
	MAP_EDIT_LAYER_LOADED: "map-edit-layer-loaded",
	MAP_COPY_FEATURE_TO_EDIT: "map-copy-feature-to-edit",

	// Panel
	PANEL_TOGGLE: "panel-toggle",
	PANEL_RESIZE: "panel-resize",

	// Panel
	WINDOW_TOGGLE: "window-toggle",
	WINDOW_RESIZE: "window-resize",
	
	// Tabs
	TABS_CHANGE: "tabs-change",

	// Tree
	TREE_ITEM_CHANGE: "tree-item-change",
	TREE_ITEM_SLIDER_CHANGE: "tree-item-slider-change",
	TREE_ITEM_ORDER_CHANGE: "tree-item-order-change",
	TREE_ITEM_REMOVE: "tree-item-remove",
	TREE_BUTTON_CLICK: "tree-button-click",

	// Layer Tree
	LAYERTREE_TOGGLE: "layertree-toggle", // TODO: deprecated (see MAP_LAYER_TOGGLE) ?

	// Legend
	LEGEND_TOGGLE: "legend-toggle",

	// Geolocation
	GEOLOCATION_SHOW_OPTIONS: "geolocation-show-options",
	GEOLOCATION_TOGGLE_ACTIVE: "geolocation-toggle-active",
	GEOLOCATION_TOGGLE_CENTER: "geolocation-toggle-center",
	GEOLOCATION_CHANGE: "geolocation-change",

	// Toolbox
	TOOLBOX_TOGGLE: "toolbox-toggle",
	TOOLBOX_BUTTON_CLICK: "toolbox-button-click",

	// Menu
	MENU_BUTTON_CLICK: "menu-button-click",
	MENU_CHECKBOX_CHANGE: "menu-checkbox-change",
	MENU_SELECT_CHANGE: "menu-select-change",

	// Context Menu
	CONTEXTMENU_SHOW: "contextmenu-show",
	CONTEXTMENU_BUTTON_CLICK: "contextmenu-button-click",
	CONTEXTMENU_CHECKBOX_CHANGE: "contextmenu-checkbox-change",
	CONTEXTMENU_SLIDER_CHANGE: "contextmenu-slider-change",

	// Search
	SEARCH_CHANGE: "search-change",
	SEARCH_SELECT: "search-select",
	SEARCH_CLEAR: "search-clear",

	// Search Place
	SEARCHPLACE_TOGGLE: "searchplace-toggle",
	SEARCHPLACE_SELECT: "searchplace-select",
	SEARCHPLACE_CLEAR: "searchplace-clear",

	// Search Parcel
	SEARCHPARCEL_TOGGLE: "searchparcel-toggle",
	SEARCHPARCEL_RESET: "searchparcel-reset",
	SEARCHPARCEL_PARCELS_RESPONSE: "searchparcel-parcels-response",
	SEARCHPARCEL_ITEM_ENTER: "searchparcel-item-enter",
	SEARCHPARCEL_ITEM_LEAVE: "searchparcel-item-leave",
	SEARCHPARCEL_ITEM_CLICK: "searchparcel-item-click",
	SEARCHPARCEL_ITEM_IMPORT: "searchparcel-item-import",

	// Measure
	MEASURE_CLEAR: "measure-clear",

	// Select
	SELECT_MULTI_TOGGLE: "select-multi-toggle",

	// Buffer
	DRAW_BUFFER_TOGGLE: "draw-buffer-toggle",
	DRAW_BUFFER_CHANGE: "draw-buffer-change",
	BUFFER_CHANGE: "buffer-change",
	BUFFER_ACCEPT: "buffer-accept",

	// Import
	IMPORT_LAYER_SHOW: "import-layer-show",
	IMPORT_LAYER_ACCEPT: "import-layer-accept",
	IMPORT_LAYER_PREVIEW: "import-layer-preview",
	IMPORT_LAYER_PREVIEW_FEATURES: "import-layer-preview-features",
	IMPORT_GEOPORTAL_SUBMIT: "import-geoportal-submit",

	// Export
	EXPORT_SHOW: "export-show",
	EXPORT_BEGIN: "export-begin",
	EXPORT_END: "export-end",

	// Time Slider
	TIMESLIDER_SHOW: "timeslider-show",
	TIMESLIDER_HIDE: "timeslider-hide",
	TIMESLIDER_SELECT: "timeslider-select"
};

// TODO: object freeze on this enum