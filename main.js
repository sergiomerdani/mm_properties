import "./style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM, BingMaps, Vector as VectorSource, XYZ } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { Projection, fromLonLat, transform } from "ol/proj";
import Tile from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS.js";
import {
  Attribution,
  defaults,
  FullScreen,
  MousePosition,
  Rotate,
} from "ol/control";
import DragRotate from "ol/interaction/DragRotate";
import { altKeyOnly, platformModifierKeyOnly } from "ol/events/condition";
import { toStringXY } from "ol/coordinate";
import LayerSwitcher from "ol-ext/control/LayerSwitcher";
import LayerGroup from "ol/layer/Group";
import SearchNominatim from "ol-ext/control/SearchNominatim";
import Feature from "ol/Feature";
import Overlay from "ol/Overlay.js";
import {
  Style,
  Circle as CircleStyle,
  Fill,
  Stroke,
  Text,
  RegularShape,
  Icon,
} from "ol/style";
import { LineString, Point, Circle } from "ol/geom.js";
import { getLength, getArea } from "ol/sphere";
import { Modify, Draw, Select } from "ol/interaction";
import Snap from "ol/interaction/Snap";
import Geolocation from "ol/Geolocation.js";
import { DragPan } from "ol/interaction";
import PrintDialog from "ol-ext/control/PrintDialog";
import CanvasAttribution from "ol-ext/control/CanvasAttribution";
import CanvasScaleLine from "ol-ext/control/CanvasScaleLine";
import CanvasTitle from "ol-ext/control/CanvasTitle";
import ol_control_Legend from "ol-ext/control/Legend";
import ol_legend_Legend from "ol-ext/legend/Legend";
import { jsPDF } from "jspdf";
import { WMTSCapabilities } from "ol/format";
import { optionsFromCapabilities } from "ol/source/WMTS";
import WMTS from "ol/source/WMTS";
import { Chart } from "chart.js/auto";
import { getPointResolution } from "ol/proj";
import { fromCircle } from "ol/geom/Polygon";
import { saveAs } from "file-saver";
import DragAndDrop from "ol/interaction/DragAndDrop";
import { GPX, GeoJSON, IGC, KML, TopoJSON } from "ol/format";
import JSZip from "jszip";
import ImageWMS from "ol/source/ImageWMS";
import { Image as ImageLayer } from "ol/layer.js";
import ol_control_Graticule from "ol-ext/control/Graticule";
import ol_control_FeatureList from "ol-ext/control/FeatureList";
import ol_control_SearchCoordinates from "ol-ext/control/SearchCoordinates";
import ol_control_Select from "ol-ext/control/Select";
import WMSCapabilities from "ol/format/WMSCapabilities";
import Cluster from "ol/source/Cluster";
import { bbox, bbox as bboxStrategy } from "ol/loadingstrategy";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import MVT from "ol/format/MVT";
import WFS from "ol/format/WFS";
import ol_style_Chart from "ol-ext/style/Chart";
import TileArcGISRest from "ol/source/TileArcGISRest.js";
import Heatmap from "ol/layer/Heatmap.js";
import { toLonLat } from "ol/proj";

proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
register(proj4);

proj4.defs(
  "EPSG:6870",
  "+proj=tmerc +lat_0=0 +lon_0=20 +k=1 +x_0=500000 +y_0=0 +ellps=GRS8082 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
);
register(proj4);

proj4.defs(
  "EPSG:32634",
  "+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs +type=crs"
);
register(proj4);

const wgs84Proj = new Projection({
  code: "EPSG:4326",
  units: "degrees",
  worldExtent: [-180.0, -90.0, 180.0, 90.0],
});
const krgjshProjection = new Projection({
  code: "EPSG:6870",
  extent: [-2963585.56, 3639475.76, 2404277.44, 9525908.77],
  worldExtent: [-16.1, 32.88, 40.18, 84.73],
  units: "m",
});
const proj32634 = new Projection({
  code: "EPSG:32634",
  extent: [166021.44, 0.0, 833978.56, 9329005.18],
  worldExtent: [18.0, 0.0, 24.0, 84.0],
  units: "m",
});

const krgjshCenter = fromLonLat([19.818913, 41.328608], "EPSG:6870");
const utmCenter = [413011.607371, 4564155.943308];
const wgs84Center = [19.820709, 41.33042];

//URLs

let host = "localhost";
let port = "8080";
// let host = "localhost",
let workspaceName = "test";
const asigWmsUrl =
  "https://geoportal.asig.gov.al/service/kufinjt_e_njesive_administrative/wms?request=GetCapabilities";

const asigWmsService = "https://geoportal.asig.gov.al/service";

// const apiUrl = "http://${host}:8082/geoserver/rest/layergroups"; //${host}
const apiUrl = `http://${host}:${port}/geoserver/rest/workspaces/${workspaceName}/layergroups`; //server

function camelCase(str) {
  // Split the string into words
  const words = str.split(" ");

  // Convert the first word to lowercase
  let camelCaseStr = words[0].toLowerCase();

  // Convert the first letter of each subsequent word to uppercase and append to the result
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    camelCaseStr += word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  return camelCaseStr;
}

function parseLayerInfo(layerParams) {
  const parts = layerParams.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid layer name format");
  }
  const workspace2 = parts[0];
  const layerName2 = parts[1];
  const layerTitle2 = layerName2
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return { workspace2, layerName2, layerTitle2 };
}
const username = "admin";
const password = "geoserver";
let layerGroupName,
  layerParams,
  layersArray = [];

// Make a GET request to the API
fetch(apiUrl, {
  method: "GET",
  // mode: "no-cors",
  headers: {
    Authorization: "Basic " + btoa(`${username}:${password}`), // Change credentials
    Accept: "application/json",
  },
  credentials: "include",
})
  .then((response) => {
    // Check if the response is successful (status code 200-299)
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    // Parse the response as JSON
    return response.json();
  })
  .then((data) => {
    const layerGroups = data.layerGroups.layerGroup;
    layerGroups.forEach((layerGroup) => {
      layerGroupName = layerGroup.name;
      const constLayerGroup = camelCase(layerGroupName);
      const newLayerGroup = new LayerGroup({
        layers: [],
        title: layerGroupName,
        displayInLayerSwitcher: true,
      });
      map.addLayer(newLayerGroup);
      layerGroupsArray.push(newLayerGroup);
      const apiUrlLayerGroups =
        apiUrl + "/" + encodeURIComponent(layerGroupName);

      fetch(apiUrlLayerGroups, {
        method: "GET",
        // mode: "no-cors",
        headers: {
          Authorization: "Basic " + btoa(`${username}:${password}`), // Change credentials
          Accept: "application/json",
        },
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          const layers = data.layerGroup.publishables.published;
          const normalizedLayers = Array.isArray(layers) ? layers : [layers];
          normalizedLayers.forEach((layer) => {
            layerParams = layer.name;
            const { workspace2, layerName2, layerTitle2 } =
              parseLayerInfo(layerParams);
            const tileLayer = new ImageLayer({
              source: new ImageWMS({
                url: `http://${host}:${port}/geoserver/${workspace2}/wms`,
                // url: `http://admin:geoserver@${host}:8082/geoserver/${workspace2}/wms`,
                params: {
                  LAYERS: layerParams,
                  VERSION: "1.1.1",
                },
                ratio: 1,
                serverType: "geoserver",
                crossOrigin: "anonymous",
              }),
              visible: true,
              title: layerTitle2,
              information: "Kufiri i tokësor i republikës së Shqipërisë",
              displayInLayerSwitcher: true,
            });
            newLayerGroup.getLayers().push(tileLayer);
            layersArray.push(tileLayer);
          });
        })
        .catch((error) => {
          console.error("There was a problem with the fetch operation:", error);
        });
    });
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });

//creating attribution control for ol
const attributionControl = new Attribution({
  collapsible: true,
});

// Zoom Extent ol-Control
const zoomExtentBtn = document.getElementById("zoom-extent");

zoomExtentBtn.addEventListener("click", function () {
  map
    .getView()
    .fit([2064411.259926, 4774562.53480825, 2399511.191928, 5332247.093174], {
      padding: [10, 10, 10, 10], // Optional padding around the extent
      maxZoom: 18, // Optional maximum zoom level
    });
  calculateScale();
});

//Full Screen COntrol
const fullScreenControl = new FullScreen({
  tipLabel: "Click to fullscreen the map",
  className: "ol-full-screen",
});

//Zoom Slider
// const zoomSlider = new ZoomSlider();

//MousePosition Coordinates
const mousePositionControl = new MousePosition({
  coordinateFormat: function (coordinate) {
    return "KRGJSH : " + toStringXY(coordinate, 2);
  },
  className: "custom-mouse-position",
});

//Rotate COntrol
const rotate = new Rotate();

//DRAGPAN MAP
const dragPanBtn = document.getElementById("pan");

const dragPan = new DragPan({
  condition: function (event) {
    return platformModifierKeyOnly(event);
  },
});

dragPanBtn.addEventListener("click", function () {
  map.addInteraction(dragPan);
});

// Adding controls in a variable
const mapControls = [
  attributionControl,
  fullScreenControl,
  mousePositionControl,
  rotate,
  dragPan,
];

// Bing Maps Basemap Layer
// const bingMaps = new TileLayer({
//   source: new BingMaps({
//     key: "AvHGkUYsgRR4sQJ1WmqJ879mN7gP-a59ExxkaD9KXDie-8nyYX4W9oSnG4ozmDXB",
//     imagerySet: "AerialWithLabelsOnDemand", //'Aerial','RoadOnDemand','CanvasGray','AerialWithLabelsOnDemand','Aerial','Birdseye','BirdseyeV2WithLabels','CanvasDark','Road','CanvasGray'
//   }),
//   visible: false,
//   title: "BingMaps",
//   baseLayer: true,
//   displayInLayerSwitcher: true,
// });

const osmMap = new TileLayer({
  source: new OSM(),
  title: "OSM",
  visible: false,
  baseLayer: true,
  displayInLayerSwitcher: true,
});

//CartoDB BaseMap Layer
const cartoDBBaseLayer = new TileLayer({
  source: new XYZ({
    url: "https://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attributions: "© CARTO",
  }),
  visible: true,
  title: "CartoDarkAll",
  baseLayer: true,
  displayInLayerSwitcher: true,
});

let baseLayerGroup;
var wmts_parser = new WMTSCapabilities();

fetch("https://geoportal.asig.gov.al/service/wmts?request=getCapabilities")
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    var result = wmts_parser.read(text);
    var opt_ortho_2015_20 = optionsFromCapabilities(result, {
      layer: "orthophoto_2015:OrthoImagery_20cm",
      matrixSet: "EPSG:6870",
    });

    const ortho = new Tile({
      name: "Ortofoto 2015 20cm",
      shortName: "2015 20cm",
      visible: false,
      source: new WMTS(opt_ortho_2015_20),
      baseLayer: true,
      displayInLayerSwitcher: true,
    });

    baseLayerGroup.getLayers().push(ortho);
  })

  .catch(function (error) {});

const country = new Style({
  stroke: new Stroke({
    color: "gray",
    width: 1,
  }),
  fill: new Fill({
    color: "rgba(20,20,20,0.9)",
  }),
});

