var startDate = new Date(1960, 1, 1);
var endDate = new Date(2016, 5, 3);
var docWidth = $(document).width();
var docHeight = $(document).height();

// Set the dimensions of the canvas / graph
var margin = {top: 20, right: 20, bottom: 20, left: 40},
    width = docWidth  - margin.left - margin.right - 40,
    height = docHeight * 0.4 - margin.top - margin.bottom;
    
// Adds the svg canvas
var svg = d3.select("#chartDiv")
    .append("svg")
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
    .domain([0, 8])
    .range([(height - margin.top), 0]);

// Define the axes
var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(20)
    .tickPadding(12)
    .innerTickSize(-(height - margin.top));;

var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(10)
    .tickPadding(12)
    .innerTickSize(-(width - margin.left - margin.right));
    
// Add the X Axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.top) + ")")
    .call(xAxis);

// Add the Y Axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);    
    
var radiusScale = d3.scale.linear()
    .domain([0, 10])
    .range([0, 10]);  
    
// Get the data
d3.csv("./data/blast-data.csv", function(error, data) {

    data.forEach(function(d) {
        d.DateTime = parseDate(d.DateTime);
        d.Magnitude = +d.Magnitude;
    });
    
    // console.log(data);
    
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
            return '#9C9C9C';
        })
        .style("opacity", function(d) {
            return 0.3;
        })
        .on('click', function(d){
            // console.log(d);
            zoomToBlastSite([d.Longitude, d.Latitude])
        })
        .on('mouseover', function(d){
            d3.select(this)
                .attr("r", 5)
                .style("opacity", 1);
            addBlastHighlightSites([d.Longitude, d.Latitude]);
        })
        .on('mouseout', function(d){
            d3.select(this)
                .attr("r", 2)
                .style("opacity", 0.5);
            
            map.getLayer('blastHighlightLayer').clear(); 
        }); 

    var drag = d3.behavior.drag()
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragmove(d) {
        // console.log(d3.select(this).attr('class'));
        if(d3.select(this).attr('class') == 'vLine'){
            d3.select(this)
            .attr("x1", d3.event.x)
            .attr("x2", d3.event.x);   
        } else {
            d3.select(this)
            .attr("y1", d3.event.y)
            .attr("y2", d3.event.y);  
        }
        
    }

    function dragend(d){
        
        var bisectDate = d3.bisector(function(d) { 
            return d.DateTime; 
        }).left;
        
        // var bisectMag = d3.bisector(function(d) { 
        //     return d.Magnitude; 
        // }).left;        

        function getDateByX(x){
            var x0 = xScale.invert(x),
                i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0.DateTime > d1.DateTime - x0 ? d1 : d0;
            return d.DateTime;
        }
        
        function getMagByY(y){
            var y0 = yScale.invert(y);
            return y0;
        }        

        var xRange = [+d3.selectAll('#vLine0').attr('x1'), +d3.selectAll('#vLine1').attr('x1')];
        var yRange = [+d3.selectAll('#hLine0').attr('y1'), +d3.selectAll('#hLine1').attr('y1')];
            
        var timeExtent = [getDateByX(xRange[0]), getDateByX(xRange[1])];
        var magExtent = [getMagByY(yRange[0]), getMagByY(yRange[1])];
        // console.log(d3.min(magExtent), d3.max(magExtent));
        
        var locations = [];
        d3.selectAll(".circle").each(function(d){
            // 
            if((d.DateTime >= d3.min(timeExtent) && d.DateTime <= d3.max(timeExtent) ) && (+d.Magnitude >= d3.min(magExtent) && +d.Magnitude <= d3.max(magExtent))){
                d3.select(this).style("fill", "#00A8E8");
                locations.push([d.Longitude, d.Latitude])                
            } else {
                d3.select(this).style("fill", "#9C9C9C");
            }
        }); 
        addBlastSites(locations);       
    }

    var selectionLines = [
        {x1: 200, y1: 0, x2: 200, y2: height - margin.top, cursor: "w-resize", class: 'vLine'}, 
        {x1: 500, y1: 0, x2: 500, y2: height - margin.top, cursor: "w-resize", class: 'vLine'}, 
        {x1: 0, y1: 50, x2: width - margin.left - margin.right, y2: 50, cursor: "n-resize", class: 'hLine'}, 
        {x1: 0, y1: 200, x2: width - margin.left - margin.right, y2: 200, cursor: "n-resize", class: 'hLine'},    
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
            .style('opacity', 0.5)
            .attr("stroke", "#00171F")
            .attr('class', d.class)
            .attr('id', d.class + i % 2)
            .style("cursor", d.cursor)
            .call(drag);    
    });

});