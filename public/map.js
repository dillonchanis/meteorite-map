//SVG Size
var width = 960;
var height = 600;

//Create our Projection for the Map
var projection = d3.geoEquirectangular()
	.translate([width/2, height/2])
	.scale(height * 1.5 / Math.PI);

//Give path our projection
var path = d3.geoPath().projection(projection);

//Create SVG
var svg = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height);

var g = svg.append("g");

//Giving SVG zoom ability
svg.attr("width", width)
	.attr("height", height)
	.style("pointer-events", "all")
  .call(d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed));

 var tooltip = d3.select("#map").append("div")
 	.attr("class", "tooltip")
 	.style("opacity", 0)
 	.style("width", 600);



/***********************************************
** Get GeoJSON data from our world.json file **
***********************************************/
d3.json("world.json", function(json) {

	//Draw the Map
	g.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("fill", "#3A3A3A");

	//Get Meteorite Landing from NASA CSV
	d3.csv("Meteorite_Landings.csv", function(data) {

		//Get meteors with that have a non-zero lat and long
		var meteors = filterMeteors(data);

		var domainMin = d3.min(massArray(meteors));
		var domainMax = d3.max(massArray(meteors));

		//Setup Radius Scale
		//Based on Mass of Meteorite, however this varies greatly
		//Using a scale to limit the size
		//scale = d3.scale.linear.domain([ inputMin, inputMax ]).range([ outputMin, outputMax ]);
		var scale = d3.scalePow().exponent(0.5)
			.domain([0, 1e6])
			.range([2, 15]);

		//Paint the Meteorite Landings on our World Map
		g.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("cx", function(meteors) {
				if(projection([meteors.reclong, meteors.reclat])) {
					return projection([meteors.reclong, meteors.reclat])[0]; 
				}
			})
			.attr("cy", function(meteors) {
				if(projection([meteors.reclong, meteors.reclat])){
					return projection([meteors.reclong, meteors.reclat])[1];
				}
			})
			.attr("r", function(meteors) {
				return scale(meteors["mass (g)"]);
			})
			.on("mouseover", function(meteors) {
				var name = meteors.name;

				tooltip.transition()
					.duration(500)
					.style("opacity", 0.7);

				var content = "<h3>" + name + "</h3>";
				content += "<br /><strong>Mass: </strong>" + convertToKilograms(meteors["mass (g)"]) + "kg";
				content += "<br /><strong>Date: </strong>" + meteors.year;
				content += "<br /><strong>Location: </strong>" + meteors.GeoLocation;

				tooltip.html(content)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY) + "px");
			})
			.on("mouseout", function(meteors) {
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			});

		//Give all meteorite hits the class 'bubble'
		g.selectAll("circle").attr("class", "bubble");

	});

});

//Returns meteors that have GeoLocation data attached to them
//Takes CSV data and returns an array 
function filterMeteors(data) {
	return data.map(function(data) {
		if(data.reclong !== 0 && data.reclat !== 0) {
			return data;
		}
	});
};

//Create an array from Meteor CSV data of just Mass
function massArray(data) {
	return data.map(function(data) {
		if(data["mass (g)"]) {
			return data["mass (g)"];
		}
	});
};

//Zoom in
function zoomed() {
	g.attr("transform", d3.event.transform);
};

//Convert given grams to kilograms
function convertToKilograms(grams) {
	return Math.floor(grams * 0.001) + 1;
};