//ASIG Layers
const protectedAreas = new Tile({
  source: new TileWMS({
    url: asigWmsService + "/akzm/wms",
    params: {
      LAYERS: "zonat_e_mbrojtura_natyrore_06042023",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Zonat e Mbrojtura",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const naturalMonuments = new Tile({
  source: new TileWMS({
    url: asigWmsService + "/akzm/wms",
    params: {
      LAYERS: "monumentet_natyrore_07032023",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Monumente Natyrore",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const roadNetwork = new Tile({
  source: new TileWMS({
    url: asigWmsService + "/instituti_transportiti/wms",
    params: {
      LAYERS: "infrastruktura_rrugore_utm",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Rrjeti Rrugor",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const albBorders = new Tile({
  source: new TileWMS({
    url: asigWmsUrl,
    params: {
      LAYERS: "rendi_1_kufi_shteteror",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Kufi Shteteror",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const albRegions = new Tile({
  source: new TileWMS({
    url: asigWmsUrl,
    params: {
      LAYERS: "rendi_2_kufi_qarku_vkm360",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Qark",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const municipalities = new Tile({
  source: new TileWMS({
    url: asigWmsUrl,
    params: {
      LAYERS: "rendi_3_kufi_bashki_vkm360_1",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Bashki",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

//Addresses System
const buildingsAdr = new Tile({
  source: new TileWMS({
    url: asigWmsService + "/adresar/wms",
    params: {
      LAYERS: "adr_ndertese",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Ndërtesa",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const enumerationAdr = new Tile({
  source: new TileWMS({
    url: asigWmsService + "/adresar/wms",
    params: {
      LAYERS: "adr_numertim",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Numërtim",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const roadsAdr = new Tile({
  source: new TileWMS({
    url: asigWmsService + "/adresar/wms",
    params: {
      LAYERS: "adr_rruge",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Rrugët",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

//EXTRA LAYER FOR CRUD
const wfsLayerUrl = `http://${host}:${port}/geoserver/${workspaceName}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=`;
const wfsLayerUrlEnd = "&maxFeatures=50&outputFormat=application/json";

let wfsVectorLayer, wfsVectorSource;

//LAYER GROUPS
baseLayerGroup = new LayerGroup({
  layers: [cartoDBBaseLayer, osmMap],
  title: "Base Layers",
  information:
    "Këto shtresa shtresat bazë të hartës të cilat mund të aktivizohen veç e veç",
  displayInLayerSwitcher: true,
});

const asigLayers = new LayerGroup({
  layers: [
    albBorders,
    albRegions,
    municipalities,
    protectedAreas,
    naturalMonuments,
    roadNetwork,
  ],
  title: "ASIG Layers",
  information:
    "Këto shtresa shtresat bazë të hartës të cilat mund të aktivizohen veç e veç",
  displayInLayerSwitcher: true,
});

const addressSystem = new LayerGroup({
  layers: [buildingsAdr, enumerationAdr, roadsAdr],
  title: "Sistemi i Adresave",
  information: "Sistemi i Adresave",
  displayInLayerSwitcher: true,
});

const center_4326 = [19.80835, 41.310824];
const center_3857 = [2206185.65, 5060810.15];
const saranda_center = [2226806.503832, 4847588.560703];
const tirana_center = [2226806.503832, 4847588.560703];

const map = new Map({
  target: "map",
  controls: defaults({ attribution: false }).extend(mapControls),
  layers: [baseLayerGroup, asigLayers, addressSystem],
  view: new View({
    projection: "EPSG:3857",
    center: center_3857,
    zoom: 14,
    maxZoom: 20,
  }),
});

// Creating vectorSource to store layers
const vectorSource = new VectorSource();

//DragRotate Interaction
const dragRotateInteraction = new DragRotate({
  condition: altKeyOnly,
});

map.addInteraction(dragRotateInteraction);

//__________________________________________________________________________________________
//GeoLocation Search
const geoSearch = new SearchNominatim({
  placeholder: "Kërko qytet/fshat...",
  collapsed: false,
  collapsible: false,
  url: "https://nominatim.openstreetmap.org/search?format=json&q={s}",
});

map.addControl(geoSearch);

geoSearch.on("select", function (event) {
  const selectedResultCoordinates = event.coordinate;

  // Create a temporary point feature
  const pointFeature = new Feature({
    geometry: new Point(selectedResultCoordinates),
  });

  // Add the point feature to a vector layer
  const vectorSource = new VectorSource({
    features: [pointFeature],
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: "red",
        }),
        stroke: new Stroke({
          color: "white",
          width: 2,
        }),
      }),
    }),
  });

  // Add the vector layer to the map
  map.addLayer(vectorLayer);
  // Remove the point feature after 1000 ms (1 second)
  setTimeout(() => {
    vectorSource.removeFeature(pointFeature);
  }, 2000);
  // Set the map view to the specified center coordinates and zoom level
  map.getView().setCenter(selectedResultCoordinates);
  map.getView().setZoom(12);
  calculateScale();

  geoSearch.clearHistory();
});

const searchBox = document.querySelector(".ol-search");

// searchBox.style.position = "absolute";
// searchBox.style.left = 0;
// searchBox.style.display = "flex";
// searchBox.style.flexDirection = "row";
// searchBox.style.flexWrap = "wrap";
// searchBox.style.width = "259px";
// searchBox.style.zIndex = 122;

// const searchWrapper = document.querySelector(".search-wrapper");

// searchWrapper.style.position = "relative";
// searchWrapper.style.zIndex = 1222;
// searchWrapper.style.top = "5px";
// searchWrapper.style.left = "5px";
// searchWrapper.style.width = "259px";
// searchWrapper.style.height = "100%";
// searchWrapper.style.display = "inline-block";

// searchWrapper.appendChild(searchBox);

//________________________________________________________________________________________________________
//Show/Hide graticule
const toggleButton = document.getElementById("graticuleButton");

const graticuleStyle = new Style({
  stroke: new Stroke({
    color: "rgba(128, 128, 128, 0.7)", // Grey color with 70% transparency
    width: 1.25, // Line width
  }),
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "#000", // Black text color
    }),
    stroke: new Stroke({
      color: "#fff", // White border around text
      width: 3,
    }),
    textAlign: "center", // Align text in the center
    offsetY: -10, // Adjusts text placement above the line
  }),
});

let graticuleControl;

toggleButton.addEventListener("click", function () {
  if (graticuleControl) {
    map.removeControl(graticuleControl);
    graticuleControl = undefined;
  } else {
    graticuleControl = new ol_control_Graticule({
      step: 10, // Distance between lines in degrees (longitude/latitude)
      stepCoord: 2, // Step for coordinates
      spacing: 120,
      projection: proj32634, // Set the projection (default is the map's projection)
      style: graticuleStyle,
      showLabel: true, // Show latitude/longitude labels
    });
    map.addControl(graticuleControl);
  }
});

//________________________________________________________________________________________________________
//Geolocation API
const geolocationButton = document.getElementById("getGeolocation");
let isTracking = false;
const geolocation = new Geolocation();
let currentPositionLayer;
const originalButtonHTML = geolocationButton.innerHTML;

geolocationButton.addEventListener("click", function () {
  if (isTracking) {
    stopGeolocationTracking();
  } else {
    startGeolocationTracking();
  }
});

function startGeolocationTracking() {
  const viewProjection = map.getView().getProjection();

  geolocation.setTrackingOptions({
    enableHighAccuracy: true,
  });

  geolocation.setProjection(viewProjection);

  const accuracyFeature = new Feature();
  geolocation.on("change:accuracyGeometry", function () {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  });

  const currentPositionFeature = new Feature();

  geolocation.on("change:position", function () {
    let currentPosition = geolocation.getPosition();
    map.getView().setCenter(currentPosition);
    map.getView().setZoom(18);

    currentPositionFeature.setGeometry(new Point(currentPosition));
    calculateScale();
  });

  // Trigger the geolocation to start tracking
  geolocation.setTracking(true);

  // Create a vector layer to display the current position
  currentPositionLayer = new VectorLayer({
    source: new VectorSource({
      features: [currentPositionFeature, accuracyFeature],
    }),
  });

  // Add the layer to the map
  map.addLayer(currentPositionLayer);

  // Update the tracking state
  isTracking = true;
  geolocationButton.textContent = "Stop Geolocation";
}

function stopGeolocationTracking() {
  // Stop the geolocation tracking
  geolocation.setTracking(false);

  // Remove the current position layer from the map
  map.removeLayer(currentPositionLayer);

  // Update the tracking state
  isTracking = false;
  geolocationButton.innerHTML = originalButtonHTML;
}

//_________________________________________________________________________________________
// Measure and show labels
const measureLine = document.getElementById("measure-length");
const measurePolygon = document.getElementById("measure-area");
const showSegments = document.getElementById("segments");
const clearPrevious = document.getElementById("clear");

const style = new Style({
  fill: new Fill({
    color: "rgba(255, 255, 255, 0.2)",
  }),
  stroke: new Stroke({
    color: "rgba(0, 0, 0, 0.5)",
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    //This is for circle style
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)",
    }),
  }),
});

const labelStyle = new Style({
  text: new Text({
    font: "14px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    padding: [3, 3, 3, 3],
    textBaseline: "bottom",
    offsetY: -15,
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
  }),
});

const tipStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15,
  }),
});

const modifyStyle = new Style({
  image: new CircleStyle({
    //This is for CircleStyle
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
  }),
  text: new Text({
    text: "Drag to modify",
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15,
  }),
});

const segmentStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
    padding: [2, 2, 2, 2],
    textBaseline: "bottom",
    offsetY: -12,
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
  }),
});

const segmentStyles = [segmentStyle];

const formatLength = function (line) {
  // const transformedLine = line.clone().transform(wgs84Proj, "EPSG:3857");
  // const length = getLength(transformedLine);
  const length = getLength(line, { projection: "EPSG:3857" });
  let output;
  if (length > 1000) {
    output = Math.round((length / 1000) * 100) / 100 + " km";
  } else {
    output = Math.round(length * 100) / 100 + " m";
  }
  return output;
};

const formatArea = function (polygon) {
  // const transformedPolygon = polygon.clone().transform(wgs84Proj, "EPSG:3857");
  // const area = getGeodesicArea(transformedPolygon);
  const area = getArea(polygon);
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + " km\xB2";
  } else {
    output = Math.round(area * 100) / 100 + " m\xB2";
  }
  return output;
};

const modify = new Modify({
  source: vectorSource,
  style: modifyStyle,
});

let tipPoint;

function styleFunction(feature, segments, drawType, tip) {
  const styles = [style];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type) {
    if (type === "Polygon") {
      point = geometry.getInteriorPoint();
      label = formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
    } else if (type === "LineString") {
      point = new Point(geometry.getLastCoordinate());
      label = formatLength(geometry);
      line = geometry;
    }
  }
  if (segments && line) {
    let count = 0;
    line.forEachSegment(function (a, b) {
      const segment = new LineString([a, b]);
      const label = formatLength(segment);
      if (segmentStyles.length - 1 < count) {
        segmentStyles.push(segmentStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    labelStyle.setGeometry(point);
    labelStyle.getText().setText(label);
    styles.push(labelStyle);
  }
  if (
    tip &&
    type === "Point" &&
    !modify.getOverlay().getSource().getFeatures().length
  ) {
    tipPoint = geometry;
    tipStyle.getText().setText(tip);
    styles.push(tipStyle);
  }
  return styles;
}

let drawLine;
let drawPoly;

//Measure Line
const drawnLineSource = new VectorSource();
measureLine.addEventListener("click", function () {
  map.removeInteraction(drawPoly);
  drawnPolygonSource.clear();
  const drawType = "LineString";
  const activeTip =
    "Click to continue drawing the " +
    (drawType === "Polygon" ? "polygon" : "line");
  const idleTip = "Click to start measuring";
  let tip = idleTip;
  drawLine = new Draw({
    source: vectorSource,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments.checked, drawType, tip);
    },
  });
  drawLine.on("drawstart", function () {
    map.un("click", getXYClickListener);
    map.un("click", getInfoClickListener);
    if (clearPrevious.checked) {
      vectorSource.clear();
      drawnLineSource.clear();
    }
    modify.setActive(false);
    tip = activeTip;
  });
  drawLine.on("drawend", function (event) {
    const drawnLine = event.feature;
    drawnLineSource.addFeature(drawnLine);
    modifyStyle.setGeometry(tipPoint);
    modify.setActive(true);
    map.once("pointermove", function () {
      modifyStyle.setGeometry();
    });
    tip = idleTip;
  });
  modify.setActive(true);
  map.addInteraction(drawLine);
});

// Create a vector layer for displaying the drawn polygons
const drawnLineLayer = new VectorLayer({
  title: "Measure Line ",
  source: drawnLineSource,
  style: styleFunction,
});
map.addLayer(drawnLineLayer);

//Measure Polygon
const drawnPolygonSource = new VectorSource();
measurePolygon.addEventListener("click", function () {
  map.removeInteraction(drawLine);
  drawnLineSource.clear();
  const drawType = "Polygon";
  const activeTip =
    "Click to continue drawing the " +
    (drawType === "Polygon" ? "polygon" : "line");
  const idleTip = "Click to start measuring";
  let tip = idleTip;
  drawPoly = new Draw({
    source: vectorSource,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments.checked, drawType, tip);
    },
  });

  drawPoly.on("drawstart", function () {
    map.un("click", getXYClickListener);
    map.un("click", getInfoClickListener);
    if (clearPrevious.checked) {
      vectorSource.clear();
      drawnPolygonSource.clear();
    }
    modify.setActive(false);
    tip = activeTip;
  });
  drawPoly.on("drawend", function (event) {
    const drawnPolygon = event.feature;
    drawnPolygonSource.addFeature(drawnPolygon);
    modifyStyle.setGeometry(tipPoint);
    modify.setActive(true);
    map.once("pointermove", function () {
      modifyStyle.setGeometry();
    });
    tip = idleTip;
  });
  modify.setActive(true);
  map.addInteraction(drawPoly);
});

// Create a vector layer for displaying the drawn polygons
const drawnPolygonLayer = new VectorLayer({
  title: "Measure Polygon",
  source: drawnPolygonSource,
  style: styleFunction,
  displayInLayerSwitcher: false,
});
map.addLayer(drawnPolygonLayer);

// The displayInLayerSwitcher function
const displayInLayerSwitcher = (layer) => {
  // Check if the layer has the displayInLayerSwitcher attribute and it's set to true
  return layer.get("displayInLayerSwitcher") === true;
};

//__________________________________________________________________________________________

// Customizing layer switcher functions
let layerGroupsArray = [asigLayers, addressSystem];

const onChangeCheck = function (evt) {
  const clickedLayer = evt;
  const parentLayerGroup = findParentLayerGroup(clickedLayer);

  if (parentLayerGroup && clickedLayer.getVisible()) {
    parentLayerGroup.setVisible(true);
  } else if (parentLayerGroup && hasVisibleSubLayer(parentLayerGroup)) {
    parentLayerGroup.setVisible(false);
  }

  // Check if the clicked layer is a base layer
  const baseLayer = clickedLayer.get("title") === "Base Layers";

  try {
    if (clickedLayer instanceof LayerGroup) {
      // If clicked layer is a LayerGroup
      const layers = clickedLayer.getLayers().getArray();
      layers.forEach((subLayer) => {
        if (!baseLayer && clickedLayer.getVisible()) {
          subLayer.setVisible(true);
        } else {
          subLayer.setVisible(false);
        }
      });
    } else {
      // If clicked layer is an individual layer (TileLayer, ImageLayer, etc.)
      if (!baseLayer && clickedLayer.getVisible()) {
        clickedLayer.setVisible(true);
      } else {
        clickedLayer.setVisible(false);
      }
    }
    addItemToLegend();
    addLayerToQuery();
  } catch (error) {}
};

function findParentLayerGroup(layer) {
  let parentLayerGroup = null;
  map.getLayers().forEach((group) => {
    if (group instanceof LayerGroup) {
      const layersInGroup = group.getLayers().getArray();
      if (layersInGroup.includes(layer)) {
        parentLayerGroup = group;
        return;
      }
    }
  });
  return parentLayerGroup;
}

// Function to check if at least one sub-layer within a layer group is visible
const hasVisibleSubLayer = function (layerGroup) {
  if (!(layerGroup instanceof LayerGroup)) {
    return false;
  }
  const layers = layerGroup.getLayers().getArray();
  let isAnySubLayerVisible = false;
  layers.forEach((subLayer) => {
    if (subLayer.getVisible()) {
      isAnySubLayerVisible = true;
    }
  });
  layerGroup.setVisible(isAnySubLayerVisible);
};

// Loop through each layer group and update its visibility
layerGroupsArray.forEach((layerGroup, index) => {
  hasVisibleSubLayer(layerGroup);
});

function logWMSLayerExtent(layerName) {
  const getCapabilitiesUrl =
    "http://localhost:8080/geoserver/test/wms?SERVICE=WMS&REQUEST=GetCapabilities";

  fetch(getCapabilitiesUrl)
    .then((response) => response.text())
    .then((text) => {
      const parser = new WMSCapabilities();
      const result = parser.read(text);
      const layers = result.Capability.Layer.Layer;
      const targetLayer = layers.find((l) => l.Name === layerName);

      if (!targetLayer) {
        console.warn(`Layer "${layerName}" not found in WMS capabilities.`);
        return;
      }

      if (targetLayer.BoundingBox && targetLayer.BoundingBox.length) {
        targetLayer.BoundingBox.forEach((bbox) => {
          if (bbox.crs === "EPSG:3857") {
            const [minx, miny, maxx, maxy] = bbox.extent;
            console.log(
              `CRS: ${bbox.crs}\n` +
                `  minx: ${minx}\n` +
                `  miny: ${miny}\n` +
                `  maxx: ${maxx}\n` +
                `  maxy: ${maxy}`
            );
            map.getView().fit([minx, miny, maxx, maxy], {
              padding: [20, 20, 20, 20],
              duration: 500,
              maxZoom: 18,
            });
          }
        });
      } else {
        console.log("No BoundingBox entries found.");
      }
    })
    .catch((error) => {
      console.error("Error reading WMS capabilities:", error);
    });
}

const layerSwitcher = new LayerSwitcher({
  displayInLayerSwitcher: displayInLayerSwitcher,
  trash: true,
  onchangeCheck: onChangeCheck,
  show_proress: true,
  mouseover: true,
  collapsed: false,
  extent: true,
  noScroll: false,
  selection: true,
  oninfo: (e) => {
    const fullLayerName = e.values_.source.getParams().LAYERS;
    const layerNameOnly = fullLayerName.split(":").pop();
    logWMSLayerExtent(layerNameOnly);
  },
});

map.addControl(layerSwitcher);

const treePanelHeader = document.createElement("header");
treePanelHeader.innerHTML = "PANELI I SHTRESAVE";

layerSwitcher.setHeader(treePanelHeader);

// Position the LayerSwitcherImage control on the top-right corner of the map
const layerSwitcherElement = layerSwitcher.element;
layerSwitcherElement.style.position = "absolute";
layerSwitcherElement.style.top = "50px";
layerSwitcherElement.style.right = "10px";

//_____________________________________________________________________________________________
// Display data from WMS Layer
// identify button
// ——————————————————————————————
//  CONFIG & DOM HOOKS
// ——————————————————————————————
const identifyBtn = document.getElementById("identify");
const identifyModeSelect = document.getElementById("identifyMode");
const container = document.querySelector(".form-container");
const maxProperties = 10;

// keep track of current mode ("all" or "top")
let currentMode = null;

// when you switch off identify, you may want to clear the form
function clearResults() {
  container.innerHTML = "";
  container.style.display = "none";
}

// ——————————————————————————————
//  MODE SELECTION & MAP LISTENERS
// ——————————————————————————————

// 1) clicking the button toggles the dropdown
identifyBtn.addEventListener("click", () => {
  // hide any old form-results
  clearResults();

  // show/hide the select
  identifyModeSelect.style.display =
    identifyModeSelect.style.display === "block" ? "none" : "block";
});

// 2) when the user picks a mode…
identifyModeSelect.addEventListener("change", () => {
  currentMode = identifyModeSelect.value; // "all" or "top"
  identifyModeSelect.style.display = "none"; // hide dropdown

  // tear down any other map click handlers you had
  map.un("click", getXYClickListener);

  // remove any drawing interactions or layers
  map.removeInteraction(drawPoly);
  map.removeInteraction(drawLine);
  map.removeLayer(drawnLineLayer);
  map.removeLayer(drawnPolygonLayer);

  // attach our identify handler
  map.on("click", getInfoClickListener);
});

// ——————————————————————————————
//  IDENTIFY HANDLER
// ——————————————————————————————

function getInfoClickListener(evt) {
  getInfo(evt);
}

let lastClickCoord = null;

async function getInfo(evt) {
  lastClickCoord = map.getCoordinateFromPixel(evt.pixel);

  // build list of visible layers (starting at group index 2)
  const visibleLayers = [];
  for (let i = 2; i < layerGroupsArray.length; i++) {
    visibleLayers.push(
      ...layerGroupsArray[i]
        .getLayers()
        .getArray()
        .filter((l) => l.getVisible())
        .reverse()
    );
  }

  if (!visibleLayers.length) {
    clearResults();
    return;
  }

  if (currentMode === "top") {
    for (const layer of visibleLayers) {
      const url = layer
        .getSource()
        .getFeatureInfoUrl(
          lastClickCoord,
          map.getView().getResolution(),
          map.getView().getProjection(),
          { INFO_FORMAT: "application/json" }
        );
      if (!url) continue;
      try {
        const json = await fetch(url).then((r) => r.json());
        const feats = json.features || [];
        if (feats.length > 0) {
          // found the topmost layer that has features here:
          container.innerHTML = "";
          feats.forEach((f) => renderFeatureBlock({ layer, feature: f }));
          container.style.display = "block";
          return; // stop scanning further
        }
      } catch (_) {
        // on error, just move to the next layer
      }
    }
    // if we get here, no layers had features
    clearResults();
  } else {
    // "all" mode: fire *all* requests in parallel
    const params = {
      INFO_FORMAT: "application/json",
      FEATURE_COUNT: 10, // ← ask GeoServer to return up to 10 features
    };
    const featureCount = 10;
    const promises = visibleLayers.map((layer) => {
      const url = layer
        .getSource()
        .getFeatureInfoUrl(
          lastClickCoord,
          map.getView().getResolution(),
          map.getView().getProjection(),
          params
        );
      if (!url) return Promise.resolve({ layer, features: [] });
      return fetch(url)
        .then((r) => r.json())
        .then((json) => ({ layer, features: json.features || [] }))
        .catch(() => ({ layer, features: [] }));
    });

    // when *all* are done...
    Promise.all(promises).then((results) => {
      const hits = results.flatMap(({ layer, features }) =>
        features.map((f) => ({ layer, feature: f }))
      );

      if (!hits.length) {
        clearResults();
        return;
      }

      // render all hits
      container.innerHTML = "";
      hits.forEach(renderFeatureBlock);
      container.style.display = "block";
    });
  }
}

// helper to query one layer (for top-only mode)
function queryLayer(layer) {
  const coordinate =
    lastClickCoord || map.getEventCoordinate(evt.originalEvent);
  const url = layer
    .getSource()
    .getFeatureInfoUrl(
      coordinate,
      map.getView().getResolution(),
      map.getView().getProjection(),
      { INFO_FORMAT: "application/json" }
    );
  if (!url) {
    clearResults();
    return;
  }
  fetch(url)
    .then((r) => r.json())
    .then((json) => {
      const feats = json.features || [];
      if (!feats.length) {
        clearResults();
        return;
      }
      container.innerHTML = "";
      feats.forEach((f) => renderFeatureBlock({ layer, feature: f }));
      container.style.display = "block";
    })
    .catch(() => clearResults());
}

// builds one “form‐block” for a layer/feature
function renderFeatureBlock({ layer, feature }) {
  const props = feature.properties || {};

  const formEl = document.createElement("div");
  formEl.className = "form-container-el";

  // header
  const hdr = document.createElement("div");
  hdr.className = "form-header";
  hdr.innerHTML = `Layer: <b>${layer.get("title") || layer.get("name")}</b>`;
  formEl.appendChild(hdr);
  formEl.appendChild(document.createElement("hr"));

  // properties
  const labels = document.createElement("div");
  const inputs = document.createElement("div");
  labels.style.display = inputs.style.display = "flex";
  labels.style.flexDirection = inputs.style.flexDirection = "column";

  Object.keys(props)
    .slice(0, maxProperties)
    .forEach((key) => {
      const lbl = document.createElement("label");
      lbl.textContent = key;
      labels.appendChild(lbl);

      const inp = document.createElement("input");
      inp.readOnly = true;
      inp.value = props[key];
      inputs.appendChild(inp);
    });

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.append(labels, inputs);
  formEl.appendChild(wrapper);

  container.appendChild(formEl);
}

// assume you still have getXYClickListener defined elsewhere
function getXYClickListener(evt) {
  getXY(evt);
}

//_______________________________________________________________
//MORE RIGHT/LEFT BUTTONS
const rightBtn = document.getElementById("move-right");
const leftBtn = document.getElementById("move-left");

function moveButton(value1, value2, value3) {
  const currentCenter = map.getView().getCenter();

  if (map.getView().getZoom() < 5) {
    // Calculate the new center by moving 1000 meters to the right (east)
    const newCenter = [currentCenter[0] + value1, currentCenter[1]];
    // Set the new center to the map view
    map.getView().setCenter(newCenter);
  } else if (map.getView().getZoom() >= 5 && map.getView().getZoom() < 10) {
    // Calculate the new center by moving 1000 meters to the right (east)
    const newCenter = [currentCenter[0] + value2, currentCenter[1]];
    // Set the new center to the map view
    map.getView().setCenter(newCenter);
  } else if (map.getView().getZoom() >= 10) {
    // Calculate the new center by moving 1000 meters to the right (east)
    const newCenter = [currentCenter[0] + value3, currentCenter[1]];
    // Set the new center to the map view
    map.getView().setCenter(newCenter);
  }
}

rightBtn.addEventListener("click", function () {
  moveButton(100000, 10000, 100);
});

leftBtn.addEventListener("click", function () {
  moveButton(-100000, -10000, -100);
});

//ZOOM-IN/OUT BUTTONS
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");

function zoomFunc(value) {
  const view = map.getView();
  const currentZoom = view.getZoom();
  const newZoom = currentZoom + value;
  view.setZoom(newZoom);
  calculateScale();
}

zoomInBtn.addEventListener("click", function () {
  zoomFunc(1);
});
zoomOutBtn.addEventListener("click", function () {
  zoomFunc(-1);
});

//GET XY COORDINATES
const getXYCoordsBtn = document.getElementById("coords");
const coordsModal = document.getElementById("myModal");
const closeModal = document.getElementsByClassName("close")[0];

function decimalToDMS(decimal) {
  const degrees = Math.floor(decimal);
  const minutesDecimal = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;
  return degrees + "° " + minutes + "' " + seconds.toFixed(2) + "''";
}

function getXY(event) {
  const mapCoords = event.coordinate;
  const mapProj = map.getView().getProjection();

  const krgjshCoords = transform(mapCoords, mapProj, "EPSG:6870");
  const utm34NCoords = transform(mapCoords, mapProj, "EPSG:32634");
  const wgs84Coords = transform(mapCoords, mapProj, "EPSG:4326");

  //WGS84 Decimal
  const [decimalLon, decimalLat] = wgs84Coords;
  //DSM
  const latitudeDMS = decimalToDMS(wgs84Coords[0]);
  const longitudeDMS = decimalToDMS(wgs84Coords[1]);
  //UTM Zone 34N

  // Write out all four representations:
  document.getElementById("decimalLon").textContent = decimalLon.toFixed(6);
  document.getElementById("decimalLat").textContent = decimalLat.toFixed(6);
  document.getElementById("easting").textContent = krgjshCoords[0].toFixed(2);
  document.getElementById("northing").textContent = krgjshCoords[1].toFixed(2);
  document.getElementById("easting1").textContent = latitudeDMS;
  document.getElementById("northing1").textContent = longitudeDMS;
  document.getElementById("easting2").textContent = utm34NCoords[0].toFixed(2);
  document.getElementById("northing2").textContent = utm34NCoords[1].toFixed(2);
  // Show the modal
  coordsModal.style.display = "block";
  // });
}

closeModal.addEventListener("click", function () {
  coordsModal.style.display = "none";
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == coordsModal) {
    coordsModal.style.display = "none";
  }
};
getXYCoordsBtn.addEventListener("click", function () {
  map.removeInteraction(drawPoly);
  map.removeInteraction(drawLine);
  map.removeLayer(drawnLineLayer);
  map.removeLayer(drawnPolygonLayer);

  const formContainer = document.querySelector(".form-container");
  formContainer.style.display = "none";
  map.un("click", getInfoClickListener);
  map.on("click", getXYClickListener);
});

//EXACT SCALE VALUES

// function calculateScale() {
//   const view = map.getView();

//   const mmPerInch = 25.4; // 1 inch = 25.4 mm
//   const mmPerPixel = 0.2645833333; // 1 pixel = 0.2645833333 mm (96 DPI)
//   const inchesPerMeter = 39.37007874015748;
//   const dpi = mmPerInch / mmPerPixel;
//   const metersPerUnit = view.getProjection().getMetersPerUnit();
//   const resolution = view.getResolution();
//   const center = view.getCenter();
//   const projection = view.getProjection();
//   const meterPerMapUnit = projection.getMetersPerUnit();
//   const mapWidth = map.getTargetElement().clientWidth;
//   const mapWidthMeters = resolution * mapWidth * meterPerMapUnit;
//   const scale = resolution * meterPerMapUnit * inchesPerMeter * dpi;
//   const scaleInput = document.getElementById("scaleInput");
//   scaleInput.value = "1:" + scale.toFixed(0);
// }

// function setMapScale() {
//   const inputElement = document.getElementById("scaleInput");
//   const scaleValue = inputElement.value.trim();

//   const scaleRegex = /^1:(\d+)$/;
//   const scaleMatch = scaleValue.match(scaleRegex);

//   if (scaleMatch) {
//     const scaleNumber = parseInt(scaleMatch[1]);
//     const projection = map.getView().getProjection();
//     const meterPerMapUnit = projection.getMetersPerUnit();
//     const view = map.getView();
//     const mmPerInch = 25.4; // 1 inch = 25.4 mm
//     const mmPerPixel = 0.2645833333; // 1 pixel = 0.2645833333 mm (96 DPI)
//     const inchesPerMeter = 39.37007874015748;
//     const dpi = mmPerInch / mmPerPixel;
//     const resolution = scaleNumber / (inchesPerMeter * dpi * meterPerMapUnit);
//     view.setResolution(resolution);
//   } else {
//     console.error("Invalid scale format. Please use the format '1:xxxxx'.");
//   }
// }

//GEOSERVER VALUES

// —————————————————————————————————————————————————————————————
// Converts an OL resolution → GeoServer scale‐denominator
function resolutionToGeoServerScale(resolution, view) {
  const mmPerInch = 25.4; // mm in an inch
  const mmPerPixel = 0.28; // GeoServer: 0.28 mm per pixel
  const dpi = mmPerInch / mmPerPixel; // ≈ 90.714 dpi
  const inchesPerMeter = 39.37007874015748; // inches in a meter
  const metersPerUnit = view.getProjection().getMetersPerUnit();

  return resolution * metersPerUnit * inchesPerMeter * dpi;
}

// Converts a GeoServer scale‐denominator → OL resolution
function geoServerScaleToResolution(scaleDenominator, view) {
  const mmPerInch = 25.4;
  const mmPerPixel = 0.28;
  const dpi = mmPerInch / mmPerPixel;
  const inchesPerMeter = 39.37007874015748;
  const metersPerUnit = view.getProjection().getMetersPerUnit();

  return scaleDenominator / (metersPerUnit * inchesPerMeter * dpi);
}

// —————————————————————————————————————————————————————————————
// Write the current GeoServer‐aligned scale into the input
function calculateScale() {
  const view = map.getView();
  const resolution = view.getResolution();
  const scaleDen = resolutionToGeoServerScale(resolution, view);
  document.getElementById("scaleInput").value = "1:" + Math.round(scaleDen);
}

// Read “1:xxxxx” and set the view to the exact GeoServer resolution
function setMapScale() {
  const raw = document.getElementById("scaleInput").value.trim();
  const m = raw.match(/^1:(\d+(?:\.\d+)?)$/);
  if (!m) {
    console.error("Invalid scale format. Use 1:12345");
    return;
  }

  const scaleDen = parseFloat(m[1]);
  const view = map.getView();
  const res = geoServerScaleToResolution(scaleDen, view);
  view.setResolution(res);
}

// Add event listener to the input field to set the map scale
const inputElement = document.getElementById("scaleInput");
inputElement.addEventListener("keyup", function (event) {
  if (event.key === "Enter") {
    setMapScale();
  }
});

// Add event listener to the map view to update scale on change
const view = map.getView();
view.on("change", function () {
  calculateScale();
});

calculateScale();

//PRINT CONTROL

map.addControl(new CanvasAttribution({ canvas: true }));
// Add a title control
map.addControl(
  new CanvasTitle({
    title: "my title",
    visible: false,
    style: new Style({
      text: new Text({
        font: '20px "Lucida Grande",Verdana,Geneva,Lucida,Arial,Helvetica,sans-serif',
      }),
    }),
  })
);
// // Add a ScaleLine control
map.addControl(new CanvasScaleLine());

// Print control
const printControl = new PrintDialog({
  immediate: true,
  collapsed: false,
});
printControl.setSize("A4");
printControl.setOrientation("landscape");
printControl.setMargin("5");

printControl.element.click();

map.addControl(printControl);
printControl.on(["print", "error"], function (e) {
  // Print success
  if (e.image) {
    if (e.pdf) {
      // Export pdf using the print info
      var pdf = new jsPDF({
        orientation: e.print.orientation,
        unit: e.print.unit,
        format: e.print.size,
      });
      pdf.addImage(
        e.image,
        "JPEG",
        e.print.position[0],
        e.print.position[0],
        e.print.imageWidth,
        e.print.imageHeight
      );
      pdf.save(e.print.legend ? "legend.pdf" : "map.pdf");
    } else {
      // Save image as file
      e.canvas.toBlob(
        function (blob) {
          var name =
            (e.print.legend ? "legend." : "map.") +
            e.imageType.replace("image/", "");
          saveAs(blob, name);
        },
        e.imageType,
        e.quality
      );
    }
  } else {
    console.warn("No canvas to export");
  }
});

// // Select the .ol-print button
const olPrintButton = document.querySelector(".ol-print");

// Select the container where you want to append the button (assuming it's .buttons)
const buttonsContainer = document.querySelector("#printContent");

const olPrintButtonEl = document.querySelector(".ol-print button");

olPrintButtonEl.style.display = "inline";
olPrintButtonEl.style.width = "100%";
olPrintButtonEl.style.height = "100%";
olPrintButtonEl.style.margin = 0;
olPrintButtonEl.style.opacity = 0;

olPrintButton.style.display = "inline";
olPrintButton.style.position = "absolute";
olPrintButton.style.top = "-4px";
olPrintButton.style.left = 0;
olPrintButton.style.bottom = 0;
olPrintButton.style.right = 0;
olPrintButton.style.width = "100%";
olPrintButton.style.height = "100%";

// Append the olPrintButton to the buttonsContainer
buttonsContainer.appendChild(olPrintButton);

//QUERY SELECTOR
async function fetchAndExtractKeys(layerURL) {
  const uniqueValuesMap = {};
  try {
    const response = await fetch(layerURL);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const features = data.features;
    features.forEach((feature) => {
      const properties = feature.properties;
      for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
          if (!uniqueValuesMap[key]) {
            uniqueValuesMap[key] = new Set();
          }
          uniqueValuesMap[key].add(properties[key]);
        }
      }
    });
    return uniqueValuesMap;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return null;
  }
}

let uniqueValuesMap;

async function getFields() {
  fieldSelect.innerHTML = "";
  attributeSelect.innerHTML = "";
  let fields = [];
  const selectedLayerIndex = parseInt(layerSelect.value);
  const selectedLayer = layersArray[selectedLayerIndex];
  if (selectedLayer) {
    uniqueValuesMap = await fetchAndExtractKeys(layerWFS);
  }

  if (uniqueValuesMap) {
    const allKeys = Object.keys(uniqueValuesMap);
    const filteredKeys = allKeys.filter((key) => key !== "geometry");

    filteredKeys.forEach((key) => {
      fields.push(key);
    });

    fields.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      fieldSelect.appendChild(option);
    });
  }
}

// Populate the dropdown with layer names
const layerSelect = document.getElementById("layerSelect");

function addLayerToQuery() {
  layerSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer...";
  layerSelect.appendChild(defaultOption);
  layersArray.forEach((wmsLayer, index) => {
    if (wmsLayer.getVisible()) {
      const layerToAdd = layersArray[index];
      const option = document.createElement("option");
      option.value = index;
      option.text = layerToAdd.get("title");
      layerSelect.appendChild(option);
    }
  });
}
let layerWFS;
// Event listener for layer selection change
layerSelect.addEventListener("change", function () {
  const selectedIndex = this.value;
  const selectedLayer = layersArray[selectedIndex];
  const selectedLayerSource = selectedLayer.getSource();
  const layerParams = selectedLayerSource.getParams().LAYERS;
  layerWFS = `http://${host}:${port}/geoserver/${workspaceName}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=${layerParams}&outputFormat=json`;
  getFields();
  getAttributeValues();
  updateOperatorOptions();
});

// Function to log layer attributes to the console
const fieldSelect = document.getElementById("fieldSelect");
const attributeSelect = document.getElementById("attributeSelect");
const operatorSelect = document.getElementById("operator");

operatorSelect.addEventListener("change", () => {
  const selectedField = fieldSelect.value;
  getAttributeValues(selectedField);
});

const greaterThanOption = document.querySelector('option[value=">"]');
const lessThanOption = document.querySelector('option[value="<"]');
const equalOption = document.querySelector('option[value="="]');
const likeOption = document.querySelector('option[value="LIKE"]');

async function getAttributeValues() {
  const selectedField = fieldSelect.value;
  const selectedOperator = operatorSelect.value;

  // Get the attribute input element
  const attributeInput = document.getElementById("attributeInput");
  if (attributeInput) {
    attributeInput.remove(); // Remove existing input field
  }

  if (
    selectedOperator === "LIKE" ||
    selectedOperator === ">" ||
    selectedOperator === "<"
  ) {
    // Create and display an input field for attribute value
    const input = document.createElement("input");
    input.type = "text";
    input.id = "attributeInput";
    input.placeholder = "Enter a value";
    attributeSelect.style.display = "none"; // Hide the select field
    attributeSelect.parentNode.insertBefore(input, attributeSelect); // Insert the input field
  } else {
    // Display the select field for attribute value
    attributeSelect.style.display = "block";
    attributeSelect.innerHTML = "";
    const uniqueValuesSet = uniqueValuesMap
      ? uniqueValuesMap[selectedField]
      : null;
    if (uniqueValuesSet) {
      const uniqueValuesArray = Array.from(uniqueValuesSet);

      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "";
      attributeSelect.appendChild(emptyOption);

      uniqueValuesArray.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        attributeSelect.appendChild(option);
      });
    }
  }
}

// Event listener for field selection change
fieldSelect.addEventListener("change", function () {
  const selectedField = fieldSelect.value;
  getAttributeValues(selectedField);
  updateOperatorOptions();
});

const filterCQL = function () {
  const selectedLayerIndex = parseInt(layerSelect.value);
  const selectedLayer = layersArray[selectedLayerIndex];
  console.log(selectedLayer);
  // Check if the attribute select dropdown is hidden (number field)
  const attributeInput = document.getElementById("attributeInput");
  let targetSource = selectedLayer.getSource();

  if (targetSource) {
    const params = targetSource.getParams();
    console.log(params);
    const selectedField = fieldSelect.value;
    const selectedOperator = operatorSelect.value;
    let selectedAttribute;

    if (attributeInput) {
      selectedAttribute = attributeInput.value.toUpperCase();

      const CQLFilter =
        selectedField + " " + selectedOperator + " '" + selectedAttribute + "'";

      params.CQL_FILTER = CQLFilter;
    } else {
      selectedAttribute = attributeSelect.value;

      const CQLFilter =
        selectedField + " " + selectedOperator + " '" + selectedAttribute + "'";

      params.CQL_FILTER = CQLFilter;
    }
    console.log("CQL Filter:", params.CQL_FILTER);

    console.log(targetSource, selectedAttribute);
    targetSource.updateParams(params);
  }
};

const resetFilter = function () {
  const selectedLayerIndex = parseInt(layerSelect.value);
  const selectedLayer = layersArray[selectedLayerIndex];

  if (selectedLayer) {
    const targetSource = selectedLayer.getSource();

    if (targetSource) {
      const params = targetSource.getParams();
      delete params.CQL_FILTER;
      targetSource.updateParams(params);
    }
  }
};

// Function to check if a field's attributes are numeric
function areAttributesNumeric(selectedField) {
  if (!selectedField || !uniqueValuesMap[selectedField]) {
    return false;
  }
  const uniqueValuesSet = uniqueValuesMap[selectedField];
  for (const value of uniqueValuesSet) {
    if (isNaN(parseFloat(value))) {
      return false;
    }
  }
  return true;
}

// Update operator options based on selected field
function updateOperatorOptions() {
  const selectedField = fieldSelect.value;
  greaterThanOption.disabled = !areAttributesNumeric(selectedField);
  lessThanOption.disabled = !areAttributesNumeric(selectedField);
  likeOption.disabled = areAttributesNumeric(selectedField);
}

// Event listener for field selection change
fieldSelect.addEventListener("change", function () {
  updateOperatorOptions();
  getAttributeValues();
});

const selectControlBtn = document.querySelector("#selectControlButton");
const selectControlForm = document.querySelector(".selectControl");

selectControlBtn.addEventListener("click", () => {
  selectControlForm.hidden = !selectControlForm.hidden;
  addLayerToQuery();
  getFields();
});

const sumbmitBtn = document.getElementById("sumbmitBtn");
const resetBtn = document.getElementById("resetBtn");

sumbmitBtn.addEventListener("click", (e) => {
  e.preventDefault();
  filterCQL();
});

resetBtn.addEventListener("click", (e) => {
  e.preventDefault();
  resetFilter();
});

//Drag Query Selector
const selectLayerControl = document.getElementById("selectControl");
dragElement(selectLayerControl);

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    if (e.target.tagName !== "SELECT" && e.target.tagName !== "INPUT") {
      e.preventDefault();
    }

    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

//WFS CRUD
let layerType,
  vectorLayer,
  source,
  layerName,
  formattedCoordinates,
  workspace,
  body,
  geometryType,
  featureIDvalue,
  draw,
  layerTitle,
  selectedLayer,
  layerGroup,
  layerParam,
  features,
  workspacePart,
  namePart;
const selectControl = new ol_control_Select({
  source: null, // Set initially to null
  className: "ol-select",
});

layerSwitcher.on("select", (e) => {
  map.removeInteraction(draw);
  selectedLayer = e.layer;

  // logWMSLayerExtent(namePart);
  if (selectedLayer instanceof LayerGroup) {
    //do nothing
  } else if (selectedLayer instanceof ImageLayer) {
    //Share WMS Layer URL
    // console.log(selectedLayer);
    // console.log(selectedLayer.getSource().getUrl());
    // const opacity = selectedLayer.getOpacity();
    // console.log("Layer opacity:", opacity);
    // console.log(selectedLayer.getSource().loaderProjection_.code_);
    // console.log(selectedLayer.getSource().getLegendUrl());
    const params = selectedLayer.getSource().getParams().LAYERS;
    const parts = params.split(":");
    namePart = parts[1];
    workspacePart = parts[0];
    console.log(namePart, workspacePart);

    layerTitle = selectedLayer.get("title");
    console.log("Selected Image Layer:", layerTitle);

    layerParam = selectedLayer.getSource().getParams().LAYERS;
    function getLayerGroup(layer) {
      map.getLayers().forEach(function (groupLayer) {
        if (groupLayer instanceof LayerGroup) {
          if (groupLayer.getLayers().getArray().includes(layer)) {
            layerGroup = groupLayer;
          }
        }
      });
      return layerGroup;
    }
    const selectedLayerGroup = getLayerGroup(selectedLayer);
  } else {
    layerTitle = selectedLayer.get("title");
    source = selectedLayer.getSource();
    console.log(source.params_);

    // features = source.getFeatures();
    const url = source.getUrl();

    console.log(url);
    vectorLayer = selectedLayer;
    const urlParts = new URL(url);
    console.log(urlParts);
    layerParam = urlParts.searchParams.get("typeName");

    [workspace, layerName] = layerParam.split(":");
    // const workspace = urlParts.pathname.split("/")[2];

    // Construct the URL for DescribeFeatureType request
    const describeFeatureTypeUrl = `http://${host}:${port}/geoserver/${workspace}/ows?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=${layerParam}`;

    // Make an AJAX request to GeoServer
    fetch(describeFeatureTypeUrl)
      .then((response) => response.text())
      .then((data) => {
        console.log(data);

        const parser = new DOMParser();
        const doc = parser.parseFromString(data, "text/xml");

        // Get all 'xsd:element' elements in the XML schema
        const elementNodes = doc.getElementsByTagName("xsd:element");

        // Loop through each 'xsd:element' to find the one with name="geom"
        for (let i = 0; i < elementNodes.length; i++) {
          const element = elementNodes[i];
          const nameAttribute = element.getAttribute("name");

          if (nameAttribute === "geom") {
            // 'geom' element found, extract its 'type' attribute
            const typeAttribute = element.getAttribute("type");
            const [, typeName] = typeAttribute.split(":");

            console.log(typeName);
            // Log the type name
            geometryType = typeName;
            if (
              geometryType === "PointPropertyType" ||
              geometryType === "MultiPointPropertyType"
            ) {
              layerType = "Point";
            } else if (
              geometryType === "GeometryPropertyType" ||
              geometryType === "MultiPolygonPropertyType" ||
              geometryType === "SurfacePropertyType"
            ) {
              layerType = "Polygon";
            } else if (
              geometryType === "MultiLineStringPropertyType" ||
              geometryType === "LineStringPropertyType"
            ) {
              layerType = "LineString";
            }
            console.log("Layer Param: ", layerParam);
            console.log("Layer Name: ", layerName);
            console.log("Workspace: ", workspace);
            console.log("Geometry Type: ", geometryType);
            console.log("Geometry (layertype):", layerType);
            console.log("Vector Layer: ", vectorLayer);
            console.log("Vector Source: ", source);
            selectControl.setSources(source);
            console.log(url);
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching DescribeFeatureType:", error);
      });
  }
});

// Create a new overlay
const popup = new Overlay({
  element: document.getElementById("popup"),
  positioning: "bottom-center",
});
map.addOverlay(popup);

//ADD and MANAGE LEGEND
let legend, newItem, clickedLayer;

const manageLegendItems = (layer) => {
  if (layer instanceof LayerGroup) {
    const layers = layer.getLayers().getArray();
    layers.forEach((subLayer) => {
      if (subLayer.getVisible()) {
        newItem = {
          title: subLayer.get("title"),
          typeGeom: "Point",
          style: new Style({
            image: new Icon({
              src: subLayer.getSource().getLegendUrl(),
              crossOrigin: "anonymous",
            }),
          }),
        };
        legend.addItem(newItem);
      }
    });
  } else if (layer instanceof TileLayer) {
    if (layer.getVisible()) {
      newItem = {
        title: layer.get("title"),
        typeGeom: "Point",
        style: new Style({
          image: new Icon({
            src: layer.getSource().getLegendUrl(),
            crossOrigin: "anonymous",
          }),
        }),
      };
      legend.addItem(newItem);
    }
  }
};

legend = new ol_legend_Legend({
  title: "Legjenda",
  items: [manageLegendItems()],
});
// Legend
const legendCtrl = new ol_control_Legend({
  title: "Legend",
  margin: 10,
  legend: legend,
});

map.addControl(legendCtrl);

const addItemToLegend = () => {
  legend.getItems().clear();
  layerGroupsArray.forEach((layerGroup) => {
    if (
      layerGroup.get("title") !== "ASIG Layers" &&
      layerGroup.get("title") !== "Sistemi i Adresave"
    ) {
      manageLegendItems(layerGroup);
    }
  });
};

addItemToLegend();

// DISPLAY CHART
const exportPDFButton = document.getElementById("exportPDF");
let selectedLayerInChart,
  link,
  myChart,
  selectedChartType = "bar";

const selectLayer = () => {
  const layerLabelElement = document.createElement("label");
  layerLabelElement.id = "layerDropdownLabel";
  layerLabelElement.textContent = "Layer:";
  document.body.appendChild(layerLabelElement);

  const layerDropdown = document.createElement("select");
  layerDropdown.id = "layerDropdown";

  document.body.appendChild(layerDropdown);

  layerDropdown.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer";
  layerDropdown.appendChild(defaultOption);

  layersArray.forEach((layer) => {
    const option = document.createElement("option");
    option.value = layer.getSource().getParams().LAYERS;
    option.text = option.value; // Use layer name as option text
    layerDropdown.appendChild(option);
  });

  // Event listener for layer selection
  layerDropdown.addEventListener("change", function (event) {
    selectedLayerInChart = event.target.value;

    // Update the link based on the selected layer
    link = `http://${host}:${port}/geoserver/${workspaceName}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${selectedLayerInChart}&maxFeatures=500&outputFormat=application/json`;

    // Generate chart and dropdowns for X-Axis and Y-Axis
    generateChart();
  });
};

const generateChart = () => {
  // Create label for X-Axis dropdown
  const xAxisLabelElement = document.createElement("label");
  xAxisLabelElement.id = "xAxisLabel";
  xAxisLabelElement.textContent = "X-Axis:";
  document.body.appendChild(xAxisLabelElement);

  // Create dropdown for X-Axis
  const xAxisDropdown = document.createElement("select");
  xAxisDropdown.id = "xAxisDropdown";
  document.body.appendChild(xAxisDropdown);

  // Create label for Y-Axis dropdown
  const yAxisLabelElement = document.createElement("label");
  yAxisLabelElement.id = "yAxisLabel";
  yAxisLabelElement.textContent = "Y-Axis:";
  document.body.appendChild(yAxisLabelElement);

  // Create dropdown for Y-Axis
  const yAxisDropdown = document.createElement("select");
  yAxisDropdown.id = "yAxisDropdown";
  document.body.appendChild(yAxisDropdown);

  const chartTypes = ["bar", "line", "radar", "polarArea"];

  const chartTypeLabel = document.createElement("label");
  chartTypeLabel.textContent = "Chart Type:";
  document.body.appendChild(chartTypeLabel);

  const chartTypeDropdown = document.createElement("select");
  chartTypeDropdown.id = "chartTypeDropdown";
  document.body.appendChild(chartTypeDropdown);

  chartTypes.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.text = type;
    chartTypeDropdown.appendChild(option);
  });

  chartTypeDropdown.addEventListener("change", (e) => {
    selectedChartType = e.target.value;
  });

  const submitButton = document.createElement("button");
  submitButton.id = "submit-chart";
  submitButton.textContent = "Submit";
  document.body.appendChild(submitButton);

  submitButton.addEventListener("click", () => {
    const selectedXAxis = xAxisDropdown.value;
    const selectedYAxis = yAxisDropdown.value;
    fetch(link)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        const features = data.features;
        if (myChart) {
          myChart.destroy(); // Destroy existing chart if it exists
        }
        generateChartWithAxes(features, selectedXAxis, selectedYAxis);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  });

  fetch(link)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const features = data.features;
      // Populate dropdown for X-Axis with property names
      console.log(features);
      const xAxisProperties = Object.keys(features[0].properties);
      xAxisProperties.forEach((property) => {
        const option = document.createElement("option");
        option.value = property;
        option.text = property;
        xAxisDropdown.appendChild(option);
      });

      const yAxisProperties = Object.keys(features[0].properties);
      yAxisProperties.forEach((property) => {
        const option = document.createElement("option");
        option.value = property;
        option.text = property;
        yAxisDropdown.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
};

const generateChartWithAxes = (features, xAxisProperty, yAxisProperty) => {
  const canvas = document.createElement("canvas");
  canvas.id = "myChart";
  document.body.appendChild(canvas);

  const ctx = document.getElementById("myChart");

  const labels = features.map((feature) => feature.properties[xAxisProperty]);
  const dataValues = features.map(
    (feature) => feature.properties[yAxisProperty]
  );

  const config = {
    type: selectedChartType,
    data: {
      labels: labels,
      datasets: [
        {
          label: "Value",
          data: dataValues,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };
  myChart = new Chart(ctx, config);
};

// ___________________________________________________________________________________________________________

// ________________________________________________________________________

// map.on("singleclick", function (event) {
//   const coordinate = event.coordinate;
//   const pixel = event.pixel;

//   displayFeatureInfo(pixel);
// });

// var displayFeatureInfo = function (pixel) {
//   map.forEachFeatureAtPixel(pixel, function (feature, layer) {
//     const extent = feature.getGeometry().getExtent();
//     getCenterOfExtent(extent);
//   });
// };

let X, Y, center, polygonFromCircle;

function getCenterOfExtent(Extent) {
  X = Extent[0] + (Extent[2] - Extent[0]) / 2;
  Y = Extent[1] + (Extent[3] - Extent[1]) / 2;
  center = [X, Y];
}

var drawCircleInMeter = function (map, radius, center) {
  var view = map.getView();
  var projection = view.getProjection();
  var resolutionAtEquator = view.getResolution();
  // var center = map.getView().getCenter();
  console.log(center);
  var pointResolution = getPointResolution(
    projection,
    resolutionAtEquator,
    center
  );
  console.log(projection.getMetersPerUnit());
  var resolutionFactor = resolutionAtEquator / pointResolution;
  var radius = (radius / 1) * resolutionFactor;

  var circle = new Circle(center, radius);
  var circleFeature = new Feature(circle);

  // Create a polygon geometry from the circle geometry
  var polygon = fromCircle(circle);

  // Create a feature from the polygon geometry
  polygonFromCircle = new Feature(polygon);
  console.log(polygonFromCircle);

  var vectorSource = new VectorSource({
    projection: "EPSG:3857",
  });
  vectorSource.addFeature(circleFeature);
  var vectorLayer = new VectorLayer({
    source: vectorSource,
  });

  map.addLayer(vectorLayer);
};

//Logout function

document.getElementById("logout").addEventListener("click", function () {
  fetch("/logout")
    .then((response) => {
      if (response.ok) {
        window.location.href = "/login";
      } else {
        alert("Failed to log out");
      }
    })
    .catch((error) => console.error("Logout error:", error));
});

//Drop KML or GPX
let dragAndDropInteraction;

class KMZ extends KML {
  constructor(opt_options) {
    const options = opt_options || {};
    options.iconUrlFunction = getKMLImage;
    super(options);
  }

  getType() {
    return "arraybuffer";
  }

  readFeature(source, options) {
    const kmlData = getKMLData(source);
    return super.readFeature(kmlData, options);
  }

  readFeatures(source, options) {
    const kmlData = getKMLData(source);
    return super.readFeatures(kmlData, options);
  }
}

function setInteraction() {
  if (dragAndDropInteraction) {
    map.removeInteraction(dragAndDropInteraction);
  }
  dragAndDropInteraction = new DragAndDrop({
    formatConstructors: [KMZ, GPX, GeoJSON, IGC, new KML(), TopoJSON],
  });
  dragAndDropInteraction.on("addfeatures", function (event) {
    const vectorSource = new VectorSource({
      features: event.features,
    });
    map.addLayer(
      new VectorLayer({
        source: vectorSource,
      })
    );
    map.getView().fit(vectorSource.getExtent());
  });
  map.addInteraction(dragAndDropInteraction);
}
setInteraction();

// Create functions to extract KML and icons from KMZ array buffer,
// which must be done synchronously.

const zip = new JSZip();

function getKMLData(buffer) {
  let kmlData;
  zip.load(buffer);
  const kmlFile = zip.file(/\.kml$/i)[0];
  if (kmlFile) {
    kmlData = kmlFile.asText();
  }
  return kmlData;
}

function getKMLImage(href) {
  const index = window.location.href.lastIndexOf("/");
  if (index !== -1) {
    const kmlFile = zip.file(href.slice(index + 1));
    if (kmlFile) {
      return URL.createObjectURL(new Blob([kmlFile.asArrayBuffer()]));
    }
  }
  return href;
}

// Define a KMZ format class by subclassing ol/format/KML
const displayFeatureInfo = function (pixel) {
  const features = [];
  map.forEachFeatureAtPixel(pixel, function (feature) {
    features.push(feature);
  });
};

map.on("pointermove", function (evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on("click", function (evt) {
  displayFeatureInfo(evt.pixel);
});
let extentBbox;

// --- Style for the base geometry ---

// Base style
const baseStyle = new Style({
  stroke: new Stroke({
    color: "blue",
    width: 2,
  }),
  fill: new Fill({
    color: "rgba(0,0,255,0.1)",
  }),
});

// Style for real vertices
const vertexStyle = new Style({
  image: new CircleStyle({
    radius: 4,
    fill: new Fill({ color: "red" }),
    stroke: new Stroke({ color: "white", width: 1 }),
  }),
});

// Style for midpoints
const midStyle = new Style({
  image: new CircleStyle({
    radius: 4,
    fill: new Fill({ color: "rgba(30, 0, 200, 0.4)" }), // green with opacity
    stroke: new Stroke({ color: "white", width: 1 }),
  }),
});

// Point geometry style (with opacity)
const pointStyleEdit = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "rgba(0, 0, 255, 0.5)" }), // blue with 50% opacity
    stroke: new Stroke({ color: "rgba(255,255,255,0.8)", width: 2 }), // white border, slightly transparent
  }),
});

function styleWithVertices(feature) {
  const styles = [baseStyle];
  const geom = feature.getGeometry();
  const type = geom.getType();

  // Helper: draw vertex
  function addVertex(coord) {
    styles.push(
      new Style({
        geometry: new Point(coord),
        image: vertexStyle.getImage(),
      })
    );
  }

  // Helper: draw midpoint
  function addMidpoint(start, end) {
    const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    styles.push(
      new Style({
        geometry: new Point(mid),
        image: midStyle.getImage(),
      })
    );
  }

  if (type === "LineString") {
    geom.forEachSegment((start, end) => {
      addVertex(start);
      addVertex(end);
      addMidpoint(start, end);
    });
  } else if (type === "Polygon") {
    geom.getCoordinates().forEach((ring) => {
      for (let i = 0; i < ring.length - 1; i++) {
        const start = ring[i];
        const end = ring[i + 1];
        addVertex(start);
        addMidpoint(start, end);
      }
    });
  } else if (type === "MultiLineString") {
    geom.getLineStrings().forEach((line) => {
      line.forEachSegment((start, end) => {
        addVertex(start);
        addVertex(end);
        addMidpoint(start, end);
      });
    });
  } else if (type === "MultiPolygon") {
    geom.getPolygons().forEach((poly) => {
      poly.getCoordinates().forEach((ring) => {
        for (let i = 0; i < ring.length - 1; i++) {
          const start = ring[i];
          const end = ring[i + 1];
          addVertex(start);
          addMidpoint(start, end);
        }
      });
    });
  } else if (type === "Point") {
    return pointStyleEdit;
  }

  return styles;
}

//EDIT LAYER
let snapInteraction = null;
let inserts = [];
let deletes = [];
let updates = [];

const editLayerButton = document.getElementById("editButton");
const editToolbar = document.getElementById("editToolbar");

editLayerButton.addEventListener("click", (e) => {
  const intExtent = extentBbox.map((c) => Math.trunc(c));

  // join into your “minX,minY,maxX,maxY” string
  const bboxParam = intExtent.join(",");

  console.log(bboxParam);
  if (!selectedLayer) {
    alert("Please select a layer!");
    return;
  }
  // Toggle toolbar
  editToolbar.style.display =
    editToolbar.style.display === "none" || editToolbar.style.display === ""
      ? "flex"
      : "none";
  //WFS Layer
  wfsVectorSource = new VectorSource({
    // url: wfsLayerUrl + layerParam + wfsLayerUrlEnd ,
    url: `http://localhost:8080/geoserver/${workspaceName}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=${layerParam}&outputFormat=application/json&maxFeatures=500&bbox=${bboxParam},EPSG:3857`,
    format: new GeoJSON(),
    strategy: bboxStrategy,
  });
  console.log(wfsVectorSource.getUrl());
  console.log(wfsLayerUrl + layerParam + wfsLayerUrlEnd);

  wfsVectorLayer = new VectorLayer({
    source: wfsVectorSource,
    title: layerTitle,
    // crossOrigin: "anonymous",
    // opacity: 0,
    visible: true,
    displayInLayerSwitcher: true,
    style: styleWithVertices,
  });

  // Remove the polygon tile layer from the map
  layerGroup.getLayers().remove(selectedLayer);

  // Add the WFS vector layer to the map
  layerGroup.getLayers().push(wfsVectorLayer);
});

// 🧲 Snap toggle button
const btnSnap = document.getElementById("btnSnap");

btnSnap.addEventListener("click", () => {
  if (!snapInteraction) {
    // Create and enable Snap
    snapInteraction = new Snap({ source: wfsVectorSource });
    map.addInteraction(snapInteraction);
    btnSnap.classList.add("active"); // highlight button
    console.log("✅ Snap ON");
  } else {
    // Disable Snap
    map.removeInteraction(snapInteraction);
    snapInteraction = null;
    btnSnap.classList.remove("active");
    console.log("❌ Snap OFF");
  }
});

// ____________________________________________________________________________________________
//MODIFY FEATURE
const modifyFeature = document.getElementById("btnEditGeom");

//MODIFY INTERACTION
let modifyInteraction = null;

modifyFeature.addEventListener("click", (e) => {
  if (!vectorLayer) {
    alert("Please select a layer first.");
    return;
  }
  // Remove any existing interactions
  if (modifyInteraction) {
    map.removeInteraction(modifyInteraction);
    btnEditGeom.classList.remove("active");
    map.removeInteraction(selectSingleClick);
    selectFeature.classList.remove("active");
  }
  if (draw) {
    map.removeInteraction(draw);
    addNewFeature.classList.remove("active");
  }
  // Create new modify interaction
  modifyInteraction = new Modify({
    source: source,
  });
  map.addInteraction(modifyInteraction);
  btnEditGeom.classList.add("active");
  // Handle modification end
  modifyInteraction.on("modifyend", function (event) {
    console.log(event);
    event.features.forEach((feature) => {
      updates.push(feature);
      console.log("Feature queued for update:", feature.getId());
      console.log("Current updates:", updates);
    });
  });
});

//SELECT FEATURE
const selectFeature = document.getElementById("btnSelect");

// Define a style for point features
const selectedPointStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: "red", // Set the fill color of the circle
    }),
    stroke: new Stroke({
      color: "rgba(254, 246, 0, 1)", // Set the border color of the circle
      width: 2, // Set the border width
    }),
  }),
});
const selected = new Style({
  fill: new Fill({
    color: "rgba(254, 246, 0, 1)",
  }),
  stroke: new Stroke({
    color: "rgba(254, 246, 0, 1)",
    width: 2,
  }),
});

