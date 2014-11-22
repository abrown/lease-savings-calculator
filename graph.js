// setup lease data
var leases = [new Lease(23325, 15.10, 0.025, 6.20), new Lease(23325, 15.10, 0.020, 6.20), new Lease(23325, 15.10, 0.015, 6.20)];

function Lease(size, leaseRate, leaseChange, operationalCosts) {
    this.size = size;
    this.leaseRate = leaseRate;
    this.leaseChange = leaseChange;
    this.operationalCosts = operationalCosts;
}
Lease.prototype.ratePerSquareFoot = function () {
    return this.leaseRate + this.operationalCosts;
};
Lease.prototype.costPerMonth = function (afterNumYears) {
    var baseCost = this.ratePerSquareFoot() * this.size;
    var cost = baseCost * Math.pow(1 + this.leaseChange, afterNumYears);
    return cost;
};
var z = d3.scale.category10();

// render leases
function renderLeases(leases) {
    console.log('Rendering lease inputs');
    var selection = d3.select('.leases').selectAll('.lease').data(leases);
    // enter
    selection.enter().insert('div', '.add-lease').html(d3.select('.template').html()).classed('lease', true).select('.remove-lease').on('click', onRemoveLease);
    // update
    selection.select('.size').property('value', function (d) {
        return d.size;
    });
    selection.select('.leaseRate').property('value', function (d) {
        return d.leaseRate;
    });
    selection.select('.operationalCosts').property('value', function (d) {
        return d.operationalCosts;
    });
    selection.select('.leaseChange').property('value', function (d) {
        return d.leaseChange * 100;
    });
    selection.select('.number').text(function (d, i) {
        return i + 1;
    });
    selection.select('h3').style('color', function (d, i) {
        return z(i);
    });
    // exit
    selection.exit().remove();
}
renderLeases(leases);


// handle input
d3.selectAll('input').on('input', function (d) {
    for (var p in d) {
        if (d3.select(this).classed(p)) {
            d[p] = +this.value;
            break;
        }
    }
    renderGraph(leases, years);
});
d3.selectAll('.leaseChange').on('input', function (d) {
    d.leaseChange = +this.value / 100;
    renderGraph(leases, years);
});
d3.select('.add-lease').on('click', onAddLease);

function onAddLease() {
    var last = leases[leases.length - 1];
    console.log('Adding a lease: ', last);
    leases.push(last);
    renderLeases(leases);
    renderGraph(leases, years);
}

function onRemoveLease(d, i) {
    console.log('Removing a lease: ', d);
    leases.splice(i, 1);
    renderLeases(leases);
    renderGraph(leases, years);
}


// setup SVG
var margin = {
    top: 10,
    right: 30,
    bottom: 30,
    left: 60
};
var chart = d3.select(".chart");
var canvas = chart.append('g').attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var width = parseInt(chart.style("width")) - margin.left - margin.right,
    height = parseInt(chart.style("height")) - margin.top - margin.bottom;
console.log(width, height);

var yearSpan = 10;
var year = new Date().getFullYear();
var years = d3.range(year, year + yearSpan);
console.log(years);

var x = d3.scale.linear().domain([year, year + yearSpan]).range([0, width]);
var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.format('d'));
var xAxisElement = canvas.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
console.log(xAxisElement);
var currency = d3.format('$,.2f');

function renderGraph(leases, years) {
    console.log('Rendering graph', leases, years);

    // update x axis
    x.domain([d3.min(years), d3.max(years)]);
    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    // update y axis
    y.domain([0, d3.max(leases, function (d) {
        return d.costPerMonth(years.length);
    })]);

    // create bar groups
    var groupWidth = width / years.length;
    var groups = canvas.selectAll('g.groups').data(years);
    // enter
    groups.enter().append('g').classed('groups', true);
    // update
    groups.style('width', groupWidth).attr("transform", function (d, i) {
        return "translate(" + (i * groupWidth - groupWidth / 2) + ",0)";
    });
    // exit
    groups.exit().remove();

    // create bars
    var barWidth = groupWidth / (leases.length + 1);
    var bars = groups.selectAll('g.bars').data(function (d, i) {
        var data = leases.map(function (l) {
            return l.costPerMonth(i);
        });
        console.log('Calculated: ', data);
        return data;
    }, function (d, i) {
        console.log('Key: ', [d, i]);
        return [d, i];
    });
    // enter
    var g = bars.enter().append("g").classed('bars', true);
    g.append('rect');
    g.append('text');
    // update
    bars.attr("transform", function (d, i) {
        return "translate(" + ((barWidth / 2) + (i * barWidth)) + ",0)";
    });
    bars.select('rect').attr("width", barWidth - 1).attr("y", function (d) {
        return y(d);
    }).attr("height", function (d) {
        return height - y(d);
    }).style('fill', function (d, i) {
        return z(i);
    });
    bars.select('text')
        .attr('transform', function (d) {
            return 'translate(' + (barWidth / 2 + 4) + ',' + (y(d) + barWidth / 4) + ') rotate(270)'; // translate('+ barWidth/2 + ',' + y(d) + ')
        })
        .text(function (d) {
            return currency(d);
        });

    // exit
    bars.exit().remove();




    //
    //    var bar = chart.selectAll("g")
    //        .data(years)
    //        .enter().append("g")
    //        .attr("transform", function (d, i) {
    //            return "translate(" + i * barWidth + ",0)";
    //        });
    //    bar.append("rect")
    //        .attr("y", function (d) {
    //            return scaledCost(d);
    //        })
    //        .attr("height", function (d) {
    //            return height - scaledCost(d);
    //        })
    //        .attr("width", barWidth - 1);
    //    bar.append("text")
    //        .attr("x", barWidth / 2)
    //        .attr("y", function (d) {
    //            return scaledCost(d) + 3;
    //        })
    //        .attr("dy", ".75em")
    //        .text(function (d) {
    //            return d;
    //        });
}
renderGraph(leases, years);


//
//
//function render() {
//
//}
//
//function ratePerSquareFoot() {
//    var rate = +d3.select('#lease-rate').property('value');
//    var opCosts = +d3.select('#operational-costs').property('value');
//    return rate + opCosts;
//}
//
//function costPerMonth(numYears) {
//    var size = +d3.select('#size').property('value');
//    var change = (+d3.select('#lease-change').property('value')) / 100;
//    var baseCost = ratePerSquareFoot() * size;
//    var cost = baseCost * Math.pow(1 + change, numYears);
//    // console.log(size, change, baseCost, cost);
//    return cost;
//}
//
//function scaledCost(d) {
//    return y(costPerMonth(d - year));
//}

//
//
//
//
//
//d3.tsv("data.tsv", type, function(error, data) {
//  y.domain([0, d3.max(data, function(d) { return d.value; })]);
//
//  var barWidth = width / data.length;
//
//  var bar = chart.selectAll("g")
//      .data(data)
//    .enter().append("g")
//      .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; });
//
//  bar.append("rect")
//      .attr("y", function(d) { return y(d.value); })
//      .attr("height", function(d) { return height - y(d.value); })
//      .attr("width", barWidth - 1);
//
//  bar.append("text")
//      .attr("x", barWidth / 2)
//      .attr("y", function(d) { return y(d.value) + 3; })
//      .attr("dy", ".75em")
//      .text(function(d) { return d.value; });
//});
//
//function type(d) {
//  d.value = +d.value; // coerce to number
//  return d;
//}
