function finalProject(){
    let filePath="data/gvaData.csv";
    let filePath2="data/mapData.csv";
    question1(filePath);
    question2(filePath2);
    question3();

}

//creates stacked bar chart of # killed/injured
let question1=function(filePath){
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    //preprocess data
    d3.csv(filePath).then(function(data) {
        data.forEach(d => {
            d.VictimsInjured = +d["# Victims Injured"];
            d.VictimsKilled = +d["# Victims Killed"];
            d.Date = new Date(d["Incident Date"]);
            d.Year = d.Date.getFullYear();
            d.Month = months[d.Date.getMonth()];
        })

        let wasAll = true; // keeps track of if previous bar chart was All Years barchart
        const mygroups = ["Injured", "Killed"]
        const legendVals = ["Injured", "Killed", "Mass Shootings"]

        //groups the data by year and sums injured/killed
        let allYears = d3.rollup(
            data,
            (group) => ({
              Injured: d3.sum(group, (d) => d.VictimsInjured),
              Killed: d3.sum(group, (d) => d.VictimsKilled)
            }),
            (d) => d.Year
        );

        //groups the data by year and sums mass shootings
        let numShootings = d3.rollup(data, v => d3.count(v, d => d["Incident ID"]), d => d.Year)

        const margin = {top: 50, right: 30, bottom: 40, left: 110};
        const width = 1600 - margin.left - margin.right;
        const height = 800 - margin.top - margin.bottom;
                
        let svg = d3.select("#plot_1").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        
        // Tool tip
        let tooltip = d3.select("#plot_1")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("position", "absolute")
        .style("font-size", "23px")

        // Initialize the Y and X axis
        let xScale = d3.scaleBand().range([ margin.left, width ])
        .paddingOuter(0.3)
        .paddingInner(0.1);
        let yScale1 = d3.scaleLinear().range([ height, 0]);
        let yScale2 = d3.scaleLinear().range([ height, 0]);

        let xAxis = d3.axisBottom().scale(xScale)
        let yAxis1 = d3.axisLeft().scale(yScale1)
        let yAxis2 = d3.axisRight().scale(yScale2)


        //function to render the appropriate bar chart
        const render = (barData, lineData) => {
            // add x and y axis
            let maxY = d3.max(Array.from(barData.values()), (d) => d.Injured) + d3.max(Array.from(barData.values()), (d) => d.Killed)
            let y2Translate = width - margin.right
            xScale.domain(Array.from(barData.keys()))
            yScale1.domain([0,maxY + (maxY * 0.15)])
            yScale2.domain([0, d3.max(Array.from(lineData.values())) * 1.7])
            svg.append('g').attr("id", "xaxis").attr("transform", "translate(0," + height + ")").style("font-size", "17px").call(xAxis);
            svg.append('g').attr("id", "yaxis").attr("transform", "translate(" + margin.left + ",0)").style("font-size", "17px").transition().duration(1000).call(yAxis1);
            svg.append('g').attr("id", "yaxis2").attr("transform", "translate(" + y2Translate + ",0)").style("font-size", "17px").transition().duration(1000).call(yAxis2);
        
            //add color
            var color = d3.scaleOrdinal()
            .domain(legendVals)
            .range(['darkgray', 'steelblue', 'black'])
        
            // Stack the data: each group will be represented on top of each other
            let stackedData = d3.stack()
            .keys(mygroups)
            .value((d, key) => {
                return d[1][key]
            })
            (Array.from(barData.entries()))

            // Three function that change the tooltip when user hover / move / leave a cell
            let mouseover = function(e, d) {
                var subgroupName = d3.select(this.parentNode).datum().key;
                var subgroupValue = d.data[1][subgroupName];
                var groupColor = color(subgroupName)
                var x = d.data[0]

                tooltip
                    .html("<strong><FONT COLOR=" + groupColor + ">" + subgroupName + "</FONT><br>" + x + "</strong>: " + subgroupValue)
                    .style("opacity", 1)
            }
            let mousemove = function(e, d) {
                tooltip
                .style("left", (e.pageX+30) + "px")
                .style("top", (e.pageY) + "px")
            }
            let mouseleave = function(e, d) {
                tooltip
                .style("opacity", 0)
            }
        
            //show bar plot
            svg.append("g").attr("class", "bars")
            .selectAll("g")
            .data(stackedData)
            .enter().append("g")
            .attr("fill", function(d) { 
                return color(d.key); })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", function(d) { 
                return xScale(d.data[0]); 
            })
            .attr("width",xScale.bandwidth())
            .attr("y", height)
            .attr("height", 0)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .transition()
            .duration(800)
            .attr("y", function(d) { 
                return yScale1(d[1]); })
            .attr("height", function(d) { 
                return yScale1(d[0]) - yScale1(d[1])
            })
            .style("opacity", 0.9)

            // show line plot
            svg.append("path")
            .attr("class", "line")
            .datum(lineData)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 4)
            .attr("opacity", 0.7)
            .transition()
            .attr("d", d3.line()
              .x(function(d) { return xScale(d[0]) + xScale.bandwidth() / 2})
              .y(function(d) { return yScale2(d[1]) })
            )
            .style("stroke-dasharray", ("5, 3")) 
            
            // Add x-axis label
            svg.append("text")
            .attr("id", "xlabel")
            .attr("x", width / 2)
            .attr("y", height + margin.top + margin.bottom - 30)
            .attr("text-anchor", "middle")
            .text("Year")
            .style("font-size", "25px");
            
            // Add num killed/injured y-axis label
            svg.append("text")
            .attr("id", "ylabel")
            .attr("x", (-height / 2))
            .attr("y", (margin.left / 2) - 12)
            .attr("text-anchor", "middle")
            .text("Number of People")
            .attr("transform", "rotate(-90)")
            .style("font-size", "25px");

            // Add num shootings y-axis label
            svg.append("text")
            .attr("id", "ylabel2")
            .text("Number of Mass Shootings")
            .attr("x", width/2 - 500)
            .attr("y", height/2 - 1850)
            .style("font-size", "25px")
            .attr("transform", "rotate(90)")
            
            // Add legend
            let legend = svg.append("g")
            .attr("transform", "translate(" + (width + margin.left) + "," + margin.top + ")");
            
            legend.selectAll("circle")
            .data([legendVals[0], legendVals[1]])
            .enter()
            .append("circle")
            .attr("cx", -1380)
            .attr("cy", function(d, i) { return (i * 30) + 80; })
            .attr("r", 10)
            .style("fill", function(d) { return color(d); })
            .style("opacity", 0.9);

            legend.selectAll("line")
            .data([legendVals[2]]) // Only add a line for "Mass Shootings"
            .enter()
            .append("line")
            .attr("x1", -1370)
            .attr("y1", 140)
            .attr("x2", -1400)
            .attr("y2", 140)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5, 3"); // Add the dashed line style
        
            legend.selectAll("text")
            .data(legendVals)
            .enter()
            .append("text")
            .attr("x", -1350)
            .attr("y", function(d, i) { return (i * 30) + 85; })
            .text(function(d) { return d; })
            .style("font-size", "22px");

            //add footnote
            svg.append("text")
            .attr("class", "footnote")
            .text("[1] A mass shooting is defined as 4+ victims injured or killed excluding the subject/suspect/perpetrator. Last updated June 4, 2023.")
            .attr("x", 10)
            .attr("y", height + margin.top + margin.bottom - 8)



        }

        //creates a new graph based on the selection in drop down
        const update = () => {
            d3.select('#yearsBtn')
            .on('change', function() {
                var selectedOption = this.value;

                if (selectedOption == "All Years") {
                    wasAll = true;
                    d3.select("#plot_1").selectAll("g, text").remove();
                    d3.select("#plot_1").selectAll("path").remove()
                    render(allYears, numShootings)
                } else{
                    //selects dataframe and groups based on selected year
                    let filtered = data.filter(function(d) {
                        return d.Year == selectedOption;
                      }).sort((a, b) => d3.ascending(a.Date, b.Date));
                    let yearData = d3.rollup(
                        filtered,
                        (group) => ({
                          Injured: d3.sum(group, (d) => d.VictimsInjured),
                          Killed: d3.sum(group, (d) => d.VictimsKilled)
                        }),
                        (d) => d.Month)
                    let lineData = d3.rollup(filtered, v => d3.count(v, d => d["Incident ID"]), d => d.Month)
                    
                    if (selectedOption == 2023) {
                        d3.select("#plot_1").selectAll("svg > *").remove();
                        render(yearData, lineData);
                        svg.select("#title").text("Mass Shooting Injuries and Deaths " + selectedOption)
                        svg.select("#xlabel").text("Month")
                        wasAll = true;
                        return
                    }
                    else if (wasAll == true){ //clears everything when previous chart was All Years chart
                        d3.select("#plot_1").selectAll("svg > *").remove();
                        render(yearData, lineData);
                    } else{ //only changes rectangle attributes and y axis
                        //adjust axes
                        let maxY = d3.max(Array.from(yearData.values()), (d) => d.Injured) + d3.max(Array.from(yearData.values()), (d) => d.Killed)
                        xScale.domain(Array.from(yearData.keys()))
                        yScale1.domain([0,maxY + (maxY * 0.1)])
                        yScale2.domain([0, d3.max(Array.from(lineData.values())) * 1.7])
                        svg.select("#xaxis").call(xAxis);
                        svg.select("#yaxis").transition().duration(800).call(yAxis1);
                        svg.select("#yaxis2").transition().duration(800).call(yAxis2)


                        let stackedData = d3.stack()
                        .keys(mygroups)
                        .value((d, key) => {
                            return d[1][key]
                        })(Array.from(yearData.entries()))

                        svg.select(".bars")
                        .selectAll("g")
                        .data(stackedData)
                        .selectAll("rect")
                        .data((d) => d)
                        .transition()
                        .duration(800)
                        .attr("x", (d) => xScale(d.data[0]))
                        .attr("width", xScale.bandwidth())
                        .attr("y", (d) => yScale1(d[1]))
                        .attr("height", (d) => yScale1(d[0]) - yScale1(d[1]));

                        // show line plot
                        svg.select(".line")
                        .datum(lineData)
                        .transition()
                        .attr("d", d3.line()
                            .x(function(d) { return xScale(d[0]) + xScale.bandwidth() / 2; })
                            .y(function(d) { return yScale2(d[1]); })
                        );
                        
                    }
                    // change title and xlabel accordingly to year
                    svg.select("#xlabel").text("Month")
                    wasAll = false;
                
                }
                
          });
        };

        // calling the functions
        render(allYears, numShootings);
        update();
    });
        
}

