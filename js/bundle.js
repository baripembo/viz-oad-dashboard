window.$ = window.jQuery = require('jquery');
function createBarChart(data, type) {
  data.forEach(function(item, index) {
    if (item.min=='' || item.max=='')
      data.splice(index, 1);
  });

  var barColor = (type=='Cases') ? '#007CE1' : '#000';
  var maxVal = d3.max(data, function(d) { return +d.max; })
  var barHeight = 25;
  var barPadding = 20;
  var margin = {top: 0, right: 40, bottom: 30, left: 50},
      width = 300,
      height = (barHeight + barPadding) * data.length;
  
  x = d3.scaleLinear()
    .domain([0, maxVal])
    .range([0, width - margin.left - margin.right]);

  // set the ranges
  y = d3.scaleBand().range([0, height]);
  y.domain(data.map(function(d) { return d.model; }));
            
  var div = '.projections-'+ type.toLowerCase();
  var svg = d3.select(div).append('svg')
      .attr('width', width)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // add the y axis
  svg.append('g')
    .attr('transform', 'translate(0, 0)')
    .call(d3.axisLeft(y)
      .tickSizeOuter(0))

  // add the x axis
  svg.append('g')
    .attr('transform', 'translate(0, '+height+')')
    .call(d3.axisBottom(x)
      .tickSizeOuter(0)
      .ticks(5, 's'));

  // append bars
  bars = svg.selectAll('.bar')
      .data(data)
    .enter().append('g')
      .attr('class', 'bar-container')
      .attr('transform', function(d, i) { return 'translate(' + x(d.min) + ', ' + (y(d.model)+10) + ')'; });

  bars.append('rect')
    .attr('class', 'bar')
    .attr('fill', barColor)
    .attr('height', barHeight)
    .attr('width', function(d) {
      var w = x(d.max) - x(d.min);
      if (w<0) w = 0;
      return w;
    });

  // add min/max labels
  bars.append('text')
    .attr('class', 'label-num')
    .attr('x', function(d) {
      return x(d.max) - x(d.min) + 4;
    })
    .attr('y', function(d) { return barHeight/2 + 4; })
    .text(function (d) {
      return d3.format('.3s')(d.max);
    });

  bars.append('text')
    .attr('class', 'label-num')
    .attr('text-anchor', 'end')
    .attr('x', -4)
    .attr('y', function(d) { return barHeight/2 + 4; })
    .text(function (d) {
      return d3.format('.3s')(d.min);
    });

  //source
  if (type=='Deaths') {
    var projectionsDiv = $('.projections .panel-inner');
    var date = new Date();
    projectionsDiv.append('<p class="small source"></p>');
    data.forEach(function(d) {
      var source = getSource('#affected+infected+cases+min+'+d.model.toLowerCase());
      var sourceDate = new Date(source['#date']);
      if (sourceDate.getTime()!=date.getTime()) {
        date = sourceDate;
        projectionsDiv.find('.source').append(' <span class="date">'+ dateFormat(date) +'</span>');
      }
      projectionsDiv.find('.source').append(' | '+ d.model +': <a href="'+ source['#meta+url'] +'" class="dataURL" target="_blank">DATA</a>');
    });
  }

}

function initTimeseries(data, div) {
  var timeseriesArray = formatTimeseriesData(data);
  createTimeSeries(timeseriesArray, div);
}

function formatTimeseriesData(data) {
  //group the data by country
  var groupByCountry = d3.nest()
    .key(function(d){ return d['Country']; })
    .key(function(d) { return d['Date']; })
    .entries(data);
  groupByCountry.sort(compare);

  //group the data by date
  var groupByDate = d3.nest()
    .key(function(d){ return d['Date']; })
    .entries(data);

  var dateArray = ['x'];
  groupByDate.forEach(function(d) {
    var date = new Date(d.key);
    var utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    dateArray.push(utcDate);
  });

  var timeseriesArray = [];
  timeseriesArray.push(dateArray);

  groupByCountry.forEach(function(country, index) {
    var arr = [country.key];
    var val = 0;
    groupByDate.forEach(function(d) {
      country.values.forEach(function(e) {
        if (d.key == e.key) {
          val = e.values[0]['confirmed cases'];
        }
      });
      arr.push(val);
    });
    timeseriesArray.push(arr);
  });

  return timeseriesArray;
}

