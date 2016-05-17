var startDate = new Date(1960, 1, 1);
var endDate = new Date(2016, 4, 30);
var docWidth = $(document).width();
var docHeight = $(document).height();
var showCircleWithinCurrentExtent, showAllCircles;
var queryParams;

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 0, bottom: 10, left: 50},
    width = docWidth  - margin.left - margin.right,
    height = docHeight * 0.39 - margin.top - margin.bottom;
    
// Adds the svg canvas
var svg = d3.select("#chartDiv")
    .append("svg")
        .attr('class', 'svg-container')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr('class', 'canvas-element')
        .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");
                
var parseDate = d3.time.format("%m/%d/%Y").parse;

// Set the ranges
var xScale = d3.time.scale()
    .domain([startDate, endDate])
    .range([0, width - margin.left - margin.right]);
    
var yScale = d3.scale.linear()
    .domain([1, 8])
    .range([(height - margin.top), 0]);

// Define the axes
var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(60)
    .tickPadding(12)
    .tickFormat(function(d){
        var year = d3.time.format('%Y')(new Date(d));
        return year.slice(-2);
    })
    .innerTickSize(-(height - margin.top));

var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    // .tickValues(yScale.domain())    
    .ticks(10)
    .tickPadding(12);
    // .innerTickSize(-(width - margin.left - margin.right));

// Add the X Axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.top) + ")")
    .call(xAxis);

// Add the Y Axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);    
    
svg.append("svg:image")
   .attr('x', -35)
   .attr('y', function(d) {return yScale(1.5);})
   .attr('width', 30)
   .attr('height', 30)
   .attr("xlink:href","./img/less.png")
   
svg.append("svg:image")
   .attr('x', -35)
   .attr('y', function(d) {return yScale(8);})
   .attr('width', 30)
   .attr('height', 30)
   .attr("xlink:href","./img/more.png")   
    
var radiusScale = d3.scale.linear()
    .domain([0, 10])
    .range([0, 10]);  
    
var colorScale = d3.scale.linear()
    .domain([0, 2, 4, 6])
    // .range(['#2c7bb6', '#d7191c']);
    .range(['#B5004D', '#FF5300', '#FFFF00', '#FFFFFF']);
    