let question2=function(filePath){
    //preprocess data
    d3.csv(filePath).then(function(data) {
        data.forEach(d => {
            d["Incident ID"] = +d["Incident ID"]
            d["Rates"] = +d["Rates"]
        })
        let grouped = d3.group(data, d => d.State)
        let width = 1600;
        let height = 1200;
        let margin={
            top:50,bottom:50,left:50,right:50}

        const svg = d3.select("#plot_2")
            .append("svg")
            .attr("width",width-margin.right-margin.left)
            .attr("height",height-margin.top-margin.bottom)
        
        const projection = d3.geoAlbersUsa()
        .scale(1800)
        .translate([width / 2, height / 2]);
        const pathgeo = d3.geoPath().projection(projection);

        let map = d3.json("data/us-states.json")

        let tooltip = d3.select("#plot_1")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("position", "absolute")
        .style("font-size", "23px")

        let mouseOver = function(e, d) {

            d3.select(this).style("stroke-width", 3)
            
            let name = d.properties.NAME
            let value = grouped.get(name)[0]["Incident ID"]
            let rates = Math.round(grouped.get(name)[0]["Rates"] * 100) / 100
            let political = grouped.get(name)[0]["Red or Blue State"]
            let gunGrade = grouped.get(name)[0]["Gun Law Grade"]
            tooltip
              .html("<strong>State : " + name + "<br>" +"</strong>Mass Shootings : " + value + "<br>Per Capita : " + rates + " per 1 million<br>Gun Law Grade : " + gunGrade+ "<br>Red or Blue State : " + political)
              .style("opacity", 1)
              .style("z-index", 9999); 
          }

          let mouseMove = function(e, d) {
            tooltip
            .style("left", (e.pageX+30) + "px")
            .style("top", (e.pageY) + "px")
        }
        
          let mouseLeave = function(d) {
            d3.select(this).style("stroke-width", 0.4)

              tooltip
            .style("opacity", 0)
            .style("z-index", -1)
          }
        
        const render = (column) => {
            //remove any existing map
            svg.selectAll("path").remove()
            svg.select(".legend").remove()
            svg.select(".legendThreshold").remove()
            //add color
            let color = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(data, function(d) { return d[column];})])

            map.then(map => {
                svg.selectAll("path")
                    .data(map.features)
                    .enter()
                    .append("path")
                    .attr("class", "state")
                    .attr("d", pathgeo)
                    .style("fill", function(d){
                        let abbrv = d.properties.NAME
                       if (grouped.get(abbrv) == undefined){
                        return "white"
                       } else {
                        return color(grouped.get(abbrv)[0][column])
                       }
                    })
                    .style("stroke-width", 0.4)
                    .style("stroke", "black")
                    .on("mouseover", mouseOver )
                    .on("mouseleave", mouseLeave )
                    .on("mousemove", mouseMove)
                
            })

            // add legend
            legendLabel = ""
            if (column == "Incident ID") {
                legendLabel = "Total Mass Shootings"
            } else{
                legendLabel = "Total Mass Shootings (per capita)"
            }

            svg.append("text")
            .attr("class", "legend")
            .attr("transform", "translate(40, 65)")
            .text(legendLabel)
            .style("font-size", "20px")
            .style("font-weight", "bold")

            svg.append("g")
            .attr("class", "legendThreshold")
            .attr("transform", "translate(40, 80)");

            const legend = d3.legendColor()
            .scale(color)
            .orient('horizontal')
            .shapeWidth(60)
            .shapeHeight(20);

            svg.select(".legendThreshold")
            .call(legend).style("font-size", "18px");

        }

        // Radio button functions for changing map
        const numShootingsRadio = document.getElementById("raw");
        const perCapitaRadio = document.getElementById("capita");

        numShootingsRadio.addEventListener("click", function (e) {
            if (this.checked) {
              render("Incident ID")
            }
        })
        perCapitaRadio.addEventListener("click", function (e) {
            if (this.checked) {
                render("Rates")
            }
        })

        //button functions for highlighting states
        let grades = ["A", "B", "C", "D", "F"]
        let political = ["Swing State", "Republican", "Democrat"]
        
        grades.forEach(option => {
            const element = document.getElementById(option);
            
            if (element) {
              element.addEventListener("mouseover", function(e) {
                  highlightStatesByColumn("Gun Law Grade", " " + option);
                element.style["background-image"] = "linear-gradient(180deg, steelblue, steelblue)";
              });
              element.addEventListener("mouseleave", function(e) {
                    d3.selectAll(".state")
                    .style("stroke-width", 0.4)
                    .style("opacity", 1)
                element.style["background-image"] = "linear-gradient(180deg, darkgray, gray)"
              });
            }
          });

        political.forEach(option => {
            const element = document.getElementById(option);
            
            if (element) {
              element.addEventListener("mouseover", function(e) {
                  highlightStatesByColumn("Red or Blue State", " " + option);
                element.style["background-image"] = "linear-gradient(180deg, steelblue, steelblue)";
              });
              element.addEventListener("mouseleave", function(e) {
                    d3.selectAll(".state")
                    .style("stroke-width", 0.4)
                    .style("opacity", 1)
                element.style["background-image"] = "linear-gradient(180deg, darkgray, gray)"
              });
            }
          });
        
        function highlightStatesByColumn(column, value) {
            d3.selectAll(".state")
                .style("opacity", function (d) {
                    let abbrv = d.properties.NAME;
                    let stateData = grouped.get(abbrv);
                    if (stateData && stateData[0][column] === value) {
                        return 3;
                    } else {
                        return 0.3;
                    }
                })
                .style("stroke-width", function(d) {
                    let abbrv = d.properties.NAME;
                    let stateData = grouped.get(abbrv);
                    if (stateData && stateData[0][column] === value) {
                        return 2;
                    } else {
                        return 0.4;
                    }
                });
        }

        //Add footnote
        svg.append("text")
        .attr("class", "footnote")
        .text("[1] A mass shooting is defined as 4+ victims injured or killed excluding the subject/suspect/perpetrator. Last updated June 4, 2023.")
        .attr("x", 10)
        .attr("y", 1050)
        svg.append("text")
        .attr("class", "footnote")
        .attr("x", 10)
        .attr("y", 1070)
        .text("[2] States are ranked and given letter grades based on their gun laws and policies, A being the strictest and F being the weakest. Source: Giffords Law Center")
        svg.append("text")
        .attr("class", "footnote")
        .attr("x", 10)
        .attr("y", 1090)
        .text("[3] Based on the results from the 2020 election. Source: New York Times")

        render("Incident ID")


    })
}