function selectStyle(feature) {
  const geometry = feature.getGeometry();

  // Check if the feature's geometry is a point
  if (geometry instanceof Point) {
    return selectedPointStyle; // Return the selected style for points
  } else {
    const color = feature.get("COLOR") || "#eeeeee";
    selected.getFill().setColor(color);
    return selected;
  }
}

let selectSingleClick, featureID, url, extent, selectedFeatures, aaa;
// Initialize a flag to control the map single-click event
let isSelectFeatureActive = false;

selectFeature.addEventListener("click", (e) => {
  isSelectFeatureActive = true;
  map.removeInteraction(draw);
  map.removeInteraction(modifyInteraction);
  btnEditGeom.classList.remove("active");
  addNewFeature.classList.remove("active");
  selectSingleClick = new Select({ style: selectStyle, hitTolerance: 5 });
  map.addInteraction(selectSingleClick);
  selectFeature.classList.add("active");
  selectSingleClick.on("select", function (event) {
    selectedFeatures = event.selected;
    var deselectedFeatures = event.deselected;

    selectedFeatures.forEach(function (feature) {
      console.log("Selected feature:", feature);
      extent = feature.getGeometry().getExtent();
      aaa = feature;
    });

    deselectedFeatures.forEach(function (feature) {
      console.log("Deselected feature:", feature);
    });
    getCenterOfExtent(extent);
  });
});

