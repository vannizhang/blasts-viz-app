// define global variables
var map, addBlastSites, addAllBlastSites, addBlastHighlightSites, zoomToBlastSite;
var mapViewData = [];
var resetMapView;
var mapLoaded = false;
var showCircleWithinCurrentExtent, showAllCircles;

require(["esri/map", 
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/geometry/Point",
    "esri/renderers/ClassBreaksRenderer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/geometry/webMercatorUtils",
    "esri/SpatialReference",
    "esri/Color",
    "esri/layers/VectorTileLayer",
    "esri/InfoTemplate",
    "dojo/domReady!"
], function(
    Map, Graphic, GraphicsLayer, ArcGISTiledMapServiceLayer,
    Point, ClassBreaksRenderer, SimpleMarkerSymbol, SimpleLineSymbol,
    webMercatorUtils, SpatialReference, 
    Color, VectorTileLayer, InfoTemplate
) {
    var initialMapPoint, initialZoomLevel;
    
    // check hash and set up map point & zoom values
    if(!window.location.hash || window.location.hash == '' || window.location.hash == '#'){
        initialMapPoint = [-115.79, 37.63];
        initialZoomLevel = 5;
    } else {
        var hashData = window.location.href.split('#')[1].split('/');
        var mapViewDataFromHash = hashData.slice(4, 7);
        initialMapPoint = [mapViewDataFromHash[0], mapViewDataFromHash[1]];
        initialZoomLevel = mapViewDataFromHash[2];
    }     
    
    var vtlayer = new VectorTileLayer("https://www.arcgis.com/sharing/rest/content/items/b187ae2ee9884d90a1fb09e95ceb003d/resources/styles/root.json");
    
    var satelliteLayer = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer", {
        visible: false
    });  
    satelliteLayer.opacity = 0.3;    
    
    var referenceLayer = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer", {
        visible: false
    });   
    
    var blastLayer = new GraphicsLayer({
        id: 'blastLayer',
        opacity: 0.8
    });
    
    var blastHighlightLayer = new GraphicsLayer({
        id: 'blastHighlightLayer',
        opacity: 0.8
    });    
             
    // initialize map object
    map = new Map("mapDiv", {
        center: initialMapPoint,
        zoom: initialZoomLevel,
        showAttribution: false,
        logo: false
    });
    
    map.addLayers([
        vtlayer,
        satelliteLayer,
        referenceLayer,
        blastLayer,
        blastHighlightLayer
    ])
    
    // add renderer to blasts layer
    var rd = new ClassBreaksRenderer(new SimpleMarkerSymbol(), "magnitude");
    rd.addBreak(5, 7, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 6, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255, 255, 0, 0])),new Color([255, 255, 0, 0.8])));
    rd.addBreak(3, 5, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255, 83, 0, 0])),new Color([255, 83, 0, 0.7])));
    rd.addBreak(0, 3, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([181, 0, 77, 0])),new Color([181, 0, 77, 0.6])));
    blastLayer.renderer = rd;
    
    //populate blast points to map
    addBlastSites = function(locations){
        map.getLayer('blastLayer').clear(); 
        locations.forEach(function(d){             
            var graphic = new Graphic(new Point(d[0], d[1]), null, {lon: +d[0], lat: +d[1], magnitude: +d[2], datetime: +d[3]});    
            map.getLayer('blastLayer').add(graphic);          
        });
    }
    
    //add hover event listener to balst points layer
    blastLayer.on('mouse-over', function(item){
        addBlastHighlightSites([
            item.graphic.attributes.lon,
            item.graphic.attributes.lat,
            item.graphic.attributes.datetime,
            item.graphic.attributes.magnitude
        ]);
    });
    
    blastLayer.on('mouse-out', function(item){
        map.infoWindow.hide();
        map.getLayer('blastHighlightLayer').clear(); 
    })

    //add the hightlight point to map
    addBlastHighlightSites = function(location){
        map.getLayer('blastHighlightLayer').clear();  
        var blastLocation = new Point(location[0], location[1]);
        var symbol = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE, 
          8, 
          null,
          new Color([255, 0, 0, 1])
        );     
        
        var attributes = {
            datetime: location[2],
            magnitude: location[3]
        };

        var graphic = new Graphic(blastLocation, symbol);    
        map.getLayer('blastHighlightLayer').add(graphic);  
        
        showInfoWindow(blastLocation, attributes);
    }    
    
    zoomToBlastSite = function(location){
        map.centerAt(new Point(location[0], location[1]));
    }

    map.on("load", function(){
        if(!window.location.hash || window.location.hash == '' || window.location.hash == '#'){
            //initialize the hash using predefined values
            window.location.hash = initialHash; 
        } else {
            parseHashData();  
        } 
        mapLoaded = true;  
        $('#chartDiv').show(); 
    });
    
    map.on("extent-change", changeHandler); 

    function changeHandler(evt){
        var extent = evt.extent;
        var lod = evt.lod.level;
        var mapCenter = evt.extent.getCenter();
        
        if(mapViewData) {
            mapViewData.length = 0;
        }
        var webMercCoord = webMercatorUtils.xyToLngLat(mapCenter.x, mapCenter.y);
        var tempMapView = []
        tempMapView[0] = webMercCoord[0].toFixed(2);
        tempMapView[1] = webMercCoord[1].toFixed(2);
        tempMapView[2] = lod;
        mapViewData = tempMapView;
        
        if(queryParams && mapLoaded){
            updateHash(queryParams, tempMapView);
        }
        
        coordMin = webMercatorUtils.xyToLngLat(extent.xmin, extent.ymin);
        coordMax = webMercatorUtils.xyToLngLat(extent.xmax, extent.ymax);
        
        if(lod >= 3){
            showBlastsInMapExtent({
                coordMin: coordMin,
                coordMax: coordMax
            });
        } else {
            showAllBlasts();
        }
        
        if(lod >= 9){
            vtlayer.opacity = .5;
            referenceLayer.show();
            satelliteLayer.show();
        } else {
            vtlayer.opacity = 1;
            referenceLayer.hide();
            satelliteLayer.hide();
        }

    } 
    
    resetMapView = function(d){
        var lon = +d[0];
        var lat = +d[1];
        var zoom = +d[2];
        var centerPoint = new Point([lon, lat], new SpatialReference({ wkid:4326 }));
        var centerPointMerc = webMercatorUtils.geographicToWebMercator(centerPoint);
        map.setZoom(zoom);
        map.centerAt(centerPointMerc);
    }
    
    function showInfoWindow(geom, attr){
        var attributes = {
            datetime: attr.datetime,
            magnitude: attr.magnitude
        };
        
        var infoTemplateContent = parseDateForInfoWindow(attributes.datetime) + '<br>';
        infoTemplateContent +=  'magnitude ' + attributes.magnitude + '<br>';     
         
        map.infoWindow.setContent(infoTemplateContent);
        map.infoWindow.show(geom, map.getInfoWindowAnchor(geom));
    }
    
    function parseDateForInfoWindow(t){
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];
        var date = new Date(t);
        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();
        return monthNames[monthIndex] + '-' + day + '-' + year;
    }
    
});