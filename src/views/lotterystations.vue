<template>
  <div class=" container mt-4 ">
    <h2 class=" text-center text-secondary pb-2">台北市附近投注站</h2>
    <div class="map-container border rounded">
      <ul class="nav justify-content-center border-bottom">
        <li class="nav-item">
          <router-link class="nav-link" :class="{active: $route.query.district === 'xinyi' || !$route.query.district}"
            :to="{name: 'lotterystations', query: {district: 'xinyi'}}">信義區</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" :class="{active: $route.query.district === 'daan'}"
            :to="{name: 'lotterystations', query: {district: 'daan'}}">大安區</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" :class="{active: $route.query.district === 'songshan'}"
            :to="{name: 'lotterystations', query: {district: 'songshan'}}">松山區</router-link>
        </li>
      </ul>



      <!-- <GMap v-if="!isLoading" :center="{lat, lng}" :lotterystations="lotterystations" :streetViewControl="false"
        :mapTypeControl="false" :fullscreenControl="true" :zoomControl="true"></GMap> -->
    </div>
  </div>
</template>

<script>
  import xinyiDummylotterystations from "../dummy_data/xinyi.json";
  import daanDummylotterystations from "../dummy_data/daan.json";
  import songshanDummylotterystations from "../dummy_data/songshan.json";
  import GMap from "../components/GMap";


  export default {
    name: "lotterystations",
    components: {
      // GMap
    },
    data() {
      return {
        lat: 25.0325917,
        lng: 121.5624999,
        lotterystations: [],
        isLoading: true
      };
    },
    mounted() {
      const {
        district
      } = this.$route.query;
      this.fetchlotterystations(district);
    },
    beforeRouteUpdate(to, from, next) {
      const {
        district
      } = to.query;
      this.fetchlotterystations(district);
      next();
    },
    methods: {
      fetchlotterystations(district = "xinyi") {
        let dummyData = {};

        if (district === "daan") {
          dummyData = daanDummylotterystations;
        } else if (district === "xinyi") {
          dummyData = xinyiDummylotterystations;
        } else {
          dummyData = songshanDummylotterystations;
        }

        this.lotterystations = dummyData.lotterystations;
        this.lat = dummyData.center.lat;
        this.lng = dummyData.center.lng;
        this.isLoading = false;
      },
      googleMapsMatrix(lat1, lon1, lat, lng) {

        let origin = new GMap.maps.LatLng(lat, lng);
        let destination = new GMap.maps.LatLng(lat1, lon1);
        let service = new GMap.maps.DistanceMatrixService();

        service.getDistanceMatrix({
          origins: [origin],
          destinations: [destination],
          travelMode: 'DRIVING',
          // transitOptions: TransitOptions,
          // drivingOptions: DrivingOptions,
          unitSystem: GMap.maps.UnitSystem.IMPERIAL,
          // avoidHighways: Boolean,
          // avoidTolls: Boolean,
        }, (response, status) => (this.googleMatrixCallback(response, status, lat, lng)));

      },

    }

  };
</script>

<style scoped>
  .google-map {
    width: 100%;
    height: 800px;
  }

  a.active {
    border-bottom: 3px solid #ffaa2b;
  }

  .primary-color {
    color: #ffaa2b;
  }
</style>