var countryTimeseriesChart;
function createTimeSeries(array , div) {
	var chart = c3.generate({
    size: {
      height: 240
    },
    padding: {
      bottom: 0,
      top: 10,
      left: 30,
      right: 16
    },
    bindto: div,
    title: {
  		text: 'Number of Confirmed Cases Over Time',
  		position: 'upper-left',
		},
		data: {
			x: 'x',
			columns: array,
      type: 'spline'
		},
    color: {
        pattern: ['#1ebfb3', '#f2645a', '#007ce1', '#9c27b0', '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
    },
    spline: {
      interpolation: {
        type: 'basis'
      }
    },
    point: { show: false },
		axis: {
			x: {
				type: 'timeseries',
				tick: {
          count: 8,
				  format: '%-m/%-d/%y',
          outer: false
				}
			},
			y: {
				min: 0,
				padding: { top:0, bottom:0 },
        tick: { 
          outer: false,
          format: shortenNumFormat
        }
			}
		},
    legend: {
      show: false,
      position: 'inset',
      inset: {
          anchor: 'top-left',
          x: 10,
          y: 0,
          step: 8
      }
    },
		tooltip: { grouped: false },
    transition: { duration: 300 }
	});

  var lastUpdated = new Date(Math.max.apply(null, timeseriesData.map(function(e) {
    return new Date(e.Date);
  })));

  if (div=='.country-timeseries-chart') {
    countryTimeseriesChart = chart;
    $('.cases-timeseries').append('<p class="small"><span class="date">'+ dateFormat(lastUpdated) +'</span> | <span class="source-name">Source</span> | <a href="https://data.humdata.org/dataset/coronavirus-covid-19-cases-and-deaths" class="dataURL" target="_blank">DATA</a></p>');
  }
  createTimeseriesLegend(chart, div);
}


function createTimeseriesLegend(chart, div) {
  var names = [];
  chart.data.shown().forEach(function(d) {
    names.push(d.id)
  });

  //custom legend
  d3.select(div).insert('div').attr('class', 'timeseries-legend').selectAll('div')
    .data(names)
    .enter().append('div')
    .attr('data-id', function(id) {
      return id;
    })
    .html(function(id) {
      return '<span></span>'+id;
    })
    .each(function(id) {
      d3.select(this).select('span').style('background-color', chart.color(id));
    })
    .on('mouseover', function(id) {
      chart.focus(id);
    })
    .on('mouseout', function(id) {
      chart.revert();
    });
}

function updateTimeseries(data, selected) {
  var updatedData = (selected != undefined) ? data.filter((country) => selected.includes(country['Country Code'])) : data;
  var timeseriesArray = formatTimeseriesData(updatedData);

  //load new data
  countryTimeseriesChart.load({
    columns: timeseriesArray,
    unload: true,
    done: function() {
      $('.country-timeseries-chart .timeseries-legend').remove();
      createTimeseriesLegend(countryTimeseriesChart, '.country-timeseries-chart');
    }
  });
}


function getMonth(m) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[m];
}

function compare(a, b) {
  const keyA = a.key.toLowerCase();
  const keyB = b.key.toLowerCase();

  let comparison = 0;
  if (keyA > keyB) {
    comparison = 1;
  } else if (keyA < keyB) {
    comparison = -1;
  }
  return comparison;
}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 0.9, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y);
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", + lineHeight + "em").text(word);
      }
    }
  });
}

function truncateString(str, num) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
}

function formatValue(val) {
  var n = (isNaN(val) || val==0) ? val : d3.format('$.3s')(val).replace(/G/, 'B');
  return n;
}

function roundUp(x, limit) {
  return Math.ceil(x/limit)*limit;
}

function setSelect(id, valueToSelect) {    
  let element = document.getElementById(id);
  element.value = valueToSelect;
}

function getAccessLabels(data) {
  var accessData = Object.entries(data);
  var accessLabels = {};
  accessData.forEach(function(item) {
    if (item[1].indexOf('access')>-1)
      accessLabels[item[1]] = item[0];
  });
  return accessLabels;
}

