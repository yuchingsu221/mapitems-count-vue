<template>
  <div class="google-map" id="map"></div>
</template>

<script>
export default {
  props: {
    center: {
      type: Object,
      default: () => ({ lat: 25.0325917, lng: 121.5624999 })
    },
    zoom: {
      type: Number,
      default: 15
    },
    streetViewControl: {
      type: Boolean,
      default: true
    },
    mapTypeControl: {
      type: Boolean,
      default: true
    },
    fullscreenControl: {
      type: Boolean,
      default: true
    },
    zoomControl: {
      type: Boolean,
      default: true
    },
    restaurants: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      map: null,
      infowindow: null,
      markers: []
    };
  },
  watch: {
    center() {
      this.resetCenter();
      this.setMarker();
    }
  },
  mounted() {
    this.initMap();
    this.setMarker();
  },
  methods: {
    initMap() {
      const google = window.google
      this.map = new google.maps.Map(document.getElementById("map"), {
        center: this.center,
        zoom: this.zoom,
        maxZoom: 20,
        minZoom: 3,
        streetViewControl: this.streetViewControl,
        mapTypeControl: this.mapTypeControl,
        fullscreenControl: this.fullscreenControl,
        zoomControl: this.zoomControl,
        icon: "../assets/icon1.png",
        styles: [{
        "elementType": "geometry",
        "stylers": [{
          "color": "#212121"
        }]
      },
      {
        "elementType": "labels.icon",
        "stylers": [{
          "visibility": "off"
        }]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#757575"
        }]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [{
          "color": "#212121"
        }]
      },
      {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [{
          "color": "#757575"
        }]
      },
      {
        "featureType": "administrative.country",
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#9e9e9e"
        }]
      },
      {
        "featureType": "administrative.land_parcel",
        "stylers": [{
          "visibility": "off"
        }]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#bdbdbd"
        }]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#757575"
        }]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{
          "color": "#181818"
        }]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#616161"
        }]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.stroke",
        "stylers": [{
          "color": "#1b1b1b"
        }]
      },
      {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [{
          "color": "#2c2c2c"
        }]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#8a8a8a"
        }]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [{
          "color": "#373737"
        }]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{
          "color": "#3c3c3c"
        }]
      },
      {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry",
        "stylers": [{
          "color": "#4e4e4e"
        }]
      },
      {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#616161"
        }]
      },
      {
        "featureType": "transit",
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#757575"
        }]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{
          "color": "#000000"
        }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{
          "color": "#3d3d3d"
        }]
      }
    ]
    
      });
  
    },
    resetCenter() {
      // set center
      this.map.panTo({ lat: this.center.lat, lng: this.center.lng });
    },
    clearMarkers() {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
    },
    setMarker() {
      const google = window.google
      
      // clear existing markers
      this.clearMarkers();

      this.restaurants.forEach(location => {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: this.map
        });

        // save markers
        this.markers.push(marker);

        const infowindow = new google.maps.InfoWindow({
          content: `
          <div id="content">
            <p id="firstHeading" class="firstHeading">${location.name}</p>
          </div>
        `,
          maxWidth: 200
        });

        marker.addListener("click", () => {
          if (this.infowindow) this.infowindow.close();
          infowindow.open(this.map, marker);
          this.infowindow = infowindow;
        });
      });
    }
  }
};
</script>