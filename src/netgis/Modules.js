"use strict";

var netgis = netgis || {};

/**
 * @memberof netgis
 * @enum
 * @readonly
 * @global
 */
netgis.Modules =
{
	/** [Menu Bar]{@link netgis.Menu} */
	"menu": true,
	
	/** [Layer Tree Panel]{@link netgis.LayerTree} */
	"layertree": true,
	
	/** [Map View]{@link netgis.Map} */
	"map": true,
	
	/** [Map Controls]{@link netgis.Controls} */
	"controls": true,
	
	/** [Map Layer Attribution]{@link netgis.Attribution} */
	"attribution": true,
	
	/** [Legend Panel]{@link netgis.Legend} */
	"legend": true,
	
	/** [Geolocation Controls]{@link netgis.Geolocation} */
	"geolocation": true,
	
	/** [Feature Info Popup]{@link netgis.Info} */
	"info": true,
	
	/** [Search Place Panel]{@link netgis.SearchPlace} */
	"searchplace": true,
	
	/** [Search Parcel Panel]{@link netgis.SearchParcel} */
	"searchparcel": true,
	
	/** [Toolbox Panel]{@link netgis.Toolbox} */
	"toolbox": true,
	
	/** [Import Layer Modal]{@link netgis.Import} */
	"import": true,
	
	/** [Export Map Modal]{@link netgis.Export} */
	"export": true,
	
	/** [Time Slider Panel]{@link netgis.TimeSlider} */
	"timeslider": true
};