// ________________________________________________________________________________

//ADD NEW FEATURE
const addNewFeature = document.getElementById("btnAdd");
// Draw Feature Event Listener
addNewFeature.addEventListener("click", (e) => {
  if (!layerName) {
    alert("Please select a layer first.");
    return;
  }

  if (draw) {
    map.removeInteraction(draw);
    addNewFeature.classList.remove("active");
  }

  draw = new Draw({
    source: source,
    type: layerType,
  });

  map.removeInteraction(selectSingleClick);
  selectFeature.classList.remove("active");

  map.addInteraction(draw);
  addNewFeature.classList.add("active");

  draw.on("drawend", function (event) {
    const feature = event.feature;
    const geom = feature.getGeometry().clone();

    feature.set("geom", geom);

    inserts.push(feature);

    console.log("New feature drawn. Click 'Save' to apply.");
  });
});

// Save Feature Function using writeTransaction
function saveFeature() {
  if (inserts.length === 0 && deletes.length === 0 && updates.length === 0) {
    alert("No features to save!");
    return;
  }
  // Create WFS format instance
  const wfsFormat = new WFS();
  const deleteFeatures = deletes.map((item) => item.feature);
  updates.forEach((feature) => {
    feature.setGeometryName("geom");
  });
  // Prepare the transaction
  const transaction = wfsFormat.writeTransaction(
    inserts,
    updates,
    deleteFeatures,
    {
      featureNS: `${workspace}@org`,
      featurePrefix: workspace,
      featureType: layerName,
      srsName: "EPSG:3857",
    }
  );
  // Serialize to XML
  const serializer = new XMLSerializer();
  var wfsPayload = serializer.serializeToString(transaction);
  // Send to server
  fetch(`http://${host}:${port}/geoserver/${workspace}/ows`, {
    method: "POST",
    body: wfsPayload,
    headers: {
      "Content-Type": "text/xml",
    },
  })
    .then((response) => response.text())
    .then((responseText) => {
      console.log("Transaction successful:", responseText);
      source.refresh();
      inserts = [];
      updates = [];
      deletes = [];
    })
    .catch((error) => {
      console.error("Transaction failed:", error);
      alert("Failed to save feature");
    });
}