function createKeyFigure(target, title, className, value) {
  var targetDiv = $(target);
  //<p class='date small'><span>"+ date +"</span></p>
  return targetDiv.append("<div class='key-figure'><div class='inner'><h3>"+ title +"</h3><div class='num " + className + "'>"+ numFormat(value) +"</div></div></div></div>");
}
/***********************/
/*** PANEL FUNCTIONS ***/
/***********************/
function initCountryPanel() {
  var data = dataByCountry[currentCountry][0];

  //timeseries
  updateTimeseries(timeseriesData, data['#country+code']);

  //set panel header
  $('.flag').attr('src', 'assets/flags/'+data['#country+code']+'.png');
  $('.country-panel h3').text(data['#country+name']);

  //covid
  var covidDiv = $('.country-panel .covid .panel-inner');
  covidDiv.children().remove();  
  createFigure(covidDiv, {className: 'cases', title: 'Total Confirmed Cases', stat: data['#affected+infected'], indicator: '#affected+infected'});
  createFigure(covidDiv, {className: 'deaths', title: 'Total Confirmed Deaths', stat: data['#affected+killed'], indicator: '#affected+killed'});

  //projections
  var projectionsDiv = $('.country-panel .projections .panel-inner');
  projectionsDiv.children().remove();  
  projectionsDiv.append('<h6>COVID-19 Projections</h6><div class="bar-chart projections-cases"><p class="chart-title">Cases</p></div>');
  var cases = [{model: 'Imperial', min: data['#affected+cases+imperial+infected+min'], max: data['#affected+cases+imperial+infected+max']},
               {model: 'LSHTM', min: data['#affected+cases+infected+lshtm+min'], max: data['#affected+cases+infected+lshtm+max']}];
  createBarChart(cases, 'Cases');
  
  projectionsDiv.append('<div class="bar-chart projections-deaths"><p class="chart-title">Deaths</p></div>');
  var deaths = [{model: 'Imperial', min: data['#affected+deaths+imperial+min'], max: data['#affected+deaths+imperial+max']},
                {model: 'LSHTM', min: data['#affected+deaths+lshtm+min'], max: data['#affected+deaths+lshtm+max']}];
  createBarChart(deaths, 'Deaths');

  //hrp
  var hrpDiv = $('.country-panel .hrp .panel-inner');
  hrpDiv.children().remove();  
  createFigure(hrpDiv, {className: 'pin', title: 'Number of People in Need', stat: shortenNumFormat(data['#affected+inneed']), indicator: '#affected+inneed'});
  createFigure(hrpDiv, {className: 'funding-level', title: 'HRP Funding Level', stat: data['#value+covid+funding+pct']+'%', indicator: '#affected+inneed'});
  createFigure(hrpDiv, {className: 'funding-received', title: 'HRP Funding Received', stat: shortenNumFormat(data['#value+covid+funding+total+usd']), indicator: '#affected+inneed'});
  createFigure(hrpDiv, {className: 'funding-required', title: 'GHRP Request (USD)', stat: shortenNumFormat(data['#value+funding+precovid+required+usd']), indicator: '#affected+inneed'});

  //inform
  var informDiv = $('.country-panel .inform .panel-inner');
  informDiv.children().remove();  
  createFigure(informDiv, {className: 'risk-index', title: 'Risk Index<br>(1-10)', stat: data['#severity+num'], indicator: '#severity+num'});
  createFigure(informDiv, {className: 'risk-class', title: 'Risk Class<br>(Very Low-Very High)', stat: data['#severity+type'], indicator: '#severity+num'});

  //school
  var schoolDiv = $('.country-panel .schools .panel-inner');
  schoolDiv.children().remove();  
  createFigure(schoolDiv, {className: 'school', stat: data['#impact+type'], indicator: '#impact+type'});

  //access -- fix this logic
  var accessDiv = $('.country-panel .humanitarian-access .panel-inner');
  accessDiv.children().remove();  
  const keys = Object.keys(data);
  var constraintsCount = 0;
  var impactCount = 0;
  var phrase = ['Restriction of movements INTO the country ', 'Restriction of movements WITHIN the country '];
  keys.forEach(function(key, index) {
    if (key.indexOf('constraints_')>-1) constraintsCount++;
    if (key.indexOf('impact_')>-1) impactCount++;
  });
  var headerCount = 0;
  var text = '';
  for (var i=1; i<=constraintsCount; i++) {
    var key = '#access+constraints_'+i;
    if (accessLabels[key].indexOf(phrase[0])>-1) {
      text = accessLabels[key].replace(phrase[0],'');
      if (headerCount==0) {
        accessDiv.append('<h6 class="access-title">'+ phrase[0] +'</h6>');
        headerCount++;
      }
    }
    else if (accessLabels[key].indexOf(phrase[1])>-1) {
      text = accessLabels[key].replace(phrase[1],'');
      if (headerCount==1) {
        accessDiv.append('<h6 class="access-title">'+ phrase[1] +'</h6>');
        headerCount++;
      }
    }
    else {
      text = accessLabels[key];
      if (headerCount==2) {
        accessDiv.append('<h6 class="access-title"></h6>');
        headerCount++;
      }
    }
    var content = '<div class="access-row">';
    content += (data[key]==1) ? '<div class="access-icon yes">YES</div>' : '<div class="access-icon">NO</div>';
    content += '<div>'+ text +'</div></div>';
    accessDiv.append(content);
  }
  accessDiv.append('<h6 class="access-title">What is the impact of COVID-19 related measures on the response?</h6>');
  for (var j=1; j<=impactCount; j++) {
    var key = '#access+impact_'+j;
    var content = '<div class="access-row">';
    content += (data[key]==j) ? '<div class="access-icon yes">YES</div>' : '<div class="access-icon">NO</div>';
    content += '<div>'+ accessLabels[key] +'</div></div>';
    accessDiv.append(content);
  }
  createSource(accessDiv, '#access+constraints');
}


function createFigure(div, obj) {
  div.append('<div class="figure '+ obj.className +'"><div class="figure-inner"></div></div>');
  var divInner = $('.'+ obj.className +' .figure-inner');
  if (obj.title != undefined) divInner.append('<h6 class="title">'+ obj.title +'</h6>');
  divInner.append('<p class="stat">'+ obj.stat +'</p>');

  createSource(divInner, obj.indicator);
}

function createSource(div, indicator) {
  var sourceObj = getSource(indicator);
  var date = dateFormat(new Date(sourceObj['#date']));
  div.append('<p class="small source"><span class="date">'+ date +'</span> | <span class="source-name">Source</span> | <a href="'+ sourceObj['#meta+url'] +'" class="dataURL" target="_blank">DATA</a></p>');
}

function updateSource(div, indicator) {
  //fix this
  var id = (indicator=='#value+covid+funding+pct') ? '#value+funding+covid+pct' : indicator;
  var sourceObj = getSource(id);
  var date = dateFormat(new Date(sourceObj['#date']));
  div.find('.date').text(date);
  div.find('.source-name').text('Source');
  div.find('.dataURL').attr('href', sourceObj['#meta+url']);
}

function getSource(indicator) {
  var obj = {};
  sourcesData.forEach(function(item) {
    if (item['#indicator+name'] == indicator) {
      obj = item;
    }
  });
  return obj;
}