// Get the data
d3.csv("./data/blast-data.csv", function(error, data) {

    data.forEach(function(d) {
        d.DateTime = parseDate(d.DateTime);
        d.Magnitude = +d.Magnitude;
    });
    
    // console.log(data[0]);
    // addAllBlastSites({Longitude: 0, Latitude:0, Magnitude: 0});  
    
    
    svg.selectAll("circle")
        .data(data).enter()
        .append("circle")
        .attr('class', 'circle')
        .attr("cx",function(d) {return xScale(d.DateTime);})
        .attr("cy",function(d) {return yScale(d.Magnitude);})
        .attr("r",function(d) {
            // return radiusScale(d.Magnitude);
            return 2;
        })
        .style("fill", function(d) {
            return colorScale(+d.Magnitude);
        })
        .style("opacity", function(d) {
            return 0.2;
        })
        .on('click', function(d){
            // console.log(d);
            zoomToBlastSite([d.Longitude, d.Latitude])
        })
        .on('mouseover', function(d){
            d3.select(this)
                .attr("r", 5)
                .style("opacity", 1);
                
            if($('#yearDiv').text()){
                addBlastHighlightSites([d.Longitude, d.Latitude, d.DateTime, d.Magnitude]);
            }
            
        })
        .on('mouseout', function(d){
            d3.select(this)
                .attr("r", 2)
                .style("opacity", 0.5);
            
            map.getLayer('blastHighlightLayer').clear(); 
            map.infoWindow.hide();
        }); 

    function getDateByX(x){
        return xScale.invert(x);
    }
    
    function getMagByY(y){
        return yScale.invert(y);
    }   
        
    var drag = d3.behavior.drag()
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragmove(d) {
        // console.log(xScale(endDate));
        var x = d3.event.x,
        xMin = xScale(startDate),
        xMax = xScale(endDate);
        x = (x < xMin) ? xMin : x;
        x = (x > xMax) ? xMax : x;
        
        var y = d3.event.y,
        yMin = yScale(8),
        yMax = yScale(1);
        y = (y < yMin) ? yMin : y;
        y = (y > yMax) ? yMax : y;
        
        if(d3.select(this).attr('class') == 'vLine'){
            d3.select(this)
            .attr("x1", x)
            .attr("x2", x);   
        } else {
            d3.select(this)
            .attr("y1", y)
            .attr("y2", y);  
        }
        
        
        var xRange = [+d3.selectAll('#vLine0').attr('x1'), +d3.selectAll('#vLine1').attr('x1')];
        var yRange = [+d3.selectAll('#hLine0').attr('y1'), +d3.selectAll('#hLine1').attr('y1')];
        var timeExtent = [getDateByX(xRange[0]), getDateByX(xRange[1])];
        var magExtent = [getMagByY(yRange[0]), getMagByY(yRange[1])];
        
        var format = d3.time.format("%Y");

        var yearText = format(d3.min(timeExtent)) + ' - ' + format(d3.max(timeExtent));
        var magText = 'magnitude ' + d3.min(magExtent).toFixed(1)+ ' - ' + d3.max(magExtent).toFixed(1);
        
        if($('#yearDiv').text() !== yearText){
            $('#yearDiv').text(yearText); 
        }
        
        if(!$("#magDiv").width()) {
            console.log($("#yearDiv").width());
            $("#magDiv").css('width', $("#yearDiv").width()); 
        }
        
        if($('#magDiv').text() !== magText){
            $('#magDiv').text(magText); 
        }
        
        queryParams = [new Date(d3.min(timeExtent)).getFullYear(), new Date(d3.max(timeExtent)).getFullYear(), d3.min(magExtent).toFixed(1), d3.max(magExtent).toFixed(1)];
        updateHash(queryParams, mapViewData);         
    }

    function dragend(d){
        
        queryPointsByXYRanges();        

        // var xRange = [+d3.selectAll('#vLine0').attr('x1'), +d3.selectAll('#vLine1').attr('x1')];
        // var yRange = [+d3.selectAll('#hLine0').attr('y1'), +d3.selectAll('#hLine1').attr('y1')];
            
        // var timeExtent = [getDateByX(xRange[0]), getDateByX(xRange[1])];
        // var magExtent = [getMagByY(yRange[0]), getMagByY(yRange[1])];
        
        // // var format = d3.time.format("%Y");
        // // $('#yearDiv').text(format(d3.min(timeExtent)) + ' - ' + format(d3.max(timeExtent)));
        // // console.log(format(d3.min(timeExtent)), format(d3.max(timeExtent)));
        
        // var locations = [];
        // d3.selectAll(".circle").each(function(d){
        //     // 
        //     if((d.DateTime >= d3.min(timeExtent) && d.DateTime <= d3.max(timeExtent) ) && (+d.Magnitude >= d3.min(magExtent) && +d.Magnitude <= d3.max(magExtent))){
        //         // d3.select(this).style("fill", "#00A8E8");
        //         d3.select(this).style("opacity", .8);
        //         locations.push([d.Longitude, d.Latitude, d.Magnitude.toFixed(0)])                
        //     } else {
        //         d3.select(this).style("opacity", .2);
        //     }
        // }); 
        // addBlastSites(locations);       
    }
    
    function queryPointsByXYRanges(){
        
        var xRange = [+d3.selectAll('#vLine0').attr('x1'), +d3.selectAll('#vLine1').attr('x1')];
        var yRange = [+d3.selectAll('#hLine0').attr('y1'), +d3.selectAll('#hLine1').attr('y1')];
            
        var timeExtent = [getDateByX(xRange[0]), getDateByX(xRange[1])];
        var magExtent = [getMagByY(yRange[0]), getMagByY(yRange[1])];
        
        // var format = d3.time.format("%Y");
        // $('#yearDiv').text(format(d3.min(timeExtent)) + ' - ' + format(d3.max(timeExtent)));
        // console.log(format(d3.min(timeExtent)), format(d3.max(timeExtent)));
        
        var locations = [];
        d3.selectAll(".circle").each(function(d){
            // 
            if((d.DateTime >= d3.min(timeExtent) && d.DateTime <= d3.max(timeExtent) ) && (+d.Magnitude >= d3.min(magExtent) && +d.Magnitude <= d3.max(magExtent))){
                // d3.select(this).style("fill", "#00A8E8");
                d3.select(this).style("opacity", .8);
                locations.push([d.Longitude, d.Latitude, d.Magnitude.toFixed(0)])                
            } else {
                d3.select(this).style("opacity", .2);
            }
        }); 
        addBlastSites(locations); 
        
    }

    var selectionLines = [
        {x1: 200, y1: 0, x2: 200, y2: height - margin.top, cursor: "w-resize", class: 'vLine', id: 'vLine-1'}, 
        {x1: 500, y1: 0, x2: 500, y2: height - margin.top, cursor: "w-resize", class: 'vLine', id: 'vLine-2'}, 
        {x1: 0, y1: 50, x2: width - margin.left - margin.right, y2: 50, cursor: "n-resize", class: 'hLine', id: 'hLine-1'}, 
        {x1: 0, y1: 200, x2: width - margin.left - margin.right, y2: 200, cursor: "n-resize", class: 'hLine', id: 'hLine-2'},    
    ];

    selectionLines.forEach(function(d, i){
        //drwa the vertical line    
        var selectionLine = svg.append('line')
            .attr({
                'x1': +d.x1,
                'y1': +d.y1,
                'x2': +d.x2,
                'y2': +d.y2
            })
            // .style("display", "none")
            .attr('stroke-width', '2')
            .style('opacity', 0.3)
            .attr("stroke", "#58C7B6")
            .attr('class', d.class)
            .attr('id', d.class + i % 2)
            .style("cursor", d.cursor)
            .call(drag);    
    });
    
    showCircleWithinCurrentExtent = function(config){
        var lonExtent = [config.coordMin[0], config.coordMax[0]];
        var latExtent = [config.coordMin[1], config.coordMax[1]];
        
        // console.log(lonExtent);
        
        var lonMin = d3.min(lonExtent);
        var lonMax = d3.max(lonExtent);
        
        if((lonMin < 0 && lonMax < 0) || (lonMin > 0 && lonMax >0) || (lonMin > -90) && (lonMax < 90)){
            d3.selectAll(".circle").each(function(d){
                //
                if((+d.Longitude >= d3.min(lonExtent) && +d.Longitude <= d3.max(lonExtent)) && (+d.Latitude >= d3.min(latExtent) && +d.Latitude <= d3.max(latExtent))){
                    d3.select(this).attr("display", null);             
                } else {
                    d3.select(this).attr("display", "none");  
                }
            }); 
        }
        
        if((lonMin < -90) && (lonMax > 90)){
            console.log('cross international dateline');
            d3.selectAll(".circle").each(function(d){
                //
                if( ( ( +d.Longitude > -180 && +d.Longitude <= lonMin ) || ( +d.Longitude >= lonMax && +d.Longitude < 180) ) && 
                    ( +d.Latitude >= d3.min(latExtent) && +d.Latitude <= d3.max(latExtent))
                ){
                    d3.select(this).attr("display", null);             
                } else {
                    d3.select(this).attr("display", "none");  
                }
            }); 
        }
        
        // d3.selectAll(".circle").each(function(d){
        //     //
        //     if((+d.Longitude >= d3.min(lonExtent) && +d.Longitude <= d3.max(lonExtent)) && (+d.Latitude >= d3.min(latExtent) && +d.Latitude <= d3.max(latExtent))){
        //         d3.select(this).attr("display", null);             
        //     } else {
        //         d3.select(this).attr("display", "none");  
        //     }
        // }); 
    }
    
   showAllCircles = function(){
       d3.selectAll(".circle").attr("display", null);  
   }

});

// function getParameterByName(name, url) {
//     if (!url) url = window.location.href;
//     name = name.replace(/[\[\]]/g, "\\$&");
//     var regex = new RegExp("[#&]" + name + "(=([^&#]*)|&|#|$)"),
//         results = regex.exec(url);
//     if (!results) return null;
//     if (!results[2]) return '';
//     return decodeURIComponent(results[2].replace(/\+/g, " "));
// }

// console.log(getParameterByName('startYear'));
// console.log(getParameterByName('endYear'));

function updateHash(data, view){  
    //data = [startYear, endYear, lowMag, highMag, lon, lat, lod]  
    var dataValues = (data) ? data.join('/') : '';
    var viewValues = (view) ? view.join('/') : '';
    var hash = '#' + dataValues + '/' + viewValues;
    window.location.hash = hash;
}

// $(window).on('hashchange', function() {
//    console.log(window.location.hash); 
// });