// DELETE Feature Listener (improved)
const deleteFeature = document.getElementById("btnDelete");
deleteFeature.addEventListener("click", (e) => {
  if (!vectorLayer) {
    alert("Please select a layer first.");
    return;
  }

  const selectedFeatures = selectSingleClick.getFeatures();
  if (selectedFeatures.getLength() === 0) {
    alert("No features selected for deletion.");
    return;
  }

  // Add to deletion queue with visual feedback
  selectedFeatures.forEach((feature) => {
    // Skip if already queued
    if (!inserts.some((f) => f.featureID === feature.get("fid"))) {
      deletes.push({
        feature: feature,
        featureID: feature.get("fid"),
      });
      console.log("Feature queued for deletion:", feature.get("fid"));
    }
  });
  console.log(`Queued ${selectedFeatures.getLength()} features for deletion`);
});

// SAVE FEATURE EVENT
const saveFeatureButton = document.getElementById("btnSave");
saveFeatureButton.addEventListener("click", () => {
  saveFeature();
});

//SELECT RECORD FROM FEATURE ON MAP
function highlightFeature(feature) {
  const featureId = feature.getId();
  vectorLayer.getSource().forEachFeature((f) => {
    if (f.getId() === featureId) {
      const geometryType = f.getGeometry().getType();

      if (geometryType === "Point") {
        // Style for point features
        f.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 10, // Adjust size as needed
              fill: new Fill({ color: "rgba(255, 0, 0, 0.8)" }), // Fill color
              stroke: new Stroke({
                color: "red",
                width: 2,
              }),
            }),
          })
        );
      } else {
        // Change style for other types (e.g., LineString, Polygon)
        f.setStyle(
          new Style({
            stroke: new Stroke({
              color: "red",
              width: 3,
            }),
            fill: new Fill({
              color: "rgba(255, 0, 0, 0.3)",
            }),
          })
        );
      }
    } else {
      // Reset style for other features (customize as needed)
      f.setStyle(null);
    }
  });
}
// _________________________________________________________________________________________________
/**
 * Parse a single DMS coordinate (e.g. "79°58′36″W") to signed decimal degrees.
 */

function parseDMS(dms) {
  // Allow zero or more spaces between the parts:
  const parts = dms.match(/(\d+)[°\s]*([0-9]+)[′']\s*([\d.]+)[″"]\s*([NSEW])/i);
  if (!parts) throw new Error(`Invalid DMS: ${dms}`);
  let [, deg, min, sec, dir] = parts;
  let dd = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
  if (/[SW]/i.test(dir)) dd = -dd;
  return dd;
}

/**
 * Parse a full "lat lon" DMS string into [lon, lat].
 * Expects something like "40°26′47″N, 79°58′36″W"
 */
function parseDMSPair(input) {
  const [latStr, lonStr] = input.split(/\s*,\s*/);
  const lat = parseDMS(latStr);
  const lon = parseDMS(lonStr);
  return [lon, lat];
}

const testLat = "41°19′39.05″N";
const testLon = "19°49′1.99″E";
const testPair = `${testLat}, ${testLon}`;
// console.log("parseDMSPair(testPair):", parseDMSPair(testPair));

//OL-EXT SEARCH COORDINATES
// Initialize the search control with custom options
const searchCoordinates = new ol_control_SearchCoordinates({
  zoom: 14, // Set the default zoom level when coordinates are found
  projection: wgs84Proj, // Set your desired projection (e.g., EPSG:4326 for lat/long)
  label: "Search Coordinates", // Optional: customize the label if needed
  minLength: 4, // Minimum input length before triggering search
  placeholder: "Enter coordinates...", // Customize the placeholder text
});
// Add control to the map
map.addControl(searchCoordinates);
// Style for the point feature
const pointStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "red" }),
    stroke: new Stroke({ color: "white", width: 2 }),
  }),
});

// Create a vector layer to hold the point feature
const gpsSource = new VectorSource();
const gpsLayer = new VectorLayer({
  source: gpsSource,
  style: pointStyle,
});
// Add the vector layer to the map
map.addLayer(gpsLayer);
// Add an event listener for the "select" event
searchCoordinates.on("select", function (event) {
  const coord = event.search.gps;
  console.log(coord);

  // Transform the coordinates to the map's projection (if needed)
  const mapProjection = map.getView().getProjection();
  console.log(mapProjection);

  const transformedCoord = transform(coord, wgs84Proj, mapProjection); // Change EPSG:4326 to your desired input projection
  console.log(transformedCoord);

  const pointFeature = new Feature({
    geometry: new Point(transformedCoord),
  });

  gpsSource.clear(); // Clear previous points
  gpsSource.addFeature(pointFeature); // Add the new point
  // Zoom to the coordinates
  map.getView().setCenter(transformedCoord);
  map.getView().setZoom(20); // Set a zoom level for the focused view
});

// _______________________________________________________________________________
// SELECY CONTROL OL-EXT
const pointSelectedStyle = new Style({
  image: new CircleStyle({
    radius: 10, // Larger radius for emphasis
    fill: new Fill({ color: "blue" }), // Blue fill color for the selected point
    stroke: new Stroke({ color: "yellow", width: 2 }), // Yellow outline
  }),
});

const polygonSelectedStyle = new Style({
  stroke: new Stroke({
    color: "blue",
    width: 3,
  }),
  fill: new Fill({
    color: "rgba(0, 0, 255, 0.3)", // Blue fill with opacity
  }),
});

const lineStringSelectedStyle = new Style({
  stroke: new Stroke({
    color: "green",
    width: 4,
    lineDash: [10, 10], // Dashed pattern
  }),
});

let previouslySelectedFeatures = []; // To store all previously selected features

selectControl.on("select", function (event) {
  const features = event.features; // Get the selected features

  // Reset the style of all previously selected features
  previouslySelectedFeatures.forEach((feat) => {
    feat.setStyle(null);
  });

  // Apply the selected style to each currently selected feature
  // Apply appropriate style based on geometry type
  features.forEach((feat) => {
    console.log(geometryType);
    if (geometryType === "PointPropertyType") {
      feat.setStyle(pointSelectedStyle);
    } else if (geometryType === "GeometryPropertyType") {
      feat.setStyle(polygonSelectedStyle);
    } else if (geometryType === "MultiLineStringPropertyType") {
      feat.setStyle(lineStringSelectedStyle);
    }
  });

  // Update the array of previously selected features
  previouslySelectedFeatures = [...features]; // Store the new selected features
});

// Add the control to the map
map.addControl(selectControl);

// SEARCH CONTROL
// Get the button and form elements
const selectLayers = document.getElementById("layer-select");
const attributeSelect2 = document.getElementById("attribute-select");

function getLayers() {
  selectLayers.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer...";
  selectLayers.appendChild(defaultOption);
  layersArray.forEach((wmsLayer, index) => {
    if (wmsLayer.getVisible()) {
      const layerToAdd = layersArray[index];
      const option = document.createElement("option");
      option.value = index;
      option.text = layerToAdd.get("title");
      selectLayers.appendChild(option);
    }
  });
}