var numFormat = d3.format(',');
var shortenNumFormat = d3.format('.2s');
var percentFormat = d3.format('.0%');
var dateFormat = d3.utcFormat("%b %d, %Y");
var colorRange = ['#F7DBD9', '#F6BDB9', '#F5A09A', '#F4827A', '#F2645A'];
var informColorRange = ['#FFE8DC','#FDCCB8','#FC8F6F','#F43C27','#961518'];
var colorDefault = '#F2F2EF';
var geomData, geomFilteredData, nationalData, accessData, subnationalData, timeseriesData, healthData, dataByCountry, totalCases, totalDeaths, maxCases, colorScale, currentCountry = '';
  
var countryCodeList = [];
var currentIndicator = {};
var currentCountryIndicator = {};
var accessLabels = {};

$( document ).ready(function() {
  var isMobile = window.innerWidth<768? true : false;
  var geomPath = 'data/worldmap.json';
  var nationalPath = 'https://proxy.hxlstandard.org/data.objects.json?dest=data_edit&strip-headers=on&force=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2Fe%2F2PACX-1vT9_g7AItbqJwDkPi55VyVhqOdB81c3FePhqAoFlIL9160mxqtqg-OofaoTZtdq39BATa37PYQ4813k%2Fpub%3Fgid%3D0%26single%3Dtrue%26output%3Dcsv';
  var accessPath = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9_g7AItbqJwDkPi55VyVhqOdB81c3FePhqAoFlIL9160mxqtqg-OofaoTZtdq39BATa37PYQ4813k/pub?gid=0&single=true&output=csv';
  var subnationalPath = 'https://proxy.hxlstandard.org/data.objects.json?dest=data_edit&strip-headers=on&force=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2Fe%2F2PACX-1vT9_g7AItbqJwDkPi55VyVhqOdB81c3FePhqAoFlIL9160mxqtqg-OofaoTZtdq39BATa37PYQ4813k%2Fpub%3Fgid%3D433791951%26single%3Dtrue%26output%3Dcsv';
  var timeseriesPath = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS23DBKc8c39Aq55zekL0GCu4I6IVnK4axkd05N6jUBmeJe9wA69s3CmMUiIvAmPdGtZPBd-cLS9YwS/pub?gid=1253093254&single=true&output=csv';
  var sourcesPath = 'https://proxy.hxlstandard.org/data.objects.json?dest=data_edit&strip-headers=on&force=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2Fe%2F2PACX-1vT9_g7AItbqJwDkPi55VyVhqOdB81c3FePhqAoFlIL9160mxqtqg-OofaoTZtdq39BATa37PYQ4813k%2Fpub%3Fgid%3D1837381168%26single%3Dtrue%26output%3Dcsv';
  var healthPath = 'data/health.csv';

  var viewportWidth = window.innerWidth - $('.content-left').innerWidth();
  var viewportHeight = window.innerHeight;
  var tooltip = d3.select(".tooltip");


  function getData() {
    Promise.all([
      d3.json(geomPath),
      d3.json(nationalPath),
      d3.json(subnationalPath),
      d3.csv(accessPath),
      d3.csv(timeseriesPath),
      d3.json(sourcesPath),
      d3.csv(healthPath)
    ]).then(function(data){
      //parse data
      geomData = topojson.feature(data[0], data[0].objects.geom);
      nationalData = data[1];
      subnationalData = data[2];
      accessData = data[3];
      timeseriesData = data[4];
      sourcesData = data[5];
      healthData = data[6];

      //format data
      nationalData.forEach(function(item) {
        if (item['#access+constraints']!=undefined) item['#access+constraints'] = item['#access+constraints'].replace('%','')/100;
        item['#value+covid+funding+pct'] = item['#value+covid+funding+pct']/100;
      })

      subnationalData.forEach(function(item) {
        var pop = item['#population'];
        if (item['#population']!=undefined) item['#population'] = parseInt(pop.replace(/,/g, ''), 10);
        item['#affected+food+p3+pct'] = item['#affected+food+p3+pct']/100;
        item['#org+count+num'] = +item['#org+count+num'];
      })

      //parse out access labels
      accessLabels = getAccessLabels(accessData[0]);

      //group data by country    
      dataByCountry = d3.nest()
        .key(function(d) { return d['#country+code']; })
        .object(nationalData);

      console.log(nationalData)
      console.log(subnationalData)
      console.log(healthData)

      //get list of priority countries
      nationalData.forEach(function(item, index) {
        countryCodeList.push(item['#country+code']);
      });

      //filter for priority countries
      geomFilteredData = geomData.features.filter((country) => countryCodeList.includes(country.properties.ISO_A3));

      initDisplay();
    });
  }

  function getCountryData() {
    //clear map region colors
    mapsvg.selectAll('.map-regions')
      .attr('fill', colorDefault);
    $('.count-marker').hide();

    var dataPath = 'data/'+currentCountry+'.geojson';
    Promise.all([
      d3.json(dataPath)
    ]).then(function(data){
      var adm1Data = data[0];
      currentCountryIndicator = {id: '#affected+food+p3+pct', name: 'Food Security'};
      drawCountryMap(adm1Data);
    });
  }

  function initDisplay() {
    //create country select 
    var countrySelect = d3.select('.country-select')
      .selectAll('option')
      .data(nationalData)
      .enter().append('option')
        .text(function(d) { return d['#country+name']; })
        .attr('value', function (d) { return d['#country+code']; });

    //insert default option    
    $('.country-select').prepend('<option value="">Select Country</option>');
    $('.country-select').val($('.country-select option:first').val());

    //country select event
    d3.select('.country-select').on('change',function(e) {
      var selected = d3.select('.country-select').node().value;
      if (selected=='') {
        resetMap();
      }
      else {        
        currentCountry = selected;
        getCountryData();
      }
    });

    //indicator select event
    d3.select('.indicator-select').on('change',function(e) {
      var selected = d3.select('.indicator-select').node().value;
      if (selected!='') {
        var container = $('.country-panel');
        var section = $('.'+selected);
        var offset = $('.panel-header').innerHeight();
        container.animate({scrollTop: section.offset().top - container.offset().top + container.scrollTop() - offset}, 300);
      }
    });

    //set content height
    $('.content').height(viewportHeight);

    //global stats
    maxCases = d3.max(nationalData, function(d) { return +d['#affected+infected']; })
    totalCases = d3.sum(nationalData, function(d) { return d['#affected+infected']; });
    totalDeaths = d3.sum(nationalData, function(d) { return d['#affected+killed']; });
    createKeyFigure('.stats-priority', 'Total Confirmed Cases', 'cases', totalCases);
    createKeyFigure('.stats-priority', 'Total Confirmed Deaths', 'deaths', totalDeaths);
    createKeyFigure('.stats-priority', 'Total Locations', 'locations', nationalData.length);
    createSource($('.global-stats'), '#affected+infected');

    //access constraints description    
    $('.description').text(accessLabels['#access+constraints']);

    //set up menu events
    $('.menu-indicators li').on('click', function() {
      $('.menu-indicators li').removeClass('selected')
      $(this).addClass('selected');
      currentIndicator = {id: $(this).attr('data-id'), name: $(this).text()};
      updateGlobalMap();
    });
    currentIndicator = {id: $('.menu-indicators').find('.selected').attr('data-id'), name: $('.menu-indicators').find('.selected div').text()};

    $('.menu h2').on('click', function() {
      resetMap();
    });

    //set up radio button events
    $('input[type="radio"]').click(function(){
      var selected = $('input[name="countryIndicators"]:checked');
      currentCountryIndicator = {id: selected.val(), name: selected.parent().text()};
      updateCountryMap();
    });

    drawGlobalMap();
    initTimeseries(timeseriesData, '.global-timeseries-chart');
    initTimeseries(timeseriesData, '.country-timeseries-chart');

    //remove loader and show vis
    $('.loader').hide();
    $('main, footer').css('opacity', 1);
  }


  function initCountryView() {
    $('.content').addClass('country-view');
    $('.menu h2').html('<a href="#">< Back to Global View</a>');
    $('.country-panel').scrollTop(0);
    $('#foodSecurity').prop('checked', true);
    currentCountryIndicator = {id: $('input[name="countryIndicators"]:checked').val(), name: $('input[name="countryIndicators"]:checked').parent().text()};

    initCountryPanel();
  }


  /****************************/
  /*** GLOBAL MAP FUNCTIONS ***/
  /****************************/
  var projection, zoom, g, mapsvg, path, markerScale;
  function drawGlobalMap(){
    var width = viewportWidth;
    var height = viewportHeight;
    var mapScale = width/4;
    var mapCenter = [30, 5];

    //choropleth color scale
    colorScale = d3.scaleQuantize().domain([0, 1]).range(colorRange);

    //create log scale for circle markers
    markerScale = d3.scaleSqrt()
      .domain([1, maxCases])
      .range([2, 15]);

    projection = d3.geoMercator()
      .center(mapCenter)
      .scale(mapScale)
      .translate([width / 2, height / 2]);

    zoom = d3.zoom()
      .scaleExtent([1, 30])
      .on("zoom", zoomed);

    path = d3.geoPath().projection(projection);

    mapsvg = d3.select('#global-map').append('svg')
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .on("wheel.zoom", null)
      .on("dblclick.zoom", null);

    mapsvg.append("rect")
      .attr("width", "100%")
      .attr("height", viewportHeight)
        
    //draw map
    g = mapsvg.append("g");
    g.selectAll("path")
    .data(geomData.features)
    .enter()
      .append("path")
      .attr("class", "map-regions")
      .attr("fill", function(d) {
        var num = -1;
        if (isHRP(d.properties.ISO_A3)){
          var country = nationalData.filter(c => c['#country+code'] == d.properties.ISO_A3);
          num = country[0][currentIndicator.id]; 
        }
        var clr = (num<0 || num=='') ? colorDefault : colorScale(num);
        return clr;
      })
      .attr("id", function(d) { return d.properties.ISO_A3; })
      .attr("d", path)
      .on("mouseover", function(d){ 
        if (isHRP(d.properties.ISO_A3)){
          tooltip.style("opacity", 1); 
        }
      })
      .on("mouseout", function(d) { tooltip.style("opacity", 0); })
      .on("mousemove", function(d) {
        if (isHRP(d.properties.ISO_A3)){
          createMapTooltip(d.properties['ISO_A3'], d.properties.NAME_LONG);
        }
      })
      .on("click", function(d) {
        if (isHRP(d.properties.ISO_A3)) {
          currentCountry = d.properties.ISO_A3;
          getCountryData();
        }
      });

    //create count markers
    var countMarker = g.append("g")
      .attr("class", "count-layer")
      .selectAll(".count-marker")
      .data(geomFilteredData)
      .enter()
        .append("g")
        .append("circle")
        .attr("class", "marker count-marker")
        .attr("id", function(d) { return d.properties.ISO_A3; })
        .attr("r", function (d){ 
          var country = nationalData.filter(country => country['#country+code'] == d.properties.ISO_A3);
          return markerScale(+country[0]['#affected+infected']); 
        })
        .attr("transform", function(d){ return "translate(" + path.centroid(d) + ")"; })
        .on("mouseover", function(){ tooltip.style("opacity", 1); })
        .on("mouseout", function(){ tooltip.style("opacity", 0); })
        .on("mousemove", function(d) {
          createMapTooltip(d.properties.ISO_A3, d.properties.NAME_LONG);
        });

    //country labels
    var label = g.selectAll(".country-label")
      .data(geomFilteredData)
      .enter().append("text")
        .attr("class", "country-label")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("dy", "1em")
        .text(function(d) { return d.properties.NAME_LONG; })
        .call(wrap, 100);

    //tooltip
    mapTooltip = mapsvg.append("g")
      .attr("class", "tooltip");

    //zoom controls
    d3.select("#zoom_in").on("click", function() {
      zoom.scaleBy(mapsvg.transition().duration(500), 1.5);
    }); 
    d3.select("#zoom_out").on("click", function() {
      zoom.scaleBy(mapsvg.transition().duration(500), 0.5);
    });

    createGlobalLegend(colorScale);
  }

  function updateGlobalMap() {
    //set up color scales
    var max = (currentIndicator.id.indexOf('access')>-1 || currentIndicator.id.indexOf('funding')>-1) ? 1 : d3.max(nationalData, function(d) { return +d[currentIndicator.id]; })
    colorScale = d3.scaleQuantize().domain([0, max]).range(colorRange);

    //toggle description
    if (currentIndicator.id=='#access+constraints')
      $('.description').show();
    else
      $('.description').hide();
    
    //update choropleth
    mapsvg.selectAll('.map-regions')
      .attr("fill", function(d) {
        var val = -1;
        var clr = colorDefault;
        if (isHRP(d.properties.ISO_A3)){
          var country = nationalData.filter(c => c['#country+code'] == d.properties.ISO_A3);
          val = country[0][currentIndicator.id]; 

          if (currentIndicator.id=='#severity+type') {
            colorScale = d3.scaleOrdinal().domain(['Very Low', 'Low', 'Medium', 'High', 'Very High']).range(informColorRange);
            clr = (val=='') ? colorDefault : colorScale(val);
          }
          else {
            clr = (val<0 || val=='') ? colorDefault : colorScale(val);
          }
        }

        return clr;
      });

    updateGlobalLegend(colorScale);
  }

  function createGlobalLegend(scale) {
    //current indicator
    var legendTitle = $('.menu-indicators').find('.selected').attr('data-legend');
    $('.map-legend.global .indicator-title').text(legendTitle);
    createSource($('.map-legend.global .indicator-source'), currentIndicator.id);

    var legend = d3.legendColor()
      .labelFormat(percentFormat)
      .cells(colorRange.length)
      .scale(scale);

    var div = d3.select('.map-legend.global');
    var svg = div.append('svg')
      .attr('height', '90px');
    svg.append('g')
      .attr('class', 'scale')
      .call(legend);


    //cases
    $('.map-legend.global').append('<h4>Number of COVID-19 cases</h4>');
    createSource($('.map-legend.global'), '#affected+infected');
    var markersvg = div.append('svg')
      .attr('height', '60px');
    markersvg.append('g')
      .attr("transform", "translate(5, 10)")
      .attr('class', 'legendSize');

    var legendSize = d3.legendSize()
      .scale(markerScale)
      .shape('circle')
      .shapePadding(40)
      .labelFormat(numFormat)
      .labelOffset(15)
      .cells(2)
      .orient('horizontal');

    markersvg.select('.legendSize')
      .call(legendSize);
  }

  function updateGlobalLegend(scale) {
    var legendTitle = $('.menu-indicators').find('.selected').attr('data-legend');
    $('.map-legend.global .indicator-title').text(legendTitle);
    updateSource($('.indicator-source'), currentIndicator.id);

    var legendFormat = (currentIndicator.id=='#access+constraints' || currentIndicator.id=='#value+covid+funding+pct') ? percentFormat : shortenNumFormat;
    var legend = d3.legendColor()
      .labelFormat(legendFormat)
      .cells(colorRange.length)
      .scale(scale);

    var g = d3.select('.map-legend.global .scale');
    g.call(legend);
  }

  function selectCountry(d) {
    setSelect('countrySelect', d.properties.ISO_A3);

    //zoom into country
    var panelWidth = $('.country-panel').width();
    var menuWidth = $('.content-left').width();
    var width = viewportWidth - panelWidth - menuWidth;
    var height = viewportHeight;
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    mapsvg.transition().duration(200).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(((width-panelWidth) / 2)+menuWidth+100, height / 2)
        .scale(Math.min(30, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    )
    .on('end', initCountryView);
  }


  function resetMap() {
    $('.content').removeClass('country-view');
    $('#country-map').empty();
    $('.menu h2').html('Global');
    setSelect('countrySelect', '');

    updateGlobalMap();
    mapsvg.transition().duration(500).call(
      zoom.transform, 
      d3.zoomIdentity
        .scale(1)
    )
    .on('end', function() { 
      $('.count-marker').show(); 
    });
  }

  function zoomed() {
    const {transform} = d3.event;
    currentZoom = transform.k;

    if (!isNaN(transform.k)) {
      g.attr('transform', transform);
      g.attr('stroke-width', 1 / transform.k);

      //update country labels and markers
      if (cg!=undefined) {
        cg.attr('transform', transform);
        cg.attr('stroke-width', 1 / transform.k);

        cmapsvg.selectAll('.adm1-label')
          .style('font-size', function(d) { return 12/transform.k+'px'; });

        cmapsvg.selectAll('circle').each(function(m){
        var marker = d3.select(this);
        subnationalData.forEach(function(d){
          if (m.properties.ADM1_REF == d['#adm1+name']) {
            var r = 20;
            marker.transition().duration(500).attr('r', function (d) { 
              return (r/currentZoom);
            });
          }
        });
      });
      }

      //update global labels and markers
      mapsvg.selectAll('.country-label')
        .style('font-size', function(d) { return 12/transform.k+'px'; });
      
      mapsvg.selectAll('circle').each(function(m){
        var marker = d3.select(this);
        nationalData.forEach(function(d){
          if (m.properties.ISO_A3 == d['#country+code']) {
            var r = markerScale(d['#affected+infected']);
            marker.transition().duration(500).attr('r', function (d) { 
              return (r/currentZoom);
            });
          }
        });
      });
    }
  }

  /*****************************/
  /*** COUNTRY MAP FUNCTIONS ***/
  /*****************************/
  var cmapsvg, cg, healthScale;
  function drawCountryMap(adm1Data) {
    $('#country-map').empty();
    var countryColorScale = d3.scaleQuantize().domain([0, 1]).range(colorRange);

    // //create log scale for health markers
    // healthScale = d3.scaleSqrt()
    //   .domain([1, maxCases])
    //   .range([2, 15]);

    //draw country map
    cmapsvg = d3.select('#country-map').append('svg')
      .attr("width", viewportWidth)
      .attr("height", viewportHeight);

    cmapsvg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
        
    //draw map
    cg = cmapsvg.append("g");
    cg.selectAll("path")
    .data(adm1Data.features)
    .enter()
      .append("path")
      .attr("class", "map-regions")
      .attr("id", function(d) { return d.properties.ADM1_REF; })
      .attr("d", path)
      .attr("fill", function(d) {
        var val = -1;
        var adm1 = subnationalData.filter(function(c) {
          if (c['#adm1+name']==d.properties.ADM1_REF && c['#country+code']==currentCountry)
            return c;
        });
        val = adm1[0][currentCountryIndicator.id];
        var clr = (val<0 || val=='') ? colorDefault : countryColorScale(val);
        return clr;
      })
      .on("mouseover", function(d){ tooltip.style("opacity", 1);})
      .on("mouseout", function(d) { tooltip.style("opacity", 0); })
      .on("mousemove", function(d) { createCountryMapTooltip(d.properties['ADM1_REF']); });


    //create health markers
    // var healthMarker = cg.append("g")
    //   .attr("class", "health-layer")
    //   .selectAll(".health-marker")
    //   .data(adm1Data.features)
    //   .enter()
    //     .append("g")
    //     .attr("transform", function(d){ return "translate(" + path.centroid(d) + ")"; });

    //   healthMarker.append("circle")
    //     .attr("class", "marker health-marker")
    //     .attr("id", function(d) { return d.properties.ADM1_REF; })
    //     .attr("r", 20);

    //   healthMarker.append("text")
    //       .attr("class", "health-label")
    //       //.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    //       //.attr("dy", '1em')
    //       .text(function(d) { 
    //         var adm1 = healthData.filter(function(c) {
    //           if (c['ADM1_REF']==d.properties.ADM1_REF && c['alpha_3']==currentCountry)
    //             return c;
    //         });
    //         return adm1[0].NUMPOINTS; 
    //       })
        // .on("mouseover", function(){ tooltip.style("opacity", 1); })
        // .on("mouseout", function(){ tooltip.style("opacity", 0); })
        // .on("mousemove", function(d) {
        //   createMapTooltip(d.properties.ISO_A3, d.properties.NAME_LONG);
        // });

    //adm1 labels
    var label = cg.selectAll(".adm1-label")
      .data(adm1Data.features)
      .enter().append("text")
        .attr("class", "adm1-label")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("dy", '1em')
        .text(function(d) { return d.properties.ADM1_REF; })
        .call(wrap, 100);

    createCountryLegend(countryColorScale);

    //zoom into selected country
    geomFilteredData.forEach(function(c) {
      if (c.properties.ISO_A3==currentCountry) {
        selectCountry(c);
      }
    });
  }

  function updateCountryMap() {
    $('.map-legend.country svg').show();
    var max = (currentCountryIndicator.id.indexOf('pct')>-1) ? 1 : d3.max(subnationalData, function(d) { 
      if (d['#country+code']==currentCountry) {
        return d[currentCountryIndicator.id]; 
      }
    });

    if (currentCountryIndicator.id=='#org+count+num') max = roundUp(max, 10);

    var countryColorScale = d3.scaleQuantize().domain([0, max]).range(colorRange);

    cmapsvg.selectAll('.map-regions')
      .attr('fill', function(d) {
        var val = -1;
        var clr = colorDefault;
        var adm1 = subnationalData.filter(function(c) {
          if (c['#adm1+name']==d.properties.ADM1_REF && c['#country+code']==currentCountry)
            return c;
        });
        val = adm1[0][currentCountryIndicator.id]; 
        clr = (val<0 || val=='') ? colorDefault : countryColorScale(val);
        return clr;
      });

    if (max!=undefined & max>0)
      updateCountryLegend(countryColorScale);
    else
      $('.map-legend.country svg').hide();
  }

  function createCountryLegend(scale) {
    $('.map-legend.country .source-container').empty();
    $('.map-legend.country svg').remove();
    createSource($('.map-legend.country .food-security-source'), '#affected+food+p3+pct');
    createSource($('.map-legend.country .population-source'), '#population');
    createSource($('.map-legend.country .orgs-source'), '#org+count+num');

    var legend = d3.legendColor()
      .labelFormat(percentFormat)
      .cells(colorRange.length)
      .scale(scale);

    var div = d3.select('.map-legend.country');
    var svg = div.append('svg');
    svg.append('g')
      .attr('class', 'scale')
      .call(legend);
  }

  function updateCountryLegend(scale) {
    var legendFormat;
    switch(currentCountryIndicator.id) {
      case '#affected+food+p3+pct':
        legendFormat = percentFormat;
        break;
      case '#population':
        legendFormat = shortenNumFormat;
        break;
      default:
        legendFormat = d3.format('.0s');
    }
    var legend = d3.legendColor()
      .labelFormat(legendFormat)
      .cells(colorRange.length)
      .scale(scale);

    var g = d3.select('.map-legend.country .scale');
    g.call(legend);
  }


  /*************************/
  /*** TOOLTIP FUNCTIONS ***/
  /*************************/
  function createCountryMapTooltip(adm1_name){
    var adm1 = subnationalData.filter(function(c) {
      if (c['#adm1+name']==adm1_name && c['#country+code']==currentCountry)
        return c;
    });
    var val = adm1[0][currentCountryIndicator.id];

    //format content for tooltip
    if (val!=undefined && val!='' && !isNaN(val)) {
      if (currentCountryIndicator.id.indexOf('pct')>-1) val = percentFormat(val);
      if (currentCountryIndicator.id=='#population') val = shortenNumFormat(val);
    }
    else {
      val = 'No Data';
    }
    var content = '<label class="h3 label-header">' + adm1_name + '</label>' + currentCountryIndicator.name + ': ' + val + '<br/>';

    showMapTooltip(content);
  }

  function createMapTooltip(country_code, country_name){
    var country = nationalData.filter(c => c['#country+code'] == country_code);
    var val = country[0][currentIndicator.id];

    //format content for tooltip
    if (val!=undefined && val!='') {
      if (currentIndicator.id.indexOf('access')>-1 || currentIndicator.id.indexOf('funding')>-1) val = percentFormat(val);
      if (currentIndicator.id=='#affected+inneed') val = shortenNumFormat(val);
    }
    else {
      val = 'No Data';
    }
    var content = '<label class="h3 label-header">' + country_name + '</label>'+ currentIndicator.name + ': ' + val + '<br/><br/>';

    //covid cases and deaths
    content += 'COVID-19 Cases: ' + numFormat(country[0]['#affected+infected']) + '<br/>';
    content += 'COVID-19 Deaths: ' + numFormat(country[0]['#affected+killed']);

    showMapTooltip(content);
  }


  function showMapTooltip(content) {
    var w = $('.tooltip').outerWidth();
    var h = ($('.tooltip-inner').outerHeight() <= 0) ? 80 : $('.tooltip-inner').outerHeight() + 20;
    tooltip.select('div').html(content);
    tooltip
      .style('height', h + 'px')
      .style('left', (d3.event.pageX - w/2) + 'px')
      .style('top', (d3.event.pageY - h - 15) + 'px')
      .style('text-align', 'left')
      .style('opacity', 1);
  }
  /*********************/


  /************************/
  /*** HELPER FUNCTIONS ***/
  /************************/
  function isHRP(country_code) {
    var included = false;
    countryCodeList.forEach(function(c){
      if (c==country_code) included = true;
    });
    return included;
  }
  /************************/


  function initTracking() {
    //initialize mixpanel
    let MIXPANEL_TOKEN = window.location.hostname=='data.humdata.org'? '5cbf12bc9984628fb2c55a49daf32e74' : '99035923ee0a67880e6c05ab92b6cbc0';
    mixpanel.init(MIXPANEL_TOKEN);
    mixpanel.track('page view', {
      'page title': document.title,
      'page type': 'datavis'
    });
  }

  getData();
  //initTracking();
});