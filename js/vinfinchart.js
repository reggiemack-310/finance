
function renderCharts(data) {
            var dateFormat = d3.time.format("%Y-%m-%d");
            var numberFormat = d3.format(".2f");
            var minDate = new Date(2100, 0, 1), maxDate = new Date(1900, 0, 1);
            var nestByDate = d3.nest()
                .key(function(d) { return d3.time.day(d.date); });

            var sum = function(arr) {
                var total = 0;
                for (var i=0; i<arr.length; i++)
                { total += parseFloat(arr[i]) }
                return total;
            };

            data.forEach(function (d, i) {
                d.dd = dateFormat.parse(d.date);
                d.month = d3.time.month(d.dd); 
                d.year = d.dd.getFullYear();
                d.adjclose = parseFloat(d.adjclose).toFixed(2);
                if (d.dd < minDate) { minDate = d.dd; };
                if (d.dd > maxDate) { maxDate = d.dd; };
                if ((i < data.length-1) && (d.ticker == data[i+1].ticker)) {
                        d.priorClose = parseFloat(data[i+1].adjclose) }
                else { d.priorClose = parseFloat(d.open) }
            });

            var ndx = crossfilter(data);
            var all = ndx.groupAll();

            var yearlyDimension = ndx.dimension(function (d, i) {
                return d3.time.year(d.dd); });
            
            var yearlyPerformanceGroup = yearlyDimension.group().reduce(
                    function (p, v) {
                        ++p.count;
                        p.absGain += v.adjclose - v.priorClose;
                        p.fluctuation += Math.abs(v.adjclose - v.priorClose);
                        p.sumIndex += (parseFloat(v.adjclose) + v.priorClose) / 2;
                        p.avgIndex = p.sumIndex / p.count;
                        p.percentageGain = (p.absGain / p.avgIndex) * 100;
                        p.fluctuationPercentage = (p.fluctuation / p.avgIndex) * 100;
                        return p; },

                    function (p, v) {
                        --p.count;
                        p.absGain -= v.adjclose - v.priorClose;
                        p.fluctuation -= Math.abs(v.adjclose - v.priorClose);
                        p.sumIndex -= (parseFloat(v.adjclose) + v.priorClose) / 2;
                        p.avgIndex = p.sumIndex / p.count;
                        p.percentageGain = (p.absGain / p.avgIndex) * 100;
                        p.fluctuationPercentage = (p.fluctuation / p.avgIndex) * 100;
                        return p; },

                    function () {
                        return {count: 0, absGain: 0, fluctuation: 0, fluctuationPercentage: 0, sumIndex: 0, avgIndex: 0, percentageGain: 0}; }
            );

			var dateDimension = ndx.dimension(function (d) {
                return d.dd;
            });

            var moveMonths = ndx.dimension(function (d) {
                return d.month});

            var indexAvgByMonthGroup = moveMonths.group().reduce(
                function (p, v) {
                    if (v.adjclose <= p.min)
                        { p.candidates.unshift(v.adjclose); };
                    if (v.adjclose >= p.max()) 
                        { p.candidates.push(v.adjclose) };
                    return p; },
                function (p, v) {
                    var index = p.candidates.indexOf(v.adjclose);
                    if (index >= 0) { p.candidates.splice(index, 1) };
                        return p; },
                function () {
                    return {candidates: [],
                        max: function() { return (this.candidates.length > 0) ? (this.candidates[this.candidates.length - 1]) : null },
                        min: function() { return (this.candidates.length > 0) ? (this.candidates[0]) : null },
                        total: function() { return (sum(this.candidates))  },
                        avg: function() { return (sum(this.candidates) / this.candidates.length) } }}
                );

            var gainOrLoss = ndx.dimension(function (d) {
                return +d.open > +d.close ? "Loss" : "Gain"; });
            var gainOrLossGroup = gainOrLoss.group();

            var fluctuation = ndx.dimension(function (d) {
                return Math.round((d.adjclose - d.priorClose) / d.priorClose * 100); });
            
            var fluctuationGroup = fluctuation.group();

            var quarter = ndx.dimension(function (d) {
                var month = d.dd.getMonth();
                var quarter = 'Q' + (Math.ceil((month+1)/3));
                return quarter; });

            var quarterGroup = quarter.group().reduceSum(function (d) {
                return d.volume; });

            var tickers = ndx.dimension(function (d) {
                return d.ticker; });

            var tickersGroup = tickers.group();
            
            var prices = dateDimension.group().reduce(
                function (p, v) {
                    ticker = v.ticker;
                    p[ticker] = v.adjclose;
                    return p; },
                
                function (p, v) {
                    ticker = v.ticker;
                    p[ticker] = 0;
                    return p; },
                // init
                function () {
                    return {};}
            );

            var volumes = dateDimension.group().reduce(
                function (p, v) {
                    ticker = v.ticker;
                    p[ticker] = v.volume/1000000;
                    return p; },
                
                function (p, v) {
                    ticker = v.ticker;
                    p[ticker] = 0;
                    return p; },
                
                function () {
                    return {};
                }
            );

            var dayOfWeek = ndx.dimension(function (d) {
                var day = d.dd.getDay();
                switch (day) {
                    case 0: return "0.Sun";
                    case 1: return "1.Mon";
                    case 2: return "2.Tue";
                    case 3: return "3.Wed";
                    case 4: return "4.Thu";
                    case 5: return "5.Fri";
                    case 6: return "6.Sat";
                } });

            var dayOfWeekGroup = dayOfWeek.group();

            var colors = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"];
            // var colors = ['#0000CC', '#0033FF', '#00CC00', '#00CCCC', '#00FF33', '#00FFFF', '#330066', '#336699', '#33CCFF', '#660066', '#6600FF', '#663333', '#6666CC', '#66FF33', '#9966CC', '#CC0000', '#CC00CC', '#CCFF33', '#FF9933', '#FFFF33' ]

            yearlyBubbleChart.width(600)
                    .height(200)
                    .margins({top: 5, right: 50, bottom: 20, left: 50})
                    .dimension(yearlyDimension)
                    .group(yearlyPerformanceGroup)
                    .transitionDuration(1500)
                    .colors(["#a60000", "#ff0000", "#ff4040", "#ff7373", "#67e667", "#39e639", "#00cc00"])
                    .colorDomain([-12000, 12000])
                    .colorAccessor(function (d) { return d.value.absGain; })
                    .keyAccessor(function (p) { return p.value.absGain; })
                    .valueAccessor(function (p) { return p.value.percentageGain; })
                    .radiusValueAccessor(function (p) { return p.value.fluctuationPercentage; })
                    .maxBubbleRelativeSize(0.2)
                    .x(d3.scale.linear().domain([-2500, 2500]))
                    .y(d3.scale.linear().domain([-100, 100]))
                    .r(d3.scale.linear().domain([0, 4000]))
                    .elasticY(true)
                    .yAxisPadding(100)
                    .elasticX(true)
                    .xAxisPadding(500)
                    .renderHorizontalGridLines(true)
                    .renderVerticalGridLines(true)
                    .renderLabel(true)
                    .renderTitle(true)
                    .label(function (p) { return p.key.getFullYear(); })
                    .title(function (p) {
                        return p.key.getFullYear()
                                + "\n"
                                + "change: " + numberFormat(p.value.absGain) + "\n"
                                + "% change : " + numberFormat(p.value.percentageGain) + "%\n"
                                + "Fluctuation / Index Ratio: " + numberFormat(p.value.fluctuationPercentage) + "%";
                    })
                    .yAxis().tickFormat(function (v) { return v + "%"; });

            gainOrLossChart.width(150)
                    .height(150)
                    .radius(60)
                    .dimension(gainOrLoss)
                    .group(gainOrLossGroup)
                    .label(function (d) {
                        if(gainOrLossChart.hasFilter() && !gainOrLossChart.hasFilter(d.data.key))
                            return d.data.key + "(0%)";
                        return d.data.key + "(" + Math.floor(d.data.value / all.value() * 100) + "%)";
                    });

            quarterChart.width(150)
                    .height(150)
                    .radius(60)
                    .innerRadius(30)
                    .dimension(quarter)
                    .group(quarterGroup);

            tickersChart.width(150)
                .height(currentTickers.length*80/Math.sqrt(currentTickers.length))
                .margins({top: 10, left: 30, right: 10, bottom: 20})
                .group(tickersGroup)
                .dimension(tickers)
                .colors(colors)
                .label(function (d){
                    return d.key; })
                .title(function(d){return d.key;})
                .elasticX(true)
                .xAxis().ticks(4);

            dayOfWeekChart.width(150)
                .height(170)
                .margins({top: 10, left: 30, right: 10, bottom: 20})
                .group(dayOfWeekGroup)
                .dimension(dayOfWeek)
                .colors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
                .label(function (d){
                    return d.key.split(".")[1];})
                .title(function(d) { return d.value; })
                .elasticX(true)
                .xAxis().ticks(4);

            fluctuationChart.width(200)
                    .height(150)
                    .margins({top: 30, right: 0, bottom: 30, left: 20})
                    .dimension(fluctuation)
                    .group(fluctuationGroup)
                    .elasticY(true)
                    .centerBar(true)
                    .gap(1)
                    .round(dc.round.floor)
                    .x(d3.scale.linear().domain([-25, 25]))
                    .renderHorizontalGridLines(true)
                    .filterPrinter(function (filters) {
                        var filter = filters[0], s = "";
                        s += numberFormat(filter[0]) + "% -> " + numberFormat(filter[1]) + "%";
                        return s; })
                    .xAxis()
                    .tickFormat(function (v) {
                        return v + "%"; });

            dc.dataCount(".dc-data-count")
                    .dimension(ndx)
                    .group(all);
            
            dc.dataTable(".dc-data-table")
                    .dimension(dateDimension)
                    .group(function (d) { var format = d3.format("02d");
                        return d.dd.getFullYear() + "-" + format((d.dd.getMonth() + 1)); })
                    .size(recordNumber)
                    .columns([
                        function (d) { return d.date; },
                        function (d) { return d.ticker; },
                        function (d) { return d.open; },
                        function (d) { return d.high; },
                        function (d) { return d.low; },
                        function (d) { return d.close; },
                        function (d) { return d.adjclose; },
                        function (d) { return d.volume; }
                    ])
                    .sortBy(function (d) { return d.dd; })
                    .order(d3.descending)
                    .renderlet(function (table) { table.selectAll(".dc-table-group").classed("info", true)})
                    // .renderlet(function (table) { table.selectAll("td").style("border", "1px solid #98abc5")})
                    .renderlet(function (table) { table.selectAll("td").style("text-align", "center")})
                    .renderlet(function (table) { table.selectAll("td").style("font-size", "10px")})
                    .renderlet(function (table) { table.selectAll("th").style("text-align", "center")});

            function getProperty(o, prop) {
                if (o[prop] !== undefined) return o[prop];
                else return 0;
            }
            
            function getTickers(tickersGroup) {
                var tickerObjects = tickersGroup.all();
                var Tickers = []
                for (var i=0; i<tickerObjects.length; i++) {
                    Tickers.push(tickerObjects[i].key); };
                return Tickers;
            }

            Tickers = getTickers(tickersGroup);

            var genLineChart = function(ticker, color, Group) {
                var line = dc.lineChart(priceChart, ticker)
                    .group(Group, ticker)
                    .valueAccessor(function (d) { return parseFloat(getProperty(d.value, ticker)) })
                    .colors([color])
                    .renderArea(true)
                    .title(function (d) { var value = parseFloat(d.data.value[ticker]);
                        return ticker + "\n" + dateFormat(d.data.key) + "\n" + numberFormat(value); })
                return line;
            }
            
            var getCharts = function(Tickers, colors, Group) {
                var LineCharts = [];
                for (var i=0; i<Tickers.length; i++) {
                    var ticker = Tickers[i], color = colors[i];
                    lineChart = genLineChart(ticker, color, Group);
                    LineCharts.push(lineChart);
                }
                return LineCharts;
            }

            var priceCharts = getCharts(Tickers, colors, prices);
            var volumeCharts = getCharts(Tickers, colors, volumes);

            var color = d3.scale.ordinal().range(colors);

            priceChart.width(600)
                .height(300)
                .transitionDuration(1000)
                .margins({top: 30, right: 50, bottom: 25, left: 50})
                .dimension(dateDimension)
                .group(prices)
                .valueAccessor(function (d) {
                    return d.value.ticker; })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .round(d3.time.month.round)
                .xUnits(d3.time.months)
                .elasticY(true)
                .elasticX(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(800).y(10).itemHeight(13).gap(1))
                .brushOn(false)
                .rangeChart(VolumeChart)
                .compose(priceCharts)
                .xAxis()
                ;

            priceChart.renderlet(function (table) { table.selectAll("g").data(Tickers)
                .enter().append("g")
                .attr("class", "legend")
                .style("font-size", "5px")
                .attr("transform", function(d, i) { 
                  return "translate(0," + i * 20 + ")"; })
                .append("rect").attr("x", 500-18).attr("width", 18).attr("height", 18).style("fill", '#dadaeb')
                .append("text").attr("x", 500-24).attr("y", 9).attr("dy", ".35em").style("text-anchor", "end").text(function(d) { return d; });
             });

            VolumeChart.width(600)
                    .height(100)
                    .transitionDuration(1000)
                    .margins({top: 0, right: 50, bottom: 25, left: 50})
                    .dimension(dateDimension)
                    .group(volumes)
                    .valueAccessor(function (d) {
                        return d.value.ticker; })
                    .x(d3.time.scale().domain([minDate, maxDate]))
                    .round(d3.time.month.round)
                    .xUnits(d3.time.months)
                    .elasticY(true)
                    .elasticX(true)
                    .renderHorizontalGridLines(true)
                    // .legend(dc.legend().x(800).y(0).itemHeight(13).gap(1))
                    .brushOn(true)
                    .compose(volumeCharts)
                    .xAxis();

        dc.renderAll();
}