let properties;
async function getFields2(layerIndex) {
  try {
    const selectedLayer = layersArray[layerIndex];
    const layerParams = selectedLayer.getSource().getParams().LAYERS;
    const layerWFS = `http://${host}:${port}/geoserver/${workspaceName}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=${layerParams}&outputFormat=json`;

    const response = await fetch(layerWFS);
    const data = await response.json();

    // Clear existing fields
    attributeSelect2.innerHTML = "";

    // Populate attribute options based on the feature properties in the JSON
    if (data.features && data.features.length > 0) {
      properties = Object.keys(data.features[0].properties);
      properties.forEach((property) => {
        const option = document.createElement("option");
        option.value = property;
        option.text = property;
        attributeSelect2.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error fetching fields:", error);
  }
}

// Listen for layer selection changes
selectLayers.addEventListener("change", (event) => {
  const layerIndex = event.target.value;
  if (layerIndex) {
    getFields2(layerIndex); // Populate attributes based on selected layer
  }
});

const searchControlButton = document.getElementById("searchControlButton");
const searchContainer = document.getElementById("search-container");

// Toggle the visibility when the button is clicked
searchControlButton.addEventListener("click", () => {
  if (searchContainer.hasAttribute("hidden")) {
    searchContainer.removeAttribute("hidden");
    getLayers();
  } else {
    searchContainer.setAttribute("hidden", ""); // Hide the form
  }
});

document.getElementById("search").addEventListener("click", async () => {
  const layerIndex = selectLayers.value;
  if (!layerIndex) {
    console.log("Please select a layer.");
    return;
  }

  const logicalOperator = document.getElementById("logical-operator").value;

  // Gather all conditions from rules
  const conditions = Array.from(rulesContainer.querySelectorAll(".rule"))
    .map((rule) => {
      const attribute = rule.querySelector(".attribute-select").value;
      const operator = rule.querySelector(".operator").value;
      const value = rule.querySelector(".value").value;
      if (attribute && operator && value) {
        return `${attribute} ${operator} '${value}'`;
      }
      return null;
    })
    .filter(Boolean); // Filter out any incomplete conditions

  // Combine conditions using the selected logical operator
  const cqlFilter = conditions.join(` ${logicalOperator} `);

  // Construct the WFS request URL with the combined cql_filter
  const selectedLayer = layersArray[layerIndex];
  const layerParams = selectedLayer.getSource().getParams().LAYERS;
  const layerWFS = `http://${host}:${port}/geoserver/${workspaceName}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=${layerParams}&outputFormat=json&cql_filter=${cqlFilter}`;

  try {
    const response = await fetch(layerWFS);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const features = data.features.map((feature) => {
        const olFeature = new GeoJSON().readFeature(feature);
        return olFeature;
      });

      const vectorSource2 = new VectorSource({
        features: features,
      });

      console.log(vectorSource2.getFeatures());

      // Get the extent of all features
      const extent = vectorSource2.getExtent();

      // Fit the map view to the extent of the selected features
      map.getView().fit(extent, { duration: 1000, padding: [50, 50, 50, 50] });
    } else {
      console.log("No matching features found.");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

const rulesContainer = document.getElementById("rules-container");
const addRuleButton = document.getElementById("add-rule");

addRuleButton.addEventListener("click", () => {
  // Create a new rule element
  const ruleDiv = document.createElement("div");
  ruleDiv.classList.add("rule");
  ruleDiv.innerHTML = `
    <label>Attribute:</label>
    <select class="attribute-select"></select>
    <select class="operator">
      <option value="=">=</option>
      <option value="!=">≠</option>
      <option value="&lt;">&lt;</option>
      <option value="&gt;">&gt;</option>
      <option value="&lt;=">&#8804;</option>
      <option value="&gt;=">&#8805;</option>
    </select>
    <input type="text" class="value" placeholder="value" />
  `;

  // Append the new rule to the rules container
  rulesContainer.appendChild(ruleDiv);

  // Optionally, populate the new attribute select options
  populateAttributeSelect(ruleDiv.querySelector(".attribute-select"));
});

// Dummy function to populate attribute options
function populateAttributeSelect(selectElement) {
  // Populate options as needed (replace with your attribute population logic)
  properties.forEach((attr) => {
    const option = document.createElement("option");
    option.value = attr;
    option.text = attr;
    selectElement.appendChild(option);
  });
}

// __________________________________________________________________________________________

//FEATURE LIST BY ME
let ft, featuresInView;

const attributeLayerSelect = document.getElementById("attribute-layer-select");

// Listen for layer selection changes
selectLayers.addEventListener("change", (event) => {
  const layerIndex = event.target.value;
  if (layerIndex) {
    getFields2(layerIndex); // Populate attributes based on selected layer
  }
});

function getLayers2() {
  attributeLayerSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer...";
  attributeLayerSelect.appendChild(defaultOption);
  layersArray.forEach((wmsLayer, index) => {
    if (wmsLayer.getVisible()) {
      const layerToAdd = layersArray[index];
      const option = document.createElement("option");
      option.value = index;
      option.text = layerToAdd.get("title");
      attributeLayerSelect.appendChild(option);
    }
  });
}

let layerIndex, selectedLayer2, tableLayerSelected;

document
  .getElementById("attributeTable")
  .addEventListener("click", async () => {
    const tableContainer = document.getElementById("attribute-table-container");
    tableContainer.hidden = !tableContainer.hidden;
    getLayers2();
  });

attributeLayerSelect.addEventListener("change", (event) => {
  layerIndex = event.target.value;
  selectedLayer2 = layersArray[layerIndex];
  getSelectedLayerTable(selectedLayer2);
});
function getSelectedLayerTable(selectedLayer) {
  tableLayerSelected = selectedLayer.getSource().getParams().LAYERS;
  const layerWFS = `http://${host}:${port}/geoserver/${workspaceName}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=${tableLayerSelected}&outputFormat=json`;

  async function fetchData() {
    try {
      const response = await fetch(layerWFS);

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the JSON data
      const data = await response.json();
      const features = data.features;
      if (data.features && data.features.length > 0) {
        const features = data.features.map((feature) => {
          const olFeature = new GeoJSON().readFeature(feature);
          return olFeature;
        });

        const vectorSource2 = new VectorSource({
          features: features,
        });
        ft = vectorSource2.getFeatures();

        const view = map.getView();
        const size = map.getSize();
        const extent = view.calculateExtent(size);

        // 5. Filter
        featuresInView = vectorSource2.getFeaturesInExtent(extent);
      }

      populateAttributeTable(featuresInView);

      // You can now work with the data object
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  // Call the fetchData function
  fetchData();
}

let highlightedRow = null;

function populateAttributeTable(features) {
  const tableHeaders = document.getElementById("table-headers");
  const tableBody = document.getElementById("table-body");

  // Clear existing table content
  tableHeaders.innerHTML = "";
  tableBody.innerHTML = "";

  if (features.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = "100%";
    cell.textContent = "No attributes available.";
    return;
  }

  // Extract headers from feature properties and exclude 'geometry'
  const firstFeature = features[0];
  const headers = Object.keys(firstFeature.getProperties()).filter(
    (header) => header !== "geometry"
  );

  // Create header row and filter row combined in a stacked layout
  headers.forEach((header) => {
    const th = document.createElement("th");
    const headerDiv = document.createElement("div");
    headerDiv.textContent = header;

    const filterInput = document.createElement("input");
    filterInput.type = "text";
    filterInput.placeholder = `Filter ${header}`;
    filterInput.addEventListener("input", () => applyFilter(features));

    // Stack header text and filter input
    th.appendChild(headerDiv);
    th.appendChild(filterInput);
    tableHeaders.appendChild(th);
  });

  // Variable to keep track of the currently highlighted row
  let highlightedRow = null;

  // Populate table rows with feature attributes
  features.forEach((feature) => {
    const row = tableBody.insertRow();
    headers.forEach((header) => {
      const cell = row.insertCell();
      cell.textContent = feature.get(header) || "";
    });
    // Single click = highlight row
    row.addEventListener("click", () => {
      if (highlightedRow) {
        highlightedRow.classList.remove("highlighted-row");
      }
      row.classList.add("highlighted-row");
      highlightedRow = row;
    });

    const zoomBtn = document.getElementById("zoom-btn");

    // When a row is selected, enable the button
    row.addEventListener("click", () => {
      if (highlightedRow) {
        highlightedRow.classList.remove("highlighted-row");
      }
      row.classList.add("highlighted-row");
      highlightedRow = row;

      zoomBtn.disabled = false; // enable zoom button
    });

    // When zoom button is clicked
    zoomBtn.addEventListener("click", () => {
      if (!highlightedRow) return;

      const rowData = {};
      headers.forEach((header) => {
        rowData[header] = feature.get(header);
      });
      zoomToFeatureExtent(feature);
    });
  });
}

// --- Globals shared by Edit + Save ---
let loadedFeatures = [];

const mapProj = map.getView().getProjection().getCode() || "EPSG:3857";

// Extract headers once (column names must match attribute names)

// Optional: skip columns that aren’t attributes (e.g., geometry/id columns)
const SKIP_FIELDS = new Set(["geom", "the_geom", "gid", "id", ""]);

const editBtn = document.getElementById("edit-btn");
const saveBtn = document.getElementById("save-btn");

// Start with Save disabled until features load
saveBtn.disabled = true;

editBtn.addEventListener("click", () => {
  // Make table cells editable (UI only)
  document.querySelectorAll("#attribute-table tbody td").forEach((td) => {
    td.contentEditable = true;
    td.style.backgroundColor = "#fffbe6";
  });

  // Parse "workspace:layer" (e.g., "test:Shkolla")
  [workspace, layerName] = tableLayerSelected.split(":");

  // Build WFS GetFeature URL (GeoJSON output)
  const wfsUrl =
    `http://${host}:${port}/geoserver/${workspace}/ows` +
    `?service=WFS&version=1.0.0&request=GetFeature` +
    `&typeName=${tableLayerSelected}` +
    `&maxFeatures=500` +
    `&outputFormat=application/json`;

  // Load features (manual fetch avoids OL loader event quirks)
  fetch(wfsUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
      return res.json();
    })
    .then((json) => {
      const fmt = new GeoJSON();
      loadedFeatures = fmt.readFeatures(json, {
        dataProjection: "EPSG:3857", // adapt if your data CRS differs
        featureProjection: mapProj, // map/view projection
      });
      saveBtn.disabled = loadedFeatures.length === 0;
      if (loadedFeatures.length === 0) {
        alert("No features returned from WFS.");
      }
    })
    .catch((err) => {
      console.error("Failed to load features for editing:", err);
      alert("Failed to load features for editing. Check console/network.");
      saveBtn.disabled = true;
    });
});

// ---- adjust these to your GeoServer setup ----
// ---- adjust these to your GeoServer setup ----
const GEOM_NAME = "geom"; // your geometry column name (geom/the_geom/wkb_geometry)
const NAMESPACE_URI = "http://test"; // Namespace URI from GeoServer > Namespaces (NOT the workspace string)
// ----------------------------------------------

saveBtn.addEventListener("click", () => {
  btnEditGeom.classList.remove("active");
  selectFeature.classList.remove("active");
  addNewFeature.classList.remove("active");
  deleteFeature.classList.remove("active");
  const [workspace, layerName] = tableLayerSelected.split(":");

  // 1) Load features fresh from WFS (GeoJSON)
  const wfsUrl =
    `http://localhost:8080/geoserver/${workspace}/ows` +
    `?service=WFS&version=1.0.0&request=GetFeature` +
    `&typeName=${tableLayerSelected}` +
    `&maxFeatures=1000&outputFormat=application/json`;

  fetch(wfsUrl)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((json) => {
      const fmt = new GeoJSON();
      const mapSrs =
        map?.getView?.().getProjection?.().getCode?.() || "EPSG:3857";
      const features = fmt.readFeatures(json, {
        dataProjection: "EPSG:3857", // change if your data CRS differs
        featureProjection: mapSrs,
      });

      if (!features.length) {
        alert("No features returned from WFS.");
        return;
      }

      // Make sure OL uses your GeoServer geometry attribute name when writing WFS-T
      features.forEach((f) => f.setGeometryName(GEOM_NAME));

      // 2) Build a safe column→field mapping from the THEAD you already have
      const ths = Array.from(
        document.querySelectorAll("#attribute-table thead th")
      );
      const firstKeys = new Set(features[0].getKeys()); // real attribute names on the feature
      const headerFields = ths.map((th) => {
        const name = (th.dataset.field || th.textContent || "").trim();
        return firstKeys.has(name) ? name : null; // null = ignore this column
      });

      // 3) Walk rows and compute diffs
      const updatedFeatures = [];
      const rows = document.querySelectorAll("#attribute-table tbody tr");

      rows.forEach((tr, rowIndex) => {
        const feat = features[rowIndex];
        if (!feat) return;

        const updated = {};
        const cells = tr.querySelectorAll("td");

        cells.forEach((td, colIndex) => {
          const fieldName = td.dataset.field || headerFields[colIndex] || null;
          // skip unknown/missing field names and geometry columns
          if (!fieldName || fieldName === GEOM_NAME || fieldName === "geometry")
            return;

          const oldVal = feat.get(fieldName);
          const raw = td.textContent.trim();
          let val = raw;

          // Simple number casting to preserve types
          if (typeof oldVal === "number" && raw !== "") {
            const n = Number(raw);
            if (!Number.isNaN(n)) val = n;
          }

          if (oldVal !== val) {
            updated[fieldName] = val;
          }
        });

        if (Object.keys(updated).length) {
          feat.setProperties(updated);
          feat.setGeometryName(GEOM_NAME);
          updatedFeatures.push(feat);
        }
      });

      if (!updatedFeatures.length) {
        alert("No changes to save!");
        return;
      }

      // 4) Write WFS-T Update
      const wfs = new WFS();
      const node = wfs.writeTransaction(
        [], // inserts
        updatedFeatures, // updates
        [], // deletes
        {
          featureNS: `${workspace}@org`,
          featurePrefix: workspace,
          featureType: layerName,
          srsName: "EPSG:3857",
        }
      );

      const xml = new XMLSerializer().serializeToString(node);

      return fetch(`http://${host}:${port}/geoserver/${workspace}/ows`, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xml,
      });
    })
    .then((res) => (res ? res.text() : null))
    .then((txt) => {
      if (!txt) return;
      console.log("WFS Transaction response:", txt);
      if (txt.includes("<ows:ExceptionReport")) {
        console.error("WFS-T error:", txt);
        alert("Save failed (see console).");
        return;
      }
      alert("Changes saved!");
      // 🔽 Reset table UI
      document.querySelectorAll("#attribute-table tbody td").forEach((td) => {
        td.contentEditable = false;
        td.style.backgroundColor = "";
      });
      saveBtn.disabled = true;
    })
    .catch((err) => {
      console.error("Save failed:", err);
      alert("Save failed. See console.");
    });
});

// Function to zoom to a feature's extent
function zoomToFeatureExtent(feature) {
  const extent = feature.getGeometry().getExtent();
  map.getView().fit(extent, { duration: 1000, padding: [50, 50, 50, 50] });
}

// Apply filter function to filter rows based on input values
function applyFilter(features) {
  const tableBody = document.getElementById("table-body");
  const filterInputs = Array.from(
    document.querySelectorAll("#table-headers input")
  );
  const headers = filterInputs.map((input) =>
    input.placeholder.replace("Filter ", "")
  );

  // Clear existing table body content
  tableBody.innerHTML = "";

  // Filter features based on each input value
  const filteredFeatures = features.filter((feature) => {
    return headers.every((header, index) => {
      const filterValue = filterInputs[index].value.toLowerCase();
      const featureValue = (feature.get(header) || "").toString().toLowerCase();
      return featureValue.includes(filterValue);
    });
  });

  // Repopulate table body with filtered features
  filteredFeatures.forEach((feature) => {
    const row = tableBody.insertRow();
    headers.forEach((header) => {
      const cell = row.insertCell();
      cell.textContent = feature.get(header) || "";
    });
    // Add click event listener to the row for zooming
    row.addEventListener("click", () => {
      // Remove previous highlight if any
      if (highlightedRow) {
        highlightedRow.classList.remove("highlighted-row");
      }

      // Highlight the clicked row
      row.classList.add("highlighted-row");
      highlightedRow = row;

      // Zoom to the feature's extent
      zoomToFeatureExtent(feature);
    });
  });
}

//SELECT ATTRIBUTE ROW FROM FEATURE ON THE MAP

map.on("singleclick", function (evt) {
  if (!selectedLayer2) {
    console.log("No layer selected; skipping GetFeatureInfo.");
    return;
  }
  if (isSelectFeatureActive) {
    console.log("Single-click disabled while 'Select Feature' is active.");
    return; // Exit early if select feature mode is active
  }
  const viewResolution = map.getView().getResolution();
  console.log(selectedLayer2);

  const layerSource = selectedLayer2.getSource(); // Replace with your TileWMS layer source

  // Construct the GetFeatureInfo URL
  const url = layerSource.getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    map.getView().getProjection(),
    {
      INFO_FORMAT: "application/json",
      FEATURE_COUNT: 1, // Retrieve only one feature
    }
  );

  if (url) {
    // Fetch feature info from WMS
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.features && data.features.length > 0) {
          const featureData = data.features[0].properties;
          console.log(featureData);

          selectTableRow(featureData); // Function to highlight the corresponding row
        } else {
          console.log("No feature found at the clicked location.");
        }
      })
      .catch((error) => console.error("Error fetching feature info:", error));
  }
});

function selectTableRow(featureData) {
  const tableHeaders = Array.from(
    document.querySelectorAll("#table-headers th")
  );
  const tableBody = document.getElementById("table-body");
  const rows = Array.from(tableBody.rows);

  let foundMatch = false;

  rows.forEach((row) => {
    const firstCell = row.cells[0]; // Use only the first cell for matching
    const header = tableHeaders[0].textContent; // Header for the first column

    // Convert both featureData and first cell content to strings and trim them
    const featureValue = String(featureData[header]).trim();
    const cellValue = String(firstCell.textContent).trim();

    console.log(
      `Comparing feature "${featureValue}" with table cell "${cellValue}"`
    ); // Debug: Log comparison

    const match = featureValue === cellValue;

    console.log("Row match result:", match); // Log whether the row was matched

    // Apply the highlight class if there's a match
    if (match) {
      // Remove the highlight from the previous row, if any
      if (highlightedRow) {
        highlightedRow.classList.remove("highlighted-row");
      }

      row.classList.add("highlighted-row");
      row.scrollIntoView({ behavior: "smooth", block: "center" });

      // Update the previous highlighted row
      highlightedRow = row;

      // Exit the loop once a match is found
      return;
    } else {
      row.classList.remove("highlighted-row");
    }
  });
}

//ADD NEW WMS LAYER ON MAP
async function logWmsLayerNamesFlat(wmsCapUrl) {
  const resp = await fetch(wmsCapUrl);
  const text = await resp.text();
  const caps = new WMSCapabilities().read(text);
  caps.Capability.Layer.Layer.forEach((l) => l.Name);
}

logWmsLayerNamesFlat(
  "https://geoportal.asig.gov.al/service/adresar/wms?request=GetCapabilities"
);

const newWMSLayer = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/qttb/wms?request=GetCapabilities",
    params: {
      LAYERS: "perdorimi_tokes_zone_2020",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "perdorimi_tokes_zone_2020",
  information: "Duhet automatizuar",
  displayInLayerSwitcher: true,
});

map.addLayer(newWMSLayer);

//ADD NEW WMTS LAYER ON MAP
fetch("https://geoportal.asig.gov.al/service/wmts?request=getCapabilities")
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    var result = wmts_parser.read(text);
    result.Contents.Layer.forEach((layer) => {
      return layer.Identifier;
    });

    var newWMTSLayer = optionsFromCapabilities(result, {
      layer: "akpt_plane_kombetare:Infrastruktura_e_energjise",
      matrixSet: "EPSG:6870",
    });

    const selectedWMTS = new Tile({
      name: "akpt_plane_kombetare:Infrastruktura_e_energjise",
      shortName: "2015 20cm",
      visible: false,
      source: new WMTS(newWMTSLayer),
      baseLayer: false,
      displayInLayerSwitcher: true,
    });

    map.addLayer(selectedWMTS);
  })

  .catch(function (error) {
    // Handle errors if necessary
  });

async function getWmtsLayerList(wmtsCapUrl) {
  const resp = await fetch(wmtsCapUrl);
  const text = await resp.text();
  const caps = new WMTSCapabilities().read(text);
  // caps.Contents.Layer is an array of layer objects

  caps.Contents.Layer.forEach((layer) => {
    return layer.Identifier;
  });
}

getWmtsLayerList(
  "https://geoportal.asig.gov.al/service/wmts?request=getCapabilities"
);

// Add ArcGIS Tile Layer with Filtered Layers

async function getLayerIdsFromMapServer(mapServerUrl) {
  const resp = await fetch(`${mapServerUrl}?f=pjson`);
  const data = await resp.json();
  // console.log("Available layers:", data.layers);
  return data.layers;
}

function filterLayerIds(layers, namesToInclude) {
  return layers
    .filter((layer) => namesToInclude.includes(layer.name))
    .map((layer) => layer.id);
}

async function addArcgisTileLayer(map, mapServerUrl, includedNames) {
  const allLayers = await getLayerIdsFromMapServer(mapServerUrl);
  const selectedIds = filterLayerIds(allLayers, includedNames);

  const arcgistileLayer = new TileLayer({
    source: new TileArcGISRest({
      url: mapServerUrl,
      params: {
        layers: `show:${selectedIds.join(",")}`,
        FORMAT: "png32",
        TRANSPARENT: true,
      },
    }),
    title: "Filtered ArcGIS Layers",
    visible: true,
    showInLayerSwitcher: true,
  });

  // map.addLayer(arcgistileLayer);
}

const mapServerUrl =
  "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer";

addArcgisTileLayer(map, mapServerUrl, ["states", "Detailed Counties"]);

//GET LAYER VISIBILITY AT CURRENT SCALE (TEMPORARILY)

// Given a scale denominator (e.g. 50000 for 1:50000),
// return the OL resolution in map‐units/pixel.
// function scaleToResolution(scaleDenominator, view) {
//   const mmPerInch = 25.4; // 1 inch = 25.4 mm
//   const mmPerPixel = 0.2645833333; // 1 pixel = 0.2645833333 mm (96 DPI)
//   const inchesPerMeter = 39.37007874015748;
//   const dpi = mmPerInch / mmPerPixel;
//   const metersPerUnit = view.getProjection().getMetersPerUnit();
//   console.log(
//     "Dpi:",
//     dpi,
//     "Meters per unit:",
//     metersPerUnit * inchesPerMeter * dpi
//   );

//   return scaleDenominator / (metersPerUnit * inchesPerMeter * dpi);
// }

// const view2 = map.getView();
// console.log(view2);

// const pixelSize = 0.0002645833333; // 1 pixel = 0.0002645833333 m (assuming 96 DPI, 1 pixel = 0.2645833333 mm)

// // your desired range
// const maxScaleDen = 500000; // 1:500k  = furthest out → largest resolution
// const minScaleDen = 50000; // 1:50k   = closest in  → smallest resolution

// const maxRes = scaleToResolution(maxScaleDen, view2); // the value is each pixel is X meter on the ground
// const minRes = scaleToResolution(minScaleDen, view2); // the value is each pixel is X meter on the ground

// const testWMSZoom = new ImageLayer({
//   source: new ImageWMS({
//     url: `http://${host}:${port}/geoserver/roles_test/wms`,
//     params: {
//       LAYERS: "roles_test:aoi_wildfire_3857",
//       VERSION: "1.1.1",
//     },
//     ratio: 1,
//     serverType: "geoserver",
//     crossOrigin: "anonymous",
//   }),
//   visible: true,
//   title: "aoi_wildfire_3857",
//   maxResolution: maxRes,
//   minResolution: minRes,
//   information: "Kufiri i tokësor i republikës së Shqipërisë",
//   displayInLayerSwitcher: true,
// });