let question3=function(){
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    let count = 0; //keep track of number of gradients
    const update = (filePath, attr) => {
        d3.json(filePath).then((data) => {
    
            let width=1800;
            let height=1100;
            let margin={
            top:50,bottom:50,left:50,right:50}
    
            let svg =d3.select("#plot_3").append("svg").attr("id", "network")
                  .attr("width",width-margin.right-margin.left)
                  .attr("height",height-margin.top-margin.bottom)
                  .attr("style", "outline: thin solid steelblue;")
            
            svg.append("defs");
    
            let edgeScale = d3.scaleLinear()
            .domain(d3.extent(data.links, d => d.value))
            .range([0, 1])
        
            //create edges using "line" elements
            let link = svg.selectAll("line")
                .data(data.links)
                .enter()
                .append("line")
                .style("stroke", "#ccc")
                .style("stroke-width", function(d) {return edgeScale(d.value)})
            
            // add color based on attributes
            let colorDomain = []
            data.nodes.forEach((item) => {
                const values = item[attr];
                colorDomain = colorDomain.concat(values)
            })

            //accounts for criminal record color domain 2+
            if (attr == "Criminal Record") {
                colorDomain.push("3+ Crimes")
            } else if (attr == "Substance Use"){
                colorDomain.push("3+ Substances")
            }
    
            let color = d3.scaleOrdinal(d3.schemePaired.concat(["#8dd3c7", 
            "#fb8072", "#b3de69", "#fccde5", 
            "#d9d9d9", "#ccebc5", "#ffed6f", "darkgray", "black"]))
            .domain(colorDomain)
    
            //Create tooltip
            let tooltip = d3.select("#plot_3")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("position", "absolute")
            .style("font-size", "23px")
    
            let mouseOver = function(e, d) {
                d3.select(this)
                .style("stroke-width", 2)
    
                let city_state = (d["City"] +", " + d["State"]).toUpperCase()
                let date = d["Day of Week"] + ", " + months[d["Month"] - 1] + " " + d["Day"] + ", " + d["Year"]
                let age = d["Age"]
                let name = d["Shooter First Name"] + " " + d["Shooter Last Name"]
                let killed = d["Number Killed"]
                let injured = d["Number Injured"]
                let race = d["Race"]
                let substance = d["Substance Use"]
                let record = d["Criminal Record"]
                let mentalIllness = d["Mental Illness"]
                let gender = d["Gender"]
                let shooterText = ""
                //handles unknown shooter age and name info for tooltip
                if ((age == "Unknown") && (name == "Unknown Unknown")) {
                    shooterText = "a shooter"
                }else if (age == "Unknown"){
                    shooterText = "<b>" + name + "<\b>"
                } else if (name == "Unknown Unknown") {
                    shooterText = "a " + age + "year-old shooter"
                } else {
                    shooterText = age + " year-old <b>" + name + "</b>"
                }

                tooltip
                  .html("<FONT color=blue size=5><b>" 
                  + city_state 
                  + "</b></FONT><br>On "
                  + date
                  +", "
                  +shooterText
                  +"<br>killed "
                  +killed
                  +" people and injured "
                  +injured
                  +" others.<br>"
                  +"<br><b>Gender</b>: "
                  +gender
                  +"<br><b>Race</b>: "
                  + race
                  +"<br><b>Substance Use</b>: "
                  +substance
                  +"<br><b>Criminal Record</b>: "
                  +record
                  +"<br><b>Mental Illness</b>: "
                  +mentalIllness)
                  .style("opacity", 1)
                  .style("z-index", 9999); 
              }
    
              let mouseMove = function(e, d) {
                tooltip
                .style("left", (e.pageX+30) + "px")
                .style("top", (e.pageY) + "px")
            }
            
              let mouseLeave = function(d) {
                d3.select(this)
                .style("opacity", 1)
                .style("stroke-width", 0.5)
    
                tooltip
                .style("opacity", 0)
                .style("z-index", -1)
              }
    
            //create nodes using "circle" elements
            let node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(data.nodes)
            .enter().append("circle")
            .attr("r", 15)
            .style("fill", function(d) {
                if (d[attr].length == 2) {
                    let color1 = color(d[attr][0])
                    let color2 = color(d[attr][1])
                    let gradient = "url(#" + makeGradient(color1, color2).toString()+")"
                    return gradient
                } else if (d[attr].length > 2) {
                    if (attr == "Criminal Record") {
                        return color("3+ Crimes")
                    } else{
                        return color("3+ Substances")
                    }
                }
                else {
                    return color(d[attr][0]);
                }
            })
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .on("mouseover", mouseOver)
            .on("mouseleave", mouseLeave)
            .on("mousemove", mouseMove)
    
            //create label using "text" elements
            let label = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(data.nodes)
            .join("text")
            .attr("class", "label")
            .text(d => d["Shooter First Name"] + "\n" + d["Shooter Last Name"])
            .style("font-size", "8px")
    
            //create force graph
            let force = d3.forceSimulation(data.nodes)
            .force("charge", d3.forceManyBody())
            .force("link", d3.forceLink(data.links).id((d) => d.id))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide(function(d){
                return d.id === "j" ? 40 : 40
            }))
        
        
            force.on("tick", function () {
                link.attr("x1", function (d) {return d.source.x;})
                .attr("y1", function (d) {return d.source.y;})
                .attr("x2", function (d) {return d.target.x;})
                .attr("y2", function (d) {return d.target.y;});
            node.attr("cx", function (d) {return d.x;})
                .attr("cy", function (d) {return d.y;});
            label.attr("x", function (d) {return d.x+10;})
                .attr("y", function (d) {return d.y+10;})});
    
            //add legend
            const legendSvg = d3.select("#plot_3")
            .append("svg")
            .attr("width", 500)
            .attr("height", ((color.domain()).length * 40))
            .style("position", "relative")
            .style("top", "0")
            .style("left", "0")
            .style("z-index", "1")
            .attr("style", "outline: thin solid steelblue;");
    
            let legend = legendSvg.append("g")
                .attr("transform", "translate(" + (width + margin.left) + "," + margin.top + ")")
    
            legend.selectAll("rect")
                .data(color.domain())
                .enter()
                .append("rect")
                .attr("x", -1820)
                .attr("y", function(d, i) {
                    return (i * 30) - 20;
                })
                .attr("height", 20)
                .attr("width", 20)
                .style("fill", function(d) {
                    return color(d);
                })
                .style("opacity", 0.9);
    
            legend.selectAll("text")
                .data(color.domain())
                .enter()
                .append("text")
                .attr("x", -1790)
                .attr("y", function(d, i) {
                    return (i * 30) - 2;
                })
                .text(function(d) {
                    return d;
                })
                .style("font-size", "20px");
            
            // create zoom effect
            let zoom = d3.zoom()
            .scaleExtent([0.3, 4])
            .on('zoom', function(event) {
                svg.selectAll("g")
                .attr('transform', event.transform);
                svg.selectAll("line")
                .attr('transform', event.transform);
            }); 
    
    
            
            svg.call(zoom)
    
        })

        const makeGradient = (color1, color2) => {
            // Define the gradientxs
            let gradient = d3.select("#network").select("defs")
            .append("linearGradient")
            .attr("id", count)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");
    
            gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-opacity", 1)
            .attr("stop-color", color1)
    
            gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-opacity", 1)
            .attr("stop-color", color1)
    
            gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-opacity", 1)
            .attr("stop-color", color2)
    
            gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-opacity", 1)
            .attr("stop-color", color2)
            count += 1

            return count - 1
        }

    }
    d3.select('#attrBtn')
            .on('change', function() {
                d3.select("#plot_3").selectAll("svg").remove()
                var selectedOption = this.value;
                let filePath = "data/networkData_" + selectedOption + ".json"
                update(filePath, selectedOption)
            })

    update('data/networkData_Location.json', 'Location')

}