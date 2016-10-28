var map;
require([
  "dojo/_base/array",
  "extras/SeatGeekSearch",
  "esri/map",
  "esri/geometry/webMercatorUtils",
  "esri/arcgis/utils",
  "esri/dijit/Directions",
  "dojo/parser",
  "esri/dijit/Legend",
  "esri/dijit/Search",
  "esri/geometry/Extent",
  "esri/graphic",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/geometry/screenUtils",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/_base/Color",
  "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
  "dojo/domReady!"], function(arrayUtils, SeatGeekSearch, Map, webMercatorUtils, arcgisUtils, Directions, parser, Legend, Search, Extent, Graphic, SimpleMarkerSymbol, screenUtils, dom, domConstruct, query, Color){


  map = new Map("map", {
    basemap: "streets",
    center: [-78.642, 35.788],
    zoom: 13
  });

  parser.parse();
  //use AGOL web map
  // arcgisUtils.createMap("8924f1d54c9c47c4bf692f11013cf28d", "map").then(function (response) {
  //     map = response.map;
  //
  //     // var legend = new Legend({
  //     //   map: map,
  //     //   layerInfos: (arcgisUtils.getLegendLayers(response))
  //     // }, "legendDiv");
  //     // legend.startup();
  // });

//search
  var search = new Search({
    map: map
  }, dom.byId("search"));
  search.startup();

  map.on("load", enableSpotlight);
  search.on("select-result", showLocation);
  search.on("clear-search", removeSpotlight);

  function enableSpotlight() {
    var html = "<div id='spotlight' class='spotlight'></div>";
    domConstruct.place(html, dom.byId("map_container"), "first");
  }

  function showLocation(e) {
    map.graphics.clear();
    var point = e.result.feature.geometry;
    var symbol = new SimpleMarkerSymbol().setStyle(
    SimpleMarkerSymbol.STYLE_SQUARE).setColor(
    new Color([255,0,0,0.5])
    );
    var graphic = new Graphic(point, symbol);
    map.graphics.add(graphic);

    map.infoWindow.setTitle("Search Result");
    map.infoWindow.setContent(e.result.name);
    map.infoWindow.show(e.result.feature.geometry);

    var spotlight = map.on("extent-change", function(extentChange) {
      var geom = screenUtils.toScreenGeometry(map.extent, map.width,    map.height, e.result.extent);
      var width = geom.xmax - geom.xmin;
      var height = geom.ymin - geom.ymax;

      var max = height;
      if ( width > height ) {
         max = width;
      }

      var margin = '-' + Math.floor(max/2) + 'px 0 0 -' + Math.floor(max/2) + 'px';

      query(".spotlight").addClass("spotlight-active").style({
        width: max + "px",
        height: max + "px",
        margin: margin
      });
      spotlight.remove();
    });
  }

  function removeSpotlight() {
    query(".spotlight").removeClass("spotlight-active");
    map.infoWindow.hide();
    map.graphics.clear();
  }

//diretions
  var directions = new Directions({
    map: map
  }, "dir");
  directions.startup();

//seatgeek
  var sg = new SeatGeekSearch({
    distance: "20mi",
    perPage: 10
  });
  map.on("click", function(e) {
    // Seat Geek expects latitude, longitude
    var geographic = webMercatorUtils.webMercatorToGeographic(e.mapPoint);
    // searchByLoc returns a deferred
    // once the deferred is resolved,
    // pass the results to a callback function
    var sgResults = sg.searchByLoc(geographic);
    sgResults.then(searchSucceeded, searchFailed);
  });
  function searchSucceeded(results) {
  // log results from Seat Geek to the console
    if ( results ) {
      arrayUtils.forEach(results.events, function(e) {
        console.log("Event: ", e.short_title, "; Average Price: ", e.stats.average_price);
      });
    } else {
      console.log("Search completed successfully but there were not any events found near that location.");
    }
  }

  function searchFailed(err) {
    console.log("Seat Geek error: ", error);
  }
});