// console.log(testWMSZoom);

// // map.addLayer(testWMSZoom);

// map.getView().on("change:resolution", () => {
//   const res = view.getResolution(); // m/px
//   console.log("Current resolution:", res);

//   const scale = res / pixelSize; // unitless denom
//   console.log("Current scale:", scale);

//   const isOn = res >= minRes && res <= maxRes;
//   console.log(
//     `Resolution: ${res.toFixed(2)} m/px`,
//     `Scale: 1:${Math.round(scale)}`,
//     `Visible: ${isOn}`
//   );
// });

function scaleToResolution(scaleDenominator, view) {
  const mmPerInch = 25.4; // 1 inch = 25.4 mm
  const mmPerPixel = 0.28; // 1 pixel = 0.2645833333 mm (96 DPI)
  // const inchesPerMeter = 39.37007874015748;
  const inchesPerMeter = 39.3701;
  const dpi = mmPerInch / mmPerPixel;
  const metersPerUnit = view.getProjection().getMetersPerUnit();
  // console.log(
  //   "Dpi:",
  //   dpi,
  //   "Meters per unit:",
  //   metersPerUnit * inchesPerMeter * dpi
  // );

  return scaleDenominator / (metersPerUnit * inchesPerMeter * dpi);
}

const view2 = map.getView();
const actualProjection = view2.getProjection();

const pixelSize = 0.00028; // 1 pixel = 0.0002645833333 m (assuming 96 DPI, 1 pixel = 0.2645833333 mm)

// your desired range
const maxScaleDen = 10000; // 1:500k  = furthest out → largest resolution
const minScaleDen = 500; // 1:50k   = closest in  → smallest resolution

const maxRes = scaleToResolution(maxScaleDen, view2); // the value is each pixel is X meter on the ground
const minRes = scaleToResolution(minScaleDen, view2); // the value is each pixel is X meter on the ground

const testWMSZoom = new ImageLayer({
  source: new ImageWMS({
    url: `http://${host}:${port}/geoserver/test/wms`,
    params: {
      LAYERS: "test:created_point",
      VERSION: "1.1.1",
    },
    ratio: 1,
    serverType: "geoserver",
    crossOrigin: "anonymous",
  }),
  visible: true,
  title: "cluster",

  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const clusterVSource = new VectorSource({
  url: testWMSZoom,
  format: new GeoJSON(),
});

const testWFSZoom = `http://${host}:${port}/geoserver/${workspaceName}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=${workspaceName}:created_point&outputFormat=json`;
// console.log(testWMSZoom);

const wfsSource = new VectorSource({
  url: testWFSZoom,
  format: new GeoJSON(),
});
const wfsLayer = new VectorLayer({
  source: wfsSource,
  // optional: style your features
  // style: feature => new Style({ … })
});

async function fetchAndLogFeaturesInExtent() {
  try {
    // 1. Fetch GeoJSON from WFS
    const resp = await fetch(testWFSZoom);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const geojson = await resp.json();

    // 2. Convert to OL Features
    const format = new GeoJSON();
    const olFeatures = format.readFeatures(geojson, {
      dataProjection: "EPSG:3857",
      featureProjection: map.getView().getProjection(),
    });

    // 3. Create a VectorSource just to use its getFeaturesInExtent()
    const vectorSource = new VectorSource({
      features: olFeatures,
    });

    // 4. Compute current view extent
    const view = map.getView();
    const size = map.getSize();
    const extent = view.calculateExtent(size);

    // 5. Filter
    const featuresInView = vectorSource.getFeaturesInExtent(extent);

    // 6. Log results
    // console.log("Features within current extent:", featuresInView);
  } catch (err) {
    console.error("Error fetching or filtering WFS data:", err);
  }
}

map.getView().on("change:resolution", () => {
  const res = view.getResolution(); // m/px
  // console.log("Current resolution:", res);

  const scale = res / pixelSize; // unitless denom
  // console.log("Current scale:", scale);

  const isOn = res >= minRes && res <= maxRes;

  // OR if you’ve just called getFeatures() already:
  // const features = wfsSource.getFeatures()
  //    .filter(f => f.getGeometry().intersectsExtent(extent));

  // (140-40) (55) -> on
  // (140-40) (32) -> off
  // (140-40) (156) -> off

  // console.log(
  //   `Resolution: ${res.toFixed(2)} m/px`,
  //   `Scale: 1:${Math.round(scale)}`,
  //   `Visible: ${isOn}`
  // );
});

// instead of:
// map.getView().on('change:resolution', fetchAndLogFeaturesInExtent);

// do this:
map.on("moveend", () => {
  // fetchAndLogFeaturesInExtent();
  extentBbox = map.getView().calculateExtent(map.getSize());
});

//ADD/UPLOAD DATA
// show the modal when the button is clicked
document.getElementById("add-data").addEventListener("click", () => {
  new bootstrap.Modal(document.getElementById("uploadModal")).show();
});

const uploadForm = document.getElementById("uploadForm");
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("shpFile");
  const layerName = document.getElementById("layerName").value.trim();
  if (!fileInput.files.length || !layerName) return;

  const formData = new FormData();
  formData.append("shp_zip", fileInput.files[0]);
  formData.append("layer_name", layerName);

  try {
    const res = await fetch("http://localhost:8000/api/upload-shapefile/", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      // pull back the raw text so you can see Django’s error page if it isn’t JSON
      const txt = await res.text();
      console.error("Upload failed:", res.status, txt);
      alert("Upload error: " + res.status);
      return;
    }

    const json = await res.json();
    console.log("Success:", json);
    // …do something with json…
  } catch (err) {
    console.error("Network or parse error:", err);
  }
});

// ________________________________________________________________________
// CLUSTER

const clusterSource = new Cluster({
  distance: 40, // pixel radius for clustering
  source: wfsSource,
});

// 4. Style cache so we only create one style per cluster size
const styleCache = {};

// 5. Cluster layer with styling function
const clusters = new VectorLayer({
  source: clusterSource,
  style: (feature) => {
    const features = feature.get("features");
    const size = features.length;
    let style = styleCache[size];
    if (!style) {
      style = new Style({
        image: new CircleStyle({
          radius: 10 + Math.min(size, 20), // scale radius by count
          stroke: new Stroke({ color: "#fff", width: 2 }),
          fill: new Fill({ color: "#3399CC" }),
        }),
        text: new Text({
          text: size.toString(),
          font: "12px sans-serif",
          fill: new Fill({ color: "#fff" }),
        }),
      });
      styleCache[size] = style;
    }
    return style;
  },
});

// map.addLayer(clusters);

const myStaticStyle = new Style({
  fill: new Fill({
    color: "rgba(0, 150, 136, 0.3)",
  }),
  stroke: new Stroke({
    color: "#009688",
    width: 1,
  }),
});

const styleFunctionMVT = (feature, resolution) => {
  const props = feature.getProperties();
  const geomType = feature.getGeometry().getType(); // e.g. 'Polygon', 'LineString', 'Point'
  const styles = [];

  // 1) color polygons differently by some property
  if (geomType === "Polygon") {
    const category = props.category; // e.g. 'residential' | 'industrial'
    let fillColor = "rgba(100,100,100,0.3)";
    if (category === "residential") fillColor = "rgba(0,150,136,0.3)";
    if (category === "industrial") fillColor = "rgba(244, 67, 54,0.3)";

    styles.push(
      new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: "#333", width: 1 }),
      })
    );
  }

  // 2) draw lines with weight based on a property
  if (geomType === "LineString") {
    const width = props.road_rank ? props.road_rank * 2 : 1;
    styles.push(
      new Style({
        stroke: new Stroke({ color: "#607d8b", width }),
      })
    );
  }

  // 3) add a text label for points (or centroids)
  if (geomType === "Point") {
    styles.push(
      new Style({
        image: new CircleStyle({ radius: 5 }),
        text: new Text({
          text: props.name || "",
          font: "12px sans-serif",
          fill: new Fill({ color: "#000" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
          offsetY: -10,
        }),
      })
    );
  }

  // return an array (or a single Style)
  return styles;
};

const mvtLayer = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    url: "http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test:ndertesa_durres_3857@EPSG:900913@pbf/{z}/{x}/{-y}.pbf",
  }),
  style: styleFunctionMVT,
  displayInLayerSwitcher: true,
  visible: true,
  title: "Nd_Durres_3857 MVT",
  maxResolution: 2.8,
  minResolution: 0.14,
});

// map.addLayer(mvtLayer);

//GRAPHICS IN OPENLAYERS

const chartModal = document.getElementById("chartModal");
const chartForm = document.getElementById("chartForm");

// your palette for dynamic colors
const COLOR_PALETTE = [
  "blue",
  "green",
  "pink",
  "orange",
  "purple",
  "yellow",
  "teal",
];

/**
 * Returns a style‐factory that knows about your chosen fields,
 * chart type, and colors.
 *
 * @param {string[]} fields    – list of attribute names to chart
 * @param {string}   chartType – "pie" | "donut" | "bar"
 * @param {string[]} colors    – same length as fields
 */

function makeChartStyleFunction(fields, chartType, colors) {
  const cache = {};
  return (feature) => {
    const data = fields.map((f) => parseFloat(feature.get(f)) || 0);
    const sum = data.reduce((a, b) => a + b, 0);
    const radius = 15;

    const key =
      fields.join(",") +
      "|" +
      data.join(",") +
      "|" +
      chartType +
      "|alwaysLabels";

    if (cache[key]) return cache[key];

    const styles = [];

    // Chart itself
    styles.push(
      new Style({
        image: new ol_style_Chart({
          type: chartType,
          radius: radius,
          data: data,
          colors: colors,
          stroke: new Stroke({ color: "#fff", width: 2 }),
          rotateWithView: true,
        }),
        geometry: feature.getGeometry().getInteriorPoint(),
        zIndex: 1,
      })
    );

    // ✅ Always show percentage labels (if sum > 0)
    if (sum > 0) {
      let offsetAcc = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i] <= 0) continue;
        const angle = ((2 * offsetAcc + data[i]) / sum) * Math.PI - Math.PI / 2;
        const pct = ((data[i] / sum) * 100).toFixed(1) + "%";
        const labelOffset = radius + 20;

        styles.push(
          new Style({
            text: new Text({
              text: pct,
              offsetX: Math.cos(angle) * labelOffset,
              offsetY: Math.sin(angle) * labelOffset,
              textAlign: "center",
              textBaseline: "middle",
              fill: new Fill({ color: "#333" }),
              stroke: new Stroke({ color: "#fff", width: 2 }),
              font: "bold 12px sans-serif",
            }),
            geometry: feature.getGeometry().getInteriorPoint(),
            zIndex: 10,
          })
        );

        offsetAcc += data[i];
      }
    }

    cache[key] = styles;
    return styles;
  };
}

// __________________________________________________________________________________________________

// grab your chart‐modal’s layer picker
const layerSelectInChart = document.getElementById("layerSelectInChart");
const fieldsContainer = document.getElementById("fieldsContainer");

// repurpose getLayers2 to fill *this* select
function populateChartLayerSelect() {
  layerSelectInChart.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer...";
  layerSelectInChart.appendChild(defaultOption);

  layersArray.forEach((wmsLayer, index) => {
    if (!wmsLayer.getVisible()) return;
    const option = document.createElement("option");
    option.value = index; // store the index
    option.text = wmsLayer.get("title") || `Layer ${index}`;
    layerSelectInChart.appendChild(option);
  });
}

document.getElementById("add-chart").addEventListener("click", () => {
  populateChartLayerSelect();
  document.getElementById("chartModal").showModal();
});

// 2) When they pick a layer, build its WFS URL and fetch the fields:
layerSelectInChart.addEventListener("change", async function () {
  fieldsContainer.innerHTML = ""; // clear old
  const idx = parseInt(this.value, 10);
  if (isNaN(idx)) return;

  // build the same URL you had in your main form…
  const layer = layersArray[idx];
  const layerParams = layer.getSource().getParams().LAYERS;

  let wfsUrl =
    `http://${host}:${port}/geoserver/${workspaceName}/ows?` +
    `service=WFS&version=1.1.0&request=GetFeature` +
    `&typeName=${layerParams}&outputFormat=json`;

  console.log("Fetching WFS URL:", wfsUrl);

  const uniqueValuesMap = await fetchAndExtractKeys(wfsUrl);

  // 3) render each key (≠ "geometry") as a checkbox
  Object.keys(uniqueValuesMap)
    .filter((k) => k !== "geometry")
    .forEach((fieldName) => {
      const wrapper = document.createElement("div");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = `chart-field-${fieldName}`;
      cb.value = fieldName;

      const lbl = document.createElement("label");
      lbl.htmlFor = cb.id;
      lbl.textContent = fieldName;

      wrapper.append(cb, lbl);
      fieldsContainer.append(wrapper);
    });
});

document.getElementById("chartForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const idx = parseInt(layerSelectInChart.value, 10);
  if (isNaN(idx)) {
    alert("Please select a layer!");
    return;
  }

  // 1) Which fields & chart type?
  const fields = Array.from(
    fieldsContainer.querySelectorAll("input:checked")
  ).map((cb) => cb.value);
  const chartType = document.getElementById("chartTypeSelect").value;

  if (fields.length < 2) {
    alert("Pick at least two fields!");
    return;
  }

  // 2) Build your colors array
  const colors = COLOR_PALETTE.slice(0, fields.length);

  // 3) Figure out workspace & layerName for the WFS URL
  const layer = layersArray[idx];
  const layersArg = layer.getSource().getParams().LAYERS;
  const [workspace, layerName] = layersArg.split(":");

  const params = layer.getSource().getParams();
  const cqlFilter = params.CQL_FILTER;
  console.log(cqlFilter);
  let wfsUrl;
  const baseUrl =
    `http://${host}:${port}/geoserver/${workspace}/ows?` +
    `service=WFS&version=1.1.0&request=GetFeature` +
    `&typeName=${workspace}:${layerName}` +
    `&outputFormat=application/json&srsName=EPSG:3857`;

  if (cqlFilter) {
    const encoded = encodeURIComponent(cqlFilter);
    wfsUrl = `${baseUrl}&CQL_FILTER=${encoded}`;
  } else {
    wfsUrl = baseUrl;
  }

  console.log(fields, chartType, colors);

  // 4) Create the style‐function closure
  const chartStyleFn = makeChartStyleFunction(fields, chartType, colors);

  // 5) If you’ve already added a chart layer/interaction before, remove it
  if (window.vectorLayerChart) {
    map.removeLayer(window.vectorLayerChart);
    map.removeInteraction(window.chartSelect);
  }

  // 6) Create & add your vector layer
  window.vectorLayerChart = new VectorLayer({
    source: new VectorSource({
      url: wfsUrl,
      format: new GeoJSON(),
    }),
    style: (feature) => chartStyleFn(feature, false),
  });

  console.log(window.vectorLayerChart);

  window.vectorLayerChart.setZIndex(99);
  map.addLayer(window.vectorLayerChart);
  generateChartLegend(fields, colors);

  chartModal.close();
});

const closeBtn = document.getElementById("closeBtn");
closeBtn.addEventListener("click", () => {
  fieldsContainer.innerHTML = "";
  chartForm.reset();
  chartModal.close();
});

const resetChart = document.getElementById("resetBtnGraphics");
resetChart.addEventListener("click", () => {
  fieldsContainer.innerHTML = "";
  chartForm.reset();
  map.removeLayer(window.vectorLayerChart);
  document.getElementById("chartLegend").style.display = "none";
});

//GENERATE CHART LEGEND
function generateChartLegend(fields, colors) {
  const legendContainer = document.getElementById("chartLegend");
  legendContainer.innerHTML = ""; // clear previous content

  const title = document.createElement("div");
  title.textContent = "Chart Legend";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "6px";
  legendContainer.appendChild(title);

  fields.forEach((field, index) => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.marginBottom = "4px";

    const swatch = document.createElement("div");
    swatch.style.width = "16px";
    swatch.style.height = "16px";
    swatch.style.backgroundColor = colors[index];
    swatch.style.border = "1px solid #333";
    swatch.style.marginRight = "8px";

    const label = document.createElement("span");
    label.textContent = field;

    item.appendChild(swatch);
    item.appendChild(label);
    legendContainer.appendChild(item);
  });

  legendContainer.style.display = "block";
}

//HEATMAP

const heatmapBtn = document.getElementById("heatmap");
const heatmapModal = document.getElementById("heatmapModal");
const layerSelectInHeatmap = document.getElementById("layerSelectInHeatmap");

heatmapBtn.addEventListener("click", () => {
  populateHeatmapLayerSelect();
  heatmapModal.showModal();
});

function populateHeatmapLayerSelect() {
  layerSelectInHeatmap.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer...";
  layerSelectInHeatmap.appendChild(defaultOption);

  layersArray.forEach((layer, index) => {
    if (!layer.getVisible()) return;
    const option = document.createElement("option");
    option.value = index;
    option.text = layer.get("title") || `Layer ${index}`;
    layerSelectInHeatmap.appendChild(option);
  });
}

document
  .getElementById("layerSelectInHeatmap")
  .addEventListener("change", async function () {
    const weightFieldSelect = document.getElementById("weightFieldSelect");
    weightFieldSelect.innerHTML = '<option value="">None (uniform)</option>';

    const idx = parseInt(this.value, 10);
    if (isNaN(idx)) return;

    const layer = layersArray[idx];
    const layerParams = layer.getSource().getParams().LAYERS;
    const [workspace, layerName] = layerParams.split(":");

    const params = layer.getSource().getParams();
    const cqlFilter = params.CQL_FILTER;
    console.log(cqlFilter);
    let wfsUrl;
    const baseUrl =
      `http://${host}:${port}/geoserver/${workspace}/ows?` +
      `service=WFS&version=1.1.0&request=GetFeature` +
      `&typeName=${workspace}:${layerName}` +
      `&outputFormat=application/json&srsName=EPSG:3857`;

    if (cqlFilter) {
      const encoded = encodeURIComponent(cqlFilter);
      wfsUrl = `${baseUrl}&CQL_FILTER=${encoded}`;
    } else {
      wfsUrl = baseUrl;
    }

    async function fetchAndExtractKeys(wfsUrl) {
      const response = await fetch(wfsUrl);
      const data = await response.json();
      const firstFeature = data.features?.[0];

      if (!firstFeature) return {};

      return firstFeature.properties;
    }
    const uniqueValuesMap = await fetchAndExtractKeys(wfsUrl);

    Object.keys(uniqueValuesMap)
      .filter((k) => k !== "geometry" && typeof uniqueValuesMap[k] === "number")
      .forEach((field) => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = field;
        weightFieldSelect.appendChild(option);
      });

    layer.set("wfsUrl", wfsUrl); // store for later use
  });

