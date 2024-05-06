/*eslint-disable*/
let vue = new Vue({

    el: '#vue',
    data: {
        loading: true,
        map: null,
        userMarker: null,
        storeMarkers: null,
        /**
         * 地圖中心的緯經度
         */
        userPosition: null,
        zoom: null,
        data: [],
        /**
         * @model 搜尋框輸入內容
         */
        searchInput: '',
        /**
         * @model filter: 
         */
        checkboxes: [false, false],
        /**
         * @model filter: 顯示多少距離以內的彩券行清單
         */
        distance: 1000,
        searching: false,
        geolocation: true,
        menuHide: true,
        noticeOpen: true,
    },
    filters: {
        /**
         * 做四捨五入
         * @param {Number} value 任何數值
         * @returns {Number} 四捨五入的數值
         */
        round: function (value) {
            return Math.round(value);
        }
    },
    computed: {
        /**
         * 以與中心的距離由小到大排序的彩券行資料列表
         * （如果沒有中心點就不計算也不排序）
         * 1. 計算所有資料與中心的距離，並放入資料陣列中
         * 2. 將資料陣列以距離作升冪排序
         */
        sortedData: function () {
            if (this.userMarker !== null) {
                let result = this.data.slice();
                let resultLength = result.length;
                for (let i = 0; i < resultLength; i++) {
                    result[i].distance = this.computeDistance(this.userPosition, result[i].geometry.coordinates);
                }
                result.sort(function (a, b) {
                    return a.distance - b.distance;
                });
                return result;
            } else {
                return this.data;
            }

        },
        /**
         * 「您的位置」及其他與搜尋字串相符的資料列表
         * 1. 比對 searchInput 是否存在於資料的名稱跟地址中
         * 2. 回傳「您的位置」及篩選後的結果
         */
        searchingList: function () {
            let result = [{
                type: 'self',
                properties: {
                    name: '您的位置',
                },
                geometry: {
                    coordinates: [null, null]
                }
            }];
            let that = this;
            return result.concat(this.sortedData.filter(
                item => (item.properties.name.indexOf(that.searchInput) >= 0 ||
                    item.properties.address.indexOf(that.searchInput) >= 0)));
        }
    },
    methods: {
        /**
         * 取得不同類型的 icon
         * @param {String} type icon 類型： red/ blue/ blue-grey / grey-blue / grey
         */
        getIcon: function (type) {
            return L.icon({
                type: type,
                iconUrl: `../img/mark-${type}.png`,
                shadowUrl: `../img/mark-shadow.png`,
                iconSize: [66, 90],
                shadowSize: [58.5, 30], // size of the shadow
                iconAnchor: [33, 90], // point of the icon which will correspond to marker's location
                shadowAnchor: [0, 28], // the same for the shadow
                popupAnchor: [0, -80] // point from which the popup should open relative to the iconAnchor
            });
        },
        /**
         * 計算 a, b 兩點的距離
         * @param {Number[]} a a 點的緯經度
         * @param {Number[]} b b 點的緯經度
         * @returns {Number} a 、 b 兩點的距離（公尺）
         */
        computeDistance: function (a, b) {
            // 1 緯度 ≒ 11574 公尺
            // 1 經度 ≒ 111320 * cos(經度) 公尺
            return Math.sqrt(
                Math.pow(Math.abs((b[1] - a[0]) * 11574), 2) +
                Math.pow(Math.abs((b[0] - a[1]) * 111320 * Math.cos(Math.abs(b[0] + a[1]) / 2 / 180)), 2)
            );
        },
        /**
         * 1. 取得彩券站點地圖的資料
         * 2. 產生營業時間表格字串
         * 3. 呼叫 addMarkers()
         * 4. loading = false
         */
        getData: function () {
            let that = this;
            let xhr = new XMLHttpRequest();
            xhr.open('get', 'https://raw.githubusercontent.com/yuchingsu221/lotterystation/main/points.json');
            xhr.onload = function () {
                that.data = JSON.parse(xhr.responseText).features;
                for (let i = 0; i < that.data.length; i++) {
                    that.data[i].properties.schedule = that.createScheduleString(that.data[i]);
                    that.data[i].focus = false;
                }
                that.addMarkers();
                that.loading = false;
            };
            xhr.send();
        },
        /**
         * 將 data 裡的彩券行資料，標記在地圖上
         */
        addMarkers: function () {
            // 宣告 marker cluster
            this.storeMarkers = new L.markerClusterGroup().addTo(this.map);
            for (let i = 0; i < this.data.length; i++) {
                // 處理 popup 字串
                let popupString = this.createPopup(this.data[i]);
                // 產生 marker
                if (this.data[i].properties.false > 0) {
                    if (this.data[i].properties.true > 0) {
                        this.data[i].marker = L.marker(
                            [this.data[i].geometry.coordinates[1], this.data[i].geometry.coordinates[0]], {
                                icon: this.getIcon('blue')
                            }).bindPopup(popupString);
                    } else {
                        this.data[i].marker = L.marker(
                            [this.data[i].geometry.coordinates[1], this.data[i].geometry.coordinates[0]], {
                                icon: this.getIcon('blue-grey')
                            }).bindPopup(popupString);
                    }
                } else {
                    if (this.data[i].properties.mask_child > 0) {
                        this.data[i].marker = L.marker(
                            [this.data[i].geometry.coordinates[1], this.data[i].geometry.coordinates[0]], {
                                icon: this.getIcon('grey-blue')
                            }).bindPopup(popupString);
                    } else {
                        this.data[i].marker = L.marker(
                            [this.data[i].geometry.coordinates[1], this.data[i].geometry.coordinates[0]], {
                                icon: this.getIcon('grey')
                            }).bindPopup(popupString);
                    }
                }
                // 監聽 marker 點擊事件
                //這邊把地圖上的雙擊改成單擊
                let that = this;
                this.data[i].marker.on('click', () => {
                    if (window.innerWidth > 480)
                        that.changePosition(
                            that.data[i].geometry.coordinates[1],
                            that.data[i].geometry.coordinates[0],
                            that.data[i]);
                });
                // 放入 marker cluster
                this.storeMarkers.addLayer(this.data[i].marker);
            }
            // 放入 map
            this.map.addLayer(this.storeMarkers);
        },
        /**
         * 1. 宣告 地圖實體
         * 2. 放入 Open Street Map 的 tileLayer
         * 3. 要求使用者的位置資訊
         * 4. 有定位的話以定位位置為地圖中心，無則以整個台灣為起始畫面
         */
        openMap: function () {
            let that = this;
            // 設定地圖
            this.map = L.map('map', {
                center: [23.6334772, 120.852944],
                zoom: 7,
                maxBounds: L.latLngBounds(L.latLng(28, 115), L.latLng(20, 127)),
                minZoom: 7,
                zoomControl: false,
            });
            // 'http://otile(s).mq.cdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg'
            // 'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
            L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: 'Map data &copy; <a target="_blank" href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a target="_blank" href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
            }).addTo(this.map);
            // L.control.zoom({
            //     position: 'topright'
            // }).addTo(this.map);

            // 定位
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    // 有使用者位置資訊就以定位為中心
                    function (position) {
                        that.geolocation = true;
                        that.userPosition = [position.coords.latitude, position.coords.longitude];
                        that.zoom = 19;
                        that.map.setView(new L.LatLng(that.userPosition[0], that.userPosition[1]), that.zoom);
                        that.userMarker = L.marker([that.userPosition[0], that.userPosition[1]], {
                            // icon: that.getIcon('own')
                        });
                        that.map.addLayer(that.userMarker);
                    }
                );
            }
            // 電腦使用雙擊移動使用者位置
            that.map.on('dblclick', (event) => {
                that.changePosition(event.latlng.lat, event.latlng.lng);
            })
            // 手機使用單擊移動使用者位置
            that.map.on('click', (event) => {
                if (window.innerWidth <= 480) {
                    that.changePosition(event.latlng.lat, event.latlng.lng);
                }
            })

        },


        isVisable: function (adult, child) {
            if (this.checkboxes[0] == true && this.checkboxes[1] == true) {
                return (adult > 0 && child > 0);
            } else if (this.checkboxes[0] == true) {
                return adult > 0;
            } else if (this.checkboxes[1] == true) {
                return child > 0;
            } else {
                return true;
            }
        },
        /**
         * 依據彩券行資料產生營業時間表格字串
         * @param {Object} item 彩券行資料
         * @returns {String} 營業時間表格字串
         */
        createScheduleString(item) {
            let schedule = item.properties.available.split('、');
            let string = `<table class="schedule">
                                <tr>
                                    <th class="th"></th><th class="th">一</th><th class="th">二</th><th class="th">三</th><th class="th">四</th><th class="th">五</th><th class="th">六</th><th class="th">日</th>
                                </tr>`;
            for (let j = 0; j < schedule.length; j++) {
                switch (j) {
                    case 0:
                        string += `<tr><th class="th">早上</th>`;
                        break;
                    case 7:
                        string += `<tr><th class="th">下午</th>`;
                        break;
                    case 14:
                        string += `<tr><th class="th">晚上</th>`;
                        break;
                }
                if (schedule[j].indexOf('營業') >= 0) {
                    string += `<td class="td">◯</td>`;
                } else {
                    string += `<td class="td"></td>`;
                }
                if (j % 7 === 6) {
                    string += `</tr>`;
                }
            }
            string += `</table>`;
            return string;
        },
        /**
         * 依據彩券行資料產生 popup 字串
         * @param {Object} item 彩券行資料
         * @returns {String} popup 字串
         */
        createPopup(item) {
            let result = `<h2 class="title">${item.properties.name}</h2>
                <div class="data address">${item.properties.address}</div>
                <div class="data phone"><a href="tel:${item.properties.phone}">${item.properties.phone}</a></div>
                `;

            return result;
        },
        /**
         * 將使用者移到某個緯經度
         * @param {Number} lat 緯度
         * @param {Number} lng 經度
         * @param {Object} item 如果該點是彩券行，參數要加上彩券行資料的物件
         */


        changePosition(lat, lng, item) {

            // 移動到緯經度
            if (!item) {

                // var oldPosition = this.userMarker;
                this.userPosition = [lat, lng];
                this.zoom = 19;
                this.map.setView(new L.LatLng(this.userPosition[0], this.userPosition[1]));
                if (this.userMarker !== null) {
                    this.map.removeLayer(this.userMarker);
                }
                this.userMarker = L.marker([this.userPosition[0], this.userPosition[1]], {
                    // icon: this.getIcon('own')
                });
                this.map.addLayer(this.userMarker);
                this.searchInput = this.userPosition;
                var nowPosition = this.userPosition;
                // console.log(oldPosition);
                console.log(nowPosition);
                return nowPosition;
            }
            // 移動到定位位置或台彩站點
            else {
                if (item.type === 'self') {
                    if (navigator.geolocation) {
                        let that = this;
                        navigator.geolocation.getCurrentPosition(
                            // 有使用者定位
                            function (position) {
                                that.userPosition = [position.coords.latitude, position.coords.longitude];
                                that.zoom = 19;
                                that.map.setView(new L.LatLng(that.userPosition[0], that.userPosition[1]), that.zoom);
                                that.searchInput = item.properties.name;
                                if (that.userMarker !== null) {
                                    that.map.removeLayer(that.userMarker);
                                    that.userMarker = L.marker([that.userPosition[0], that.userPosition[1]], {
                                        icon: that.getIcon('own')
                                    });
                                    that.map.addLayer(that.userMarker);
                                }
                            },
                            // 無使用者定位
                            function (err) {
                                if (err.code === 1) {
                                    alert('您未提供位置資訊的權限，請檢查您的瀏覽器設定。');
                                }
                            }
                        );
                    }
                } else {
                    this.userPosition = [item.geometry.coordinates[1], item.geometry.coordinates[0]];
                    this.zoom = 19;
                    this.map.setView(new L.LatLng(this.userPosition[0], this.userPosition[1]), this.zoom);
                    this.searchInput = item.properties.name;
                    if (this.userMarker !== null) {
                        this.map.removeLayer(this.userMarker);
                    }
                    this.userMarker = L.marker([this.userPosition[0], this.userPosition[1]], {
                        icon: this.getIcon('red')
                    }).bindPopup(item.marker._popup._content);
                    this.map.addLayer(this.userMarker);
                }
            }
            // card每次定點都會自動將點擊地點至於最左方
            this.$refs.myCard.scrollTo(0, 0);
            // sidebar每次定點都會自動將點擊地點至於最上方
            this.$refs.myList.scrollTo(0, 0);

        },
        /**
         * 中心移到台彩站點並開啟 popup
         * @param {Object} item 台彩資料
         */
        focusStore(item) {
            let that = this;
            this.map.setView([item.geometry.coordinates[1], item.geometry.coordinates[0]]);
            let marker;
            if (item.distance === 0) {
                marker = L.marker(
                    [item.geometry.coordinates[1], item.geometry.coordinates[0]], {
                        icon: this.getIcon('red')
                    }).bindPopup(this.createPopup(item));
                marker.addTo(this.map).openPopup();
            } else {
                marker = L.marker(
                    [item.geometry.coordinates[1], item.geometry.coordinates[0]], {
                        icon: this.getIcon(item.marker.options.icon.options.type)
                    }).bindPopup(this.createPopup(item));

            }
            // var card = this.$el.querySelector(".card");
            // card.scrollLeft = card.scrollHeight;
            // card.scrollTo(0, 0);
            marker.addTo(this.map).openPopup();
            marker.on('popupclose', function removeMarker() {
                that.map.removeLayer(marker);
            });
            item.focus = true;
            // window.scrollTo({ left: 0, behavior: 'smooth' });
            // window.scrollTo(0, 0);
        },

        runDirection(lat, lng, item) {

            
            var routing;

            this.userPosition = [lat, lng];
            

            navigator.geolocation.getCurrentPosition(success, error, [options])

            var options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };

            function success(pos) {
                var crd = pos.coords;
                console.log('Your current position is:');
                console.log(`Latitude : ${crd.latitude}`);
                console.log(`Longitude: ${crd.longitude}`);
                console.log(`More or less ${crd.accuracy} meters.`);

                return [crd.latitude, crd.longitude];
            }

            function error(err) {
                console.warn(`ERROR(${err.code}): ${err.message}`);
            }

            var test = getPosition();

            // console.log(geolocationPositionInstance.coords);
            console.log(test);

            function getPosition() {
                navigator.geolocation.getCurrentPosition(function (data) {
                    let latitude = data.coords.latitude;
                    let longitude = data.coords.longitude;
                    console.log('緯度：', latitude);
                    console.log('經度：', longitude);
                    // text.innerHTML = `緯度: ${latitude}<br>  經度: ${longitude}`;
                });
            };

            // getPosition();

            // console.log(this.userPosition[1], item.geometry.coordinates[1], item.geometry.coordinates[0], );
            // 有使用者定位);
            setInterval(function () {
                var newWaypoint = routingControl.getWaypoints()[0].latLng;
                var newLat = newWaypoint.lat + 0.01;
                var newLng = newWaypoint.lng + 0.01;
                routingControl.setWaypoints([
                   L.latLng(newLat, newLng),
                   routingControl.options.waypoints[1]
                 ]);
            }, 10000);



            var routing = L.Routing.control({
                waypoints: [
                    L.latLng(25.01139057415976, 121.46182975745764),
                    L.latLng(item.geometry.coordinates[1], item.geometry.coordinates[0])
                ],
                //不可拖動新增地點於地圖上
                lineOptions: {
                    addWaypoints: false
                },
                routeWhileDragging: true
            }).addTo(this.map);

            // delay().then(() => {
            //     routing.spliceWaypoints(0, 2);   // 顯示 1
            //     return delay(2000); // 延遲ㄧ秒
            //     routing.spliceWaypoints(0, 2);
            //   })

            // foo().then((res) => console.log(res));

            function checkLine() {
                $("#navigation").dblclick()
            };

            async function foo() {
                const delay = (s) => {
                    return new Promise(function (resolve) { // 回傳一個 promise
                        setTimeout(resolve, s); // 等待多少秒之後 resolve()
                    });
                };

                await $("#navigation").click();
                await delay(10000);
                routing.spliceWaypoints(0, 2);

            };

            //     funC().then($("#navigation").dblclick())
            //     console.log($("#navigation").dblclick())
            //     funA();
            //  
            foo();

            // routing.spliceWaypoints(0, 2);

            // console.log(L.marker(
            //     [item.geometry.coordinates[1], item.geometry.coordinates[0]]));

        }




    },
    mounted() {

        this.openMap();
        this.getData();
        // 點選搜尋框以外的地方時，搜尋選項會隱藏
        let that = this;
        document.querySelector('body').addEventListener('click', function (event) {
            if (event.target.classList.contains('search-input') !== true) {
                that.searching = false;
            }
        });
    },
});