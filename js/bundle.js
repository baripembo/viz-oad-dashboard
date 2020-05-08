window.$ = window.jQuery = require('jquery');
function hxlProxyToJSON(input){
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}
$( document ).ready(function() {
  const DATA_URL = 'data/';
  mapboxgl.accessToken = 'pk.eyJ1IjoiZXJpa2F3ZWkiLCJhIjoiY2pqb2kzeXJoMmM1eDNsc280YnBub2d6aCJ9.DapwlemDz4dhkDIG7sNdwQ';

  var isMobile = $(window).width()<600? true : false;
  var dataUrls = ['geodata_locations.geojson'];
  var map;

  function getData() {
    // dataUrls.forEach(function (url, index) {
    //   loadData(url, function (responseText) {
    //     parseData(JSON.parse(responseText), index);
    //   })
    // })
    initMap();
  }

  function initMap() {
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [20, 6],
      minZoom: 2
    });

    var hoveredStateId = null;

    map.addControl(new mapboxgl.NavigationControl());

    //erikawei.ck9xcye7b6wya2kmnbbj23fub-9x34p

    // map.addSource('locationSource', {
    //   type: 'csv',
    //   data: DATA_URL+'data/geodata_locations.geojson'
    // });

    map.on('load', function() {
      map.addSource('adm1', {
        'type': 'geojson',
        'data': 'data/features.geojson'
      });
     
      // The feature-state dependent fill-opacity expression will render the hover effect
      // when a feature's hover state is set to true.
      map.addLayer({
        'id': 'adm1-fills',
        'type': 'fill',
        'source': 'adm1',
        'layout': {},
        'paint': {
          'fill-color': '#627BC1',
          'fill-opacity': 0
          // 'fill-opacity': [
          //   'case',
          //   ['boolean', ['feature-state', 'hover'], false],
          //   1,
          //   0.5
          // ]
        }
      });
       
      // map.addLayer({
      //   'id': 'state-borders',
      //   'type': 'line',
      //   'source': 'states',
      //   'layout': {},
      //   'paint': {
      //     'line-color': '#000',
      //     'line-width': 1
      //   }
      // });
       
      // When the user moves their mouse over the state-fill layer, we'll update the
      // feature state for the feature under the mouse.
      map.on('mousemove', 'adm1-fills', function(e) {
        console.log(e.features[0].properties.ADM1_REF, e.features[0].properties.ADM0_REF);
        // if (e.features.length > 0) {
        //   if (hoveredStateId) {
        //     map.setFeatureState(
        //       { source: 'states', id: hoveredStateId },
        //       { hover: false }
        //     );
        //   }
        //   hoveredStateId = e.features[0].id;
        //   map.setFeatureState(
        //     { source: 'states', id: hoveredStateId },
        //     { hover: true }
        //   );
        // }
      });
       
      // When the mouse leaves the state-fill layer, update the feature state of the
      // previously hovered feature.
      // map.on('mouseleave', 'state-fills', function() {
      //   if (hoveredStateId) {
      //     map.setFeatureState(
      //       { source: 'states', id: hoveredStateId },
      //       { hover: false }
      //     );
      //   }
      //   hoveredStateId = null;
      // });

    });
    
  }

  function initTracking() {
    //initialize mixpanel
    let MIXPANEL_TOKEN = '';
    mixpanel.init(MIXPANEL_TOKEN);
    mixpanel.track('page view', {
      'page title': document.title,
      'page type': 'datavis'
    });
  }

  getData();
  //initTracking();
});