document
  .getElementById("heatmapForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const idx = parseInt(layerSelectInHeatmap.value, 10);
    if (isNaN(idx)) return;

    const selectedLayer = layersArray[idx];
    const wfsUrl = selectedLayer.get("wfsUrl");
    const weightField = document.getElementById("weightFieldSelect").value;
    const blur = parseInt(document.getElementById("blurRange").value, 10);
    const radius = parseInt(document.getElementById("radiusRange").value, 10);

    if (window.heatmapLayer) map.removeLayer(window.heatmapLayer);

    const vectorSource = new VectorSource({
      url: wfsUrl,
      format: new GeoJSON(),
    });
    let minWeight, maxWeight;

    window.heatmapLayer = new Heatmap({
      source: vectorSource,
      blur: blur,
      radius: radius,
      weight: (f) => {
        if (!weightField) return 1; // uniform heatmap
        const raw = parseFloat(f.get(weightField));
        if (isNaN(raw)) return 0;
        console.log(minWeight, maxWeight);

        // Normalize between 0 and 1 based on actual dataset range
        return (raw - minWeight) / (maxWeight - minWeight);
      },
      title: "Heatmap Layer",
    });

    map.addLayer(window.heatmapLayer);
    window.heatmapLayer.setZIndex(98);

    // Wait until source loads features
    vectorSource.on("change", () => {
      if (vectorSource.getState() !== "ready") return;

      const featuresHeatmap = vectorSource.getFeatures();
      if (!featuresHeatmap.length) return;

      if (!weightField) {
        // Uniform weights (all 1)
        minWeight = 0;
        maxWeight = 1;
      } else {
        const weights = featuresHeatmap.map(
          (f) => parseFloat(f.get(weightField)) || 0
        );
        minWeight = Math.min(...weights);
        maxWeight = Math.max(...weights);
      }

      const legendMinEl = document.getElementById("legendMin");
      const legendMaxEl = document.getElementById("legendMax");
      const heatmapLegend = document.getElementById("heatmapLegend");

      legendMinEl.textContent = `Min: ${minWeight}`;
      legendMaxEl.textContent = `Max: ${maxWeight}`;
      heatmapLegend.style.display = "block";
    });

    heatmapModal.close();
  });

document.getElementById("closeHeatmapBtn").addEventListener("click", () => {
  heatmapModal.close();
});

document.getElementById("resetHeatmapBtn").addEventListener("click", () => {
  if (window.heatmapLayer) {
    map.removeLayer(window.heatmapLayer);
    window.heatmapLayer = null;
  }
  document.getElementById("heatmapForm").reset();
  document.getElementById("heatmapLegend").style.display = "none";
});

// REACHABILITY

const reachabilityBtn = document.getElementById("reachabilityBtn");
const reachabilityModal = document.getElementById("reachabilityModal");
const closeReachabilityBtn = document.getElementById("closeReachabilityBtn");

reachabilityBtn.addEventListener("click", () => {
  reachabilityModal.showModal();
});

closeReachabilityBtn.addEventListener("click", () => {
  reachabilityModal.close();
});

const inputModeSelect = document.getElementById("inputMode");
const layerSelectContainer = document.getElementById("layerSelectContainer");

inputModeSelect.addEventListener("change", () => {
  const isClickMode = inputModeSelect.value === "click";
  layerSelectContainer.style.display = isClickMode ? "none" : "block";

  if (isClickMode) {
    reachabilityModal.close();
  }
});

let mapClickCoordinate = null;

map.on("click", function (evt) {
  if (inputModeSelect.value === "click") {
    // mapClickCoordinate = toLonLat(evt.coordinate);
    mapClickCoordinate = evt.coordinate; // This stays in EPSG:3857
    const [x, y] = mapClickCoordinate;

    document.getElementById(
      "clickCoordDisplay"
    ).textContent = `Start Point: ${x.toFixed(5)}, ${y.toFixed(5)}`;

    reachabilityModal.showModal();
  }
});

// === Submit Handler ===
document
  .getElementById("reachabilityForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    map.removeLayer(window.reachabilityLayer);

    const travelMode = document.getElementById("travelMode").value;
    const rangeType = document.getElementById("rangeType").value;
    const rawInput = document.getElementById("rangeValues").value;

    const rangeValues = rawInput
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((n) => !isNaN(n))
      .sort((a, b) => b - a); // max to min

    let origins = [];

    if (inputModeSelect.value === "click") {
      if (!mapClickCoordinate) {
        alert("Please click on the map to set a start point.");
        return;
      }
      origins = [mapClickCoordinate];
    } else {
      const layerIdx = parseInt(
        document.getElementById("originLayerSelect").value,
        10
      );
      const selectedLayer = layersArray[layerIdx];

      const layerParams = selectedLayer.getSource().getParams().LAYERS;
      const [workspace, layerName] = layerParams.split(":");
      const cqlFilter = selectedLayer.getSource().getParams().CQL_FILTER;

      let wfsUrl =
        `http://${host}:${port}/geoserver/${workspace}/ows?` +
        `service=WFS&version=1.1.0&request=GetFeature` +
        `&typeName=${workspace}:${layerName}` +
        `&outputFormat=application/json&srsName=EPSG:3857`;

      if (cqlFilter) {
        wfsUrl += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
      }
      console.log(wfsUrl);

      const response = await fetch(wfsUrl);
      const geojson = await response.json();

      const features = new GeoJSON().readFeatures(geojson, {
        dataProjection: "EPSG:3857",
        featureProjection: map.getView().getProjection(),
      });

      if (!features.length) {
        alert("No features found in the selected layer.");
        return;
      }
      // Assuming these are points
      origins = features.map((f) => f.getGeometry().getCoordinates());
    }

    const allFeatures = [];

    const url = `https://api.openrouteservice.org/v2/isochrones/${travelMode}`;
    const apiKey =
      "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFhZjdlYThlODJiOWEyYmY5MTk4MzU1OTk5ODZiMGFhMTg2OTBkNmZiYTJmNzgxNGU1ZDlmODYwIiwiaCI6Im11cm11cjY0In0=";

    for (const origin of origins) {
      const location4326 = toLonLat(origin);
      const body = {
        locations: [location4326],
        range:
          rangeType === "time" ? rangeValues.map((v) => v * 60) : rangeValues,
        range_type: rangeType,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const geojson = await res.json();
      const features = new GeoJSON().readFeatures(geojson, {
        dataProjection: "EPSG:4326",
        featureProjection: map.getView().getProjection(),
      });

      allFeatures.push(...features);
    }
    const reachabilitySource = new VectorSource({
      features: allFeatures,
    });

    const colors = rangeValues.map((_, i) => {
      const hue = 240 - (i * 240) / rangeValues.length;
      return `hsla(${hue}, 100%, 50%, 0.4)`;
    });

    window.reachabilityLayer = new VectorLayer({
      source: reachabilitySource,
      style: (feature) => {
        const value = feature.get("value");
        const userIndex =
          rangeType === "time"
            ? rangeValues.indexOf(value / 60)
            : rangeValues.indexOf(value);

        return new Style({
          fill: new Fill({ color: colors[userIndex] || "rgba(0,0,0,0.2)" }),
          stroke: new Stroke({ color: "#333", width: 1.5 }),
          zIndex: 100 + userIndex,
        });
      },
    });

    map.addLayer(window.reachabilityLayer);
    map
      .getView()
      .fit(reachabilitySource.getExtent(), { padding: [50, 50, 50, 50] });

    // === Update Legend ===
    const legendList = document.getElementById("reachabilityLegendList");
    legendList.innerHTML = "";
    const legendBox = document.querySelector("#reachabilityLegend h4");
    const modeLabel = {
      "foot-walking": "🚶 Walking",
      "driving-car": "🚗 Driving",
      "cycling-regular": "🚴 Riding",
    };

    legendBox.textContent = `Reachability - ${
      modeLabel[travelMode] || travelMode
    }`;

    const sortedForLegend = [...rangeValues].sort((a, b) => a - b);
    sortedForLegend.forEach((val) => {
      const label = rangeType === "time" ? `${val} ⏱️ min` : `${val} 📏 m`;
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.marginBottom = "4px";

      const swatch = document.createElement("span");
      swatch.style.width = "16px";
      swatch.style.height = "16px";
      swatch.style.backgroundColor = colors[rangeValues.indexOf(val)];
      swatch.style.marginRight = "8px";
      swatch.style.border = "1px solid #ccc";

      li.appendChild(swatch);
      li.appendChild(document.createTextNode(label));
      legendList.appendChild(li);
    });

    document.getElementById("reachabilityLegend").style.display = "block";
    reachabilityModal.close();
  });

function populateReachabilityOriginLayers() {
  const originSelect = document.getElementById("originLayerSelect");
  originSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer...";
  originSelect.appendChild(defaultOption);

  layersArray.forEach((layer, index) => {
    if (!layer.getVisible()) return;

    const source = layer.getSource?.();
    const params = source?.getParams?.();
    const url = source?.getUrl?.();

    if (!params?.LAYERS || !url || !url.includes("/geoserver")) return;

    const option = document.createElement("option");
    option.value = index;
    option.text = layer.get("title") || `Layer ${index}`;
    option.setAttribute("data-layername", params.LAYERS);
    option.setAttribute("data-wfsurl", url.replace("wms", "wfs"));
    originSelect.appendChild(option);
  });
}

inputModeSelect.addEventListener("change", () => {
  const showLayerMode = inputModeSelect.value === "layer";
  layerSelectContainer.style.display = showLayerMode ? "block" : "none";
  if (showLayerMode) populateReachabilityOriginLayers();
});

document
  .getElementById("resetReachabilityBtn")
  .addEventListener("click", () => {
    // Reset all form fields
    document.getElementById("reachabilityForm").reset();

    // Hide layer selector again
    document.getElementById("layerSelectContainer").style.display = "none";

    // Clear coordinate display
    document.getElementById("clickCoordDisplay").textContent = "";

    // Remove reachability layer from map if exists
    if (window.reachabilityLayer) {
      map.removeLayer(window.reachabilityLayer);
      window.reachabilityLayer = null;
    }

    // Hide and clear the legend
    const legendBox = document.getElementById("reachabilityLegend");
    legendBox.style.display = "none";
    document.getElementById("reachabilityLegendList").innerHTML = "";

    // Clear selected map point
    mapClickCoordinate = null;
  });

//Site Selection
// Elements
const siteSelectionBtn = document.getElementById("site-selection");
const siteSelectionModal = document.getElementById("siteSelectionModal");

const demandSelect = document.getElementById("demandLayerSelect");
const facilitiesSelect = document.getElementById("existingLayerSelect");

const candidateLayerType = document.getElementById("candidateLayerType");
const candidateLayerNameWrapper = document.getElementById(
  "candidateLayerNameWrapper"
);
const candidateLayerSelectWrapper = document.getElementById(
  "candidateLayerSelectWrapper"
);
const candidateLayerSelect = document.getElementById("candidateLayerSelect");

const closeModalBtn = document.getElementById("closeSiteSelection");
const runBtn = document.getElementById("runSiteSelection");

// Populate dropdowns with visible WMS layers
function populateSiteSelectionLayers() {
  demandSelect.innerHTML = "";
  facilitiesSelect.innerHTML = "";
  candidateLayerSelect.innerHTML = "";

  const makeDefaultOption = (text) => {
    const opt = document.createElement("option");
    opt.value = "";
    opt.text = text;
    return opt;
  };

  demandSelect.appendChild(makeDefaultOption("Select demand layer..."));
  facilitiesSelect.appendChild(makeDefaultOption("Select facilities layer..."));
  candidateLayerSelect.appendChild(
    makeDefaultOption("Select candidate layer...")
  );

  layersArray.forEach((layer, index) => {
    if (!layer.getVisible()) return;

    const source = layer.getSource?.();
    const params = source?.getParams?.();
    const url = source?.getUrl?.();

    // Only GeoServer WMS layers
    if (!params?.LAYERS || !url || !url.includes("/geoserver")) return;

    const title = layer.get("title") || `Layer ${index}`;

    const optionDemand = document.createElement("option");
    optionDemand.value = index;
    optionDemand.text = title;
    optionDemand.setAttribute("data-layername", params.LAYERS);
    optionDemand.setAttribute("data-wfsurl", url.replace("wms", "wfs"));

    const optionFacilities = optionDemand.cloneNode(true);
    const optionCandidate = optionDemand.cloneNode(true);

    demandSelect.appendChild(optionDemand);
    facilitiesSelect.appendChild(optionFacilities);
    candidateLayerSelect.appendChild(optionCandidate);
  });
}

// Handle candidate layer type change
candidateLayerType.addEventListener("change", () => {
  if (candidateLayerType.value === "new") {
    candidateLayerNameWrapper.style.display = "block";
    candidateLayerSelectWrapper.style.display = "none";
  } else {
    candidateLayerNameWrapper.style.display = "none";
    candidateLayerSelectWrapper.style.display = "block";
    populateSiteSelectionLayers(); // Refresh options
  }
});

// Open modal
siteSelectionBtn.addEventListener("click", () => {
  populateSiteSelectionLayers();
  siteSelectionModal.style.display = "block";
});

// Close modal
closeModalBtn.addEventListener("click", () => {
  siteSelectionModal.style.display = "none";
});

// Run site selection
runBtn.addEventListener("click", () => {
  let candidateLayerName;
  if (candidateLayerType.value === "new") {
    candidateLayerName = document.getElementById("candidateLayerName").value;
  } else {
    candidateLayerName =
      candidateLayerSelect.options[
        candidateLayerSelect.selectedIndex
      ].dataset.layername.split(":")[1];
  }

  const demandLayer =
    demandSelect.options[demandSelect.selectedIndex].dataset.layername.split(
      ":"
    )[1];
  const facilitiesLayer = facilitiesSelect?.options[
    facilitiesSelect.selectedIndex
  ]?.dataset?.layername
    ? facilitiesSelect.options[
        facilitiesSelect.selectedIndex
      ].dataset.layername.split(":")[1]
    : null;

  const D = parseFloat(document.getElementById("paramD").value);
  const minLib = parseFloat(document.getElementById("paramMinLib").value);
  const grid = parseFloat(document.getElementById("paramGrid").value);
  const K = parseInt(document.getElementById("paramK").value);

  console.log("Candidate Layer Name:", candidateLayerName);
  console.log("Demand Layer:", demandLayer);
  console.log("Facilities Layer:", facilitiesLayer);
  console.log("Parameters:", { D, minLib, grid, K });

  fetch("http://localhost:8000/api/site-selection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidateLayerName,
      demandLayer,
      facilitiesLayer,
      D,
      minLib,
      grid,
      K,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Site selection completed", data);
      siteSelectionModal.style.display = "none";
    });
});

// X/Y POINTS INPUT
let xyPoints = [];

// open modal when button clicked
document.getElementById("add-xy").addEventListener("click", () => {
  xyPoints = [];
  document.getElementById("xyPointList").innerHTML = "";
  document.getElementById("xyModal").style.display = "block";
});

// close modal
document.getElementById("xyClose").addEventListener("click", () => {
  document.getElementById("xyModal").style.display = "none";
});

// add point
document.getElementById("xyAddPoint").addEventListener("click", () => {
  const x = parseFloat(document.getElementById("xyX").value);
  const y = parseFloat(document.getElementById("xyY").value);

  if (isNaN(x) || isNaN(y)) {
    alert("⚠️ Please enter valid coordinates.");
    return;
  }

  xyPoints.push({ x, y });

  const li = document.createElement("li");
  li.textContent = `X: ${x}, Y: ${y}`;
  document.getElementById("xyPointList").appendChild(li);

  // clear inputs
  document.getElementById("xyX").value = "";
  document.getElementById("xyY").value = "";
});

const labelX = document.querySelector("label[for='xyX']");
const labelY = document.querySelector("label[for='xyY']");
const projectionSelect = document.getElementById("xyProjection");

function updateXYLabels() {
  if (projectionSelect.value === "EPSG:4326") {
    labelX.textContent = "Longitude:";
    labelY.textContent = "Latitude:";
  } else {
    labelX.textContent = "X:";
    labelY.textContent = "Y:";
  }
}

// run once when modal opens (pre-select 4326)
document.getElementById("add-xy").addEventListener("click", () => {
  document.getElementById("xyModal").style.display = "block";
  updateXYLabels(); // set initial labels
});

// listen for changes
projectionSelect.addEventListener("change", updateXYLabels);

// create layer
document.getElementById("xyCreateLayer").addEventListener("click", () => {
  const inputCrs = document.getElementById("xyProjection").value;

  const mapCrs = map.getView().getProjection(); // usually EPSG:3857

  if (xyPoints.length === 0) {
    alert("⚠️ No points added!");
    return;
  }

  // Build point features
  const pointFeatures = xyPoints.map((c) => {
    const coords = transform([c.x, c.y], inputCrs, mapCrs);
    return new Feature({
      geometry: new Point(coords),
    });
  });

  // Vector source
  const vectorSource = new VectorSource({
    features: pointFeatures,
  });

  // Style
  const pointStyle = new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: "red" }),
      stroke: new Stroke({ color: "#fff", width: 2 }),
    }),
  });

  // Vector layer
  const pointLayer = new VectorLayer({
    source: vectorSource,
    style: pointStyle,
  });

  // Add to map
  map.addLayer(pointLayer);

  // Zoom to extent
  map.getView().fit(vectorSource.getExtent(), {
    padding: [20, 20, 20, 20],
  });

  console.log("✅ Point layer added with", xyPoints.length, "points");

  // Close modal
  document.getElementById("xyModal").style.display = "none";
});

// _________________________________________________________________________________
