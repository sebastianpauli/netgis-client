# netgis-client
WebGIS-Client in development for NetGIS / Geoportal RLP.

## Disclaimer:
In early development, things will change and break frequently!

## Principles:
- **Small Footprint:** Because this map clients purpose is to be included in other websites in multiple instances, no frameworks are used to keep it lean. Obviously some libraries like OL are necessary (see dependencies), but the goal is to mostly rely on browser APIs only.
- **Backwards Compatibility:** This map client may be used in work environments with relatively old hardware and software.
- **Modularization:** Functionality is encapsulated in module classes (classic JS prototyped objects).
- **Programming Patterns:** At the core this client makes heavy use of the Observer and State patterns. Where possible pure functions shall be implemented to reduce side effects.

## Dependencies:
These are the required libraries with their latest known-to-work versions and downloads:

### Core:
- OpenLayers [10.0.0](https://github.com/openlayers/openlayers/releases/download/v10.0.0/v10.0.0-site.zip)
- FontAwesome [5.12.0](https://use.fontawesome.com/releases/v5.12.0/fontawesome-free-5.12.0-web.zip)

### Optional:
- PROJ4JS [2.6.0](https://github.com/proj4js/proj4js/archive/refs/tags/2.6.0.zip)
- JSTS [1.6.1](https://github.com/bjornharrtell/jsts/archive/refs/tags/1.6.1.zip)
- ShapefileJS [4.0.2](https://github.com/calvinmetcalf/shapefile-js/archive/refs/tags/v4.0.2.zip)
- JSPDF [1.3.2](https://github.com/parallax/jsPDF/archive/refs/tags/v1.3.2.zip)
- GIFJS [0.2.0](https://github.com/jnordberg/gif.js/archive/refs/tags/v0.2.0.zip)
- SQLJS [1.8.0](https://github.com/sql-js/sql.js/releases/download/v1.8.0/sql.js)
- GeoPackageJS [4.2.3](https://github.com/ngageoint/geopackage-js/archive/refs/tags/4.2.3.zip)

## Documentation:
- Follow the [Tutorial](https://github.com/sebastianpauli/netgis-client/blob/main/TUTORIAL.md)
- See the [How To](https://github.com/sebastianpauli/netgis-client/blob/main/HOWTO.md) guides for more examples
- View the [Online Documentation](https://sebastianpauli.net/netgis/docs/)
- See the [Demo](https://github.com/sebastianpauli/netgis-client/tree/main/demo) folder for example implementations
