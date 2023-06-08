let map, infoWindow;
let app = {};
// import { MarkerClusterer } from "@googlemaps/markerclusterer";
let init = (app) =>{

  app.enumerate = (a) => {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => {e._idx = k++;});
    return a;
};
  app.popup = (obs) =>{
    console.log(obs);
    //Put the popup code in here
  }
  app.init = () => {
    window.initMap = initMap;
    // app.vue.get_observations();
    // console.log(app.vue.observations)
    // console.log("getobs")
    
    initMap();
    // console.log("done")
  };
  app.get_observations = function () {
    axios.get(observations_url)
      .then(function (r) {
        app.vue.observations = r.data.observations
     })
  };

  app.search = function () {
    if (app.vue.query.length > 1) {
      axios.get(search_url, {params: {q: app.vue.query}}).then(function(search_results){
        app.vue.search_results = search_results.data.search_results;
      });
    } else {
      app.vue.search_results = [];
    }
    
  };

  app.add_interest = function (result) {
    axios.post(add_interest_url, {species_id: result.id, species_name: result.common_name}).then(response => {
      console.log('Interest added successfully');
    })
    .catch(error => {
      console.error('Failed to add interest', error)
    });
  };

  app.rate_density = function (rating){
    console.log(rating);
    axios.post(rate_density_url, {rating: rating}).then(response => {
      console.log('Density added successfully');
    })
    .catch(error => {
      console.error('Failed to rate observation Density', error)
    }); 
  }

  
  app.test = function () {
    console.log("test")
  }

  app.clear_search = function () {
    console.log("clicked")
    this.query = "";
    app.vue.search_results = [];
  };

  app.data ={
    observations: [],
    markers: [],
    currentMarkers: [],
    map,
    search_results: [],
    query: "",
    filterinterests: false,
    notes: [],
    density: 0,
  };
  app.methods = {
    get_observations: app.get_observations,
    search: app.search,
    add_interest: app.add_interest,
    clear_search: app.clear_search,
    interonly: app.interonly,
    rate_density: app.rate_density,
    test: app.test,
  };

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods
  });
  async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    // const { MarkerClusterer} = await google.maps.importLibrary("markerClusterer");
    
    const map = new Map(document.getElementById("map"), {
      center: { lat: 37.0902, lng: -100},
      zoom: 10,
      streetViewControl: false,
      mapId: 'MainMap'
    });
    app.data.map = map
    const map2 = new Map(document.getElementById("map2"), {
      center: { lat: 37.0902, lng: -100},
      zoom: 10,
      streetViewControl: false,
      mapId: 'FnoteMap'
    });
    console.log("mapping")
    infoWindow = new google.maps.InfoWindow();
   {
      // Try HTML5 geolocation.
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
  
            infoWindow.setPosition(pos);
            infoWindow.setContent("You are here");
            infoWindow.open(map);
            map.setCenter(pos);
            map.setZoom(10);
            map2.setCenter(pos);
            map2.setZoom(10);
          },
          () => {
            handleLocationError(true, infoWindow, map.getCenter());
          }
        );
      } else {
        handleLocationError(false, infoWindow, map.getCenter());
      }
    };
    console.log("waiting points")

console.log('got the points')
  // console.log(app.vue.observations)

  let markers = []
  let markers2 = []
  // let markerCluster = new markerClusterer.MarkerClusterer({markers, map});
  let markerCluster = new markerClusterer.MarkerClusterer({ markers, map });
  axios.get(getfieldnotes_url).then(function (r)  {
    app.data.notes = r.data.field_notes
    markers2 =  app.vue.notes.map(obs => {
      console.log(obs)
      const marker2 = new google.maps.Marker({
        position: { lat: obs['latitude'], lng: obs['longitude']},
        map: map2,
      });
      marker2.addListener("gmp-click", () => {
        infoWindow.open(map2, marker2);
        app.fnotepopup(obs);
      });
      // markerCluster.addMarkers([marker]);
      return marker2;
  })
  // markers.splice(0,markers.length)
  });
  //  markerCluster.clearMarkers();
   google.maps.event.addListener(map, "idle", () => {
    // 
    // markerCluster.clearMarkers();
    // markerCluster.clearMarkers();
    // markers.splice(0,markers.length)
    console.log("remap")
    markerCluster.clearMarkers();
    let bounds = map.getBounds()
    let ne = bounds.getNorthEast();
    let sw = bounds.getSouthWest();
    axios.get(observations_url, {params: {
      lat_max: ne.lat(), lat_min: sw.lat(),
      lng_min: sw.lng(), lng_max: ne.lng(), filter: app.data.filterinterests,
    }})
    .then(function (r)  {
      markerCluster.clearMarkers();
      app.vue.observations = r.data.observations
      markers =  app.vue.observations.map(obs => {
        const marker = new google.maps.Marker({
          position: { lat: obs['latitude'], lng: obs['longitude']},
          map: map,
        });
        marker.addListener("gmp-click", () => {
          infoWindow.setContent(obs['common_name']);
          infoWindow.open(map, marker);
          app.popup(obs);
        });
        // markerCluster.addMarkers([marker]);
        return marker;
    })
    // markers.splice(0,markers.length)
    markerCluster.addMarkers(markers);


    
  });
  
    // hi = bnds
    // var ne = bounds.getNorthEast();
    // var sw = bounds.getSouthWest();
//     await axios.get(observations_url, {params: {lax: , lam: , lox:, lom:}})
//     .then(function (r) {
//       app.vue.observations = r.data.observations
//  })
    // console.log(ne)
    // console.log(sw)
    console.log(map.getBounds())

    // markerClu.addMarkers(markers);

    // markerCluster.addMarkers(markers);

  })
  // console.log("done obs")
    
  };
  
  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
      browserHasGeolocation
        ? "Allow access to current location to get local data"
        : "Error: Your browser doesn't support geolocation."
    );
    infoWindow.open(map);
  };
  app.init()
};
app.interonly = function() {
  console.log(app.data.filterinterests)
  app.data.map.setZoom(app.data.map.getZoom());
  app.data.filterinterests = !app.data.filterinterests;
};

init(app);