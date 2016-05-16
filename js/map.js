var map, addBlastSites, addAllBlastSites, foo, addBlastHighlightSites, zoomToBlastSite;

var startDate = new Date(1960, 1, 1);
var endDate = new Date(2016, 4, 30);
var docWidth = $(document).width();
var docHeight = $(document).height();
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
"esri/Color",
"esri/layers/VectorTileLayer",
"dojo/domReady!"], 
function(
    Map, Graphic, GraphicsLayer, ArcGISTiledMapServiceLayer,
    Point, ClassBreaksRenderer, SimpleMarkerSymbol, SimpleLineSymbol,
    webMercatorUtils, Color, VectorTileLayer
) {
    
    var vtlayer = new VectorTileLayer("https://www.arcgis.com/sharing/rest/content/items/b187ae2ee9884d90a1fb09e95ceb003d/resources/styles/root.json");
    
    var blastLayer = new GraphicsLayer({
        id: 'blastLayer',
        opacity: 0.8
    });
    
    // var allBlastLayer = new GraphicsLayer({
    //     id: 'allBlastLayer',
    //     opacity: 0.8
    // });    
    
    var blastHighlightLayer = new GraphicsLayer({
        id: 'blastHighlightLayer',
        opacity: 0.8
    });    
    
    var satelliteLayer = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer", {
        visible: false
    });  
    satelliteLayer.opacity = 0.3;    
    
    var referenceLayer = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer", {
        visible: false
    });        
    
    map = new Map("mapDiv", {
        center: [0, 50],
        zoom: 2,
        // basemap: "satellite",
        showAttribution: false
    });


    map.addLayer(vtlayer);
    map.addLayer(satelliteLayer);
    map.addLayer(referenceLayer);
    map.addLayer(blastLayer);
    // map.addLayer(allBlastLayer);
    map.addLayer(blastHighlightLayer);
    
    var rd = new ClassBreaksRenderer(new SimpleMarkerSymbol(), "mag");
    rd.addBreak(6, 8, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255, 255, 255, 0])),new Color([255, 255, 255, 0.9])));
    rd.addBreak(4, 6, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255, 255, 0, 0])),new Color([255, 255, 0, 0.8])));
    rd.addBreak(2, 4, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255, 83, 0, 0])),new Color([255, 83, 0, 0.7])));
    rd.addBreak(0, 2, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([181, 0, 77, 0])),new Color([181, 0, 77, 0.6])));
    
    blastLayer.renderer = rd;
    // allBlastLayer.renderer = rd;

    addBlastSites = function(locations){
        map.getLayer('blastLayer').clear(); 
        map.getLayer('blastHighlightLayer').clear();   

        locations.forEach(function(d){        
            var graphic = new Graphic(new Point(d[0], d[1]), null, {mag: +d[2]});    
            map.getLayer('blastLayer').add(graphic);          
        });
        
        console.log(blastLayer);
    }
    
    // addAllBlastSites = function(locations){
    //     // map.getLayer('blastLayer').clear(); 
    //     // map.getLayer('blastHighlightLayer').clear();   

    //     locations.forEach(function(d){        
    //         var graphic = new Graphic(new Point(d.Longitude, d.Latitude), null, {mag: +d.Magnitude});    
    //         map.getLayer('allBlastLayer').add(graphic);          
    //     });
        
    //     // console.log(blastLayer);
    // }    

    addBlastHighlightSites = function(location, hightlight){
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
        
        var infoTemplateContent = '<b>Date: </b>' + getSimplifiedDate(attributes.datetime) + '<br>';
        infoTemplateContent +=  '<b>Magnitude: </b>' + attributes.magnitude + '<br>';     
        
        var graphic = new Graphic(blastLocation, symbol);    
        map.getLayer('blastHighlightLayer').add(graphic);  
        
        // map.infoWindow.setTitle('<b>Blast Information</b>');
        map.infoWindow.setContent(infoTemplateContent);
        map.infoWindow.show(blastLocation, map.getInfoWindowAnchor(blastLocation));
    }    
    
    zoomToBlastSite = function(location){
        map.centerAt(new Point(location[0], location[1]));
    }
    
    map.on("extent-change", changeHandler);

    function changeHandler(evt){
        var extent = evt.extent;
        var lod = evt.lod.level;
        
        // console.log(evt);

        coordMin = webMercatorUtils.xyToLngLat(extent.xmin, extent.ymin);
        coordMax = webMercatorUtils.xyToLngLat(extent.xmax, extent.ymax);
        
        if(lod >= 5){
            showCircleWithinCurrentExtent({
                coordMin: coordMin,
                coordMax: coordMax
            });
        } else {
            showAllCircles();
        }
        
        if(lod >= 11){
            // vtlayer.hide();
            vtlayer.opacity = .5;
            referenceLayer.show();
            satelliteLayer.show();
        } else {
            // vtlayer.show();
            vtlayer.opacity = 1;
            referenceLayer.hide();
            satelliteLayer.hide();
        }

    } 
    
    function getSimplifiedDate(t){

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