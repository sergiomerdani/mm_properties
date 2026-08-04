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
import {
  altKeyOnly,
  platformModifierKeyOnly,
  always,
  shiftKeyOnly,
} from "ol/events/condition";
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
import {
  GeometryCollection,
  LinearRing,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Circle,
} from "ol/geom.js";
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
import ImageStatic from "ol/source/ImageStatic.js";
import { Image as ImageLayer } from "ol/layer.js";
import ol_control_Graticule from "ol-ext/control/Graticule";
import ol_control_FeatureList from "ol-ext/control/FeatureList";
import WMSCapabilities from "ol/format/WMSCapabilities";
import Cluster from "ol/source/Cluster";
import { bbox, bbox as bboxStrategy } from "ol/loadingstrategy";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import MVT from "ol/format/MVT";
import WFS from "ol/format/WFS";
import ol_style_Chart from "ol-ext/style/Chart";
import TileArcGISRest from "ol/source/TileArcGISRest.js";
import ImageArcGISRest from "ol/source/ImageArcGISRest.js";
import Heatmap from "ol/layer/Heatmap.js";
import { toLonLat } from "ol/proj";
import ol_interaction_SnapGuides from "ol-ext/interaction/SnapGuides";
import DragBox from "ol/interaction/DragBox.js";
import Translate from "ol/interaction/Translate.js";
import Collection from "ol/Collection.js";
import ol_interaction_Transform from "ol-ext/interaction/Transform.js";
import ol_interaction_CopyPaste from "ol-ext/interaction/CopyPaste.js";
import { getCenter } from "ol/extent";
import EsriJSON from "ol/format/EsriJSON.js";

proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
register(proj4);

proj4.defs(
  "EPSG:6870",
  "+proj=tmerc +lat_0=0 +lon_0=20 +k=1 +x_0=500000 +y_0=0 +ellps=GRS8082 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);
register(proj4);

proj4.defs(
  "EPSG:32634",
  "+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs +type=crs",
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

// Map usernames to roles
const roleMap = {
  admin: "superAdmin",
  user_reader: "reader",
  user_editor: "editor",
  user_admin: "admin",
};

const role = roleMap[username] || "reader";

let layerGroupName,
  layerParams,
  layersArray = [];

function shouldAutoLoadWorkspaceLayerGroups() {
  return workspaceName !== "test";
}

// === Backend Admin Loader ===
function loadAdminLayers() {
  if (!shouldAutoLoadWorkspaceLayerGroups()) {
    console.log("Skipping automatic layer group loading for test workspace.");
    return;
  }

  const apiUrl = `http://${host}:${port}/geoserver/rest/workspaces/${workspaceName}/layergroups`;
  console.log("loading admin layers...");
  fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${username}:${password}`),
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
            Authorization: "Basic " + btoa(`${username}:${password}`),
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
                  url: `http://localhost:8000/geoserver-proxy/test/wms`,
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
            console.error(
              "There was a problem with the fetch operation:",
              error,
            );
          });
      });
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

// === Reader/Editor/Admin Loader ===
function loadUserLayers() {
  const capabilitiesUrl = `http://localhost:8000/geoserver-proxy/${workspaceName}/wms?SERVICE=WMS&REQUEST=GetCapabilities`;
  console.log("loading user layers...");
  fetch(capabilitiesUrl, {
    method: "GET",
    headers: { Accept: "application/xml" },
  })
    .then((response) => response.text())
    .then((xmlText) => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "text/xml");

      const capability = xml.getElementsByTagName("Capability")[0];
      const rootLayer = capability.getElementsByTagName("Layer")[0];

      // Collect names of group children
      const groupChildren = new Set();
      const allLayers = rootLayer.getElementsByTagName("Layer");
      Array.from(allLayers).forEach((ln) => {
        const parent = ln.parentNode;
        if (parent !== rootLayer) {
          const n = ln.getElementsByTagName("Name")[0];
          if (n) groupChildren.add(n.textContent);
        }
      });

      // Loop through root children
      Array.from(rootLayer.children).forEach((layerNode) => {
        if (layerNode.tagName !== "Layer") return;

        const nameNode = layerNode.getElementsByTagName("Name")[0];
        const titleNode = layerNode.getElementsByTagName("Title")[0];
        if (!nameNode) return;

        const layerName = nameNode.textContent; // this might already include workspace
        const layerTitle = titleNode ? titleNode.textContent : layerName;

        // Ensure it has workspace prefix
        const qualifiedName = layerName.includes(":")
          ? layerName
          : `${workspaceName}:${layerName}`;

        if (groupChildren.has(layerName)) return; // skip duplicates

        const childLayers = Array.from(layerNode.children).filter(
          (el) => el.tagName === "Layer",
        );

        if (childLayers.length > 0) {
          if (!shouldAutoLoadWorkspaceLayerGroups()) return;

          const newLayerGroup = new LayerGroup({
            title: layerTitle,
            displayInLayerSwitcher: true,
            layers: [],
          });

          childLayers.forEach((childNode) => {
            const childName = childNode.getElementsByTagName("Name")[0];
            const childTitle = childNode.getElementsByTagName("Title")[0];
            if (!childName) return;

            const childLayer = new ImageLayer({
              source: new ImageWMS({
                url: `http://localhost:8000/geoserver-proxy/${workspaceName}/wms`,
                params: { LAYERS: childName.textContent, VERSION: "1.1.1" },
                ratio: 1,
                serverType: "geoserver",
                crossOrigin: "anonymous",
              }),
              title: childTitle
                ? childTitle.textContent
                : childName.textContent,
              visible: false,
              displayInLayerSwitcher: true,
            });

            newLayerGroup.getLayers().push(childLayer);
          });

          map.addLayer(newLayerGroup);
          layersArray.push(newLayerGroup);
        } else {
          const tileLayer = new ImageLayer({
            source: new ImageWMS({
              url: `http://localhost:8000/geoserver-proxy/${workspaceName}/wms`,
              params: { LAYERS: qualifiedName, VERSION: "1.1.1" },
              ratio: 1,
              serverType: "geoserver",
              crossOrigin: "anonymous",
            }),
            title: layerTitle,
            visible: false,
            displayInLayerSwitcher: true,
          });

          map.addLayer(tileLayer);
          layersArray.push(tileLayer);
        }
      });
    })
    .catch((err) => console.error("Error in GetCapabilities:", err));
}

if (role === "superAdmin") {
  loadAdminLayers();
} else {
  loadUserLayers();
}

// Make a GET request to the API
// fetch(apiUrl, {
//   method: "GET",
//   // mode: "no-cors",
//   headers: {
//     Authorization: "Basic " + btoa(`${username}:${password}`),
//     Accept: "application/json",
//   },
//   credentials: "include",
// })
//   .then((response) => {
//     // Check if the response is successful (status code 200-299)
//     if (!response.ok) {
//       throw new Error("Network response was not ok");
//     }
//     // Parse the response as JSON
//     return response.json();
//   })
//   .then((data) => {
//     const layerGroups = data.layerGroups.layerGroup;
//     layerGroups.forEach((layerGroup) => {
//       layerGroupName = layerGroup.name;
//       const constLayerGroup = camelCase(layerGroupName);
//       const newLayerGroup = new LayerGroup({
//         layers: [],
//         title: layerGroupName,
//         displayInLayerSwitcher: true,
//       });
//       map.addLayer(newLayerGroup);
//       layerGroupsArray.push(newLayerGroup);
//       const apiUrlLayerGroups =
//         apiUrl + "/" + encodeURIComponent(layerGroupName);

//       fetch(apiUrlLayerGroups, {
//         method: "GET",
//         // mode: "no-cors",
//         headers: {
//           Authorization: "Basic " + btoa(`${username}:${password}`),
//           Accept: "application/json",
//         },
//         credentials: "include",
//       })
//         .then((response) => {
//           if (!response.ok) {
//             throw new Error("Network response was not ok");
//           }
//           return response.json();
//         })
//         .then((data) => {
//           const layers = data.layerGroup.publishables.published;
//           const normalizedLayers = Array.isArray(layers) ? layers : [layers];
//           normalizedLayers.forEach((layer) => {
//             layerParams = layer.name;
//             const { workspace2, layerName2, layerTitle2 } =
//               parseLayerInfo(layerParams);

//             const tileLayer = new ImageLayer({
//               source: new ImageWMS({
//                 url: `http://localhost:8000/geoserver-proxy/test/wms`,
//                 params: {
//                   LAYERS: layerParams,
//                   VERSION: "1.1.1",
//                 },
//                 ratio: 1,
//                 serverType: "geoserver",
//                 crossOrigin: "anonymous",
//               }),
//               visible: true,
//               title: layerTitle2,
//               information: "Kufiri i tokësor i republikës së Shqipërisë",
//               displayInLayerSwitcher: true,
//             });
//             newLayerGroup.getLayers().push(tileLayer);
//             layersArray.push(tileLayer);
//           });
//         })
//         .catch((error) => {
//           console.error("There was a problem with the fetch operation:", error);
//         });
//     });
//   })
//   .catch((error) => {
//     console.error("There was a problem with the fetch operation:", error);
//   });

// Logged in As USER - Reading data

// const capabilitiesUrl = `http://localhost:8000/geoserver-proxy/${workspaceName}/wms?SERVICE=WMS&REQUEST=GetCapabilities`;

// fetch(capabilitiesUrl, {
//   method: "GET",
//   headers: { Accept: "application/xml" },
// })
//   .then((response) => response.text())
//   .then((xmlText) => {
//     const parser = new DOMParser();
//     const xml = parser.parseFromString(xmlText, "text/xml");

//     const capability = xml.getElementsByTagName("Capability")[0];
//     const rootLayer = capability.getElementsByTagName("Layer")[0];

//     // Step 1: collect names of all group children
//     const groupChildren = new Set();
//     const allLayers = rootLayer.getElementsByTagName("Layer");
//     Array.from(allLayers).forEach((ln) => {
//       const parent = ln.parentNode;
//       if (parent !== rootLayer) {
//         const n = ln.getElementsByTagName("Name")[0];
//         if (n) groupChildren.add(n.textContent);
//       }
//     });

//     // Step 2: loop through direct children of root
//     Array.from(rootLayer.children).forEach((layerNode) => {
//       if (layerNode.tagName !== "Layer") return;

//       const nameNode = layerNode.getElementsByTagName("Name")[0];
//       const titleNode = layerNode.getElementsByTagName("Title")[0];
//       if (!nameNode) return;

//       const layerName = nameNode.textContent;
//       const layerTitle = titleNode ? titleNode.textContent : layerName;

//       // Skip if this layer is already a child of a group
//       if (groupChildren.has(layerName)) return;

//       // Check if it’s a group (has direct child Layers)
//       const childLayers = Array.from(layerNode.children).filter(
//         (el) => el.tagName === "Layer"
//       );

//       if (childLayers.length > 0) {
//         // Build a LayerGroup
//         const newLayerGroup = new LayerGroup({
//           title: layerTitle,
//           displayInLayerSwitcher: true,
//           layers: [],
//         });

//         childLayers.forEach((childNode) => {
//           const childName = childNode.getElementsByTagName("Name")[0];
//           const childTitle = childNode.getElementsByTagName("Title")[0];
//           if (!childName) return;

//           const childLayer = new ImageLayer({
//             source: new ImageWMS({
//               url: `http://localhost:8000/geoserver-proxy/${workspaceName}/wms`,
//               params: { LAYERS: childName.textContent, VERSION: "1.1.1" },
//               ratio: 1,
//               serverType: "geoserver",
//               crossOrigin: "anonymous",
//             }),
//             title: childTitle ? childTitle.textContent : childName.textContent,
//             visible: false,
//             displayInLayerSwitcher: true,
//           });

//           newLayerGroup.getLayers().push(childLayer);
//         });

//         map.addLayer(newLayerGroup);
//         layersArray.push(newLayerGroup);
//       } else {
//         // Single standalone layer
//         const tileLayer = new ImageLayer({
//           source: new ImageWMS({
//             url: `http://localhost:8000/geoserver-proxy/${workspaceName}/wms`,
//             params: { LAYERS: layerName, VERSION: "1.1.1" },
//             ratio: 1,
//             serverType: "geoserver",
//             crossOrigin: "anonymous",
//           }),
//           title: layerTitle,
//           visible: false,
//           displayInLayerSwitcher: true,
//         });

//         map.addLayer(tileLayer);
//         layersArray.push(tileLayer);
//       }
//     });
//   })
//   .catch((error) => console.error("Error in GetCapabilities:", error));

//creating attribution control for ol
const attributionControl = new Attribution({
  collapsible: true,
});

// Zoom Extent ol-Control
const zoomExtentBtn = document.getElementById("zoom-extent");

zoomExtentBtn.addEventListener("click", function () {
  const view = map.getView();
  const savedView = getInitialMapViewState();
  const viewProjection = view.getProjection().getCode();
  const savedProjection = savedView.projection || defaultMapProjection;
  const center =
    savedProjection === viewProjection
      ? savedView.center
      : transform(savedView.center, savedProjection, viewProjection);

  view.animate({
    center,
    zoom: savedView.zoom,
    duration: 500,
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

const projectionDisplayNames = {
  "EPSG:3857": "Web Mercator",
  "EPSG:4326": "WGS84",
  "EPSG:6870": "KRGJSH",
  "EPSG:32634": "UTM 34N",
};

function formatMapCoordinate(coordinate) {
  const projectionCode =
    map?.getView?.().getProjection?.().getCode?.() || defaultMapProjection;
  const decimals = projectionCode === "EPSG:4326" ? 6 : 2;
  const label = projectionDisplayNames[projectionCode] || projectionCode;
  return `${label} (${projectionCode}) : ${toStringXY(coordinate, decimals)}`;
}

//MousePosition Coordinates
const mousePositionControl = new MousePosition({
  coordinateFormat: formatMapCoordinate,
  className: "custom-mouse-position",
});

//Rotate COntrol
const rotate = new Rotate();

//DRAGPAN MAP
// const dragPanBtn = document.getElementById("pan");

// const dragPan = new DragPan({
//   condition: function (event) {
//     return platformModifierKeyOnly(event);
//   },
// });

// dragPanBtn.addEventListener("click", function () {
//   map.addInteraction(dragPan);
// });

// Adding controls in a variable
const mapControls = [
  attributionControl,
  fullScreenControl,
  mousePositionControl,
  rotate,
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

const satelliteImageryBaseLayer = new TileLayer({
  source: new XYZ({
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attributions: "Tiles (c) Esri",
    crossOrigin: "anonymous",
  }),
  visible: false,
  title: "Satellite Imagery",
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

const asigAkptWmsUrl = "https://geoportal.asig.gov.al/service/akpt/wms";

const kategoritePropozuaraLayer = new ImageLayer({
  title: "Kategorite propozuara perdorimit te tokes",
  visible: false,
  displayInLayerSwitcher: true,
  source: new ImageWMS({
    url: asigAkptWmsUrl,
    params: {
      LAYERS: "kategorite_propozuara_perdorimit_te_tokes",
      FORMAT: "image/png",
      TRANSPARENT: true,
      VERSION: "1.1.1",
    },
    serverType: "geoserver",
    crossOrigin: "anonymous",
  }),
});

const kufiNjesieStrukturoreLayer = new ImageLayer({
  title: "Kufi njesie strukturore dhe perdorimi i tokes INSPIRE",
  visible: false,
  displayInLayerSwitcher: true,
  source: new ImageWMS({
    url: asigAkptWmsUrl,
    params: {
      LAYERS: "kufi_njesie_strukturore_dhe_perdorimi_i_tokes_inspire",
      FORMAT: "image/png",
      TRANSPARENT: true,
      VERSION: "1.1.1",
    },
    serverType: "geoserver",
    crossOrigin: "anonymous",
  }),
});

//EXTRA LAYER FOR CRUD
const wfsLayerUrl = `http://${host}:${port}/geoserver/${workspaceName}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=`;
const wfsLayerUrlEnd = "&maxFeatures=50&outputFormat=application/json";

let wfsVectorLayer, wfsVectorSource;
let isLocalVectorEdit = false;
let originalVectorLayerStyle = null;
let editLayerProjection = "EPSG:3857";
let editMapProjection = "EPSG:3857";

function getGeoServerProxyOwsUrl(workspace = workspaceName) {
  return `http://localhost:8000/geoserver-proxy/${workspace}/ows`;
}

function getWfsGetFeatureUrl({
  typeName,
  workspace = workspaceName,
  version = "1.1.0",
  maxFeatures,
  outputFormat = "application/json",
  srsName,
  cqlFilter,
}) {
  const params = new URLSearchParams({
    service: "WFS",
    version,
    request: "GetFeature",
    typeName,
    outputFormat,
  });

  if (maxFeatures) {
    params.set("maxFeatures", String(maxFeatures));
  }

  if (srsName) {
    params.set("srsName", srsName);
  }

  if (cqlFilter) {
    params.set("cql_filter", cqlFilter);
  }

  return `${getGeoServerProxyOwsUrl(workspace)}?${params}`;
}

//LAYER GROUPS
baseLayerGroup = new LayerGroup({
  layers: [cartoDBBaseLayer, osmMap, satelliteImageryBaseLayer],
  title: "Base Layers",
  information:
    "Këto shtresa shtresat bazë të hartës të cilat mund të aktivizohen veç e veç",
  displayInLayerSwitcher: true,
});

baseLayerGroup.getLayers().forEach(watchBaseLayerForCesium);
baseLayerGroup.getLayers().on("add", (event) => {
  watchBaseLayerForCesium(event.element);
  if (event.element?.getVisible?.()) {
    setCesiumBaseLayerFromOpenLayers(event.element);
  }
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

const planifikimiLayers = new LayerGroup({
  layers: [kategoritePropozuaraLayer, kufiNjesieStrukturoreLayer],
  title: "Planifikimi",
  displayInLayerSwitcher: true,
});

const referencePriceStyle = new Style({
  fill: new Fill({ color: "rgba(26, 115, 232, 0.16)" }),
  stroke: new Stroke({ color: "#1a73e8", width: 1.5 }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: "#1a73e8" }),
    stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
  }),
});

function getNumericPropertyByName(feature, patterns) {
  const props = feature.getProperties();

  for (const [key, value] of Object.entries(props)) {
    if (key === "geometry") continue;
    const normalizedKey = key.toLowerCase();
    const matches = patterns.some((pattern) => normalizedKey.includes(pattern));
    const numericValue =
      typeof value === "number"
        ? value
        : Number(String(value).replace(",", "."));

    if (matches && Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
}

function getNumericFeatureValueForYear(feature, year) {
  return getNumericPropertyByName(feature, [String(year)]);
}

function getLabelProperty(feature) {
  const props = feature.getProperties();
  const preferredKeys = [
    "name",
    "Name",
    "NAME",
    "emri",
    "Emri",
    "EMRI",
    "label",
    "Label",
    "LABEL",
  ];

  for (const key of preferredKeys) {
    if (props[key]) return String(props[key]);
  }

  return "";
}

function getReferenceZone2025Color(value) {
  if (!Number.isFinite(value)) return "rgba(148, 163, 184, 0.2)";
  if (value >= 3000) return "rgba(127, 29, 29, 0.2)";
  if (value >= 2200) return "rgba(220, 38, 38, 0.2)";
  if (value >= 1600) return "rgba(249, 115, 22, 0.2)";
  if (value >= 1000) return "rgba(234, 179, 8, 0.2)";
  if (value >= 500) return "rgba(132, 204, 22, 0.2)";
  return "rgba(34, 197, 94, 0.2)";
}

function getReferenceZone2025Style(feature, resolution) {
  const value = getNumericPropertyByName(feature, ["2025"]);
  const label = resolution < 40 ? getLabelProperty(feature) : "";
  const fillColor = getReferenceZone2025Color(value);

  return new Style({
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: "rgba(51, 65, 85, 0.5)", width: 0.8 }),
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
    }),
    text: label
      ? new Text({
          text: label,
          font: "bold 11px Calibri,sans-serif",
          fill: new Fill({ color: "#0f172a" }),
          stroke: new Stroke({ color: "#ffffff", width: 3 }),
          overflow: true,
        })
      : undefined,
  });
}

const stadiaOpenMapTilesLayer = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    url: "https://tiles.stadiamaps.com/data/openmaptiles/{z}/{x}/{y}.pbf?api_key=6ec6da2c-3e7e-4b4d-8ef7-4ba39357c366",
  }),
  style: referencePriceStyle,
  visible: false,
  title: "Stadia OpenMapTiles",
  displayInLayerSwitcher: true,
});

const referenceZones2025Layer = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    url: "https://tiles.kaktu.al/data/reference_zones_2025/{z}/{x}/{y}.pbf",
  }),
  style: getReferenceZone2025Style,
  visible: false,
  title: "reference_zones_2025",
  displayInLayerSwitcher: true,
});

const center_4326 = [19.80835, 41.310824];
const center_3857 = [2206185.65, 5060810.15];
const saranda_center = [2226806.503832, 4847588.560703];
const mapSessionViewKey = "mmPropertiesMapView";
const defaultMapProjection = "EPSG:3857";

function getInitialMapViewState() {
  try {
    const savedView = JSON.parse(sessionStorage.getItem(mapSessionViewKey));
    const projection = savedView?.projection || defaultMapProjection;
    if (
      Array.isArray(savedView?.center) &&
      savedView.center.length === 2 &&
      Number.isFinite(savedView.center[0]) &&
      Number.isFinite(savedView.center[1]) &&
      Number.isFinite(savedView.zoom)
    ) {
      return {
        center: savedView.center,
        zoom: savedView.zoom,
        projection,
      };
    }
  } catch (error) {
    console.warn("Could not read saved map view:", error);
  }

  return {
    center: [0, 0],
    zoom: 2,
    projection: defaultMapProjection,
  };
}

const initialMapViewState = getInitialMapViewState();

const map = new Map({
  target: "map",
  controls: defaults({ attribution: false }).extend(mapControls),
  layers: [
    baseLayerGroup,
    asigLayers,
    addressSystem,
    planifikimiLayers,
    stadiaOpenMapTilesLayer,
    referenceZones2025Layer,
  ],
  view: new View({
    projection: initialMapViewState.projection,
    center: initialMapViewState.center,
    zoom: initialMapViewState.zoom,
    maxZoom: 20,
  }),
});

const cesiumContainer = document.getElementById("cesiumContainer");
const cesiumElevationTooltip = document.getElementById("cesiumElevationTooltip");
const toggle3dMapButton = document.getElementById("toggle3dMap");
const centerCesiumMapButton = document.getElementById("centerCesiumMap");
const resetCesiumGlobeButton = document.getElementById("resetCesiumGlobe");
const orientCesiumNorthButton = document.getElementById("orientCesiumNorth");
const toggleCesiumElevationButton = document.getElementById("toggleCesiumElevation");
const toggleCesiumTerrainButton = document.getElementById("toggleCesiumTerrain");
const toggleCesiumBuildingsButton = document.getElementById("toggleCesiumBuildings");
const toggleGooglePhotorealisticButton = document.getElementById(
  "toggleGooglePhotorealistic",
);
const toggleCesiumDrawFootprintButton = document.getElementById(
  "toggleCesiumDrawFootprint",
);
const cesiumDrawTypeSelect = document.getElementById("cesiumDrawType");
const toggleCesiumTransmissionPoleButton = document.getElementById(
  "toggleCesiumTransmissionPole",
);
const toggleCesiumTransmissionCableButton = document.getElementById(
  "toggleCesiumTransmissionCable",
);
const toggleCesiumManholeButton = document.getElementById("toggleCesiumManhole");
const toggleCesiumPipelineButton = document.getElementById("toggleCesiumPipeline");
const toggleHimareTerrainWmsButton = document.getElementById(
  "toggleHimareTerrainWms",
);
const toggleDhermiTerrainWmsButton = document.getElementById(
  "toggleDhermiTerrainWms",
);
const togglePalaseTerrainWmsButton = document.getElementById(
  "togglePalaseTerrainWms",
);
const toggleAshkTerrainWmsButton = document.getElementById(
  "toggleAshkTerrainWms",
);
const toggleQkdTerrainWmsButton = document.getElementById(
  "toggleQkdTerrainWms",
);
const toggleKufiNsTerrainWmsButton = document.getElementById(
  "toggleKufiNsTerrainWms",
);
const toggleKategoriTokeTerrainWmsButton = document.getElementById(
  "toggleKategoriTokeTerrainWms",
);
const himareTerrainOpacityInput = document.getElementById("himareTerrainOpacity");
const dhermiTerrainOpacityInput = document.getElementById("dhermiTerrainOpacity");
const palaseTerrainOpacityInput = document.getElementById("palaseTerrainOpacity");
const ashkTerrainOpacityInput = document.getElementById("ashkTerrainOpacity");
const qkdTerrainOpacityInput = document.getElementById("qkdTerrainOpacity");
const kufiNsTerrainOpacityInput = document.getElementById("kufiNsTerrainOpacity");
const kategoriTokeTerrainOpacityInput = document.getElementById(
  "kategoriTokeTerrainOpacity",
);
const cesiumProfileButton = document.getElementById("cesiumProfileButton");
const cesiumProfilePanel = document.getElementById("cesiumProfilePanel");
const cesiumProfileClose = document.getElementById("cesiumProfileClose");
const cesiumProfileStats = document.getElementById("cesiumProfileStats");
const cesiumProfileChartCanvas = document.getElementById("cesiumProfileChart");
const cesiumSiteTerrainButton = document.getElementById("cesiumSiteTerrainButton");
const cesiumSiteTerrainPanel = document.getElementById("cesiumSiteTerrainPanel");
const cesiumSiteTerrainClose = document.getElementById("cesiumSiteTerrainClose");
const cesiumSiteTerrainRun = document.getElementById("cesiumSiteTerrainRun");
const cesiumSiteTerrainSpacingInput = document.getElementById(
  "cesiumSiteTerrainSpacing",
);
const cesiumSiteTerrainTargetInput = document.getElementById(
  "cesiumSiteTerrainTarget",
);
const cesiumSiteProfileSpacingInput = document.getElementById(
  "cesiumSiteProfileSpacing",
);
const cesiumSiteProfileDirectionSelect = document.getElementById(
  "cesiumSiteProfileDirection",
);
const cesiumSiteProfileAngleInput = document.getElementById(
  "cesiumSiteProfileAngle",
);
const cesiumSiteProfilesRun = document.getElementById("cesiumSiteProfilesRun");
const cesiumSiteProfilesAnalyze = document.getElementById(
  "cesiumSiteProfilesAnalyze",
);
const cesiumSiteTerrainStatus = document.getElementById("cesiumSiteTerrainStatus");
const cesiumSiteTerrainResults = document.getElementById("cesiumSiteTerrainResults");
const cesiumSolarButton = document.getElementById("cesiumSolarButton");
const cesiumSolarPanel = document.getElementById("cesiumSolarPanel");
const cesiumSolarClose = document.getElementById("cesiumSolarClose");
const cesiumSolarDraw = document.getElementById("cesiumSolarDraw");
const cesiumSolarOptimize = document.getElementById("cesiumSolarOptimize");
const cesiumSolarClear = document.getElementById("cesiumSolarClear");
const cesiumSolarStatus = document.getElementById("cesiumSolarStatus");
const cesiumSolarResults = document.getElementById("cesiumSolarResults");
const cesiumSolarPanelWidthInput = document.getElementById("cesiumSolarPanelWidth");
const cesiumSolarPanelHeightInput = document.getElementById("cesiumSolarPanelHeight");
const cesiumSolarColumnGapInput = document.getElementById("cesiumSolarColumnGap");
const cesiumSolarRowGapInput = document.getElementById("cesiumSolarRowGap");
const cesiumSolarMarginInput = document.getElementById("cesiumSolarMargin");
const cesiumSolarMountHeightInput = document.getElementById("cesiumSolarMountHeight");
const cesiumSolarPanelTiltInput = document.getElementById("cesiumSolarPanelTilt");
const cesiumSolarPanelTiltValue = document.getElementById("cesiumSolarPanelTiltValue");
const cesiumSolarSideTiltInput = document.getElementById("cesiumSolarSideTilt");
const cesiumSolarSideTiltValue = document.getElementById("cesiumSolarSideTiltValue");
const cesiumSolarWattageInput = document.getElementById("cesiumSolarWattage");
const cesiumSolarDailyYieldInput = document.getElementById("cesiumSolarDailyYield");
const cesiumSolarPerformanceRatioInput = document.getElementById(
  "cesiumSolarPerformanceRatio",
);
const cesiumSunButton = document.getElementById("cesiumSunButton");
const cesiumSunPanel = document.getElementById("cesiumSunPanel");
const cesiumSunClose = document.getElementById("cesiumSunClose");
const cesiumSunDateInput = document.getElementById("cesiumSunDate");
const cesiumSunTimeZoneInput = document.getElementById("cesiumSunTimeZone");
const cesiumSunHourInput = document.getElementById("cesiumSunHour");
const cesiumSunHourValue = document.getElementById("cesiumSunHourValue");
const cesiumSunLightingInput = document.getElementById("cesiumSunLighting");
const cesiumSunShadowsInput = document.getElementById("cesiumSunShadows");
const cesiumSunPlay = document.getElementById("cesiumSunPlay");
const cesiumSunReset = document.getElementById("cesiumSunReset");
const cesiumSunStatus = document.getElementById("cesiumSunStatus");
const cesiumSunResults = document.getElementById("cesiumSunResults");
const cesiumIonAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZjlhZTVlOS1hZDg2LTQxNTgtYmFjYS1iYTRjNDcxOWFhNjQiLCJpZCI6MTE1MTg4LCJpYXQiOjE2Nzg0NjMyNTJ9.FntmGyy-qhgprvx60qrCryPonYG7hKjdxTi11M3j9yA";
let cesiumViewer = null;
let isCesiumMode = false;
let isCesiumTerrainEnabled = false;
let isCesiumBuildingsEnabled = false;
let isGooglePhotorealisticEnabled = false;
let cesiumWorldTerrainProviderPromise = null;
let cesiumOsmBuildingsTilesetPromise = null;
let cesiumOsmBuildingsTileset = null;
let googlePhotorealisticTilesetPromise = null;
let googlePhotorealisticTileset = null;
const cesiumBaseLayerByOlLayer = new WeakMap();
let cesiumBaseImageryLayer = null;
let isCesiumDrawFootprintMode = false;
let cesiumDrawHandler = null;
let cesiumDrawPositions = [];
let cesiumDrawPreviewPosition = null;
let cesiumDrawPolylineEntity = null;
let cesiumDrawPolygonEntity = null;
const cesiumDrawPointEntities = [];
const cesiumDrawnFeatures = [];
let isCesiumTransmissionPoleMode = false;
let isCesiumTransmissionCableMode = false;
let cesiumTransmissionPoleHandler = null;
let cesiumTransmissionCableHandler = null;
const cesiumTransmissionPoles = [];
const cesiumTransmissionCables = [];
const cesiumTransmissionSelectedPoles = [];
let isCesiumManholeMode = false;
let isCesiumPipelineMode = false;
let cesiumManholeHandler = null;
let cesiumPipelineHandler = null;
const cesiumManholes = [];
const cesiumPipelines = [];
const cesiumSelectedManholes = [];
let himareTerrainWmsLayer = null;
let isHimareTerrainWmsVisible = false;
let dhermiTerrainWmsLayer = null;
let isDhermiTerrainWmsVisible = false;
let palaseTerrainWmsLayer = null;
let isPalaseTerrainWmsVisible = false;
let ashkTerrainWmsLayer = null;
let isAshkTerrainWmsVisible = false;
let qkdTerrainWmsLayer = null;
let isQkdTerrainWmsVisible = false;
let kufiNsTerrainWmsLayer = null;
let isKufiNsTerrainWmsVisible = false;
let kategoriTokeTerrainWmsLayer = null;
let isKategoriTokeTerrainWmsVisible = false;
let cesiumProfileChart = null;
const cesiumTerrainAnalysisEntities = [];
const cesiumGeneratedProfileByEntityId = new globalThis.Map();
let cesiumProfileLinePickHandler = null;
let cesiumElevationTooltipHandler = null;
let isCesiumElevationTooltipEnabled = false;
let isCesiumSolarMode = false;
let isCesiumSolarRotating = false;
let isCesiumSolarDrawingFinished = false;
let cesiumSolarRotationStartAngleDegrees = 0;
let cesiumSolarRotationStartPointerAngleDegrees = 0;
let cesiumSolarHandler = null;
let cesiumSolarPositions = [];
let cesiumSolarPreviewPosition = null;
let cesiumSolarPolygonEntity = null;
let cesiumSolarOutlineEntity = null;
let cesiumSolarRotationHandleEntity = null;
const cesiumSolarPanelEntities = [];
let cesiumSolarPanelPrimitive = null;
let cesiumSolarSupportLegs = null;
let cesiumSolarLastLayout = null;
let cesiumSolarAngleDegrees = 0;
let cesiumSunPlayTimer = null;

function getTerrainOpacity(input) {
  const value = Number(input?.value);
  return Number.isFinite(value) ? value : 0.85;
}

function bindTerrainOpacitySlider(input, getLayer) {
  input?.addEventListener("input", () => {
    const layer = getLayer();
    if (layer) {
      layer.alpha = getTerrainOpacity(input);
    }
  });
}

function makePanelDraggable(panel, handle) {
  if (!panel || !handle) return;

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button, input, select, textarea")) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const parentRect = panel.offsetParent?.getBoundingClientRect() || {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    panel.style.left = `${rect.left - parentRect.left}px`;
    panel.style.top = `${rect.top - parentRect.top}px`;
    panel.style.right = "auto";
    panel.style.transform = "none";
    panel.style.zIndex = "3700";
    handle.setPointerCapture?.(event.pointerId);

    const onPointerMove = (moveEvent) => {
      const maxLeft = Math.max(0, parentRect.width - panel.offsetWidth);
      const maxTop = Math.max(0, parentRect.height - panel.offsetHeight);
      const nextLeft = Math.min(
        Math.max(moveEvent.clientX - parentRect.left - offsetX, 0),
        maxLeft,
      );
      const nextTop = Math.min(
        Math.max(moveEvent.clientY - parentRect.top - offsetY, 0),
        maxTop,
      );
      panel.style.left = `${nextLeft}px`;
      panel.style.top = `${nextTop}px`;
    };

    const stopDragging = () => {
      handle.releasePointerCapture?.(event.pointerId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
  });
}

function getCesiumCameraHeightFromZoom(zoom) {
  if (!Number.isFinite(zoom)) return 2500000;
  return Math.max(350, 22000000 / Math.pow(2, zoom));
}

function getVisibleOpenLayersBaseLayer() {
  return baseLayerGroup
    ?.getLayers()
    ?.getArray()
    ?.find((layer) => layer.getVisible());
}

function normalizeCesiumTileUrl(url) {
  if (!url) return null;
  return url.replace("{a-c}", "{s}").replace("{1-4}", "{s}");
}

function getCesiumSubdomains(url) {
  if (url?.includes("{1-4}")) return ["1", "2", "3", "4"];
  if (url?.includes("{a-c}")) return ["a", "b", "c"];
  return undefined;
}

function createCesiumProviderFromOpenLayersLayer(layer) {
  const Cesium = window.Cesium;
  if (!Cesium || !layer) return null;

  const source = layer.getSource?.();
  const title = layer.get("title") || layer.get("name") || "";

  if (title === "Ortofoto 2015 20cm" || title === "2015 20cm") {
    return new Cesium.WebMapServiceImageryProvider({
      url: "https://geoportal.asig.gov.al/service/wms",
      layers: "orthophoto_2015:OrthoImagery_20cm",
      parameters: {
        service: "WMS",
        version: "1.1.1",
        format: "image/jpeg",
        transparent: false,
        srs: "EPSG:4326",
      },
      enablePickFeatures: false,
      credit: "ASIG Ortofoto 2015 20cm",
    });
  }

  if (title === "OSM" || source instanceof OSM) {
    return new Cesium.UrlTemplateImageryProvider({
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      credit: "OpenStreetMap contributors",
      maximumLevel: 19,
    });
  }

  if (title === "CartoDarkAll") {
    return new Cesium.UrlTemplateImageryProvider({
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      subdomains: ["1", "2", "3", "4"],
      credit: "CARTO, OpenStreetMap contributors",
      maximumLevel: 19,
    });
  }

  const urls = source?.getUrls?.();
  const url = normalizeCesiumTileUrl(urls?.[0] || source?.getUrl?.());
  if (url?.includes("{z}") && url?.includes("{x}") && url?.includes("{y}")) {
    return new Cesium.UrlTemplateImageryProvider({
      url,
      subdomains: getCesiumSubdomains(urls?.[0] || source?.getUrl?.()),
      credit: title,
      maximumLevel: 22,
    });
  }

  if (
    source?.getLayer &&
    source?.getMatrixSet &&
    source?.getUrls &&
    Cesium.WebMapTileServiceImageryProvider
  ) {
    const wmtsUrls = source.getUrls();
    return new Cesium.WebMapTileServiceImageryProvider({
      url: wmtsUrls?.[0],
      layer: source.getLayer(),
      style: source.getStyle?.() || "",
      format: source.getFormat?.() || "image/png",
      tileMatrixSetID: source.getMatrixSet(),
      maximumLevel: 22,
      credit: title,
    });
  }

  return null;
}

function setCesiumBaseLayerFromOpenLayers(layer = getVisibleOpenLayersBaseLayer()) {
  if (!cesiumViewer || !layer) return;

  let provider = cesiumBaseLayerByOlLayer.get(layer);
  if (!provider) {
    provider = createCesiumProviderFromOpenLayersLayer(layer);
    if (provider) cesiumBaseLayerByOlLayer.set(layer, provider);
  }

  if (!provider) {
    console.warn("Cesium cannot mirror this base layer:", layer.get("title"));
    return;
  }

  if (cesiumBaseImageryLayer) {
    cesiumViewer.imageryLayers.remove(cesiumBaseImageryLayer, false);
    cesiumBaseImageryLayer = null;
  }

  cesiumBaseImageryLayer = cesiumViewer.imageryLayers.addImageryProvider(
    provider,
    0,
  );
}

function watchBaseLayerForCesium(layer) {
  layer?.on?.("change:visible", () => {
    if (layer.getVisible()) setCesiumBaseLayerFromOpenLayers(layer);
  });
}

function hideCesiumElevationTooltip() {
  if (cesiumElevationTooltip) {
    cesiumElevationTooltip.hidden = true;
  }
}

function getCesiumCursorCartographic(screenPosition) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !screenPosition) return null;

  const ray = viewer.camera.getPickRay(screenPosition);
  if (!ray) return null;

  const globePosition = viewer.scene.globe.pick(ray, viewer.scene);
  const position =
    Cesium.defined(globePosition)
      ? globePosition
      : viewer.camera.pickEllipsoid(screenPosition, viewer.scene.globe.ellipsoid);

  if (!Cesium.defined(position)) return null;
  return Cesium.Cartographic.fromCartesian(position);
}

function updateCesiumElevationTooltip(screenPosition) {
  const Cesium = window.Cesium;
  if (
    !Cesium ||
    !cesiumElevationTooltip ||
    !isCesiumMode ||
    !isCesiumElevationTooltipEnabled
  ) {
    hideCesiumElevationTooltip();
    return;
  }

  const cartographic = getCesiumCursorCartographic(screenPosition);
  if (!cartographic) {
    hideCesiumElevationTooltip();
    return;
  }

  const terrainHeight = cesiumViewer.scene.globe.getHeight(cartographic);
  const elevation = Number.isFinite(terrainHeight)
    ? terrainHeight
    : cartographic.height;
  const unitText =
    Math.abs(elevation) >= 1000
      ? `${(elevation / 1000).toFixed(2)} km`
      : `${elevation.toFixed(1)} m`;

  cesiumElevationTooltip.textContent = `Elev: ${unitText}`;
  cesiumElevationTooltip.style.left = `${screenPosition.x}px`;
  cesiumElevationTooltip.style.top = `${screenPosition.y}px`;
  cesiumElevationTooltip.hidden = false;
}

function ensureCesiumElevationTooltipHandler() {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || cesiumElevationTooltipHandler) return;

  cesiumElevationTooltipHandler = new Cesium.ScreenSpaceEventHandler(
    viewer.scene.canvas,
  );
  cesiumElevationTooltipHandler.setInputAction((event) => {
    updateCesiumElevationTooltip(event.endPosition);
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  viewer.scene.canvas.addEventListener("mouseleave", hideCesiumElevationTooltip);
}

function setCesiumElevationTooltipEnabled(enabled) {
  isCesiumElevationTooltipEnabled = enabled;
  toggleCesiumElevationButton?.classList.toggle("is-active", enabled);
  if (toggleCesiumElevationButton) {
    toggleCesiumElevationButton.title = enabled
      ? "Hide terrain elevation at cursor"
      : "Show terrain elevation at cursor";
  }
  if (enabled) {
    setMapMode3d(true);
  } else {
    hideCesiumElevationTooltip();
  }
}

function formatDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCesiumSunHour(hourValue) {
  const totalMinutes = Math.round(Number(hourValue || 0) * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getCesiumSunDateTime() {
  const dateValue = cesiumSunDateInput?.value || formatDateInputValue();
  const hourLabel = formatCesiumSunHour(cesiumSunHourInput?.value || 12);
  const timeZone = cesiumSunTimeZoneInput?.value || "local";
  return new Date(
    timeZone === "local"
      ? `${dateValue}T${hourLabel}:00`
      : `${dateValue}T${hourLabel}:00${timeZone}`,
  );
}

function getCesiumSunTimeZoneLabel() {
  const selected = cesiumSunTimeZoneInput?.selectedOptions?.[0];
  return selected?.textContent?.trim() || "Browser local";
}

function getCesiumSunTimeZoneOffsetHours() {
  const value = cesiumSunTimeZoneInput?.value || "+02:00";
  const match = value.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return -new Date().getTimezoneOffset() / 60;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) + Number(match[3]) / 60);
}

function getCesiumSunAnalysisLocation() {
  const Cesium = window.Cesium;
  if (Cesium && cesiumSolarLastLayout?.projector && cesiumSolarLastLayout?.center) {
    const cartographic = cesiumSolarLastLayout.projector.fromLocal(
      cesiumSolarLastLayout.center,
    );
    return {
      lon: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      source: "solar site",
    };
  }

  if (Cesium && cesiumViewer?.camera?.positionWC) {
    const cartographic = Cesium.Cartographic.fromCartesian(
      cesiumViewer.camera.positionWC,
    );
    return {
      lon: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      source: "camera",
    };
  }

  const view = map.getView();
  const lonLat = toLonLat(view.getCenter() || [0, 0], view.getProjection());
  return { lon: lonLat[0], lat: lonLat[1], source: "map center" };
}

function getDayOfYear(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const start = new Date(Date.UTC(year, 0, 0));
  return Math.floor((date - start) / 86400000);
}

function getSolarDeclinationAndEquation(dateValue) {
  const dayOfYear = getDayOfYear(dateValue);
  const gamma = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  return { equationOfTime, declination };
}

function normalizeMinutes(minutes) {
  return ((minutes % 1440) + 1440) % 1440;
}

function formatMinutesAsClock(minutes) {
  if (!Number.isFinite(minutes)) return "-";
  const normalized = normalizeMinutes(minutes);
  const hours = Math.floor(normalized / 60);
  const mins = Math.round(normalized % 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getSolarPositionAtMinutes({ lat, lon, dateValue, timeZoneOffset, minutes }) {
  const { equationOfTime, declination } = getSolarDeclinationAndEquation(dateValue);
  const latRad = (lat * Math.PI) / 180;
  const trueSolarMinutes = normalizeMinutes(
    minutes + equationOfTime + 4 * lon - 60 * timeZoneOffset,
  );
  const hourAngleDeg = trueSolarMinutes / 4 - 180;
  const hourAngle = (hourAngleDeg * Math.PI) / 180;
  const cosZenith =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const altitude = 90 - (zenith * 180) / Math.PI;
  const azimuthBase =
    (Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          (Math.sin(latRad) * Math.cos(zenith) - Math.sin(declination)) /
            (Math.cos(latRad) * Math.sin(zenith) || 1),
        ),
      ),
    ) *
      180) /
    Math.PI;
  const azimuth = hourAngleDeg > 0 ? 360 - azimuthBase : azimuthBase;
  return { altitude, azimuth };
}

function getCesiumSunDirectionFromPanel(centerCartesian, sunPosition) {
  const Cesium = window.Cesium;
  if (!Cesium || !centerCartesian) return null;
  const altitudeRadians = Cesium.Math.toRadians(sunPosition.altitude);
  const azimuthRadians = Cesium.Math.toRadians(sunPosition.azimuth);
  const localDirection = new Cesium.Cartesian3(
    Math.cos(altitudeRadians) * Math.sin(azimuthRadians),
    Math.cos(altitudeRadians) * Math.cos(azimuthRadians),
    Math.sin(altitudeRadians),
  );
  const eastNorthUp = Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);
  return Cesium.Cartesian3.normalize(
    Cesium.Matrix4.multiplyByPointAsVector(
      eastNorthUp,
      localDirection,
      new Cesium.Cartesian3(),
    ),
    new Cesium.Cartesian3(),
  );
}

function getCesiumSolarSamplePanel() {
  const Cesium = window.Cesium;
  const layout = cesiumSolarLastLayout;
  if (!Cesium || !layout?.panels?.length) return null;
  layout.settings = {
    ...layout.settings,
    ...getCesiumSolarSettings(),
  };
  const panelCorners = layout.panels[Math.floor(layout.panels.length / 2)];
  const positions = getCesiumSolarTiltedPanelCartesianCorners(panelCorners, layout);
  const center = positions.reduce(
    (sum, position) => Cesium.Cartesian3.add(sum, position, sum),
    new Cesium.Cartesian3(),
  );
  Cesium.Cartesian3.divideByScalar(center, positions.length, center);

  const edgeA = Cesium.Cartesian3.subtract(
    positions[1],
    positions[0],
    new Cesium.Cartesian3(),
  );
  const edgeB = Cesium.Cartesian3.subtract(
    positions[2],
    positions[0],
    new Cesium.Cartesian3(),
  );
  const normal = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.cross(edgeA, edgeB, new Cesium.Cartesian3()),
    new Cesium.Cartesian3(),
  );
  const up = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(
    center,
    new Cesium.Cartesian3(),
  );
  if (Cesium.Cartesian3.dot(normal, up) < 0) {
    Cesium.Cartesian3.negate(normal, normal);
  }
  return { center, normal };
}

function isCesiumSunRayBlockedByTerrain(center, sunDirection) {
  const Cesium = window.Cesium;
  const viewer = cesiumViewer;
  if (!Cesium || !viewer?.scene?.globe || !center || !sunDirection) return false;
  const start = Cesium.Cartesian3.add(
    center,
    Cesium.Cartesian3.multiplyByScalar(sunDirection, 2, new Cesium.Cartesian3()),
    new Cesium.Cartesian3(),
  );
  const intersection = viewer.scene.globe.pick(
    new Cesium.Ray(start, sunDirection),
    viewer.scene,
  );
  if (!intersection) return false;
  const distance = Cesium.Cartesian3.distance(start, intersection);
  return distance > 5 && distance < 150000;
}

function isCesiumPanelInDirectSun(sunPosition, samplePanel) {
  const Cesium = window.Cesium;
  if (!Cesium || !samplePanel || sunPosition.altitude <= 0) return false;
  const sunDirection = getCesiumSunDirectionFromPanel(samplePanel.center, sunPosition);
  if (!sunDirection) return false;
  const faceDot = Cesium.Cartesian3.dot(samplePanel.normal, sunDirection);
  if (faceDot <= 0.02) return false;
  return !isCesiumSunRayBlockedByTerrain(samplePanel.center, sunDirection);
}

function getCesiumSunAnalysis() {
  const dateValue = cesiumSunDateInput?.value || formatDateInputValue();
  const location = getCesiumSunAnalysisLocation();
  const timeZoneOffset = getCesiumSunTimeZoneOffsetHours();
  const { equationOfTime, declination } = getSolarDeclinationAndEquation(dateValue);
  const latRad = (location.lat * Math.PI) / 180;
  const sunriseZenith = (90.833 * Math.PI) / 180;
  const cosHourAngle =
    (Math.cos(sunriseZenith) /
      (Math.cos(latRad) * Math.cos(declination)) -
      Math.tan(latRad) * Math.tan(declination));
  if (cosHourAngle < -1 || cosHourAngle > 1) {
    return { location, dateValue, polarDay: cosHourAngle < -1 };
  }

  const hourAngleDeg = (Math.acos(cosHourAngle) * 180) / Math.PI;
  const solarNoon = 720 - 4 * location.lon - equationOfTime + timeZoneOffset * 60;
  const sunrise = solarNoon - hourAngleDeg * 4;
  const sunset = solarNoon + hourAngleDeg * 4;
  const samplePanel = getCesiumSolarSamplePanel();
  let panelStart = null;
  let panelEnd = null;
  if (samplePanel) {
    for (let minute = Math.floor(sunrise); minute <= Math.ceil(sunset); minute += 5) {
      const sunPosition = getSolarPositionAtMinutes({
        lat: location.lat,
        lon: location.lon,
        dateValue,
        timeZoneOffset,
        minutes: minute,
      });
      const directSun = isCesiumPanelInDirectSun(sunPosition, samplePanel);
      if (directSun && panelStart === null) panelStart = minute;
      if (directSun) panelEnd = minute;
    }
  }
  return {
    location,
    dateValue,
    sunrise,
    solarNoon,
    sunset,
    daylightMinutes: sunset - sunrise,
    hasSamplePanel: Boolean(samplePanel),
    panelStart,
    panelEnd,
  };
}

function renderCesiumSunResults() {
  if (!cesiumSunResults) return;
  const analysis = getCesiumSunAnalysis();
  if (!analysis || analysis.polarDay !== undefined) {
    cesiumSunResults.innerHTML = `
      <div class="cesium-sun-result-card">
        <strong>Sun window</strong>
        <span>${analysis?.polarDay ? "Sun above horizon all day" : "No sunrise/sunset"}</span>
      </div>
    `;
    return;
  }

  const panelWindow =
    analysis.panelStart !== null && analysis.panelEnd !== null
      ? `${formatMinutesAsClock(analysis.panelStart)} - ${formatMinutesAsClock(
          analysis.panelEnd,
        )}`
      : analysis.hasSamplePanel
        ? "No direct sun detected"
        : "Create/rotate solar layout";
  cesiumSunResults.innerHTML = `
    <div class="cesium-sun-result-card">
      <strong>Sunrise</strong>
      <span>${formatMinutesAsClock(analysis.sunrise)}</span>
    </div>
    <div class="cesium-sun-result-card">
      <strong>Solar noon</strong>
      <span>${formatMinutesAsClock(analysis.solarNoon)}</span>
    </div>
    <div class="cesium-sun-result-card">
      <strong>Sunset</strong>
      <span>${formatMinutesAsClock(analysis.sunset)}</span>
    </div>
    <div class="cesium-sun-result-card">
      <strong>Daylight</strong>
      <span>${Math.floor(analysis.daylightMinutes / 60)}h ${Math.round(
        analysis.daylightMinutes % 60,
      )}m</span>
    </div>
    <div class="cesium-sun-result-card cesium-sun-result-card--wide">
      <strong>Direct sun on panels</strong>
      <span>${panelWindow}</span>
    </div>
    <div class="cesium-sun-result-card cesium-sun-result-card--wide">
      <strong>Location</strong>
      <span>${analysis.location.lat.toFixed(4)}, ${analysis.location.lon.toFixed(
        4,
      )} (${analysis.location.source})</span>
    </div>
  `;
}

function setCesiumSunStatus(message) {
  if (cesiumSunStatus) cesiumSunStatus.textContent = message || "";
}

function updateCesiumSunSimulation() {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  if (cesiumSunHourValue) {
    cesiumSunHourValue.textContent = formatCesiumSunHour(cesiumSunHourInput?.value || 12);
  }

  const dateTime = getCesiumSunDateTime();
  const lightingEnabled = cesiumSunLightingInput?.checked !== false;
  const shadowsEnabled = Boolean(cesiumSunShadowsInput?.checked);
  viewer.clock.currentTime = Cesium.JulianDate.fromDate(dateTime);
  viewer.clock.shouldAnimate = false;
  viewer.scene.globe.enableLighting = lightingEnabled;
  if (viewer.scene.sun) viewer.scene.sun.show = lightingEnabled;
  if (viewer.scene.moon) viewer.scene.moon.show = lightingEnabled;
  viewer.shadows = lightingEnabled && shadowsEnabled;
  if (viewer.scene.shadowMap) {
    viewer.scene.shadowMap.enabled = lightingEnabled && shadowsEnabled;
    viewer.scene.shadowMap.softShadows = true;
  }
  viewer.scene.requestRender?.();
  renderCesiumSunResults();
  setCesiumSunStatus(
    `${dateTime.toLocaleDateString()} ${formatCesiumSunHour(
      cesiumSunHourInput?.value || 12,
    )} (${getCesiumSunTimeZoneLabel()}) - lighting ${lightingEnabled ? "on" : "off"}, shadows ${
      lightingEnabled && shadowsEnabled ? "on" : "off"
    }.`,
  );
}

function setCesiumSunPlaying(enabled) {
  if (cesiumSunPlayTimer) {
    clearInterval(cesiumSunPlayTimer);
    cesiumSunPlayTimer = null;
  }
  if (cesiumSunPlay) cesiumSunPlay.textContent = enabled ? "Pause" : "Play";
  if (!enabled) return;

  cesiumSunPlayTimer = window.setInterval(() => {
    const currentHour = Number(cesiumSunHourInput?.value || 0);
    const nextHour = currentHour >= 23.75 ? 0 : currentHour + 0.25;
    if (cesiumSunHourInput) cesiumSunHourInput.value = String(nextHour);
    updateCesiumSunSimulation();
  }, 450);
}

function initializeCesiumSunControls() {
  if (cesiumSunDateInput && !cesiumSunDateInput.value) {
    cesiumSunDateInput.value = formatDateInputValue();
  }
  if (cesiumSunHourValue) {
    cesiumSunHourValue.textContent = formatCesiumSunHour(cesiumSunHourInput?.value || 12);
  }
}

function initCesiumViewer() {
  if (cesiumViewer) return cesiumViewer;

  const Cesium = window.Cesium;
  if (!Cesium || !cesiumContainer) {
    alert("Cesium is not loaded. Check your internet connection or add Cesium locally.");
    return null;
  }

  Cesium.Ion.defaultAccessToken = cesiumIonAccessToken;
  cesiumViewer = new Cesium.Viewer(cesiumContainer, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    baseLayer: false,
  });

  cesiumViewer.scene.globe.baseColor = Cesium.Color.WHITE;
  cesiumViewer.scene.globe.depthTestAgainstTerrain = false;
  cesiumViewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );
  setCesiumBaseLayerFromOpenLayers();
  ensureCesiumProfileLinePickHandler();
  ensureCesiumElevationTooltipHandler();
  return cesiumViewer;
}

function getCesiumFlatTerrainProvider() {
  const Cesium = window.Cesium;
  return new Cesium.EllipsoidTerrainProvider();
}

function getCesiumWorldTerrainProvider() {
  const Cesium = window.Cesium;
  if (!Cesium) return Promise.resolve(null);

  if (!cesiumWorldTerrainProviderPromise) {
    cesiumWorldTerrainProviderPromise = Cesium.createWorldTerrainAsync
      ? Cesium.createWorldTerrainAsync({
          requestVertexNormals: true,
          requestWaterMask: true,
        })
      : Promise.resolve(
          Cesium.createWorldTerrain({
            requestVertexNormals: true,
            requestWaterMask: true,
          }),
        );
  }

  return cesiumWorldTerrainProviderPromise;
}

async function setCesiumTerrainEnabled(enabled) {
  const viewer = initCesiumViewer();
  if (!viewer || !toggleCesiumTerrainButton) return;

  toggleCesiumTerrainButton.classList.add("is-loading");
  toggleCesiumTerrainButton.querySelector("span").textContent = enabled
    ? "Loading"
    : "Terrain";

  try {
    viewer.terrainProvider = enabled
      ? await getCesiumWorldTerrainProvider()
      : getCesiumFlatTerrainProvider();
    isCesiumTerrainEnabled = enabled;
    viewer.scene.globe.depthTestAgainstTerrain = enabled;
    toggleCesiumTerrainButton.classList.toggle("is-active", enabled);
    toggleCesiumTerrainButton.title = enabled
      ? "Switch to flat globe"
      : "Toggle 3D Terrain";

    if (enabled && googlePhotorealisticTileset) {
      googlePhotorealisticTileset.show = false;
      isGooglePhotorealisticEnabled = false;
      toggleGooglePhotorealisticButton?.classList.remove("is-active");
      if (toggleGooglePhotorealisticButton) {
        toggleGooglePhotorealisticButton.title =
          "Show Google Photorealistic 3D Tiles";
      }
    }
  } catch (error) {
    console.error("Could not load Cesium terrain:", error);
    alert("Could not load Cesium World Terrain. Check the Cesium ion token and network connection.");
  } finally {
    toggleCesiumTerrainButton.classList.remove("is-loading");
    toggleCesiumTerrainButton.querySelector("span").textContent = "Terrain";
  }
}

async function getCesiumOsmBuildingsTileset() {
  const Cesium = window.Cesium;
  if (!Cesium) return null;

  if (!cesiumOsmBuildingsTilesetPromise) {
    if (Cesium.createOsmBuildingsAsync) {
      cesiumOsmBuildingsTilesetPromise = Cesium.createOsmBuildingsAsync();
    } else if (Cesium.createOsmBuildings) {
      cesiumOsmBuildingsTilesetPromise = Promise.resolve(
        Cesium.createOsmBuildings(),
      );
    } else if (Cesium.Cesium3DTileset?.fromIonAssetId) {
      cesiumOsmBuildingsTilesetPromise =
        Cesium.Cesium3DTileset.fromIonAssetId(96188);
    } else {
      cesiumOsmBuildingsTilesetPromise = Cesium.IonResource.fromAssetId(
        96188,
      ).then((resource) => new Cesium.Cesium3DTileset({ url: resource }));
    }
  }

  cesiumOsmBuildingsTileset = await cesiumOsmBuildingsTilesetPromise;
  return cesiumOsmBuildingsTileset;
}

async function setCesiumBuildingsEnabled(enabled) {
  const viewer = initCesiumViewer();
  if (!viewer || !toggleCesiumBuildingsButton) return;

  toggleCesiumBuildingsButton.classList.add("is-loading");
  toggleCesiumBuildingsButton.querySelector("span").textContent = enabled
    ? "Loading"
    : "Buildings";

  try {
    const tileset = await getCesiumOsmBuildingsTileset();
    if (!tileset) return;

    if (!viewer.scene.primitives.contains(tileset)) {
      viewer.scene.primitives.add(tileset);
    }

    isCesiumBuildingsEnabled = enabled;
    tileset.show = enabled;
    toggleCesiumBuildingsButton.classList.toggle("is-active", enabled);
    toggleCesiumBuildingsButton.title = enabled
      ? "Hide OSM Buildings"
      : "Show OSM Buildings";

    if (enabled && googlePhotorealisticTileset) {
      googlePhotorealisticTileset.show = false;
      isGooglePhotorealisticEnabled = false;
      toggleGooglePhotorealisticButton?.classList.remove("is-active");
      if (toggleGooglePhotorealisticButton) {
        toggleGooglePhotorealisticButton.title =
          "Show Google Photorealistic 3D Tiles";
      }
    }
  } catch (error) {
    console.error("Could not load Cesium OSM Buildings:", error);
    alert("Could not load Cesium OSM Buildings. Check the Cesium ion token and network connection.");
  } finally {
    toggleCesiumBuildingsButton.classList.remove("is-loading");
    toggleCesiumBuildingsButton.querySelector("span").textContent = "Buildings";
  }
}

async function getGooglePhotorealisticTileset() {
  const Cesium = window.Cesium;
  if (!Cesium) return null;

  if (!googlePhotorealisticTilesetPromise) {
    if (Cesium.createGooglePhotorealistic3DTileset) {
      googlePhotorealisticTilesetPromise =
        Cesium.createGooglePhotorealistic3DTileset();
    } else if (Cesium.Cesium3DTileset?.fromIonAssetId) {
      googlePhotorealisticTilesetPromise =
        Cesium.Cesium3DTileset.fromIonAssetId(2275207);
    } else {
      googlePhotorealisticTilesetPromise = Cesium.IonResource.fromAssetId(
        2275207,
      ).then((resource) => new Cesium.Cesium3DTileset({ url: resource }));
    }
  }

  googlePhotorealisticTileset = await googlePhotorealisticTilesetPromise;
  return googlePhotorealisticTileset;
}

async function setGooglePhotorealisticEnabled(enabled) {
  const viewer = initCesiumViewer();
  if (!viewer || !toggleGooglePhotorealisticButton) return;

  toggleGooglePhotorealisticButton.classList.add("is-loading");
  toggleGooglePhotorealisticButton.querySelector("span").textContent = enabled
    ? "Loading"
    : "Google 3D";

  try {
    const tileset = await getGooglePhotorealisticTileset();
    if (!tileset) return;

    if (!viewer.scene.primitives.contains(tileset)) {
      viewer.scene.primitives.add(tileset);
    }

    isGooglePhotorealisticEnabled = enabled;
    tileset.show = enabled;
    toggleGooglePhotorealisticButton.classList.toggle("is-active", enabled);
    toggleGooglePhotorealisticButton.title = enabled
      ? "Hide Google Photorealistic 3D Tiles"
      : "Show Google Photorealistic 3D Tiles";

    if (enabled && isCesiumTerrainEnabled) {
      viewer.terrainProvider = getCesiumFlatTerrainProvider();
      viewer.scene.globe.depthTestAgainstTerrain = false;
      isCesiumTerrainEnabled = false;
      toggleCesiumTerrainButton?.classList.remove("is-active");
      if (toggleCesiumTerrainButton) {
        toggleCesiumTerrainButton.title = "Toggle 3D Terrain";
      }
    }

    if (enabled && cesiumOsmBuildingsTileset) {
      cesiumOsmBuildingsTileset.show = false;
      isCesiumBuildingsEnabled = false;
      toggleCesiumBuildingsButton?.classList.remove("is-active");
      if (toggleCesiumBuildingsButton) {
        toggleCesiumBuildingsButton.title = "Show OSM Buildings";
      }
    }
  } catch (error) {
    console.error("Could not load Google Photorealistic 3D Tiles:", error);
    alert("Could not load Google Photorealistic 3D Tiles. Check your Cesium ion token, Google tiles access, and network connection.");
  } finally {
    toggleGooglePhotorealisticButton.classList.remove("is-loading");
    toggleGooglePhotorealisticButton.querySelector("span").textContent =
      "Google 3D";
  }
}

function setHimareTerrainWmsVisible(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleHimareTerrainWmsButton) return;

  if (enabled && !himareTerrainWmsLayer) {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: "https://apps.kadaster.al/himarewms",
      layers: "ndertesa,pasuri",
      parameters: {
        service: "WMS",
        version: "1.1.1",
        transparent: true,
        format: "image/png",
        tiled: true,
        styles: "",
      },
      credit: "Kadaster Himare WMS",
    });
    himareTerrainWmsLayer = viewer.imageryLayers.addImageryProvider(provider);
    himareTerrainWmsLayer.alpha = getTerrainOpacity(himareTerrainOpacityInput);
  }

  isHimareTerrainWmsVisible = enabled;
  if (himareTerrainWmsLayer) {
    himareTerrainWmsLayer.show = enabled;
  }
  toggleHimareTerrainWmsButton.classList.toggle("is-active", enabled);
  toggleHimareTerrainWmsButton.title = enabled
    ? "Hide Himare properties on 3D terrain"
    : "Show Himare properties on 3D terrain";

  if (enabled) {
    setMapMode3d(true);
  }
}

function setDhermiTerrainWmsVisible(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleDhermiTerrainWmsButton) return;

  if (enabled && !dhermiTerrainWmsLayer) {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: "https://apps.kadaster.al/dhermiwms",
      layers: "ndertesa,pasuri",
      parameters: {
        service: "WMS",
        version: "1.1.1",
        transparent: true,
        format: "image/png",
        tiled: true,
        styles: "",
      },
      credit: "Kadaster Dhermi WMS",
    });
    dhermiTerrainWmsLayer = viewer.imageryLayers.addImageryProvider(provider);
    dhermiTerrainWmsLayer.alpha = getTerrainOpacity(dhermiTerrainOpacityInput);
  }

  isDhermiTerrainWmsVisible = enabled;
  if (dhermiTerrainWmsLayer) {
    dhermiTerrainWmsLayer.show = enabled;
  }
  toggleDhermiTerrainWmsButton.classList.toggle("is-active", enabled);
  toggleDhermiTerrainWmsButton.title = enabled
    ? "Hide Dhermi properties on 3D terrain"
    : "Show Dhermi properties on 3D terrain";

  if (enabled) {
    setMapMode3d(true);
  }
}

function setPalaseTerrainWmsVisible(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !togglePalaseTerrainWmsButton) return;

  if (enabled && !palaseTerrainWmsLayer) {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: "https://apps.kadaster.al/palasewms",
      layers: "ndertesa,pasuri",
      parameters: {
        service: "WMS",
        version: "1.1.1",
        transparent: true,
        format: "image/png",
        tiled: true,
        styles: "",
      },
      credit: "Kadaster Palase WMS",
    });
    palaseTerrainWmsLayer = viewer.imageryLayers.addImageryProvider(provider);
    palaseTerrainWmsLayer.alpha = getTerrainOpacity(palaseTerrainOpacityInput);
  }

  isPalaseTerrainWmsVisible = enabled;
  if (palaseTerrainWmsLayer) {
    palaseTerrainWmsLayer.show = enabled;
  }
  togglePalaseTerrainWmsButton.classList.toggle("is-active", enabled);
  togglePalaseTerrainWmsButton.title = enabled
    ? "Hide Palase properties on 3D terrain"
    : "Show Palase properties on 3D terrain";

  if (enabled) {
    setMapMode3d(true);
  }
}

function setAshkTerrainWmsVisible(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleAshkTerrainWmsButton) return;

  if (enabled && !ashkTerrainWmsLayer) {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: "https://geoportal.asig.gov.al/service/zrpp/wms",
      layers: "p_kadastrale_ashk_042025",
      parameters: {
        service: "WMS",
        version: "1.1.1",
        transparent: true,
        format: "image/png",
        tiled: true,
        styles: "",
      },
      credit: "ASIG P Kadastrale ASHK 04/2025",
    });
    ashkTerrainWmsLayer = viewer.imageryLayers.addImageryProvider(provider);
    ashkTerrainWmsLayer.alpha = getTerrainOpacity(ashkTerrainOpacityInput);
  }

  isAshkTerrainWmsVisible = enabled;
  if (ashkTerrainWmsLayer) {
    ashkTerrainWmsLayer.show = enabled;
  }
  toggleAshkTerrainWmsButton.classList.toggle("is-active", enabled);
  toggleAshkTerrainWmsButton.title = enabled
    ? "Hide P Kadastrale ASHK from 3D terrain"
    : "Show P Kadastrale ASHK on 3D terrain";

  if (enabled) {
    setMapMode3d(true);
  }
}

function setQkdTerrainWmsVisible(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleQkdTerrainWmsButton) return;

  if (enabled && !qkdTerrainWmsLayer) {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: "https://geoportal.asig.gov.al/service/zrpp/wms",
      layers: "parcela_kadastrale_qkd_042025",
      parameters: {
        service: "WMS",
        version: "1.1.1",
        transparent: true,
        format: "image/png",
        tiled: true,
        styles: "",
      },
      credit: "ASIG Parcela Kadastrale QKD 04/2025",
    });
    qkdTerrainWmsLayer = viewer.imageryLayers.addImageryProvider(provider);
    qkdTerrainWmsLayer.alpha = getTerrainOpacity(qkdTerrainOpacityInput);
  }

  isQkdTerrainWmsVisible = enabled;
  if (qkdTerrainWmsLayer) {
    qkdTerrainWmsLayer.show = enabled;
  }
  toggleQkdTerrainWmsButton.classList.toggle("is-active", enabled);
  toggleQkdTerrainWmsButton.title = enabled
    ? "Hide Parcela Kadastrale QKD from 3D terrain"
    : "Show Parcela Kadastrale QKD on 3D terrain";

  if (enabled) {
    setMapMode3d(true);
  }
}

function setKufiNsTerrainWmsVisible(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleKufiNsTerrainWmsButton) return;

  if (enabled && !kufiNsTerrainWmsLayer) {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: "https://geoportal.asig.gov.al/service/akpt/wms",
      layers: "kufi_njesie_strukturore_dhe_perdorimi_i_tokes_inspire",
      parameters: {
        service: "WMS",
        version: "1.1.1",
        transparent: true,
        format: "image/png",
        tiled: true,
        styles: "",
      },
      credit: "ASIG AKPT Kufi Njesie Strukturore",
    });
    kufiNsTerrainWmsLayer = viewer.imageryLayers.addImageryProvider(provider);
    kufiNsTerrainWmsLayer.alpha = getTerrainOpacity(kufiNsTerrainOpacityInput);
  }

  isKufiNsTerrainWmsVisible = enabled;
  if (kufiNsTerrainWmsLayer) {
    kufiNsTerrainWmsLayer.show = enabled;
  }
  toggleKufiNsTerrainWmsButton.classList.toggle("is-active", enabled);
  toggleKufiNsTerrainWmsButton.title = enabled
    ? "Hide Kufi Njesie Strukturore from 3D terrain"
    : "Show Kufi Njesie Strukturore on 3D terrain";

  if (enabled) {
    setMapMode3d(true);
  }
}

function setKategoriTokeTerrainWmsVisible(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleKategoriTokeTerrainWmsButton) return;

  if (enabled && !kategoriTokeTerrainWmsLayer) {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: "https://geoportal.asig.gov.al/service/akpt/wms",
      layers: "kategorite_propozuara_perdorimit_te_tokes",
      parameters: {
        service: "WMS",
        version: "1.1.1",
        transparent: true,
        format: "image/png",
        tiled: true,
        styles: "",
      },
      credit: "ASIG AKPT Kategorite Propozuara Perdorimit Te Tokes",
    });
    kategoriTokeTerrainWmsLayer =
      viewer.imageryLayers.addImageryProvider(provider);
    kategoriTokeTerrainWmsLayer.alpha = getTerrainOpacity(
      kategoriTokeTerrainOpacityInput,
    );
  }

  isKategoriTokeTerrainWmsVisible = enabled;
  if (kategoriTokeTerrainWmsLayer) {
    kategoriTokeTerrainWmsLayer.show = enabled;
  }
  toggleKategoriTokeTerrainWmsButton.classList.toggle("is-active", enabled);
  toggleKategoriTokeTerrainWmsButton.title = enabled
    ? "Hide Kategorite Propozuara from 3D terrain"
    : "Show Kategorite Propozuara on 3D terrain";

  if (enabled) {
    setMapMode3d(true);
  }
}

function getLatestCesiumLineFeature() {
  return [...cesiumDrawnFeatures]
    .reverse()
    .find(
      (feature) =>
        feature.geometryType === "LineString" &&
        Array.isArray(feature.positions) &&
        feature.positions.length >= 2,
    );
}

function createCesiumLineProfileSamples(positions, intervalMeters = 25) {
  const Cesium = window.Cesium;
  if (!Cesium || positions.length < 2) return [];

  const cartographics = positions.map((position) =>
    Cesium.Cartographic.fromCartesian(position),
  );
  const samples = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < cartographics.length - 1; i += 1) {
    const start = cartographics[i];
    const end = cartographics[i + 1];
    const geodesic = new Cesium.EllipsoidGeodesic(start, end);
    const segmentDistance = geodesic.surfaceDistance || 0;
    const steps = Math.max(1, Math.ceil(segmentDistance / intervalMeters));

    for (let step = 0; step < steps; step += 1) {
      if (i > 0 && step === 0) continue;
      const fraction = step / steps;
      const point = geodesic.interpolateUsingFraction(fraction);
      samples.push({
        distance: cumulativeDistance + segmentDistance * fraction,
        cartographic: point,
      });
    }

    cumulativeDistance += segmentDistance;
  }

  samples.push({
    distance: cumulativeDistance,
    cartographic: cartographics[cartographics.length - 1],
  });

  return samples;
}

async function sampleCesiumProfileTerrain(samples) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !samples.length) return [];

  const cartographics = samples.map(
    (sample) =>
      new Cesium.Cartographic(
        sample.cartographic.longitude,
        sample.cartographic.latitude,
        sample.cartographic.height,
      ),
  );

  let sampledCartographics = cartographics;
  if (Cesium.sampleTerrainMostDetailed) {
    try {
      sampledCartographics = await Cesium.sampleTerrainMostDetailed(
        viewer.terrainProvider,
        cartographics,
      );
    } catch (error) {
      console.warn("Could not sample terrain profile:", error);
    }
  }

  return samples.map((sample, index) => ({
    distance: sample.distance,
    elevation: sampledCartographics[index]?.height ?? 0,
  }));
}

function getCesiumProfileStats(profile) {
  const elevations = profile.map((point) => point.elevation).filter(Number.isFinite);
  const totalDistance = profile.at(-1)?.distance || 0;
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const startElevation = profile[0]?.elevation ?? 0;
  const endElevation = profile.at(-1)?.elevation ?? startElevation;
  let gain = 0;
  let loss = 0;
  let maxUphillSlope = 0;
  let maxDownhillSlope = 0;

  for (let i = 1; i < profile.length; i += 1) {
    const delta = profile[i].elevation - profile[i - 1].elevation;
    const distanceDelta = profile[i].distance - profile[i - 1].distance;
    const segmentSlope = distanceDelta > 0 ? (delta / distanceDelta) * 100 : 0;
    if (delta > 0) gain += delta;
    if (delta < 0) loss += Math.abs(delta);
    if (segmentSlope > maxUphillSlope) maxUphillSlope = segmentSlope;
    if (segmentSlope < maxDownhillSlope) maxDownhillSlope = segmentSlope;
  }

  return {
    totalDistance,
    minElevation,
    maxElevation,
    gain,
    loss,
    overallSlope: totalDistance > 0 ? ((endElevation - startElevation) / totalDistance) * 100 : 0,
    maxUphillSlope,
    maxDownhillSlope,
  };
}

function getCesiumProfileSlopeSeries(profile) {
  return profile.map((point, index) => {
    if (index === 0) return 0;
    const previousPoint = profile[index - 1];
    const distanceDelta = point.distance - previousPoint.distance;
    if (!Number.isFinite(distanceDelta) || distanceDelta <= 0) return 0;
    return ((point.elevation - previousPoint.elevation) / distanceDelta) * 100;
  });
}

function renderCesiumProfileChart(profile) {
  if (!cesiumProfileChartCanvas || !cesiumProfileStats || !cesiumProfilePanel) {
    return;
  }

  const stats = getCesiumProfileStats(profile);
  const slopeSeries = getCesiumProfileSlopeSeries(profile);
  cesiumProfileStats.innerHTML = `
    <span>Distance: ${(stats.totalDistance / 1000).toFixed(2)} km</span>
    <span>Min: ${stats.minElevation.toFixed(1)} m</span>
    <span>Max: ${stats.maxElevation.toFixed(1)} m</span>
    <span>Gain/Loss: ${stats.gain.toFixed(1)} / ${stats.loss.toFixed(1)} m</span>
    <span>Overall slope: ${stats.overallSlope.toFixed(1)}%</span>
    <span>Max up/down: ${stats.maxUphillSlope.toFixed(1)}% / ${stats.maxDownhillSlope.toFixed(1)}%</span>
  `;

  if (cesiumProfileChart) {
    cesiumProfileChart.destroy();
  }

  cesiumProfilePanel.hidden = false;
  cesiumProfileChart = new Chart(cesiumProfileChartCanvas, {
    type: "line",
    data: {
      labels: profile.map((point) => (point.distance / 1000).toFixed(2)),
      datasets: [
        {
          label: "Elevation (m)",
          data: profile.map((point) => Number(point.elevation.toFixed(2))),
          borderColor: "#0d6efd",
          backgroundColor: "rgba(13, 110, 253, 0.14)",
          fill: true,
          pointRadius: 0,
          tension: 0.25,
          yAxisID: "elevation",
        },
        {
          label: "Slope (%)",
          data: slopeSeries.map((slope) => Number(slope.toFixed(2))),
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.08)",
          fill: false,
          pointRadius: 0,
          tension: 0.25,
          yAxisID: "slope",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 4,
          right: 10,
          top: 6,
          bottom: 22,
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Distance (km)" },
          ticks: {
            maxTicksLimit: 8,
            padding: 6,
          },
        },
        elevation: {
          type: "linear",
          position: "left",
          title: { display: true, text: "Elevation (m)" },
          ticks: {
            maxTicksLimit: 7,
            padding: 4,
          },
        },
        slope: {
          type: "linear",
          position: "right",
          title: { display: true, text: "Slope (%)" },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            maxTicksLimit: 7,
            padding: 4,
            callback: (value) => `${value}%`,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 12,
            usePointStyle: true,
          },
        },
      },
    },
  });
  requestAnimationFrame(() => cesiumProfileChart?.resize());
}

async function createTerrainProfileFromLatestLine() {
  const viewer = initCesiumViewer();
  if (!viewer) return;

  const lineFeature = getLatestCesiumLineFeature();
  if (!lineFeature) {
    alert("Draw a 3D Line first, then click Profile.");
    return;
  }

  cesiumProfileButton?.classList.add("is-loading");
  try {
    const samples = createCesiumLineProfileSamples(lineFeature.positions);
    const profile = await sampleCesiumProfileTerrain(samples);
    if (!profile.length) {
      alert("Could not create a terrain profile from this line.");
      return;
    }
    renderCesiumProfileChart(profile);
  } finally {
    cesiumProfileButton?.classList.remove("is-loading");
  }
}

function getLatestCesiumPolygonFeature() {
  return [...cesiumDrawnFeatures]
    .reverse()
    .find(
      (feature) =>
        feature.geometryType === "Polygon" &&
        Array.isArray(feature.positions) &&
        feature.positions.length >= 3,
    );
}

function clearCesiumTerrainAnalysisEntities() {
  if (!cesiumViewer) return;
  cesiumTerrainAnalysisEntities.splice(0).forEach((entity) => {
    cesiumViewer.entities.remove(entity);
  });
  cesiumGeneratedProfileByEntityId.clear();
}

function getCesiumLocalProjector(cartographics) {
  const Cesium = window.Cesium;
  const centerLongitude =
    cartographics.reduce((sum, point) => sum + point.longitude, 0) /
    cartographics.length;
  const centerLatitude =
    cartographics.reduce((sum, point) => sum + point.latitude, 0) /
    cartographics.length;
  const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;
  const cosLatitude = Math.max(Math.cos(centerLatitude), 0.000001);

  return {
    centerLongitude,
    centerLatitude,
    earthRadius,
    toLocal(cartographic) {
      return {
        x:
          (cartographic.longitude - centerLongitude) *
          cosLatitude *
          earthRadius,
        y: (cartographic.latitude - centerLatitude) * earthRadius,
      };
    },
    fromLocal(point) {
      return new Cesium.Cartographic(
        centerLongitude + point.x / (cosLatitude * earthRadius),
        centerLatitude + point.y / earthRadius,
        0,
      );
    },
  };
}

function isCesiumLocalPointInPolygon(point, polygonPoints) {
  let inside = false;
  for (
    let currentIndex = 0, previousIndex = polygonPoints.length - 1;
    currentIndex < polygonPoints.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const current = polygonPoints[currentIndex];
    const previous = polygonPoints[previousIndex];
    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y || 1e-12) +
          current.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function createCesiumPolygonTerrainSamples(positions, spacingMeters = 25) {
  const Cesium = window.Cesium;
  if (!Cesium || positions.length < 3) return [];

  const safeSpacing = Math.max(5, Number(spacingMeters) || 25);
  const cartographics = positions.map((position) =>
    Cesium.Cartographic.fromCartesian(position),
  );
  const projector = getCesiumLocalProjector(cartographics);
  const polygonPoints = cartographics.map((point) => projector.toLocal(point));
  const xs = polygonPoints.map((point) => point.x);
  const ys = polygonPoints.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const estimatedSamples =
    ((maxX - minX) / safeSpacing) * ((maxY - minY) / safeSpacing);
  const adjustedSpacing =
    estimatedSamples > 1800
      ? safeSpacing * Math.sqrt(estimatedSamples / 1800)
      : safeSpacing;
  const samples = [];

  for (let y = minY; y <= maxY; y += adjustedSpacing) {
    for (let x = minX; x <= maxX; x += adjustedSpacing) {
      const localPoint = { x, y };
      if (!isCesiumLocalPointInPolygon(localPoint, polygonPoints)) continue;
      samples.push({
        local: localPoint,
        cartographic: projector.fromLocal(localPoint),
      });
    }
  }

  if (!samples.length) {
    const centerLocal = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
    samples.push({
      local: centerLocal,
      cartographic: projector.fromLocal(centerLocal),
    });
  }

  return {
    samples,
    spacing: adjustedSpacing,
    requestedSpacing: safeSpacing,
    bounds: { minX, maxX, minY, maxY },
    projector,
  };
}

async function sampleCesiumTerrainPoints(samples) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !samples.length) return [];

  const cartographics = samples.map(
    (sample) =>
      new Cesium.Cartographic(
        sample.cartographic.longitude,
        sample.cartographic.latitude,
        sample.cartographic.height,
      ),
  );

  let sampledCartographics = cartographics;
  if (Cesium.sampleTerrainMostDetailed) {
    try {
      sampledCartographics = await Cesium.sampleTerrainMostDetailed(
        viewer.terrainProvider,
        cartographics,
      );
    } catch (error) {
      console.warn("Could not sample site terrain:", error);
    }
  }

  return samples.map((sample, index) => ({
    ...sample,
    elevation: sampledCartographics[index]?.height ?? 0,
    cartographic: sampledCartographics[index] || sample.cartographic,
  }));
}

function getCesiumAspectLabel(degrees) {
  if (!Number.isFinite(degrees)) return "Flat / mixed";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % directions.length;
  return `${directions[index]} (${degrees.toFixed(0)} deg)`;
}

function getCesiumSiteTerrainMetrics(points, spacingMeters, targetElevation) {
  const Cesium = window.Cesium;
  const elevations = points
    .map((point) => point.elevation)
    .filter((value) => Number.isFinite(value));
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const averageElevation =
    elevations.reduce((sum, elevation) => sum + elevation, 0) / elevations.length;
  const target = Number.isFinite(targetElevation) ? targetElevation : averageElevation;
  const cellArea = spacingMeters * spacingMeters;
  let cutVolume = 0;
  let fillVolume = 0;

  points.forEach((point) => {
    const delta = target - point.elevation;
    if (delta > 0) fillVolume += delta * cellArea;
    if (delta < 0) cutVolume += Math.abs(delta) * cellArea;
  });

  const slopePairs = [];
  let slopeSum = 0;
  let slopeCount = 0;
  let maxSlope = 0;
  let aspectX = 0;
  let aspectY = 0;
  const neighborLimit = spacingMeters * 1.55;

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = points[j].local.x - points[i].local.x;
      const dy = points[j].local.y - points[i].local.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0 || distance > neighborLimit) continue;

      const elevationDelta = points[j].elevation - points[i].elevation;
      const slope = Math.abs(elevationDelta / distance) * 100;
      slopeSum += slope;
      slopeCount += 1;
      if (slope > maxSlope) maxSlope = slope;

      const downhillSign = elevationDelta > 0 ? -1 : 1;
      const weight = Math.abs(elevationDelta) / distance;
      aspectX += (dx / distance) * downhillSign * weight;
      aspectY += (dy / distance) * downhillSign * weight;

      slopePairs.push({
        slope,
        midpoint: {
          x: (points[i].local.x + points[j].local.x) / 2,
          y: (points[i].local.y + points[j].local.y) / 2,
        },
      });
    }
  }

  const aspectDegrees =
    Math.hypot(aspectX, aspectY) > 0
      ? (Cesium.Math.toDegrees(Math.atan2(aspectX, aspectY)) + 360) % 360
      : null;

  slopePairs.sort((a, b) => b.slope - a.slope);

  return {
    minElevation,
    maxElevation,
    averageElevation,
    elevationRange: maxElevation - minElevation,
    averageSlope: slopeCount ? slopeSum / slopeCount : 0,
    maxSlope,
    aspectDegrees,
    aspectLabel: getCesiumAspectLabel(aspectDegrees),
    targetElevation: target,
    cutVolume,
    fillVolume,
    netVolume: fillVolume - cutVolume,
    steepestZones: slopePairs.slice(0, 5),
  };
}

function addCesiumSiteTerrainGraphics(metrics, context) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  clearCesiumTerrainAnalysisEntities();
  metrics.steepestZones.forEach((zone, index) => {
    const cartographic = context.projector.fromLocal(zone.midpoint);
    const position = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      0,
    );
    cesiumTerrainAnalysisEntities.push(
      viewer.entities.add({
        name: `Steep zone ${index + 1}`,
        position,
        ellipse: {
          semiMajorAxis: context.spacing * 0.75,
          semiMinorAxis: context.spacing * 0.75,
          material: Cesium.Color.RED.withAlpha(0.32),
          outline: true,
          outlineColor: Cesium.Color.RED,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `${zone.slope.toFixed(1)}%`,
          font: "12px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      }),
    );
  });

  const { minX, maxX, minY, maxY } = context.bounds;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const profileLines = [
    {
      name: "Profile guide E-W",
      color: Cesium.Color.DEEPSKYBLUE,
      points: [
        context.projector.fromLocal({ x: minX, y: centerY }),
        context.projector.fromLocal({ x: maxX, y: centerY }),
      ],
    },
    {
      name: "Profile guide N-S",
      color: Cesium.Color.ORANGE,
      points: [
        context.projector.fromLocal({ x: centerX, y: minY }),
        context.projector.fromLocal({ x: centerX, y: maxY }),
      ],
    },
  ];

  profileLines.forEach((line) => {
    cesiumTerrainAnalysisEntities.push(
      viewer.entities.add({
        name: line.name,
        polyline: {
          positions: line.points.map((point) =>
            Cesium.Cartesian3.fromRadians(point.longitude, point.latitude, 0),
          ),
          width: 3,
          clampToGround: true,
          material: new Cesium.PolylineDashMaterialProperty({
            color: line.color,
            dashLength: 16,
          }),
        },
      }),
    );
  });
}

function setCesiumSiteTerrainStatus(message, isError = false) {
  if (!cesiumSiteTerrainStatus) return;
  cesiumSiteTerrainStatus.hidden = !message;
  cesiumSiteTerrainStatus.textContent = message || "";
  cesiumSiteTerrainStatus.classList.toggle("is-error", isError);
}

function renderCesiumSiteTerrainResults(metrics, context) {
  if (!cesiumSiteTerrainResults) return;
  cesiumSiteTerrainResults.innerHTML = [
    ["Min elevation", `${metrics.minElevation.toFixed(1)} m`],
    ["Max elevation", `${metrics.maxElevation.toFixed(1)} m`],
    ["Average elevation", `${metrics.averageElevation.toFixed(1)} m`],
    ["Elevation range", `${metrics.elevationRange.toFixed(1)} m`],
    ["Average slope", `${metrics.averageSlope.toFixed(1)}%`],
    ["Steepest slope", `${metrics.maxSlope.toFixed(1)}%`],
    ["Aspect direction", metrics.aspectLabel],
    ["Target elevation", `${metrics.targetElevation.toFixed(1)} m`],
    ["Cut volume", `${metrics.cutVolume.toFixed(0)} m3`],
    ["Fill volume", `${metrics.fillVolume.toFixed(0)} m3`],
    ["Net fill-cut", `${metrics.netVolume.toFixed(0)} m3`],
    [
      "Samples",
      `${context.samples.length} points / ${context.spacing.toFixed(1)} m`,
    ],
  ]
    .map(
      ([label, value]) => `
        <div class="cesium-site-terrain-card">
          <strong>${label}</strong>
          <span title="${value}">${value}</span>
        </div>
      `,
    )
    .join("");
}

function getCesiumProfileDirectionAngle(context) {
  const direction = cesiumSiteProfileDirectionSelect?.value || "longest";
  const { minX, maxX, minY, maxY } = context.bounds;
  if (direction === "north-south") return 0;
  if (direction === "east-west") return 90;
  if (direction === "custom") {
    const angle = Number(cesiumSiteProfileAngleInput?.value);
    return Number.isFinite(angle) ? angle : 90;
  }
  return maxX - minX >= maxY - minY ? 90 : 0;
}

function createCesiumPolygonProfileSegments(positions, spacingMeters = 3) {
  const Cesium = window.Cesium;
  if (!Cesium || positions.length < 3) return null;

  const safeSpacing = Math.max(1, Number(spacingMeters) || 3);
  const baseContext = createCesiumPolygonTerrainSamples(positions, 25);
  const cartographics = positions.map((position) =>
    Cesium.Cartographic.fromCartesian(position),
  );
  const projector = getCesiumLocalProjector(cartographics);
  const polygonPoints = cartographics.map((point) => projector.toLocal(point));
  const angleDegrees = getCesiumProfileDirectionAngle({
    bounds: baseContext.bounds,
  });
  const angleRadians = Cesium.Math.toRadians(angleDegrees);
  const direction = {
    x: Math.sin(angleRadians),
    y: Math.cos(angleRadians),
  };
  const normal = {
    x: -direction.y,
    y: direction.x,
  };
  const rotatedPoints = polygonPoints.map((point) => ({
    u: point.x * direction.x + point.y * direction.y,
    w: point.x * normal.x + point.y * normal.y,
  }));
  const us = rotatedPoints.map((point) => point.u);
  const ws = rotatedPoints.map((point) => point.w);
  const minU = Math.min(...us);
  const maxU = Math.max(...us);
  const minW = Math.min(...ws);
  const maxW = Math.max(...ws);
  const profileCountEstimate = (maxW - minW) / safeSpacing;
  const adjustedSpacing =
    profileCountEstimate > 350
      ? safeSpacing * Math.ceil(profileCountEstimate / 350)
      : safeSpacing;
  const segments = [];
  let profileIndex = 1;

  for (let w = minW; w <= maxW; w += adjustedSpacing) {
    const intersections = [];
    for (let i = 0; i < rotatedPoints.length; i += 1) {
      const start = rotatedPoints[i];
      const end = rotatedPoints[(i + 1) % rotatedPoints.length];
      const crosses =
        (start.w <= w && end.w > w) || (end.w <= w && start.w > w);
      if (!crosses) continue;
      const fraction = (w - start.w) / (end.w - start.w);
      intersections.push(start.u + fraction * (end.u - start.u));
    }

    intersections.sort((a, b) => a - b);
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const startU = Math.max(intersections[i], minU);
      const endU = Math.min(intersections[i + 1], maxU);
      if (endU - startU < Math.max(0.5, adjustedSpacing * 0.25)) continue;
      const startLocal = {
        x: direction.x * startU + normal.x * w,
        y: direction.y * startU + normal.y * w,
      };
      const endLocal = {
        x: direction.x * endU + normal.x * w,
        y: direction.y * endU + normal.y * w,
      };
      segments.push({
        name: `Profile ${profileIndex}`,
        startLocal,
        endLocal,
        positions: [
          Cesium.Cartesian3.fromRadians(
            projector.fromLocal(startLocal).longitude,
            projector.fromLocal(startLocal).latitude,
            0,
          ),
          Cesium.Cartesian3.fromRadians(
            projector.fromLocal(endLocal).longitude,
            projector.fromLocal(endLocal).latitude,
            0,
          ),
        ],
      });
      profileIndex += 1;
    }
  }

  return {
    segments,
    spacing: adjustedSpacing,
    requestedSpacing: safeSpacing,
    angleDegrees,
  };
}

async function openCesiumGeneratedProfile(entityId) {
  const profileLine = cesiumGeneratedProfileByEntityId.get(entityId);
  if (!profileLine) return;
  let profile = profileLine.profile;
  if (!profile?.length) {
    setCesiumSiteTerrainStatus(`Sampling ${profileLine.name}...`);
    profile = await sampleCesiumProfileTerrain(
      createCesiumLineProfileSamples(profileLine.positions, 2),
    );
    profileLine.profile = profile;
  }
  if (profile.length) {
    renderCesiumProfileChart(profile);
    setCesiumSiteTerrainStatus(`${profileLine.name} profile opened.`);
  }
}

function ensureCesiumProfileLinePickHandler() {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || cesiumProfileLinePickHandler) return;

  cesiumProfileLinePickHandler = new Cesium.ScreenSpaceEventHandler(
    viewer.scene.canvas,
  );
  cesiumProfileLinePickHandler.setInputAction((event) => {
    const picked = viewer.scene.pick(event.position);
    const entity = picked?.id;
    if (!entity?.id || !cesiumGeneratedProfileByEntityId.has(entity.id)) return;
    openCesiumGeneratedProfile(entity.id);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function addCesiumGeneratedProfileLines(profileContext) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  profileContext.segments.forEach((segment, index) => {
    const entity = viewer.entities.add({
      name: segment.name,
      polyline: {
        positions: segment.positions,
        width: 2,
        clampToGround: true,
        material:
          index % 2 === 0 ? Cesium.Color.CYAN : Cesium.Color.LIGHTSEAGREEN,
      },
      label: {
        text: String(index + 1),
        font: "11px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      position: segment.positions[0],
    });
    cesiumTerrainAnalysisEntities.push(entity);
    cesiumGeneratedProfileByEntityId.set(entity.id, segment);
  });
}

function getCesiumProfileSummary(profile) {
  const stats = getCesiumProfileStats(profile);
  const slopeSeries = getCesiumProfileSlopeSeries(profile);
  const maxSlope = slopeSeries.reduce(
    (max, slope) => Math.max(max, Math.abs(slope)),
    0,
  );
  return {
    distance: stats.totalDistance,
    minElevation: stats.minElevation,
    maxElevation: stats.maxElevation,
    gain: stats.gain,
    loss: stats.loss,
    maxSlope,
  };
}

function renderCesiumAnalyzedProfileList(profiles) {
  if (!cesiumSiteTerrainResults) return;
  const totalLength = profiles.reduce(
    (sum, profile) => sum + profile.summary.distance,
    0,
  );
  const highestSlope = Math.max(
    ...profiles.map((profile) => profile.summary.maxSlope),
  );

  cesiumSiteTerrainResults.innerHTML = `
    <div class="cesium-site-terrain-card">
      <strong>Analyzed</strong>
      <span>${profiles.length}</span>
    </div>
    <div class="cesium-site-terrain-card">
      <strong>Total length</strong>
      <span>${(totalLength / 1000).toFixed(2)} km</span>
    </div>
    <div class="cesium-site-terrain-card">
      <strong>Max slope</strong>
      <span>${highestSlope.toFixed(1)}%</span>
    </div>
    <div class="cesium-site-profile-list">
      <div class="cesium-site-profile-list__header">
        <span>Profile</span>
        <span>Length</span>
        <span>Min</span>
        <span>Max</span>
        <span>Gain/Loss</span>
        <span>Max slope</span>
      </div>
      ${profiles
        .map(
          ({ entityId, segment, summary }) => `
            <button class="cesium-site-profile-row" type="button" data-profile-id="${entityId}">
              <strong>${segment.name}</strong>
              <span>${summary.distance.toFixed(1)} m</span>
              <span>${summary.minElevation.toFixed(1)} m</span>
              <span>${summary.maxElevation.toFixed(1)} m</span>
              <span>${summary.gain.toFixed(1)} / ${summary.loss.toFixed(1)} m</span>
              <span>${summary.maxSlope.toFixed(1)}%</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;

  cesiumSiteTerrainResults
    .querySelectorAll(".cesium-site-profile-row")
    .forEach((row) => {
      row.addEventListener("click", () => {
        openCesiumGeneratedProfile(row.dataset.profileId);
      });
    });
}

async function analyzeCesiumGeneratedProfiles() {
  const profiles = [...cesiumGeneratedProfileByEntityId.entries()];
  if (!profiles.length) {
    setCesiumSiteTerrainStatus("Generate profile lines first.", true);
    return;
  }

  cesiumSiteProfilesAnalyze?.setAttribute("disabled", "disabled");
  cesiumSiteTerrainButton?.classList.add("is-loading");
  const analyzedProfiles = [];

  try {
    for (let index = 0; index < profiles.length; index += 1) {
      const [entityId, segment] = profiles[index];
      setCesiumSiteTerrainStatus(
        `Analyzing ${segment.name} (${index + 1}/${profiles.length})...`,
      );
      if (!segment.profile?.length) {
        segment.profile = await sampleCesiumProfileTerrain(
          createCesiumLineProfileSamples(segment.positions, 2),
        );
      }
      if (!segment.profile.length) continue;
      segment.summary = getCesiumProfileSummary(segment.profile);
      analyzedProfiles.push({ entityId, segment, summary: segment.summary });
    }

    if (!analyzedProfiles.length) {
      setCesiumSiteTerrainStatus("No terrain profiles could be analyzed.", true);
      return;
    }
    renderCesiumAnalyzedProfileList(analyzedProfiles);
    setCesiumSiteTerrainStatus(
      `Finished. ${analyzedProfiles.length} profiles analyzed. Click a row to open the chart.`,
    );
  } catch (error) {
    console.error("Profile analysis failed:", error);
    setCesiumSiteTerrainStatus(error.message || "Profile analysis failed.", true);
  } finally {
    cesiumSiteProfilesAnalyze?.removeAttribute("disabled");
    cesiumSiteTerrainButton?.classList.remove("is-loading");
  }
}

function generateCesiumProfilesForLatestPolygon() {
  const viewer = initCesiumViewer();
  if (!viewer) return;

  const polygonFeature = getLatestCesiumPolygonFeature();
  if (!polygonFeature) {
    setCesiumSiteTerrainStatus("Draw a 3D Polygon first, then generate profiles.", true);
    return;
  }

  const spacing = Number(cesiumSiteProfileSpacingInput?.value) || 3;
  setCesiumSiteTerrainStatus("Generating profile lines...");
  try {
    clearCesiumTerrainAnalysisEntities();
    const profileContext = createCesiumPolygonProfileSegments(
      polygonFeature.positions,
      spacing,
    );
    if (!profileContext?.segments?.length) {
      setCesiumSiteTerrainStatus("No profile lines could be generated inside this polygon.", true);
      return;
    }
    addCesiumGeneratedProfileLines(profileContext);
    setCesiumSiteTerrainStatus(
      `Generated ${profileContext.segments.length} profiles at ${profileContext.spacing.toFixed(
        1,
      )} m spacing, angle ${profileContext.angleDegrees.toFixed(0)} deg. Click a line to open its profile.`,
    );
    if (cesiumSiteTerrainResults) {
      cesiumSiteTerrainResults.innerHTML = `
        <div class="cesium-site-terrain-card">
          <strong>Profiles</strong>
          <span>${profileContext.segments.length}</span>
        </div>
        <div class="cesium-site-terrain-card">
          <strong>Spacing</strong>
          <span>${profileContext.spacing.toFixed(1)} m</span>
        </div>
        <div class="cesium-site-terrain-card">
          <strong>Direction</strong>
          <span>${profileContext.angleDegrees.toFixed(0)} deg</span>
        </div>
      `;
    }
  } catch (error) {
    console.error("Profile generation failed:", error);
    setCesiumSiteTerrainStatus(error.message || "Profile generation failed.", true);
  }
}

async function analyzeLatestCesiumPolygonTerrain() {
  const viewer = initCesiumViewer();
  if (!viewer) return;

  const polygonFeature = getLatestCesiumPolygonFeature();
  if (!polygonFeature) {
    setCesiumSiteTerrainStatus("Draw a 3D Polygon first, then run Site Terrain.", true);
    return;
  }

  const spacing = Number(cesiumSiteTerrainSpacingInput?.value) || 25;
  const targetElevation = Number(cesiumSiteTerrainTargetInput?.value);
  cesiumSiteTerrainButton?.classList.add("is-loading");
  cesiumSiteTerrainRun?.setAttribute("disabled", "disabled");
  setCesiumSiteTerrainStatus("Sampling terrain inside polygon...");

  try {
    const context = createCesiumPolygonTerrainSamples(
      polygonFeature.positions,
      spacing,
    );
    const sampledPoints = await sampleCesiumTerrainPoints(context.samples);
    if (!sampledPoints.length) {
      setCesiumSiteTerrainStatus("No terrain samples were created inside this polygon.", true);
      return;
    }
    context.samples = sampledPoints;
    const metrics = getCesiumSiteTerrainMetrics(
      sampledPoints,
      context.spacing,
      targetElevation,
    );
    if (cesiumSiteTerrainTargetInput && !cesiumSiteTerrainTargetInput.value) {
      cesiumSiteTerrainTargetInput.placeholder = metrics.averageElevation.toFixed(1);
    }
    renderCesiumSiteTerrainResults(metrics, context);
    addCesiumSiteTerrainGraphics(metrics, context);
    setCesiumSiteTerrainStatus(
      `Finished. ${sampledPoints.length} terrain points sampled${
        context.spacing !== context.requestedSpacing
          ? `; spacing adjusted to ${context.spacing.toFixed(1)} m for performance`
          : ""
      }.`,
    );
  } catch (error) {
    console.error("Site terrain analysis failed:", error);
    setCesiumSiteTerrainStatus(error.message || "Site terrain analysis failed.", true);
  } finally {
    cesiumSiteTerrainButton?.classList.remove("is-loading");
    cesiumSiteTerrainRun?.removeAttribute("disabled");
  }
}

function getCesiumGroundPosition(screenPosition) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !screenPosition) return null;

  if (viewer.scene.pickPositionSupported) {
    const pickedPosition = viewer.scene.pickPosition(screenPosition);
    if (Cesium.defined(pickedPosition)) return pickedPosition;
  }

  const ray = viewer.camera.getPickRay(screenPosition);
  if (!ray) return null;

  const globePosition = viewer.scene.globe.pick(ray, viewer.scene);
  if (Cesium.defined(globePosition)) return globePosition;

  return viewer.camera.pickEllipsoid(screenPosition, viewer.scene.globe.ellipsoid);
}

function getCesiumPositionWithHeightOffset(position, offsetMeters) {
  const Cesium = window.Cesium;
  if (!Cesium || !position) return null;

  const cartographic = Cesium.Cartographic.fromCartesian(position);
  return Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height + offsetMeters,
  );
}

function getCesiumTransmissionPoleFromEntity(entity) {
  if (!entity) return null;
  return cesiumTransmissionPoles.find(
    (pole) =>
      pole.entity === entity ||
      pole.topEntity === entity ||
      pole.baseEntity === entity,
  );
}

function createCesiumCablePositions(startTop, endTop, sagMeters = 3) {
  const Cesium = window.Cesium;
  if (!Cesium || !startTop || !endTop) return [];

  const start = Cesium.Cartographic.fromCartesian(startTop);
  const end = Cesium.Cartographic.fromCartesian(endTop);
  const geodesic = new Cesium.EllipsoidGeodesic(start, end);
  const positions = [];
  const steps = 32;

  for (let index = 0; index <= steps; index += 1) {
    const fraction = index / steps;
    const point = geodesic.interpolateUsingFraction(fraction);
    const height =
      start.height + (end.height - start.height) * fraction -
      Math.sin(Math.PI * fraction) * sagMeters;

    positions.push(
      Cesium.Cartesian3.fromRadians(point.longitude, point.latitude, height),
    );
  }

  return positions;
}

function setCesiumTransmissionPoleMode(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleCesiumTransmissionPoleButton) return;

  if (enabled) {
    setCesiumDrawFootprintMode(false);
    setCesiumTransmissionCableMode(false);
    setCesiumManholeMode(false);
    setCesiumPipelineMode(false);
    if (isCesiumSolarMode) setCesiumSolarMode(false);
  }

  isCesiumTransmissionPoleMode = enabled;
  toggleCesiumTransmissionPoleButton.classList.toggle("is-active", enabled);
  toggleCesiumTransmissionPoleButton.title = enabled
    ? "Click terrain to place transmission poles"
    : "Draw 3D transmission poles";

  if (!enabled) {
    if (cesiumTransmissionPoleHandler) {
      cesiumTransmissionPoleHandler.destroy();
      cesiumTransmissionPoleHandler = null;
    }
    return;
  }

  setMapMode3d(true);
  cesiumTransmissionPoleHandler = new Cesium.ScreenSpaceEventHandler(
    viewer.scene.canvas,
  );
  cesiumTransmissionPoleHandler.setInputAction((event) => {
    addCesiumTransmissionPole(event.position);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function addCesiumTransmissionPole(screenPosition) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  const basePosition = getCesiumGroundPosition(screenPosition);
  if (!viewer || !Cesium || !basePosition) return;

  const poleHeight = 18;
  const poleId = cesiumTransmissionPoles.length + 1;
  const centerPosition = getCesiumPositionWithHeightOffset(
    basePosition,
    poleHeight / 2,
  );
  const topPosition = getCesiumPositionWithHeightOffset(basePosition, poleHeight);
  if (!centerPosition || !topPosition) return;

  const entity = viewer.entities.add({
    name: `Transmission Pole ${poleId}`,
    position: centerPosition,
    properties: {
      transmissionPoleId: poleId,
      heightMeters: poleHeight,
    },
    cylinder: {
      length: poleHeight,
      topRadius: 0.16,
      bottomRadius: 0.28,
      material: Cesium.Color.DIMGRAY,
      outline: true,
      outlineColor: Cesium.Color.WHITE.withAlpha(0.65),
    },
  });

  const topEntity = viewer.entities.add({
    name: `Transmission Pole ${poleId} top`,
    position: topPosition,
    point: {
      pixelSize: 9,
      color: Cesium.Color.ORANGE,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: `P${poleId}`,
      font: "12px sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  const baseEntity = viewer.entities.add({
    name: `Transmission Pole ${poleId} base`,
    position: basePosition,
    point: {
      pixelSize: 7,
      color: Cesium.Color.DARKORANGE,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });

  cesiumTransmissionPoles.push({
    id: poleId,
    entity,
    topEntity,
    baseEntity,
    basePosition,
    topPosition,
    heightMeters: poleHeight,
  });
}

function setCesiumTransmissionPoleSelected(pole, selected) {
  const Cesium = window.Cesium;
  if (!Cesium || !pole?.topEntity?.point) return;
  pole.topEntity.point.color = selected ? Cesium.Color.LIME : Cesium.Color.ORANGE;
  pole.topEntity.point.pixelSize = selected ? 12 : 9;
}

function clearCesiumTransmissionCableSelection() {
  cesiumTransmissionSelectedPoles.splice(0).forEach((pole) => {
    setCesiumTransmissionPoleSelected(pole, false);
  });
}

function addCesiumTransmissionCable(startPole, endPole) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !startPole || !endPole || startPole === endPole) return;

  const positions = createCesiumCablePositions(startPole.topPosition, endPole.topPosition);
  if (positions.length < 2) return;

  const entity = viewer.entities.add({
    name: `Cable P${startPole.id}-P${endPole.id}`,
    polyline: {
      positions,
      width: 3,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.15,
        color: Cesium.Color.ORANGE,
      }),
    },
  });

  cesiumTransmissionCables.push({
    entity,
    startPoleId: startPole.id,
    endPoleId: endPole.id,
    positions,
  });
}

function setCesiumTransmissionCableMode(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleCesiumTransmissionCableButton) return;

  if (enabled) {
    setCesiumDrawFootprintMode(false);
    setCesiumTransmissionPoleMode(false);
    setCesiumManholeMode(false);
    setCesiumPipelineMode(false);
    if (isCesiumSolarMode) setCesiumSolarMode(false);
  }

  isCesiumTransmissionCableMode = enabled;
  toggleCesiumTransmissionCableButton.classList.toggle("is-active", enabled);
  toggleCesiumTransmissionCableButton.title = enabled
    ? "Click two transmission poles to connect them"
    : "Connect two transmission poles with cable";

  clearCesiumTransmissionCableSelection();

  if (!enabled) {
    if (cesiumTransmissionCableHandler) {
      cesiumTransmissionCableHandler.destroy();
      cesiumTransmissionCableHandler = null;
    }
    return;
  }

  setMapMode3d(true);
  cesiumTransmissionCableHandler = new Cesium.ScreenSpaceEventHandler(
    viewer.scene.canvas,
  );
  cesiumTransmissionCableHandler.setInputAction((event) => {
    const picked = viewer.scene.pick(event.position);
    const pole = getCesiumTransmissionPoleFromEntity(picked?.id);
    if (!pole || cesiumTransmissionSelectedPoles.includes(pole)) return;

    cesiumTransmissionSelectedPoles.push(pole);
    setCesiumTransmissionPoleSelected(pole, true);

    if (cesiumTransmissionSelectedPoles.length === 2) {
      addCesiumTransmissionCable(
        cesiumTransmissionSelectedPoles[0],
        cesiumTransmissionSelectedPoles[1],
      );
      clearCesiumTransmissionCableSelection();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function getCesiumManholeFromEntity(entity) {
  if (!entity) return null;
  return cesiumManholes.find(
    (manhole) =>
      manhole.entity === entity ||
      manhole.coverEntity === entity ||
      manhole.bottomEntity === entity,
  );
}

function setCesiumManholeMode(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleCesiumManholeButton) return;

  if (enabled) {
    setCesiumDrawFootprintMode(false);
    setCesiumTransmissionPoleMode(false);
    setCesiumTransmissionCableMode(false);
    setCesiumPipelineMode(false);
    if (isCesiumSolarMode) setCesiumSolarMode(false);
  }

  isCesiumManholeMode = enabled;
  toggleCesiumManholeButton.classList.toggle("is-active", enabled);
  toggleCesiumManholeButton.title = enabled
    ? "Click terrain to place underground manholes"
    : "Draw underground manholes";

  if (!enabled) {
    if (cesiumManholeHandler) {
      cesiumManholeHandler.destroy();
      cesiumManholeHandler = null;
    }
    return;
  }

  setMapMode3d(true);
  cesiumManholeHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  cesiumManholeHandler.setInputAction((event) => {
    addCesiumManhole(event.position);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function addCesiumManhole(screenPosition) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  const coverPosition = getCesiumGroundPosition(screenPosition);
  if (!viewer || !Cesium || !coverPosition) return;

  const depthMeters = 2;
  const manholeId = cesiumManholes.length + 1;
  const centerPosition = getCesiumPositionWithHeightOffset(
    coverPosition,
    -depthMeters / 2,
  );
  const bottomPosition = getCesiumPositionWithHeightOffset(coverPosition, -depthMeters);
  if (!centerPosition || !bottomPosition) return;

  const entity = viewer.entities.add({
    name: `Manhole ${manholeId}`,
    position: centerPosition,
    properties: {
      manholeId,
      depthMeters,
      assetType: "underground-manhole",
    },
    cylinder: {
      length: depthMeters,
      topRadius: 0.85,
      bottomRadius: 0.85,
      material: Cesium.Color.CYAN.withAlpha(0.55),
      outline: true,
      outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
    },
  });

  const coverEntity = viewer.entities.add({
    name: `Manhole ${manholeId} cover`,
    position: coverPosition,
    ellipse: {
      semiMajorAxis: 0.95,
      semiMinorAxis: 0.95,
      material: Cesium.Color.DARKSLATEGRAY.withAlpha(0.85),
      outline: true,
      outlineColor: Cesium.Color.CYAN,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
    label: {
      text: `M${manholeId}`,
      font: "12px sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -22),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  const bottomEntity = viewer.entities.add({
    name: `Manhole ${manholeId} invert`,
    position: bottomPosition,
    point: {
      pixelSize: 8,
      color: Cesium.Color.CYAN,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  cesiumManholes.push({
    id: manholeId,
    entity,
    coverEntity,
    bottomEntity,
    coverPosition,
    bottomPosition,
    depthMeters,
  });
}

function setCesiumManholeSelected(manhole, selected) {
  const Cesium = window.Cesium;
  if (!Cesium || !manhole?.bottomEntity?.point) return;
  manhole.bottomEntity.point.color = selected ? Cesium.Color.LIME : Cesium.Color.CYAN;
  manhole.bottomEntity.point.pixelSize = selected ? 12 : 8;
}

function clearCesiumPipelineSelection() {
  cesiumSelectedManholes.splice(0).forEach((manhole) => {
    setCesiumManholeSelected(manhole, false);
  });
}

function addCesiumPipeline(startManhole, endManhole) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (
    !viewer ||
    !Cesium ||
    !startManhole ||
    !endManhole ||
    startManhole === endManhole
  ) {
    return;
  }

  const positions = [startManhole.bottomPosition, endManhole.bottomPosition];
  const pipelineId = cesiumPipelines.length + 1;
  const entity = viewer.entities.add({
    name: `Pipeline M${startManhole.id}-M${endManhole.id}`,
    properties: {
      pipelineId,
      startManholeId: startManhole.id,
      endManholeId: endManhole.id,
      assetType: "underground-pipeline",
    },
    polyline: {
      positions,
      width: 7,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.18,
        color: Cesium.Color.CYAN,
      }),
      depthFailMaterial: Cesium.Color.CYAN.withAlpha(0.35),
      clampToGround: false,
    },
  });

  cesiumPipelines.push({
    entity,
    startManholeId: startManhole.id,
    endManholeId: endManhole.id,
    positions,
  });
}

function setCesiumPipelineMode(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleCesiumPipelineButton) return;

  if (enabled) {
    setCesiumDrawFootprintMode(false);
    setCesiumTransmissionPoleMode(false);
    setCesiumTransmissionCableMode(false);
    setCesiumManholeMode(false);
    if (isCesiumSolarMode) setCesiumSolarMode(false);
  }

  isCesiumPipelineMode = enabled;
  toggleCesiumPipelineButton.classList.toggle("is-active", enabled);
  toggleCesiumPipelineButton.title = enabled
    ? "Click two manholes to connect an underground pipe"
    : "Connect two manholes with an underground pipe";

  clearCesiumPipelineSelection();

  if (!enabled) {
    if (cesiumPipelineHandler) {
      cesiumPipelineHandler.destroy();
      cesiumPipelineHandler = null;
    }
    return;
  }

  setMapMode3d(true);
  cesiumPipelineHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  cesiumPipelineHandler.setInputAction((event) => {
    const picked = viewer.scene.pick(event.position);
    const manhole = getCesiumManholeFromEntity(picked?.id);
    if (!manhole || cesiumSelectedManholes.includes(manhole)) return;

    cesiumSelectedManholes.push(manhole);
    setCesiumManholeSelected(manhole, true);

    if (cesiumSelectedManholes.length === 2) {
      addCesiumPipeline(cesiumSelectedManholes[0], cesiumSelectedManholes[1]);
      clearCesiumPipelineSelection();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function getCesiumDrawPreviewPositions() {
  if (cesiumDrawPositions.length === 0) return [];
  return cesiumDrawPreviewPosition
    ? [...cesiumDrawPositions, cesiumDrawPreviewPosition]
    : cesiumDrawPositions;
}

function getCesiumDrawType() {
  return cesiumDrawTypeSelect?.value || "Polygon";
}

function clearCesiumDrawSketch() {
  if (!cesiumViewer) return;

  cesiumDrawPointEntities.splice(0).forEach((entity) => {
    cesiumViewer.entities.remove(entity);
  });

  if (cesiumDrawPolylineEntity) {
    cesiumViewer.entities.remove(cesiumDrawPolylineEntity);
    cesiumDrawPolylineEntity = null;
  }

  if (cesiumDrawPolygonEntity) {
    cesiumViewer.entities.remove(cesiumDrawPolygonEntity);
    cesiumDrawPolygonEntity = null;
  }

  cesiumDrawPositions = [];
  cesiumDrawPreviewPosition = null;
}

function getCesiumSolarSettings() {
  return {
    panelWidth: Math.max(0.1, Number(cesiumSolarPanelWidthInput?.value) || 1.1),
    panelHeight: Math.max(0.1, Number(cesiumSolarPanelHeightInput?.value) || 1.8),
    columnGap: Math.max(0, Number(cesiumSolarColumnGapInput?.value) || 0),
    rowGap: Math.max(0, Number(cesiumSolarRowGapInput?.value) || 0),
    margin: Math.max(0, Number(cesiumSolarMarginInput?.value) || 0),
    mountHeight: Math.max(0, Number(cesiumSolarMountHeightInput?.value) || 2),
    panelTilt: Math.max(-75, Math.min(75, Number(cesiumSolarPanelTiltInput?.value) || 0)),
    sideTilt: Math.max(-75, Math.min(75, Number(cesiumSolarSideTiltInput?.value) || 0)),
    wattage: Math.max(1, Number(cesiumSolarWattageInput?.value) || 450),
    dailyYield: Math.max(0, Number(cesiumSolarDailyYieldInput?.value) || 0),
    performanceRatio: Math.max(
      0,
      Math.min(1, Number(cesiumSolarPerformanceRatioInput?.value) || 0),
    ),
  };
}

function syncCesiumSolarTiltValue() {
  const tilt = Math.max(-75, Math.min(75, Number(cesiumSolarPanelTiltInput?.value) || 0));
  const sideTilt = Math.max(-75, Math.min(75, Number(cesiumSolarSideTiltInput?.value) || 0));
  if (cesiumSolarPanelTiltValue) cesiumSolarPanelTiltValue.textContent = `${tilt.toFixed(0)}°`;
  if (cesiumSolarSideTiltValue) cesiumSolarSideTiltValue.textContent = `${sideTilt.toFixed(0)}°`;
}

function hasCesiumSolarMesh() {
  return Boolean(cesiumSolarPanelPrimitive || cesiumSolarSupportLegs);
}

function getCesiumSolarPreviewPositions() {
  if (cesiumSolarPositions.length === 0) return [];
  return cesiumSolarPreviewPosition
    ? [...cesiumSolarPositions, cesiumSolarPreviewPosition]
    : cesiumSolarPositions;
}

function getClosedCesiumSolarPreviewPositions() {
  const positions = getCesiumSolarPreviewPositions();
  if (positions.length < 3) return positions;
  return [...positions, positions[0]];
}

function clearCesiumSolarPanels() {
  if (!cesiumViewer) return;
  cesiumSolarPanelEntities.splice(0).forEach((entity) => {
    cesiumViewer.entities.remove(entity);
  });
  if (cesiumSolarPanelPrimitive) {
    cesiumViewer.scene.primitives.remove(cesiumSolarPanelPrimitive);
    cesiumSolarPanelPrimitive = null;
  }
  if (cesiumSolarSupportLegs) {
    cesiumViewer.scene.primitives.remove(cesiumSolarSupportLegs);
    cesiumSolarSupportLegs = null;
  }
  if (cesiumSolarRotationHandleEntity) {
    cesiumViewer.entities.remove(cesiumSolarRotationHandleEntity);
    cesiumSolarRotationHandleEntity = null;
  }
}

function clearCesiumSolarSketch({ keepResults = false } = {}) {
  if (!cesiumViewer) return;
  if (cesiumSolarPolygonEntity) {
    cesiumViewer.entities.remove(cesiumSolarPolygonEntity);
    cesiumSolarPolygonEntity = null;
  }
  if (cesiumSolarOutlineEntity) {
    cesiumViewer.entities.remove(cesiumSolarOutlineEntity);
    cesiumSolarOutlineEntity = null;
  }
  if (!keepResults) {
    clearCesiumSolarPanels();
    cesiumSolarPositions = [];
    cesiumSolarPreviewPosition = null;
  }
}

function setCesiumSolarStatus(message) {
  if (cesiumSolarStatus) cesiumSolarStatus.textContent = message || "";
}

function updateCesiumSolarDrawButtonLabel() {
  if (!cesiumSolarDraw) return;
  if (!isCesiumSolarMode) {
    cesiumSolarDraw.textContent = "Draw Site";
  } else if (isCesiumSolarDrawingFinished) {
    cesiumSolarDraw.textContent = "Stop Edit";
  } else {
    cesiumSolarDraw.textContent = "Finish Site";
  }
}

function renderCesiumSolarResults(result) {
  if (!cesiumSolarResults) return;
  if (!result) {
    cesiumSolarResults.innerHTML = "";
    return;
  }
  const yearlyYield = result.settings.dailyYield * 365;
  cesiumSolarResults.innerHTML = `
    <div class="cesium-solar-result-card">
      <strong>Panels</strong>
      <span>${result.panelCount}</span>
    </div>
    <div class="cesium-solar-result-card">
      <strong>Capacity</strong>
      <span>${result.capacityKw.toFixed(2)} kW</span>
    </div>
    <div class="cesium-solar-result-card">
      <strong>Daily energy</strong>
      <span>${result.dailyEnergyKwh.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} kWh</span>
    </div>
    <div class="cesium-solar-result-card">
      <strong>Yearly energy</strong>
      <span>${result.yearlyEnergyKwh.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} kWh</span>
    </div>
    <div class="cesium-solar-result-card">
      <strong>Panel area</strong>
      <span>${result.panelArea.toFixed(1)} m2</span>
    </div>
    <div class="cesium-solar-result-card">
      <strong>Coverage</strong>
      <span>${result.coverage.toFixed(1)}%</span>
    </div>
    <div class="cesium-solar-result-card">
      <strong>Daily indicator</strong>
      <span>${result.settings.dailyYield.toFixed(2)} kWh/kWp</span>
    </div>
    <div class="cesium-solar-result-card">
      <strong>Yearly indicator</strong>
      <span>${yearlyYield.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} kWh/kWp</span>
    </div>
  `;
}

function getCesiumSolarLocalContext(positions) {
  const Cesium = window.Cesium;
  const cartographics = positions.map((position) =>
    Cesium.Cartographic.fromCartesian(position),
  );
  const projector = getCesiumLocalProjector(cartographics);
  const polygonPoints = cartographics.map((point) => projector.toLocal(point));
  return { projector, polygonPoints };
}

function getCesiumLocalPolygonArea(points) {
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

function getCesiumSolarRotatedPoint(center, axisX, axisY, offsetX, offsetY) {
  return {
    x: center.x + axisX.x * offsetX + axisY.x * offsetY,
    y: center.y + axisX.y * offsetX + axisY.y * offsetY,
  };
}

function getCesiumSolarPointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const segmentLengthSquared = dx * dx + dy * dy;
  if (segmentLengthSquared <= 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        segmentLengthSquared,
    ),
  );
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };
  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function isCesiumSolarPanelInsidePolygon(corners, polygonPoints, margin) {
  return corners.every((corner) => {
    if (!isCesiumLocalPointInPolygon(corner, polygonPoints)) return false;
    if (margin <= 0) return true;
    return polygonPoints.every((point, index) => {
      const next = polygonPoints[(index + 1) % polygonPoints.length];
      return getCesiumSolarPointToSegmentDistance(corner, point, next) >= margin;
    });
  });
}

function createCesiumSolarLayout(positions) {
  const Cesium = window.Cesium;
  if (!Cesium || positions.length < 3) return null;

  const settings = getCesiumSolarSettings();
  const { projector, polygonPoints } = getCesiumSolarLocalContext(positions);
  const xs = polygonPoints.map((point) => point.x);
  const ys = polygonPoints.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const angleRadians = Cesium.Math.toRadians(cesiumSolarAngleDegrees);
  const axisX = { x: Math.cos(angleRadians), y: Math.sin(angleRadians) };
  const axisY = { x: -Math.sin(angleRadians), y: Math.cos(angleRadians) };
  const stepX = settings.panelWidth + settings.columnGap;
  const stepY = settings.panelHeight + settings.rowGap;
  const center = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
  const diagonal = Math.hypot(maxX - minX, maxY - minY);
  const panels = [];
  const maxPanels = 10000;
  const rotatedPolygonPoints = polygonPoints.map((point) => ({
    u: (point.x - center.x) * axisX.x + (point.y - center.y) * axisX.y,
    v: (point.x - center.x) * axisY.x + (point.y - center.y) * axisY.y,
  }));
  const us = rotatedPolygonPoints.map((point) => point.u);
  const vs = rotatedPolygonPoints.map((point) => point.v);

  for (let y = -diagonal; y <= diagonal; y += stepY) {
    for (let x = -diagonal; x <= diagonal; x += stepX) {
      const panelCenter = getCesiumSolarRotatedPoint(center, axisX, axisY, x, y);
      const corners = [
        getCesiumSolarRotatedPoint(
          panelCenter,
          axisX,
          axisY,
          -settings.panelWidth / 2,
          -settings.panelHeight / 2,
        ),
        getCesiumSolarRotatedPoint(
          panelCenter,
          axisX,
          axisY,
          settings.panelWidth / 2,
          -settings.panelHeight / 2,
        ),
        getCesiumSolarRotatedPoint(
          panelCenter,
          axisX,
          axisY,
          settings.panelWidth / 2,
          settings.panelHeight / 2,
        ),
        getCesiumSolarRotatedPoint(
          panelCenter,
          axisX,
          axisY,
          -settings.panelWidth / 2,
          settings.panelHeight / 2,
        ),
      ];
      if (!isCesiumSolarPanelInsidePolygon(corners, polygonPoints, settings.margin)) {
        continue;
      }
      panels.push(corners);
      if (panels.length >= maxPanels) break;
    }
    if (panels.length >= maxPanels) break;
  }

  const siteArea = getCesiumLocalPolygonArea(polygonPoints);
  const panelArea = panels.length * settings.panelWidth * settings.panelHeight;
  const capacityKw = (panels.length * settings.wattage) / 1000;
  const dailyEnergyKwh = capacityKw * settings.dailyYield * settings.performanceRatio;
  return {
    panels,
    projector,
    center,
    axisX,
    axisY,
    settings,
    rotationBounds: {
      minU: Math.min(...us),
      maxU: Math.max(...us),
      maxV: Math.max(...vs),
    },
    siteArea,
    panelArea,
    panelCount: panels.length,
    capacityKw,
    dailyEnergyKwh,
    yearlyEnergyKwh: dailyEnergyKwh * 365,
    coverage: siteArea > 0 ? (panelArea / siteArea) * 100 : 0,
    limited: panels.length >= maxPanels,
    maxPanels,
  };
}

function getCesiumCartographicTerrainHeight(cartographic) {
  const height = cesiumViewer?.scene?.globe?.getHeight(cartographic);
  return Number.isFinite(height) ? height : 0;
}

function getCesiumSolarPanelCartesianCorners(panelCorners, projector, heightOffset = 0) {
  const Cesium = window.Cesium;
  return panelCorners.map((corner) => {
    const cartographic = projector.fromLocal(corner);
    const terrainHeight = heightOffset > 0 ? getCesiumCartographicTerrainHeight(cartographic) : 0;
    return Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      terrainHeight + heightOffset,
    );
  });
}

function getCesiumSolarPanelCenter(panelCorners) {
  const sum = panelCorners.reduce(
    (total, corner) => ({
      x: total.x + corner.x,
      y: total.y + corner.y,
    }),
    { x: 0, y: 0 },
  );
  return {
    x: sum.x / panelCorners.length,
    y: sum.y / panelCorners.length,
  };
}

function getCesiumSolarTiltedPanelCartesianCorners(panelCorners, layout) {
  const Cesium = window.Cesium;
  const center = getCesiumSolarPanelCenter(panelCorners);
  const tiltRadians = Cesium.Math.toRadians(layout.settings.panelTilt);
  const sideTiltRadians = Cesium.Math.toRadians(layout.settings.sideTilt);
  return panelCorners.map((corner) => {
    const cartographic = layout.projector.fromLocal(corner);
    const terrainHeight = getCesiumCartographicTerrainHeight(cartographic);
    const tiltOffset =
      ((corner.x - center.x) * layout.axisY.x + (corner.y - center.y) * layout.axisY.y) *
        Math.sin(tiltRadians) +
      ((corner.x - center.x) * layout.axisX.x + (corner.y - center.y) * layout.axisX.y) *
        Math.sin(sideTiltRadians);
    return Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      terrainHeight + layout.settings.mountHeight + tiltOffset,
    );
  });
}

function drawCesiumSolarLayout(positions) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || positions.length < 3) return;

  clearCesiumSolarPanels();
  const layout = createCesiumSolarLayout(positions);
  if (!layout) return;
  cesiumSolarLastLayout = layout;

  layout.panels.forEach((panelCorners) => {
    const cartesianCorners = getCesiumSolarPanelCartesianCorners(
      panelCorners,
      layout.projector,
    );
    cesiumSolarPanelEntities.push(
      viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(cartesianCorners),
          material: Cesium.Color.DARKSLATEGRAY.withAlpha(0.82),
          outline: true,
          outlineColor: Cesium.Color.CYAN.withAlpha(0.9),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      }),
    );
  });

  const handleOffset = Math.max(3, layout.settings.rowGap + layout.settings.panelHeight);
  const handleV = layout.rotationBounds.maxV + handleOffset;
  const handleStart = {
    x:
      layout.center.x +
      layout.axisX.x * layout.rotationBounds.minU +
      layout.axisY.x * handleV,
    y:
      layout.center.y +
      layout.axisX.y * layout.rotationBounds.minU +
      layout.axisY.y * handleV,
  };
  const handleEnd = {
    x:
      layout.center.x +
      layout.axisX.x * layout.rotationBounds.maxU +
      layout.axisY.x * handleV,
    y:
      layout.center.y +
      layout.axisX.y * layout.rotationBounds.maxU +
      layout.axisY.y * handleV,
  };
  const handleMid = {
    x: (handleStart.x + handleEnd.x) / 2,
    y: (handleStart.y + handleEnd.y) / 2,
  };
  const handlePositions = [handleStart, handleEnd].map((point) => {
    const cartographic = layout.projector.fromLocal(point);
    return Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      0,
    );
  });
  cesiumSolarRotationHandleEntity = viewer.entities.add({
    polyline: {
      positions: handlePositions,
      width: 5,
      clampToGround: true,
      material: Cesium.Color.ORANGE,
    },
    position: (() => {
      const cartographic = layout.projector.fromLocal(handleMid);
      return Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        0,
      );
    })(),
    point: {
      pixelSize: 12,
      color: Cesium.Color.ORANGE,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });

  renderCesiumSolarResults(layout);
  if (cesiumSunPanel && !cesiumSunPanel.hidden) renderCesiumSunResults();
  setCesiumSolarStatus(
    `${layout.panelCount} panels. Drag the orange edge/handle to rotate.${
      layout.limited
        ? ` Layout capped at ${layout.maxPanels} panels for performance.`
        : ""
    }`,
  );
}

function createCesiumSolarPanelMesh() {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  const layout = cesiumSolarLastLayout;
  if (!viewer || !Cesium || !layout?.panels?.length) {
    setCesiumSolarStatus("Create or finish a solar layout before creating a mesh.");
    return;
  }

  layout.settings = {
    ...layout.settings,
    ...getCesiumSolarSettings(),
  };

  cesiumSolarPanelEntities.splice(0).forEach((entity) => {
    viewer.entities.remove(entity);
  });
  if (cesiumSolarPanelPrimitive) {
    viewer.scene.primitives.remove(cesiumSolarPanelPrimitive);
    cesiumSolarPanelPrimitive = null;
  }
  if (cesiumSolarSupportLegs) {
    viewer.scene.primitives.remove(cesiumSolarSupportLegs);
    cesiumSolarSupportLegs = null;
  }

  const instances = layout.panels.map((panelCorners, index) => {
    const positions = getCesiumSolarTiltedPanelCartesianCorners(panelCorners, layout);
    return new Cesium.GeometryInstance({
      id: `solar-panel-${index + 1}`,
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(positions),
        perPositionHeight: true,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.DARKSLATEGRAY.withAlpha(1),
        ),
      },
    });
  });

  const primitiveOptions = {
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true,
    }),
    asynchronous: true,
  };

  cesiumSolarPanelPrimitive = new Cesium.Primitive(primitiveOptions);
  viewer.scene.primitives.add(cesiumSolarPanelPrimitive);

  cesiumSolarSupportLegs = new Cesium.PolylineCollection();
  const legMaterial = Cesium.Material.fromType("Color", {
    color: Cesium.Color.DARKGRAY.withAlpha(0.98),
  });
  layout.panels.forEach((panelCorners) => {
    const center = getCesiumSolarPanelCenter(panelCorners);
    const cartographic = layout.projector.fromLocal(center);
    const terrainHeight = getCesiumCartographicTerrainHeight(cartographic);
    const legTopHeight = Math.max(
      terrainHeight,
      terrainHeight + layout.settings.mountHeight - 0.12,
    );
    cesiumSolarSupportLegs.add({
      positions: [
        Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          terrainHeight,
        ),
        Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          legTopHeight,
        ),
      ],
      width: 6,
      material: legMaterial,
    });
  });
  viewer.scene.primitives.add(cesiumSolarSupportLegs);

  setCesiumSolarStatus(
    `Created raised panels ${layout.settings.mountHeight.toFixed(
      1,
    )} m above terrain, tilted ${layout.settings.panelTilt.toFixed(
      0,
    )}° up/down and ${layout.settings.sideTilt.toFixed(
      0,
    )}° left/right, with one center support leg per panel.`,
  );
  if (cesiumSunPanel && !cesiumSunPanel.hidden) renderCesiumSunResults();
}

function updateCesiumSolarSketch() {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  if (!cesiumSolarOutlineEntity) {
    cesiumSolarOutlineEntity = viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(
          () => getClosedCesiumSolarPreviewPositions(),
          false,
        ),
        width: 3,
        clampToGround: true,
        material: Cesium.Color.ORANGE,
      },
    });
  }

  if (getCesiumSolarPreviewPositions().length >= 3 && !cesiumSolarPolygonEntity) {
    cesiumSolarPolygonEntity = viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(
          () => new Cesium.PolygonHierarchy(getCesiumSolarPreviewPositions()),
          false,
        ),
        material: Cesium.Color.ORANGE.withAlpha(0.18),
        outline: true,
        outlineColor: Cesium.Color.ORANGE,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  }

  const previewPositions = getCesiumSolarPreviewPositions();
  if (previewPositions.length >= 3) {
    drawCesiumSolarLayout(previewPositions);
  }
}

function finishCesiumSolarDrawing() {
  if (cesiumSolarPositions.length < 3) return;
  cesiumSolarPreviewPosition = null;
  isCesiumSolarDrawingFinished = true;
  updateCesiumSolarSketch();
  updateCesiumSolarDrawButtonLabel();
  setCesiumSolarStatus("Solar layout finished. Drag the orange edge/handle to rotate.");
}

function getCesiumSolarPointerAngle(screenPosition) {
  const Cesium = window.Cesium;
  const position = getCesiumGroundPosition(screenPosition);
  const positions = getCesiumSolarPreviewPositions();
  if (!Cesium || !position || positions.length < 3) return null;
  const { polygonPoints, projector } = getCesiumSolarLocalContext(positions);
  const localPoint = projector.toLocal(Cesium.Cartographic.fromCartesian(position));
  const xs = polygonPoints.map((point) => point.x);
  const ys = polygonPoints.map((point) => point.y);
  const center = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
  return Cesium.Math.toDegrees(
    Math.atan2(localPoint.y - center.y, localPoint.x - center.x),
  );
}

function getCesiumShortestAngleDelta(currentAngle, startAngle) {
  return ((((currentAngle - startAngle) % 360) + 540) % 360) - 180;
}

function beginCesiumSolarRotation(screenPosition) {
  const pointerAngle = getCesiumSolarPointerAngle(screenPosition);
  if (!Number.isFinite(pointerAngle)) return false;
  cesiumSolarRotationStartAngleDegrees = cesiumSolarAngleDegrees;
  cesiumSolarRotationStartPointerAngleDegrees = pointerAngle;
  isCesiumSolarRotating = true;
  if (cesiumViewer?.scene?.screenSpaceCameraController) {
    cesiumViewer.scene.screenSpaceCameraController.enableRotate = false;
  }
  setCesiumSolarStatus("Rotating solar layout...");
  return true;
}

function endCesiumSolarRotation() {
  isCesiumSolarRotating = false;
  if (cesiumViewer?.scene?.screenSpaceCameraController) {
    cesiumViewer.scene.screenSpaceCameraController.enableRotate = true;
  }
  setCesiumSolarStatus("Solar layout rotated. Drag the orange edge/handle again if needed.");
}

function updateCesiumSolarRotation(screenPosition) {
  const positions = getCesiumSolarPreviewPositions();
  const pointerAngle = getCesiumSolarPointerAngle(screenPosition);
  if (!Number.isFinite(pointerAngle)) return;
  const angleDelta = getCesiumShortestAngleDelta(
    pointerAngle,
    cesiumSolarRotationStartPointerAngleDegrees,
  );
  cesiumSolarAngleDegrees = cesiumSolarRotationStartAngleDegrees + angleDelta;
  drawCesiumSolarLayout(positions);
}

function addCesiumSolarVertex(screenPosition) {
  if (isCesiumSolarDrawingFinished) return;
  const position = getCesiumGroundPosition(screenPosition);
  if (!position) return;
  cesiumSolarPositions.push(position);
  updateCesiumSolarSketch();
}

function updateCesiumDrawSketch() {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  const drawType = getCesiumDrawType();

  if (drawType !== "Point" && !cesiumDrawPolylineEntity) {
    cesiumDrawPolylineEntity = viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(
          () => getCesiumDrawPreviewPositions(),
          false,
        ),
        width: 3,
        clampToGround: true,
        material: Cesium.Color.YELLOW,
      },
    });
  }

  if (
    drawType === "Polygon" &&
    cesiumDrawPositions.length >= 3 &&
    !cesiumDrawPolygonEntity
  ) {
    cesiumDrawPolygonEntity = viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(
          () => new Cesium.PolygonHierarchy(getCesiumDrawPreviewPositions()),
          false,
        ),
        material: Cesium.Color.YELLOW.withAlpha(0.22),
        outline: true,
        outlineColor: Cesium.Color.YELLOW,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  }
}

function finishCesiumDrawing() {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  const drawType = getCesiumDrawType();
  const minimumPoints =
    drawType === "Point" ? 1 : drawType === "LineString" ? 2 : 3;
  if (cesiumDrawPositions.length < minimumPoints) return;

  const sourcePositions = [...cesiumDrawPositions];
  const featureIndex = cesiumDrawnFeatures.length + 1;
  const baseEntity = {
    name: `3D ${drawType} ${featureIndex}`,
    properties: {
      geometryType: drawType,
      exportStatus: "geometry-ready",
    },
  };
  let entity;

  if (drawType === "Point") {
    entity = viewer.entities.add({
      ...baseEntity,
      position: sourcePositions[0],
      point: {
        pixelSize: 11,
        color: Cesium.Color.CORNFLOWERBLUE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  } else if (drawType === "LineString") {
    entity = viewer.entities.add({
      ...baseEntity,
      polyline: {
        positions: sourcePositions,
        width: 4,
        clampToGround: true,
        material: Cesium.Color.CORNFLOWERBLUE,
      },
    });
  } else {
    entity = viewer.entities.add({
      ...baseEntity,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(sourcePositions),
        material: Cesium.Color.CORNFLOWERBLUE.withAlpha(0.45),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  }

  cesiumDrawnFeatures.push({
    entity,
    positions: sourcePositions,
    geometryType: drawType,
  });

  clearCesiumDrawSketch();
  setCesiumDrawFootprintMode(false);
}

function addCesiumDrawVertex(screenPosition) {
  const viewer = cesiumViewer;
  const Cesium = window.Cesium;
  const position = getCesiumGroundPosition(screenPosition);
  if (!viewer || !Cesium || !position) return;

  cesiumDrawPositions.push(position);
  cesiumDrawPointEntities.push(
    viewer.entities.add({
      position,
      point: {
        pixelSize: 9,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    }),
  );
  updateCesiumDrawSketch();

  if (getCesiumDrawType() === "Point") {
    finishCesiumDrawing();
  }
}

function setCesiumDrawFootprintMode(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !toggleCesiumDrawFootprintButton) return;

  if (enabled) {
    setCesiumTransmissionPoleMode(false);
    setCesiumTransmissionCableMode(false);
    setCesiumManholeMode(false);
    setCesiumPipelineMode(false);
  }

  isCesiumDrawFootprintMode = enabled;
  toggleCesiumDrawFootprintButton.classList.toggle("is-active", enabled);
  toggleCesiumDrawFootprintButton.title = enabled
    ? "Click to digitize. Double-click or right-click to finish lines and polygons."
    : "Draw 3D geometry";

  if (!enabled) {
    if (cesiumDrawHandler) {
      cesiumDrawHandler.destroy();
      cesiumDrawHandler = null;
    }
    clearCesiumDrawSketch();
    return;
  }

  setMapMode3d(true);
  clearCesiumDrawSketch();
  cesiumDrawHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  cesiumDrawHandler.setInputAction((event) => {
    addCesiumDrawVertex(event.position);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  cesiumDrawHandler.setInputAction((event) => {
    cesiumDrawPreviewPosition = getCesiumGroundPosition(event.endPosition);
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  cesiumDrawHandler.setInputAction(() => {
    finishCesiumDrawing();
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  cesiumDrawHandler.setInputAction(() => {
    finishCesiumDrawing();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

function setCesiumSolarMode(enabled) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !cesiumSolarButton) return;

  if (enabled) {
    setCesiumDrawFootprintMode(false);
    setCesiumTransmissionPoleMode(false);
    setCesiumTransmissionCableMode(false);
    setCesiumManholeMode(false);
    setCesiumPipelineMode(false);
  }

  isCesiumSolarMode = enabled;
  cesiumSolarButton.classList.toggle("is-active", enabled);
  cesiumSolarDraw?.classList.toggle("btn-primary", enabled);
  if (enabled) {
    isCesiumSolarDrawingFinished = false;
  }
  updateCesiumSolarDrawButtonLabel();

  if (!enabled) {
    if (cesiumSolarHandler) {
      cesiumSolarHandler.destroy();
      cesiumSolarHandler = null;
    }
    if (isCesiumSolarRotating) {
      endCesiumSolarRotation();
    }
    updateCesiumSolarDrawButtonLabel();
    setCesiumSolarStatus("Solar drawing paused.");
    return;
  }

  setMapMode3d(true);
  setCesiumSolarStatus("Click to draw the site polygon. Right-click or double-click to finish.");
  cesiumSolarHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  cesiumSolarHandler.setInputAction((event) => {
    const picked = viewer.scene.pick(event.position);
    if (picked?.id === cesiumSolarRotationHandleEntity) {
      beginCesiumSolarRotation(event.position);
      return;
    }
    addCesiumSolarVertex(event.position);
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  cesiumSolarHandler.setInputAction((event) => {
    if (isCesiumSolarRotating) {
      updateCesiumSolarRotation(event.endPosition);
      return;
    }
    if (isCesiumSolarDrawingFinished) return;
    cesiumSolarPreviewPosition = getCesiumGroundPosition(event.endPosition);
    updateCesiumSolarSketch();
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  cesiumSolarHandler.setInputAction(() => {
    if (isCesiumSolarRotating) {
      endCesiumSolarRotation();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_UP);
  cesiumSolarHandler.setInputAction(() => {
    finishCesiumSolarDrawing();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

function flyCesiumToOpenLayersView() {
  const viewer = initCesiumViewer();
  if (!viewer) return;

  const view = map.getView();
  const center = view.getCenter() || [0, 0];
  const lonLat = toLonLat(center, view.getProjection());
  const height = getCesiumCameraHeightFromZoom(view.getZoom());
  const Cesium = window.Cesium;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1], height),
    duration: 0.45,
  });
}

function resetCesiumGlobeView() {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  setMapMode3d(true);
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(20, 35, 18000000),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration: 0.65,
  });
}

function orientCesiumCameraNorth() {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  setMapMode3d(true);
  viewer.camera.flyTo({
    destination: viewer.camera.positionWC.clone(),
    orientation: {
      heading: 0,
      pitch: viewer.camera.pitch,
      roll: 0,
    },
    duration: 0.35,
  });
}

function syncOpenLayersToCesiumCamera() {
  if (!cesiumViewer) return;

  const Cesium = window.Cesium;
  const cartographic = Cesium.Cartographic.fromCartesian(
    cesiumViewer.camera.positionWC,
  );
  const lonLat = [
    Cesium.Math.toDegrees(cartographic.longitude),
    Cesium.Math.toDegrees(cartographic.latitude),
  ];
  const view = map.getView();
  view.setCenter(fromLonLat(lonLat, view.getProjection()));
}

function setMapMode3d(enabled, options = {}) {
  if (!cesiumContainer || !toggle3dMapButton) return;
  if (enabled && !initCesiumViewer()) return;

  isCesiumMode = enabled;
  cesiumContainer.hidden = !enabled;
  toggle3dMapButton.classList.toggle("is-active", enabled);
  toggle3dMapButton.title = enabled ? "Switch to 2D Map" : "Switch to 3D Globe";
  toggle3dMapButton.querySelector("span").textContent = enabled ? "2D" : "3D";

  if (enabled) {
    if (options.centerOnMap) {
      flyCesiumToOpenLayersView();
    }
    cesiumViewer.resize();
  } else {
    isCesiumElevationTooltipEnabled = false;
    toggleCesiumElevationButton?.classList.remove("is-active");
    hideCesiumElevationTooltip();
    syncOpenLayersToCesiumCamera();
    map.updateSize();
  }
}

toggle3dMapButton?.addEventListener("click", () => {
  setMapMode3d(!isCesiumMode);
});

centerCesiumMapButton?.addEventListener("click", () => {
  setMapMode3d(true, { centerOnMap: true });
});

resetCesiumGlobeButton?.addEventListener("click", () => {
  resetCesiumGlobeView();
});

orientCesiumNorthButton?.addEventListener("click", () => {
  orientCesiumCameraNorth();
});

toggleCesiumElevationButton?.addEventListener("click", () => {
  setCesiumElevationTooltipEnabled(!isCesiumElevationTooltipEnabled);
});

toggleCesiumTerrainButton?.addEventListener("click", () => {
  setCesiumTerrainEnabled(!isCesiumTerrainEnabled);
});

toggleCesiumBuildingsButton?.addEventListener("click", () => {
  setCesiumBuildingsEnabled(!isCesiumBuildingsEnabled);
});

toggleGooglePhotorealisticButton?.addEventListener("click", () => {
  setGooglePhotorealisticEnabled(!isGooglePhotorealisticEnabled);
});

toggleCesiumDrawFootprintButton?.addEventListener("click", () => {
  setCesiumDrawFootprintMode(!isCesiumDrawFootprintMode);
});

toggleCesiumTransmissionPoleButton?.addEventListener("click", () => {
  setCesiumTransmissionPoleMode(!isCesiumTransmissionPoleMode);
});

toggleCesiumTransmissionCableButton?.addEventListener("click", () => {
  setCesiumTransmissionCableMode(!isCesiumTransmissionCableMode);
});

toggleCesiumManholeButton?.addEventListener("click", () => {
  setCesiumManholeMode(!isCesiumManholeMode);
});

toggleCesiumPipelineButton?.addEventListener("click", () => {
  setCesiumPipelineMode(!isCesiumPipelineMode);
});

cesiumDrawTypeSelect?.addEventListener("change", () => {
  if (isCesiumDrawFootprintMode) {
    clearCesiumDrawSketch();
  }
});

toggleHimareTerrainWmsButton?.addEventListener("click", () => {
  setHimareTerrainWmsVisible(!isHimareTerrainWmsVisible);
});

toggleDhermiTerrainWmsButton?.addEventListener("click", () => {
  setDhermiTerrainWmsVisible(!isDhermiTerrainWmsVisible);
});

togglePalaseTerrainWmsButton?.addEventListener("click", () => {
  setPalaseTerrainWmsVisible(!isPalaseTerrainWmsVisible);
});

toggleAshkTerrainWmsButton?.addEventListener("click", () => {
  setAshkTerrainWmsVisible(!isAshkTerrainWmsVisible);
});

toggleQkdTerrainWmsButton?.addEventListener("click", () => {
  setQkdTerrainWmsVisible(!isQkdTerrainWmsVisible);
});

toggleKufiNsTerrainWmsButton?.addEventListener("click", () => {
  setKufiNsTerrainWmsVisible(!isKufiNsTerrainWmsVisible);
});

toggleKategoriTokeTerrainWmsButton?.addEventListener("click", () => {
  setKategoriTokeTerrainWmsVisible(!isKategoriTokeTerrainWmsVisible);
});

bindTerrainOpacitySlider(himareTerrainOpacityInput, () => himareTerrainWmsLayer);
bindTerrainOpacitySlider(dhermiTerrainOpacityInput, () => dhermiTerrainWmsLayer);
bindTerrainOpacitySlider(palaseTerrainOpacityInput, () => palaseTerrainWmsLayer);
bindTerrainOpacitySlider(ashkTerrainOpacityInput, () => ashkTerrainWmsLayer);
bindTerrainOpacitySlider(qkdTerrainOpacityInput, () => qkdTerrainWmsLayer);
bindTerrainOpacitySlider(kufiNsTerrainOpacityInput, () => kufiNsTerrainWmsLayer);
bindTerrainOpacitySlider(
  kategoriTokeTerrainOpacityInput,
  () => kategoriTokeTerrainWmsLayer,
);

cesiumProfileButton?.addEventListener("click", () => {
  createTerrainProfileFromLatestLine();
});

makePanelDraggable(
  cesiumProfilePanel,
  cesiumProfilePanel?.querySelector(".cesium-profile-panel__header"),
);
makePanelDraggable(
  cesiumSiteTerrainPanel,
  cesiumSiteTerrainPanel?.querySelector(".cesium-site-terrain-panel__header"),
);
makePanelDraggable(
  cesiumSolarPanel,
  cesiumSolarPanel?.querySelector(".cesium-solar-panel__header"),
);
makePanelDraggable(
  cesiumSunPanel,
  cesiumSunPanel?.querySelector(".cesium-sun-panel__header"),
);

cesiumProfileClose?.addEventListener("click", () => {
  if (cesiumProfilePanel) {
    cesiumProfilePanel.hidden = true;
  }
});

cesiumSiteTerrainButton?.addEventListener("click", () => {
  if (!cesiumSiteTerrainPanel) return;
  cesiumSiteTerrainPanel.hidden = false;
  setCesiumSiteTerrainStatus("");
  if (!cesiumSiteTerrainResults?.children.length) {
    cesiumSiteTerrainResults.innerHTML = `
      <div class="cesium-site-terrain-card">
        <strong>Ready</strong>
        <span>Draw polygon</span>
      </div>
    `;
  }
});

cesiumSiteTerrainRun?.addEventListener("click", () => {
  analyzeLatestCesiumPolygonTerrain();
});

cesiumSiteProfilesRun?.addEventListener("click", () => {
  generateCesiumProfilesForLatestPolygon();
});

cesiumSiteProfilesAnalyze?.addEventListener("click", () => {
  analyzeCesiumGeneratedProfiles();
});

cesiumSiteTerrainClose?.addEventListener("click", () => {
  if (cesiumSiteTerrainPanel) {
    cesiumSiteTerrainPanel.hidden = true;
  }
  clearCesiumTerrainAnalysisEntities();
});

cesiumSolarButton?.addEventListener("click", () => {
  if (!cesiumSolarPanel) return;
  cesiumSolarPanel.hidden = !cesiumSolarPanel.hidden;
  if (!cesiumSolarPanel.hidden) {
    setMapMode3d(true);
    setCesiumSolarStatus("Set parameters, then click Draw Site.");
  } else {
    setCesiumSolarMode(false);
  }
});

cesiumSolarClose?.addEventListener("click", () => {
  if (cesiumSolarPanel) cesiumSolarPanel.hidden = true;
  setCesiumSolarMode(false);
});

cesiumSolarDraw?.addEventListener("click", () => {
  if (isCesiumSolarMode && !isCesiumSolarDrawingFinished) {
    if (cesiumSolarPositions.length >= 3) {
      finishCesiumSolarDrawing();
    } else {
      setCesiumSolarStatus("Add at least 3 points before finishing the site.");
    }
    return;
  }

  if (isCesiumSolarMode && isCesiumSolarDrawingFinished) {
    setCesiumSolarMode(false);
    return;
  }

  clearCesiumSolarSketch();
  renderCesiumSolarResults(null);
  setCesiumSolarMode(true);
});

cesiumSolarOptimize?.addEventListener("click", () => {
  createCesiumSolarPanelMesh();
});

cesiumSolarClear?.addEventListener("click", () => {
  setCesiumSolarMode(false);
  isCesiumSolarDrawingFinished = false;
  clearCesiumSolarSketch();
  renderCesiumSolarResults(null);
  updateCesiumSolarDrawButtonLabel();
  setCesiumSolarStatus("Set parameters, then draw a 3D site polygon.");
});

[
  cesiumSolarPanelWidthInput,
  cesiumSolarPanelHeightInput,
  cesiumSolarColumnGapInput,
  cesiumSolarRowGapInput,
  cesiumSolarMarginInput,
  cesiumSolarMountHeightInput,
  cesiumSolarPanelTiltInput,
  cesiumSolarSideTiltInput,
  cesiumSolarWattageInput,
  cesiumSolarDailyYieldInput,
  cesiumSolarPerformanceRatioInput,
].forEach((input) => {
  input?.addEventListener("input", () => {
    syncCesiumSolarTiltValue();
    if (
      hasCesiumSolarMesh() &&
      (input === cesiumSolarPanelTiltInput ||
        input === cesiumSolarSideTiltInput ||
        input === cesiumSolarMountHeightInput)
    ) {
      createCesiumSolarPanelMesh();
      return;
    }
    const positions = getCesiumSolarPreviewPositions();
    if (positions.length >= 3) drawCesiumSolarLayout(positions);
  });
});

syncCesiumSolarTiltValue();
initializeCesiumSunControls();

cesiumSunButton?.addEventListener("click", () => {
  if (!cesiumSunPanel) return;
  cesiumSunPanel.hidden = !cesiumSunPanel.hidden;
  cesiumSunButton.classList.toggle("is-active", !cesiumSunPanel.hidden);
  if (!cesiumSunPanel.hidden) {
    setMapMode3d(true);
    initializeCesiumSunControls();
    updateCesiumSunSimulation();
  } else {
    setCesiumSunPlaying(false);
  }
});

cesiumSunClose?.addEventListener("click", () => {
  if (cesiumSunPanel) cesiumSunPanel.hidden = true;
  cesiumSunButton?.classList.remove("is-active");
  setCesiumSunPlaying(false);
});

[
  cesiumSunDateInput,
  cesiumSunTimeZoneInput,
  cesiumSunHourInput,
  cesiumSunLightingInput,
  cesiumSunShadowsInput,
].forEach((input) => {
  input?.addEventListener("input", updateCesiumSunSimulation);
  input?.addEventListener("change", updateCesiumSunSimulation);
});

cesiumSunPlay?.addEventListener("click", () => {
  setCesiumSunPlaying(!cesiumSunPlayTimer);
});

cesiumSunReset?.addEventListener("click", () => {
  if (cesiumSunHourInput) cesiumSunHourInput.value = "12";
  updateCesiumSunSimulation();
});

function saveCurrentMapViewForSession() {
  const view = map.getView();
  sessionStorage.setItem(
    mapSessionViewKey,
    JSON.stringify({
      center: view.getCenter(),
      zoom: view.getZoom(),
      projection: view.getProjection().getCode(),
    }),
  );
}

const mapProjectionSelect = document.getElementById("mapProjectionSelect");
const setMapProjectionButton = document.getElementById("setMapProjection");

if (mapProjectionSelect) {
  mapProjectionSelect.value = map.getView().getProjection().getCode();
}

function setMapProjection(projectionCode) {
  const oldView = map.getView();
  const oldProjection = oldView.getProjection().getCode();

  if (projectionCode === oldProjection) return;

  const oldCenter = oldView.getCenter() || [0, 0];
  let nextCenter = oldCenter;
  try {
    nextCenter = transform(oldCenter, oldProjection, projectionCode);
  } catch (error) {
    console.warn("Could not transform map center:", error);
  }

  map.setView(
    new View({
      projection: projectionCode,
      center: nextCenter,
      zoom: oldView.getZoom(),
      rotation: oldView.getRotation(),
      maxZoom: 20,
    }),
  );
  calculateScale();
  map.updateSize();
  syncAttributeSelectionLayer();
  const tableContainer = document.getElementById("attribute-table-container");
  if (!tableContainer?.hidden && attributeTableFeatures.length) {
    refreshAttributeTableView();
  }
}

setMapProjectionButton?.addEventListener("click", () => {
  setMapProjection(mapProjectionSelect.value);
});

document.getElementById("save-session-view").addEventListener("click", () => {
  saveCurrentMapViewForSession();
  alert("Current map view saved for this session.");
});

// Creating vectorSource to store layers
const vectorSource = new VectorSource();

const attributeSelectionSource = new VectorSource();
const attributeSelectionLayer = new VectorLayer({
  source: attributeSelectionSource,
  title: "Selected Attribute Features",
  displayInLayerSwitcher: false,
  style: new Style({
    image: new CircleStyle({
      radius: 12,
      fill: new Fill({ color: "rgba(255, 214, 10, 0.9)" }),
      stroke: new Stroke({ color: "#111827", width: 3 }),
    }),
    fill: new Fill({ color: "rgba(255, 214, 10, 0.34)" }),
    stroke: new Stroke({ color: "#f59e0b", width: 5 }),
  }),
});

map.addLayer(attributeSelectionLayer);

const georefDestinationSource = new VectorSource();
const georefDestinationLayer = new VectorLayer({
  source: georefDestinationSource,
  title: "Georeference Tie Points",
  displayInLayerSwitcher: false,
  style: (feature) =>
    new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: "#ffd60a" }),
        stroke: new Stroke({ color: "#111827", width: 2 }),
      }),
      text: new Text({
        text: String(feature.get("label") || ""),
        offsetX: 14,
        offsetY: -10,
        fill: new Fill({ color: "#111827" }),
        stroke: new Stroke({ color: "#ffffff", width: 3 }),
        font: "bold 13px Arial, sans-serif",
      }),
    }),
});

map.addLayer(georefDestinationLayer);

const georefCursorLabel = document.createElement("div");
georefCursorLabel.className = "georef-map-cursor-label";
const georefCursorOverlay = new Overlay({
  element: georefCursorLabel,
  positioning: "bottom-left",
  offset: [12, -12],
});

map.addOverlay(georefCursorOverlay);
georefCursorOverlay.setPosition(undefined);

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
let layerSearchItems = [];
let layerSearchMarkerLayer = null;

function escapeCqlValue(value) {
  return String(value).replace(/'/g, "''");
}

function quoteCqlProperty(fieldName) {
  return `"${String(fieldName).replace(/"/g, '""')}"`;
}

function getLayerSearchItems() {
  const items = [];

  function visitLayer(layer) {
    if (layer instanceof LayerGroup) {
      layer.getLayers().forEach(visitLayer);
      return;
    }

    const params = layer.getSource?.()?.getParams?.();
    const typeName =
      params?.LAYERS || params?.layers || layer.get("layerParam");
    if (!typeName || !String(typeName).includes(":")) return;

    items.push({
      title: layer.get("title") || typeName,
      typeName,
      layer,
    });
  }

  map.getLayers().forEach(visitLayer);
  return items;
}

async function fetchSearchLayerFields(typeName) {
  const [workspace = workspaceName] = typeName.split(":");
  const params = new URLSearchParams({
    service: "WFS",
    version: "1.1.0",
    request: "DescribeFeatureType",
    typeName,
  });
  const response = await fetch(
    `${getGeoServerProxyOwsUrl(workspace)}?${params}`,
  );
  if (!response.ok) {
    throw new Error(`Could not read fields for ${typeName}.`);
  }

  const text = await response.text();
  const doc = new DOMParser().parseFromString(text, "application/xml");
  return Array.from(doc.querySelectorAll("element"))
    .map((element) => ({
      name: element.getAttribute("name"),
      type: element.getAttribute("type") || "",
    }))
    .filter(
      (field) =>
        field.name &&
        !/gml|geometry|point|polygon|linestring/i.test(field.type) &&
        !["geom", "the_geom", "geometry", "wkb_geometry"].includes(field.name),
    );
}

function buildLayerSearchControl() {
  if (!searchBox) return;

  const mapElement = document.getElementById("map");
  const panel = document.createElement("div");
  panel.className = "layer-search-config";
  panel.innerHTML = `
    <select id="mapSearchMode" title="Search mode">
      <option value="nominatim">Nominatim</option>
      <option value="layer">Layer</option>
    </select>
    <select id="mapSearchLayer" hidden></select>
    <select id="mapSearchField" hidden></select>
    <input id="mapSearchValue" type="search" placeholder="Feature name" hidden />
    <button id="mapLayerSearchApply" type="button" hidden title="Search layer">
      <i class="fa-solid fa-magnifying-glass"></i>
    </button>
    <div id="mapSearchSuggestions" class="layer-search-suggestions" hidden></div>
  `;
  mapElement.appendChild(panel);
  panel.addEventListener("pointerdown", (event) => event.stopPropagation());
  panel.addEventListener("click", (event) => event.stopPropagation());

  const modeSelect = panel.querySelector("#mapSearchMode");
  const layerSelect = panel.querySelector("#mapSearchLayer");
  const fieldSelect = panel.querySelector("#mapSearchField");
  const valueInput = panel.querySelector("#mapSearchValue");
  const applyButton = panel.querySelector("#mapLayerSearchApply");
  const suggestionsBox = panel.querySelector("#mapSearchSuggestions");
  let suggestionTimer = null;
  let suggestionRequestId = 0;

  function setLayerMode(enabled) {
    layerSelect.hidden = !enabled;
    fieldSelect.hidden = !enabled;
    valueInput.hidden = !enabled;
    applyButton.hidden = !enabled;
    suggestionsBox.hidden = true;
    panel.classList.toggle("layer-search-mode", enabled);
    const nominatimInput = searchBox.querySelector("input[type='search']");
    if (nominatimInput) nominatimInput.hidden = enabled;
  }

  function populateLayerSearchLayers() {
    layerSearchItems = getLayerSearchItems();
    layerSelect.innerHTML = "";
    layerSearchItems.forEach((item, index) => {
      layerSelect.add(new Option(item.title, String(index)));
    });
    if (!layerSearchItems.length) {
      layerSelect.add(new Option("No GeoServer layers found", ""));
    }
  }

  async function populateLayerSearchFields() {
    fieldSelect.innerHTML = "";
    const layerItem = layerSearchItems[Number(layerSelect.value)];
    if (!layerItem) return;

    fieldSelect.add(new Option("Loading fields...", ""));
    try {
      const fields = await fetchSearchLayerFields(layerItem.typeName);
      fieldSelect.innerHTML = "";
      fields.forEach((field) =>
        fieldSelect.add(new Option(field.name, field.name)),
      );
      if (!fields.length)
        fieldSelect.add(new Option("No text fields found", ""));
      valueInput.value = "";
      updateLayerSearchSuggestions();
    } catch (error) {
      console.error(error);
      fieldSelect.innerHTML = "";
      fieldSelect.add(new Option("Could not load fields", ""));
    }
  }

  function buildCaseInsensitiveSearchFilter(fieldName, searchValue) {
    const value = escapeCqlValue(searchValue);
    return `${quoteCqlProperty(fieldName)} ILIKE '%${value}%'`;
  }

  async function fetchLayerSearchSuggestions(searchValue = "") {
    const layerItem = layerSearchItems[Number(layerSelect.value)];
    const fieldName = fieldSelect.value;
    if (!layerItem || !fieldName) return [];

    const [workspace = workspaceName] = layerItem.typeName.split(":");
    const mapProjection = map.getView().getProjection().getCode();
    const url = getWfsGetFeatureUrl({
      workspace,
      typeName: layerItem.typeName,
      version: "1.1.0",
      maxFeatures: 12,
      srsName: mapProjection,
      cqlFilter: searchValue
        ? buildCaseInsensitiveSearchFilter(fieldName, searchValue)
        : null,
    });
    const response = await fetch(url);
    if (!response.ok) return [];

    const geojson = await response.json();
    const values = (geojson.features || [])
      .map((feature) => feature.properties?.[fieldName])
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(value));

    return [...new Set(values)].slice(0, 10);
  }

  function renderLayerSearchSuggestions(values) {
    suggestionsBox.innerHTML = "";
    if (!values.length) {
      suggestionsBox.hidden = true;
      return;
    }

    values.forEach((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = value;
      button.addEventListener("click", () => {
        valueInput.value = value;
        suggestionsBox.hidden = true;
        runLayerSearch();
      });
      suggestionsBox.appendChild(button);
    });
    suggestionsBox.hidden = false;
  }

  function updateLayerSearchSuggestions() {
    window.clearTimeout(suggestionTimer);
    const requestId = ++suggestionRequestId;
    const searchValue = valueInput.value.trim();

    suggestionTimer = window.setTimeout(async () => {
      const values = await fetchLayerSearchSuggestions(searchValue);
      if (requestId !== suggestionRequestId) return;
      renderLayerSearchSuggestions(values);
    }, 200);
  }

  async function runLayerSearch() {
    const layerItem = layerSearchItems[Number(layerSelect.value)];
    const fieldName = fieldSelect.value;
    const searchValue = valueInput.value.trim();
    if (!layerItem || !fieldName || !searchValue) {
      alert("Choose layer, field, and search value.");
      return;
    }

    const [workspace = workspaceName] = layerItem.typeName.split(":");
    const mapProjection = map.getView().getProjection().getCode();
    const cqlFilter = buildCaseInsensitiveSearchFilter(fieldName, searchValue);
    const url = getWfsGetFeatureUrl({
      workspace,
      typeName: layerItem.typeName,
      version: "1.1.0",
      maxFeatures: 1,
      srsName: mapProjection,
      cqlFilter,
    });

    const response = await fetch(url);
    if (!response.ok) {
      alert(`Search failed with status ${response.status}.`);
      return;
    }

    const geojson = await response.json();
    const features = new GeoJSON().readFeatures(geojson, {
      dataProjection: mapProjection,
      featureProjection: mapProjection,
    });

    if (!features.length) {
      alert("No feature found with that value.");
      return;
    }
    suggestionsBox.hidden = true;

    const feature = features[0];
    const extent = feature.getGeometry().getExtent();
    map.getView().fit(extent, {
      duration: 600,
      padding: [70, 70, 70, 70],
      maxZoom: 18,
    });

    if (layerSearchMarkerLayer) map.removeLayer(layerSearchMarkerLayer);
    layerSearchMarkerLayer = new VectorLayer({
      source: new VectorSource({ features: [feature] }),
      style: new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: "rgba(239, 68, 68, 0.9)" }),
          stroke: new Stroke({ color: "#ffffff", width: 2 }),
        }),
        stroke: new Stroke({ color: "#ef4444", width: 4 }),
        fill: new Fill({ color: "rgba(239, 68, 68, 0.2)" }),
      }),
      displayInLayerSwitcher: false,
    });
    map.addLayer(layerSearchMarkerLayer);
  }

  modeSelect.addEventListener("change", () => {
    const enabled = modeSelect.value === "layer";
    setLayerMode(enabled);
    if (enabled) {
      populateLayerSearchLayers();
      populateLayerSearchFields();
    }
  });
  layerSelect.addEventListener("change", populateLayerSearchFields);
  fieldSelect.addEventListener("change", () => {
    valueInput.value = "";
    updateLayerSearchSuggestions();
  });
  valueInput.addEventListener("input", updateLayerSearchSuggestions);
  valueInput.addEventListener("focus", updateLayerSearchSuggestions);
  applyButton.addEventListener("click", runLayerSearch);
  valueInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runLayerSearch();
  });
}

buildLayerSearchControl();

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
                `  maxy: ${maxy}`,
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
layerSwitcherElement.style.top = "150px";
layerSwitcherElement.style.left = "0";
layerSwitcherElement.style.right = "auto";

//_____________________________________________________________________________________________
// Display data from WMS Layer
// identify button
// ——————————————————————————————
//  CONFIG & DOM HOOKS
// ——————————————————————————————
const identifyBtn = document.getElementById("identify");
const identifyModeSelect = document.getElementById("identifyMode");
const container = document.querySelector(".form-container");
const maxProperties = 30;

// keep track of current mode ("all" or "top")
let currentMode = null;

// when you switch off identify, you may want to clear the form
function clearResults() {
  container.innerHTML = "";
  container.style.display = "none";
}

function positionIdentifyContainer(evt) {
  const mapRect = map.getTargetElement().getBoundingClientRect();
  const panelWidth = 360;
  const panelHeight = 420;
  const padding = 12;
  const clickX = evt.originalEvent?.clientX ?? mapRect.left + evt.pixel[0];
  const clickY = evt.originalEvent?.clientY ?? mapRect.top + evt.pixel[1];
  const left = Math.min(
    Math.max(clickX + 12, padding),
    window.innerWidth - panelWidth - padding,
  );
  const top = Math.min(
    Math.max(clickY + 12, padding),
    window.innerHeight - panelHeight - padding,
  );

  container.style.left = `${left}px`;
  container.style.top = `${top}px`;
}

function prepareIdentifyContainer(evt) {
  container.innerHTML = "";
  positionIdentifyContainer(evt);

  const header = document.createElement("div");
  header.className = "form-container__titlebar";
  header.innerHTML = `
    <span>Identify Results</span>
    <button type="button" class="close-form" title="Close">&times;</button>
  `;
  container.appendChild(header);
  header.querySelector(".close-form").addEventListener("click", clearResults);
}

function enableIdentifyContainerDrag() {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  container.addEventListener("mousedown", (event) => {
    if (!event.target.closest(".form-container__titlebar")) return;
    if (event.target.closest("button")) return;

    dragging = true;
    const rect = container.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    container.classList.add("is-dragging");
    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!dragging) return;

    const left = Math.min(
      Math.max(event.clientX - offsetX, 8),
      window.innerWidth - container.offsetWidth - 8,
    );
    const top = Math.min(
      Math.max(event.clientY - offsetY, 8),
      window.innerHeight - container.offsetHeight - 8,
    );
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    container.classList.remove("is-dragging");
  });
}

enableIdentifyContainerDrag();

// ——————————————————————————————
//  MODE SELECTION & MAP LISTENERS
// ——————————————————————————————

// 1) clicking the button toggles the dropdown
identifyBtn.addEventListener("click", () => {
  // hide any old form-results
  clearResults();

  // show/hide the select
  const isOpen = identifyModeSelect.style.display === "block";
  if (isOpen) {
    identifyModeSelect.style.display = "none";
    return;
  }

  const buttonRect = identifyBtn.getBoundingClientRect();
  identifyModeSelect.style.left = `${buttonRect.left}px`;
  identifyModeSelect.style.top = `${buttonRect.bottom + 6}px`;
  identifyModeSelect.style.display = "block";
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

  const visibleLayers = getVisibleIdentifyLayers();

  if (!visibleLayers.length) {
    clearResults();
    return;
  }

  if (currentMode === "top") {
    for (const layer of visibleLayers) {
      const feats = await queryIdentifyLayer(layer, evt);
      if (feats.length > 0) {
        prepareIdentifyContainer(evt);
        feats.forEach((f) => renderFeatureBlock({ layer, feature: f }));
        container.style.display = "block";
        return;
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
      if (layer instanceof VectorTileLayer) {
        return Promise.resolve({
          layer,
          features: getVectorTileFeaturesAtPixel(layer, evt.pixel),
        });
      }
      const source = layer.getSource?.();
      if (typeof source?.getFeatureInfoUrl !== "function") {
        return Promise.resolve({ layer, features: [] });
      }
      const url = layer
        .getSource()
        .getFeatureInfoUrl(
          lastClickCoord,
          map.getView().getResolution(),
          map.getView().getProjection(),
          params,
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
        features.map((f) => ({ layer, feature: f })),
      );

      if (!hits.length) {
        clearResults();
        return;
      }

      // render all hits
      prepareIdentifyContainer(evt);
      hits.forEach(renderFeatureBlock);
      container.style.display = "block";
    });
  }
}

function getVisibleIdentifyLayers() {
  const layers = [];
  const collectLayers = (layer) => {
    if (!layer.getVisible()) return;

    if (layer instanceof LayerGroup) {
      layer.getLayers().getArray().slice().reverse().forEach(collectLayers);
      return;
    }

    const source = layer.getSource?.();
    const isQueryableWms = typeof source?.getFeatureInfoUrl === "function";
    const isVectorTile = layer instanceof VectorTileLayer;

    if (isQueryableWms || isVectorTile) {
      layers.push(layer);
    }
  };

  map.getLayers().getArray().slice().reverse().forEach(collectLayers);
  return layers;
}

async function queryIdentifyLayer(layer, evt) {
  if (layer instanceof VectorTileLayer) {
    return getVectorTileFeaturesAtPixel(layer, evt.pixel);
  }

  const source = layer.getSource?.();
  if (typeof source?.getFeatureInfoUrl !== "function") return [];

  const url = source.getFeatureInfoUrl(
    lastClickCoord,
    map.getView().getResolution(),
    map.getView().getProjection(),
    {
      INFO_FORMAT: "application/json",
      FEATURE_COUNT: 10,
    },
  );
  if (!url) return [];

  try {
    const json = await fetch(url).then((response) => response.json());
    return json.features || [];
  } catch (_) {
    return [];
  }
}

function getVectorTileFeaturesAtPixel(layer, pixel) {
  const features = [];
  map.forEachFeatureAtPixel(
    pixel,
    (feature, featureLayer) => {
      if (featureLayer === layer) features.push(feature);
    },
    {
      hitTolerance: 5,
      layerFilter: (featureLayer) => featureLayer === layer,
    },
  );
  return features;
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
      { INFO_FORMAT: "application/json" },
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
  const props = feature.getProperties
    ? { ...feature.getProperties() }
    : { ...(feature.properties || {}) };
  delete props.geometry;

  const formEl = document.createElement("div");
  formEl.className = "form-container-el";

  // header
  const hdr = document.createElement("div");
  hdr.className = "form-header";
  hdr.innerHTML = `<span>Layer</span><b>${layer.get("title") || layer.get("name")}</b>`;
  formEl.appendChild(hdr);

  const table = document.createElement("table");
  table.className = "form-properties";

  Object.keys(props)
    .slice(0, maxProperties)
    .forEach((key) => {
      const row = document.createElement("tr");
      const keyCell = document.createElement("th");
      const valueCell = document.createElement("td");
      keyCell.textContent = key;
      valueCell.textContent =
        props[key] === null || props[key] === undefined
          ? ""
          : String(props[key]);
      row.append(keyCell, valueCell);
      table.appendChild(row);
    });

  if (!table.children.length) {
    const empty = document.createElement("div");
    empty.className = "form-empty";
    empty.textContent = "No attributes returned.";
    formEl.appendChild(empty);
  } else {
    formEl.appendChild(table);
  }

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

function setMapScaleDenominator(scaleDenominator) {
  const scale = Number(scaleDenominator);
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error("Scale must be a positive number.");
  }

  const scaleInput = document.getElementById("scaleInput");
  if (scaleInput) {
    scaleInput.value = `1:${Math.round(scale)}`;
  }

  const view = map.getView();
  const res = geoServerScaleToResolution(scale, view);
  view.setResolution(res);
  calculateScale();
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
  }),
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
        e.print.imageHeight,
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
        e.quality,
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
  drawInteraction,
  layerTitle,
  selectedLayer,
  layerGroup,
  layerParam,
  features,
  workspacePart,
  namePart;
function fetchLayerPropertiesFromWFS(url, layerParam) {
  const [workspaceName, layerNamePart] = layerParam.split(":");

  // update globals
  workspace = workspaceName;
  layerName = layerNamePart;

  // If this is a VectorSource, set as active source + layer
  if (wfsVectorSource) {
    source = wfsVectorSource;
  }
  if (wfsVectorLayer) {
    vectorLayer = wfsVectorLayer;
  }
  console.log(host, port, workspace, layerParam);

  const describeFeatureTypeUrl = `http://${host}:8000/geoserver-proxy/${workspace}/ows?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=${layerParam}`;

  fetch(describeFeatureTypeUrl)
    .then((response) => response.text())
    .then((data) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, "text/xml");
      const elementNodes = doc.getElementsByTagName("xsd:element");

      for (let i = 0; i < elementNodes.length; i++) {
        const element = elementNodes[i];
        if (element.getAttribute("name") === "geom") {
          const typeAttribute = element.getAttribute("type");
          const [, typeName] = typeAttribute.split(":");
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

          console.log("Layer Param:", layerParam);
          console.log("Layer Name:", layerName);
          console.log("Workspace:", workspace);
          console.log("Geometry Type:", geometryType);
          console.log("LayerType:", layerType);
          console.log("Vector Layer:", vectorLayer);
          console.log("Vector Source:", source);
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching DescribeFeatureType:", error);
    });
}

function getLayerDeclaredProjection(layer) {
  const params = layer?.getSource?.()?.getParams?.() || {};
  return (
    layer?.get("projection") ||
    layer?.get("srsName") ||
    params.SRS ||
    params.CRS ||
    params.srsName ||
    "EPSG:3857"
  );
}

async function getLayerNativeProjection(layerParam) {
  const [layerWorkspace = workspaceName] = layerParam.split(":");
  const capabilitiesUrl = `${getGeoServerProxyOwsUrl(layerWorkspace)}?service=WFS&version=1.1.0&request=GetCapabilities`;

  try {
    const response = await fetch(capabilitiesUrl);
    if (!response.ok)
      throw new Error(`WFS capabilities HTTP ${response.status}`);

    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "text/xml");
    const featureTypes = Array.from(
      doc.getElementsByTagNameNS("*", "FeatureType"),
    );

    for (const featureType of featureTypes) {
      const name = featureType.getElementsByTagNameNS("*", "Name")[0]
        ?.textContent;
      if (
        name !== layerParam &&
        name?.split(":").pop() !== layerParam.split(":").pop()
      ) {
        continue;
      }

      const defaultSrs =
        featureType.getElementsByTagNameNS("*", "DefaultSRS")[0]?.textContent ||
        featureType.getElementsByTagNameNS("*", "DefaultCRS")[0]?.textContent ||
        featureType.getElementsByTagNameNS("*", "SRS")[0]?.textContent;

      if (defaultSrs) {
        const epsgMatch = defaultSrs.match(/EPSG[:/]*([0-9]+)/i);
        return epsgMatch ? `EPSG:${epsgMatch[1]}` : defaultSrs;
      }
    }
  } catch (error) {
    console.warn("Could not detect native layer projection:", error);
  }

  return getLayerDeclaredProjection(selectedLayer);
}

function cloneFeaturesForProjection(
  featuresToClone,
  sourceProjection,
  targetProjection,
) {
  return featuresToClone.map((feature) => {
    const clone = feature.clone();
    clone.setId(feature.getId());
    clone.setGeometryName(feature.getGeometryName?.() || "geom");
    const geometry = clone.getGeometry();
    if (geometry && sourceProjection !== targetProjection) {
      geometry.transform(sourceProjection, targetProjection);
    }
    return clone;
  });
}

function cloneFeaturesForTransaction(featuresToClone) {
  return cloneFeaturesForProjection(
    featuresToClone,
    editMapProjection,
    editLayerProjection,
  );
}

function getEditableLayerType(layer) {
  const configuredType = layer?.get?.("geometryType");
  if (["Point", "LineString", "Polygon"].includes(configuredType)) {
    return configuredType;
  }

  const feature = layer
    ?.getSource?.()
    ?.getFeatures?.()
    ?.find((item) => item.getGeometry?.());
  const geometryType = feature?.getGeometry?.()?.getType?.();

  if (!geometryType) return "Polygon";
  if (geometryType.includes("Point")) return "Point";
  if (geometryType.includes("LineString")) return "LineString";
  if (geometryType.includes("Polygon")) return "Polygon";
  return "Polygon";
}

function getDefaultFieldValue(fieldType) {
  if (fieldType === "number") return 0;
  if (fieldType === "boolean") return false;
  if (fieldType === "date") return new Date().toISOString().slice(0, 10);
  return "";
}

function applyLayerSchemaToFeature(feature, layer) {
  const fields = layer?.get?.("attributeSchema") || [];
  fields.forEach((field) => {
    if (!feature.getKeys().includes(field.name)) {
      feature.set(field.name, getDefaultFieldValue(field.type));
    }
  });
}

layerSwitcher.on("select", (e) => {
  map.removeInteraction(drawInteraction);
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
    layerTitle = selectedLayer.get("title");
    layerParam = selectedLayer.getSource().getParams().LAYERS;
    console.log(selectedLayer);
    console.log(selectedLayer.getSource());

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
  } else if (selectedLayer instanceof VectorLayer) {
    if (selectedLayer.get("editableVector")) {
      layerTitle = selectedLayer.get("title") || "Vector layer";
      layerName = layerTitle;
      layerParam = null;
      layerType = getEditableLayerType(selectedLayer);
      vectorLayer = selectedLayer;
      source = selectedLayer.getSource();
      wfsVectorLayer = selectedLayer;
      wfsVectorSource = source;
    }
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
    (feature) => feature.properties[yAxisProperty],
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
    center,
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
      }),
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
      }),
    );
  }

  // Helper: draw midpoint
  function addMidpoint(start, end) {
    const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    styles.push(
      new Style({
        geometry: new Point(mid),
        image: midStyle.getImage(),
      }),
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

// === Helper: Replace a layer either in a LayerGroup or directly on the map ===
function replaceLayer(oldLayer, newLayer) {
  let replaced = false;

  // Check if inside a LayerGroup
  map.getLayers().forEach((groupLayer) => {
    if (groupLayer instanceof LayerGroup) {
      const groupLayers = groupLayer.getLayers();
      if (groupLayers.getArray().includes(oldLayer)) {
        groupLayers.remove(oldLayer);
        groupLayers.push(newLayer);
        replaced = true;
      }
    }
  });

  // If not replaced in a group, assume it’s direct on map
  if (!replaced) {
    map.removeLayer(oldLayer);
    map.addLayer(newLayer);
  }
}

//EDIT LAYER
let snapInteraction = null;
let inserts = [];
let deletes = [];
let updates = [];

const editLayerButton = document.getElementById("editButton");
const editToolbar = document.getElementById("editToolbar");

let isEditing = false;
let originalLayer = null;

editLayerButton.addEventListener("click", async () => {
  if (!selectedLayer && !isEditing) {
    alert("Please select a layer!");
    return;
  }

  if (!isEditing) {
    if (
      selectedLayer instanceof VectorLayer &&
      selectedLayer.get("editableVector")
    ) {
      isLocalVectorEdit = true;
      inserts = [];
      updates = [];
      deletes = [];
      originalLayer = selectedLayer;
      wfsVectorLayer = selectedLayer;
      wfsVectorSource = selectedLayer.getSource();
      source = wfsVectorSource;
      vectorLayer = selectedLayer;
      layerTitle = selectedLayer.get("title") || "Vector layer";
      layerName = layerTitle;
      layerType = getEditableLayerType(selectedLayer);
      originalVectorLayerStyle = selectedLayer.getStyle();
      selectedLayer.setStyle(styleWithVertices);

      editToolbar.style.display = "flex";
      editLayerButton.classList.add("active");
      isEditing = true;
      console.log("✏️ Local vector edit mode enabled");
      return;
    }

    if (!layerParam) {
      alert("This layer cannot be edited with the current editor.");
      return;
    }

    isLocalVectorEdit = false;
    editMapProjection = map.getView().getProjection().getCode();
    editLayerProjection = await getLayerNativeProjection(layerParam);
    // --- Enable edit mode ---
    const intExtent = extentBbox.map((c) => Math.trunc(c));
    const [editWorkspace = workspaceName] = layerParam.split(":");
    const bboxExtent =
      editMapProjection === editLayerProjection
        ? intExtent
        : (() => {
            const min = transform(
              [intExtent[0], intExtent[1]],
              editMapProjection,
              editLayerProjection,
            );
            const max = transform(
              [intExtent[2], intExtent[3]],
              editMapProjection,
              editLayerProjection,
            );
            return [
              Math.min(min[0], max[0]),
              Math.min(min[1], max[1]),
              Math.max(min[0], max[0]),
              Math.max(min[1], max[1]),
            ];
          })();
    const bboxParam = bboxExtent.map((c) => Math.trunc(c)).join(",");

    wfsVectorSource = new VectorSource({
      url: `${getGeoServerProxyOwsUrl(editWorkspace)}?service=WFS&version=1.1.0&request=GetFeature&typeName=${layerParam}&outputFormat=application/json&maxFeatures=500&bbox=${bboxParam},${editLayerProjection}&srsName=${editMapProjection}`,
      format: new GeoJSON({
        dataProjection: editMapProjection,
        featureProjection: editMapProjection,
      }),
      strategy: bboxStrategy,
    });

    wfsVectorLayer = new VectorLayer({
      source: wfsVectorSource,
      title: layerTitle,
      visible: true,
      displayInLayerSwitcher: true,
      style: styleWithVertices,
    });

    // Swap WMS → WFS
    originalLayer = selectedLayer;
    replaceLayer(selectedLayer, wfsVectorLayer);

    // 🔹 Fetch DescribeFeatureType for editing
    const wfsUrl = wfsVectorSource.getUrl();
    fetchLayerPropertiesFromWFS(wfsUrl, layerParam);

    // Show toolbar
    editToolbar.style.display = "flex";
    editLayerButton.classList.add("active");
    isEditing = true;
    console.log("✏️ Edit mode enabled");
  } else {
    clearInteractions();
    clearToolbarButtons();
    map.removeInteraction(translateInteraction);
    btnTranslate.classList.remove("active");
    btnTranslate.disabled = true;
    btnSelect.textContent = "🖱️";

    if (isLocalVectorEdit && originalLayer) {
      originalLayer.setStyle(originalVectorLayerStyle);
    } else if (wfsVectorLayer && originalLayer) {
      replaceLayer(wfsVectorLayer, originalLayer);
      originalLayer.getSource().refresh(); // refresh WMS after edits
    }
    // Hide toolbar
    editToolbar.style.display = "none";
    editLayerButton.classList.remove("active");
    isEditing = false;
    // 🔹 Reset selection so user must pick again next time
    selectedLayer = null;
    originalLayer = null;
    originalVectorLayerStyle = null;
    isLocalVectorEdit = false;
    layerParam = null;
    layerTitle = null;
    console.log("✅ Edit mode disabled");
  }
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

// SnapGuide

const snapGuideBtn = document.getElementById("btnSnapGuides");
let snapGuidesActive = false; // track state

const redGuideStyle = new Style({
  stroke: new Stroke({
    color: "rgba(255, 0, 0, 0.8)", // bright red
    width: 2,
    lineDash: [8, 8], // dashed line
  }),
  image: new CircleStyle({
    radius: 4,
    fill: new Fill({ color: "rgba(255,0,0,0.8)" }),
    stroke: new Stroke({ color: "#fff", width: 1 }), // white border for contrast
  }),
});

const snapGuidesInteraction = new ol_interaction_SnapGuides({
  source: wfsVectorSource,
  pixelTolerance: 10,
  enableInitialGuides: true,
  style: redGuideStyle,
});

snapGuideBtn.addEventListener("click", () => {
  if (!snapGuidesActive) {
    // Turn ON
    map.addInteraction(snapGuidesInteraction);
    snapGuideBtn.classList.add("active");
    console.log("✅ SnapGuides Interaction ON");
  } else {
    // Turn OFF
    map.removeInteraction(snapGuidesInteraction);
    snapGuideBtn.classList.remove("active");
    console.log("❌ SnapGuides Interaction OFF");
  }
  snapGuidesActive = !snapGuidesActive; // flip state
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
  clearInteractions();
  clearToolbarButtons();
  btnSelect.textContent = "🖱️";

  // Create new modify interaction
  modifyInteraction = new Modify({
    source: wfsVectorSource,
    insertVertexCondition: (e) => {
      // Allow creating vertices only when dragging on a midpoint
      return e.type === "pointerdrag";
    },
    addCondition: () => false,
  });
  map.addInteraction(modifyInteraction);
  btnEditGeom.classList.add("active");

  snapGuidesInteraction.setModifyInteraction(modifyInteraction);

  // when pin is OFF: prevent dragging coincident vertices together
  modifyInteraction.on("modifystart", (event) => {
    if (pinEnabled) return;
    const segs = modifyInteraction.dragSegments_;
    if (segs && segs.length > 1) {
      modifyInteraction.dragSegments_ = [segs[0]];
    }
  });

  modifyInteraction.on("modifyend", function (event) {
    event.features.forEach((feature) => {
      const geom = feature.getGeometry();
      console.log(geom.getCoordinates());
      syncClosure(feature);
      fixPolygon(geom);
      removeCollinearVertices(geom, 1.0);
      if (feature.getId()) {
        // Existing feature → update
        if (!updates.includes(feature)) {
          updates.push(feature);
          console.log("Feature queued for update:", feature.getId());
        }
      } else {
        // New feature (still unsaved insert) → do nothing
        console.log("Modified unsaved feature (still in inserts).");
      }
    });
    updateSaveButtonState(); // ✅
  });
});

function queueEditedFeature(feature, actionMessage) {
  if (isLocalVectorEdit) {
    if (!updates.includes(feature) && !inserts.includes(feature)) {
      updates.push(feature);
    }
    console.log(actionMessage);
    return;
  }

  if (feature.getId()) {
    if (!updates.includes(feature)) {
      updates.push(feature);
      console.log(actionMessage);
    }
  } else {
    console.log("Edited unsaved feature (still in inserts).");
  }
}

//SELECT FEATURE
const btnSelect = document.getElementById("btnSelect");
const btnSelectDropdown = document.getElementById("btnSelectDropdown");
const selectOptions = document.getElementById("selectOptions");
btnSelectDropdown.addEventListener("click", () => {
  selectOptions.classList.toggle("dropdown-show");
});
const btnSelectSingle = document.getElementById("btnSelectSingle");
const btnSelectRectangle = document.getElementById("btnSelectRectangle");

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

let activeSelectInteraction, extent;
let selectedFeatures = new Collection();

function activateSingleSelect() {
  if (!vectorLayer) {
    alert("Please select a layer first.");
    return;
  }
  clearInteractions();
  clearToolbarButtons();
  btnSelectSingle.classList.add("active");
  activeSelectInteraction = null;
  btnTranslate.disabled = false;

  activeSelectInteraction = new Select({
    hitTolerance: 5,
    multi: true,
  });
  map.addInteraction(activeSelectInteraction);
  btnSelect.classList.add("active");

  activeSelectInteraction.on("select", (event) => {
    // clear old styles and collection
    event.deselected.forEach((f) => {
      f.setStyle(null);
      selectedFeatures.remove(f);
    });

    // add style + push into collection
    event.selected.forEach((f) => {
      f.setStyle(selectStyle);
      if (!selectedFeatures.getArray().includes(f)) {
        selectedFeatures.push(f);
      }
    });

    console.log("🎯 Selected (click):", selectedFeatures.getArray());
    if (selectedFeatures.getLength() > 0) {
      extent = selectedFeatures.item(0).getGeometry().getExtent();
    }
  });
}

// --- Single-click select ---
btnSelect.addEventListener("click", () => {
  activateSingleSelect();
});
// --- Dropdown choices ---
btnSelectSingle.addEventListener("click", () => {
  btnSelect.textContent = "🖱️";
  btnSelect.title = "Single Select";
  btnSelectSingle.classList.add("active");
  btnSelectRectangle.classList.remove("active");
  selectOptions.classList.remove("dropdown-show");
  activateSingleSelect();
});
// --- Rectangle select ---
btnSelectRectangle.addEventListener("click", () => {
  if (!vectorLayer) {
    alert("Please select a layer first.");
    return;
  }
  clearInteractions();
  clearToolbarButtons();
  btnSelect.textContent = "🗂️";
  selectOptions.classList.remove("dropdown-show");
  btnSelectSingle.classList.remove("active");

  activeSelectInteraction = null;
  map.removeInteraction(translateInteraction);
  btnTranslate.classList.remove("active");
  btnTranslate.disabled = false;

  activeSelectInteraction = new DragBox({
    condition: always,
    freehand: true,
  });
  map.addInteraction(activeSelectInteraction);

  activeSelectInteraction.on("boxend", () => {
    // clear old selection
    selectedFeatures.forEach((f) => f.setStyle(null));
    selectedFeatures.clear();

    const extent = activeSelectInteraction.getGeometry().getExtent();
    const features = wfsVectorSource.getFeaturesInExtent(extent);

    // style and store new ones
    features.forEach((f) => {
      f.setStyle(selectStyle);
      selectedFeatures.push(f);
    });

    console.log("🎯 Selected (rectangle):", selectedFeatures);
  });

  btnSelectRectangle.classList.add("active");
  btnSelect.classList.add("active");
  selectOptions.classList.remove("dropdown-show");
  console.log("🗂️ Rectangle select active");
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
  clearInteractions();
  clearToolbarButtons();
  btnSelect.textContent = "🖱️";

  drawInteraction = new Draw({
    source: wfsVectorSource,
    type: layerType,
  });

  map.addInteraction(drawInteraction);
  addNewFeature.classList.add("active");

  snapGuidesInteraction.setDrawInteraction(drawInteraction);

  drawInteraction.on("drawend", function (event) {
    const feature = event.feature;

    // ✅ Don’t clone, just use the real feature in wfsVectorSource
    applyLayerSchemaToFeature(feature, wfsVectorLayer);
    feature.set("geom", feature.getGeometry());
    if (isLocalVectorEdit && !feature.getId()) {
      feature.setId(`local.${Date.now()}.${inserts.length + 1}`);
    }

    if (!inserts.includes(feature)) {
      inserts.push(feature);
    }

    console.log("New feature drawn. Click 'Save' to apply.");
    updateSaveButtonState(); // ✅
  });
});

// Save Feature Function using writeTransaction
function saveFeature() {
  if (inserts.length === 0 && deletes.length === 0 && updates.length === 0) {
    alert("No features to save!");
    return;
  }

  if (isLocalVectorEdit) {
    deletes.forEach((item) => {
      wfsVectorSource.removeFeature(item.feature);
    });
    inserts = [];
    updates = [];
    deletes = [];
    updateSaveButtonState();
    alert("Vector layer edits saved in this map session.");
    return;
  }

  // Create WFS format instance
  const wfsFormat = new WFS();
  const insertFeatures = cloneFeaturesForTransaction(inserts);
  const updateFeatures = cloneFeaturesForTransaction(updates);
  const deleteFeatures = deletes.map((item) => item.feature);
  console.log(insertFeatures);

  [...insertFeatures, ...updateFeatures].forEach((f) => {
    const keepGeom = f.getGeometry();
    f.set("geom", keepGeom);
    f.setGeometryName("geom");
  });

  updateFeatures.forEach((f) => {
    // 🔹 Drop all non-geometry properties (like fid) before saving
    const keepGeom = f.getGeometry();
    f.getKeys().forEach((key) => {
      if (key !== "geom") {
        f.unset(key, true);
      }
    });

    // 🔹 Normalize geometry property
    if (f.getGeometryName() !== "geom") {
      f.set("geom", keepGeom); // store under correct key
      f.setGeometryName("geom"); // tell OL the schema property
    }
  });

  // Prepare the transaction
  const transaction = wfsFormat.writeTransaction(
    insertFeatures,
    updateFeatures,
    deleteFeatures,
    {
      featureNS: `${workspace}@org`,
      featurePrefix: workspace,
      featureType: layerName,
      srsName: editLayerProjection,
    },
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
      Authorization: "Basic " + btoa(`${username}:${password}`),
    },
  })
    .then((response) => response.text())
    .then((responseText) => {
      console.log("Transaction XML:", responseText);
      source.refresh();
      inserts = [];
      updates = [];
      deletes = [];
      updateSaveButtonState(); // ✅
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

  // const selectedFeatures = activeSelectInteraction.getFeatures();
  if (selectedFeatures.getLength() === 0) {
    alert("No features selected for deletion.");
    return;
  }

  // Add to deletion queue with visual feedback
  selectedFeatures.forEach((feature) => {
    if (isLocalVectorEdit) {
      if (!deletes.some((item) => item.feature === feature)) {
        deletes.push({
          feature: feature,
          featureID: feature.getId?.() || null,
        });
      }
      return;
    }

    // Skip if already queued
    if (!inserts.some((f) => f.featureID === feature.get("fid"))) {
      deletes.push({
        feature: feature,
        featureID: feature.get("fid"),
      });
      console.log("Feature queued for deletion:", feature.get("fid"));
    }
  });
  updateSaveButtonState(); // ✅
  console.log(`Queued ${selectedFeatures.length} features for deletion`);
});

const splitFeatureButton = document.getElementById("btnSplit");

function getSelectedFeatureForSplit() {
  const selectedArray = selectedFeatures.getArray();

  if (selectedArray.length !== 1) {
    alert("Select exactly one feature to split.");
    activateSingleSelect();
    return null;
  }

  return selectedArray[0];
}

function createSplitParts(targetFeature, cutterFeature) {
  const turfApi = getTurf();
  if (!turfApi) {
    alert(
      "Turf.js is not loaded. Check your internet connection and try again.",
    );
    return [];
  }

  const format = new GeoJSON();
  const mapProjection = map.getView().getProjection().getCode();
  const targetGeoJson = format.writeFeatureObject(targetFeature, {
    featureProjection: mapProjection,
    dataProjection: "EPSG:4326",
  });
  const cutterGeoJson = format.writeFeatureObject(cutterFeature, {
    featureProjection: mapProjection,
    dataProjection: "EPSG:4326",
  });
  const targetType = getBaseGeometryType(targetFeature);
  let splitGeoJson = null;

  if (targetType === "LineString") {
    if (!turfApi.lineSplit) {
      alert("Line split is not available in Turf.js.");
      return [];
    }
    splitGeoJson = turfApi.lineSplit(targetGeoJson, cutterGeoJson);
  } else if (targetType === "Polygon") {
    return splitPolygonWithJsts(targetFeature, cutterFeature);
  } else {
    alert("Split supports line and polygon features.");
    return [];
  }

  return format
    .readFeatures(splitGeoJson, {
      dataProjection: "EPSG:4326",
      featureProjection: mapProjection,
    })
    .filter((feature) => feature.getGeometry?.());
}

function splitPolygonWithJsts(targetFeature, cutterFeature) {
  const jstsApi = window.jsts;
  const turfApi = getTurf();

  if (!jstsApi?.io?.OL3Parser || !jstsApi?.operation?.polygonize?.Polygonizer) {
    alert("JSTS is not loaded. Check your internet connection and try again.");
    return [];
  }

  const parser = new jstsApi.io.OL3Parser();
  parser.inject(
    Point,
    LineString,
    LinearRing,
    Polygon,
    MultiPoint,
    MultiLineString,
    MultiPolygon,
    GeometryCollection,
  );

  const targetGeometry = targetFeature.getGeometry();
  const cutterGeometry = cutterFeature.getGeometry();
  const boundary = targetGeometry.getLinearRing
    ? targetGeometry.getLinearRing(0)
    : targetGeometry.getBoundary?.();

  if (!boundary) {
    alert(
      "This polygon cannot be split because its boundary could not be read.",
    );
    return [];
  }

  const polygonBoundary = parser.read(boundary);
  const cutterLine = parser.read(cutterGeometry);
  const nodedLinework = polygonBoundary.union(cutterLine);
  const polygonizer = new jstsApi.operation.polygonize.Polygonizer();
  polygonizer.add(nodedLinework);

  const polygonized = polygonizer.getPolygons();
  const splitParts = [];
  const format = new GeoJSON();
  const mapProjection = map.getView().getProjection().getCode();
  const originalGeoJson = format.writeFeatureObject(targetFeature, {
    featureProjection: mapProjection,
    dataProjection: "EPSG:4326",
  });

  for (let i = 0; i < polygonized.size(); i++) {
    const candidateGeometry = parser.write(polygonized.get(i));
    const candidateFeature = new Feature({ geometry: candidateGeometry });
    const candidateGeoJson = format.writeFeatureObject(candidateFeature, {
      featureProjection: mapProjection,
      dataProjection: "EPSG:4326",
    });
    const pointInCandidate = turfApi?.pointOnFeature?.(candidateGeoJson);

    if (
      !pointInCandidate ||
      !turfApi?.booleanPointInPolygon?.(pointInCandidate, originalGeoJson)
    ) {
      continue;
    }

    splitParts.push(candidateFeature);
  }

  return splitParts;
}

function queueSplitResult(targetFeature, splitParts) {
  if (splitParts.length < 2) {
    alert("The split line did not create multiple parts.");
    return false;
  }

  targetFeature.setStyle(null);
  wfsVectorSource.removeFeature(targetFeature);

  const insertIndex = inserts.indexOf(targetFeature);
  if (insertIndex > -1) {
    inserts.splice(insertIndex, 1);
  } else if (!deletes.some((item) => item.feature === targetFeature)) {
    deletes.push({
      feature: targetFeature,
      featureID: targetFeature.getId?.() || targetFeature.get("fid") || null,
    });
  }

  const updateIndex = updates.indexOf(targetFeature);
  if (updateIndex > -1) {
    updates.splice(updateIndex, 1);
  }

  splitParts.forEach((part, index) => {
    const partGeometry = part.getGeometry();
    part.setProperties(targetFeature.getProperties());
    ["geometry", "geom", "the_geom", "wkb_geometry"].forEach((key) => {
      part.unset(key, true);
    });
    part.setGeometry(partGeometry);
    part.set("geom", partGeometry);
    if (isLocalVectorEdit) {
      part.setId(`split.${Date.now()}.${index + 1}`);
    }
    wfsVectorSource.addFeature(part);
    inserts.push(part);
  });

  selectedFeatures.clear();
  activeSelectInteraction?.getFeatures?.().clear?.();
  updateSaveButtonState();
  return true;
}

function activateSplitTool() {
  if (!wfsVectorSource || !vectorLayer) {
    alert("Open the editor for a layer before splitting features.");
    return;
  }

  const targetFeature = getSelectedFeatureForSplit();
  if (!targetFeature) return;

  clearInteractions();
  clearToolbarButtons();
  btnSelect.textContent = "🖱️";

  const splitSketchSource = new VectorSource();
  drawInteraction = new Draw({
    source: splitSketchSource,
    type: "LineString",
  });

  map.addInteraction(drawInteraction);
  splitFeatureButton.classList.add("active");

  drawInteraction.once("drawend", (event) => {
    const splitParts = createSplitParts(targetFeature, event.feature);
    if (queueSplitResult(targetFeature, splitParts)) {
      console.log("Feature split into", splitParts.length, "parts.");
    }
    map.removeInteraction(drawInteraction);
    drawInteraction = null;
    splitFeatureButton.classList.remove("active");
  });
}

splitFeatureButton.addEventListener("click", activateSplitTool);

const bufferFeatureButton = document.getElementById("btnBuffer");
const bufferModal = document.getElementById("bufferModal");
const bufferModalClose = document.getElementById("bufferModalClose");
const bufferCancel = document.getElementById("bufferCancel");
const bufferApply = document.getElementById("bufferApply");
const bufferDistanceInput = document.getElementById("bufferDistance");
const bufferUnitsSelect = document.getElementById("bufferUnits");
const bufferLayerNameInput = document.getElementById("bufferLayerName");
const bufferStartSelect = document.getElementById("bufferStartSelect");
const bufferSelectedHelp = document.getElementById("bufferSelectedHelp");
let bufferLayerNameEdited = false;

const bufferStyle = new Style({
  stroke: new Stroke({
    color: "#f97316",
    width: 3,
  }),
  fill: new Fill({
    color: "rgba(249, 115, 22, 0.24)",
  }),
});

function getTurf() {
  return window.turf;
}

function getDefaultBufferLayerName(distance, units, scope) {
  const unitLabel = units === "kilometers" ? "km" : "m";
  const scopeLabel = scope === "layer" ? "Layer" : "Selected";
  return `Buffer ${scopeLabel} ${distance || 0} ${unitLabel}`;
}

function updateDefaultBufferLayerName(force = false) {
  if (!force && bufferLayerNameEdited) return;

  bufferLayerNameInput.value = getDefaultBufferLayerName(
    bufferDistanceInput.value,
    bufferUnitsSelect.value,
    getSelectedBufferScope(),
  );
}

function createBufferLayer(
  bufferFeatures,
  distance,
  units,
  scope,
  outputLayerName,
) {
  const bufferSource = new VectorSource({
    features: bufferFeatures,
  });
  const bufferLayer = new VectorLayer({
    source: bufferSource,
    title: outputLayerName || getDefaultBufferLayerName(distance, units, scope),
    displayInLayerSwitcher: true,
    style: bufferStyle,
  });
  bufferLayer.set("editableVector", true);
  bufferLayer.set("bufferLayer", true);

  map.addLayer(bufferLayer);
  registerPersistentVectorLayer(bufferLayer, "buffer");
  map.getView().fit(bufferSource.getExtent(), {
    duration: 600,
    padding: [50, 50, 50, 50],
    maxZoom: 18,
  });
}

function openBufferDialog() {
  if (!isEditing || !wfsVectorSource) {
    alert("Open the editor for a layer before creating a buffer.");
    return;
  }

  bufferModal.classList.add("open");
  bufferModal.setAttribute("aria-hidden", "false");
  bufferLayerNameEdited = false;
  updateDefaultBufferLayerName(true);
  bufferDistanceInput.focus();
  bufferDistanceInput.select();
  updateBufferDialogHelp();
}

function closeBufferDialog() {
  bufferModal.classList.remove("open");
  bufferModal.setAttribute("aria-hidden", "true");
}

function getSelectedBufferScope() {
  return (
    document.querySelector('input[name="bufferScope"]:checked')?.value ||
    "selected"
  );
}

function updateBufferDialogHelp() {
  const scope = getSelectedBufferScope();
  const selectedCount = selectedFeatures.getLength();
  const layerCount = wfsVectorSource?.getFeatures?.().length || 0;

  if (scope === "layer") {
    bufferSelectedHelp.textContent = `This will buffer all ${layerCount} loaded features in the active editable layer.`;
    bufferStartSelect.style.display = "none";
    return;
  }

  bufferSelectedHelp.textContent = selectedCount
    ? `${selectedCount} selected feature${selectedCount === 1 ? "" : "s"} will be buffered.`
    : "Use the editor select tool, then run the buffer for the selected features.";
  bufferStartSelect.style.display = "block";
}

function getBufferFeatures(scope) {
  if (scope === "layer") {
    return (wfsVectorSource?.getFeatures?.() || []).filter((feature) =>
      feature.getGeometry(),
    );
  }

  return selectedFeatures.getArray().filter((feature) => feature.getGeometry());
}

function bufferFeatures(features, distance, units, scope, outputLayerName) {
  const turfApi = getTurf();

  if (!turfApi?.buffer) {
    alert(
      "Turf.js is not loaded. Check your internet connection and try again.",
    );
    return false;
  }

  const format = new GeoJSON();
  const mapProjection = map.getView().getProjection().getCode();
  const bufferedFeatures = [];

  features.forEach((feature) => {
    const geojsonFeature = format.writeFeatureObject(feature, {
      featureProjection: mapProjection,
      dataProjection: "EPSG:4326",
    });
    const buffered = turfApi.buffer(geojsonFeature, distance, {
      units,
    });

    if (!buffered) return;

    const olFeature = format.readFeature(buffered, {
      dataProjection: "EPSG:4326",
      featureProjection: mapProjection,
    });
    olFeature.setProperties({
      sourceId: feature.getId?.() || feature.get("fid") || null,
      buffer_distance: distance,
      buffer_units: units,
    });
    olFeature.setId(`buffer.${Date.now()}.${bufferedFeatures.length + 1}`);
    bufferedFeatures.push(olFeature);
  });

  if (!bufferedFeatures.length) {
    alert("No buffer geometry was created.");
    return false;
  }

  createBufferLayer(bufferedFeatures, distance, units, scope, outputLayerName);
  return true;
}

function applyBufferFromDialog() {
  const distance = Number(bufferDistanceInput.value);
  const units = bufferUnitsSelect.value;
  const scope = getSelectedBufferScope();
  const outputLayerName =
    bufferLayerNameInput.value.trim() ||
    getDefaultBufferLayerName(bufferDistanceInput.value, units, scope);

  if (!Number.isFinite(distance) || distance <= 0) {
    alert("Please enter a positive buffer distance.");
    bufferDistanceInput.focus();
    return;
  }

  const features = getBufferFeatures(scope);
  if (!features.length) {
    if (scope === "selected") {
      alert("Select one or more features from the editor toolbar first.");
      activateSingleSelect();
      updateBufferDialogHelp();
      return;
    }

    alert("No loaded features were found in the active editable layer.");
    return;
  }

  if (bufferFeatures(features, distance, units, scope, outputLayerName)) {
    closeBufferDialog();
  }
}

bufferFeatureButton.addEventListener("click", openBufferDialog);
bufferModalClose.addEventListener("click", closeBufferDialog);
bufferCancel.addEventListener("click", closeBufferDialog);
bufferApply.addEventListener("click", applyBufferFromDialog);
bufferStartSelect.addEventListener("click", () => {
  activateSingleSelect();
  updateBufferDialogHelp();
  closeBufferDialog();
});
document.querySelectorAll('input[name="bufferScope"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateDefaultBufferLayerName();
    updateBufferDialogHelp();
  });
});
bufferDistanceInput.addEventListener("input", () =>
  updateDefaultBufferLayerName(),
);
bufferUnitsSelect.addEventListener("change", () =>
  updateDefaultBufferLayerName(),
);
bufferLayerNameInput.addEventListener("input", () => {
  bufferLayerNameEdited = bufferLayerNameInput.value.trim().length > 0;
});
bufferModal.addEventListener("click", (event) => {
  if (event.target === bufferModal) {
    closeBufferDialog();
  }
});

const mergeFeatureButton = document.getElementById("btnMerge");
const mergeModal = document.getElementById("mergeModal");
const mergeModalClose = document.getElementById("mergeModalClose");
const mergeCancel = document.getElementById("mergeCancel");
const mergeApply = document.getElementById("mergeApply");
const mergeStartSelect = document.getElementById("mergeStartSelect");
const mergeSelectedHelp = document.getElementById("mergeSelectedHelp");

function openMergeDialog() {
  if (!isEditing || !wfsVectorSource) {
    alert("Open the editor for a layer before merging features.");
    return;
  }

  mergeModal.classList.add("open");
  mergeModal.setAttribute("aria-hidden", "false");
  updateMergeDialogHelp();
}

function closeMergeDialog() {
  mergeModal.classList.remove("open");
  mergeModal.setAttribute("aria-hidden", "true");
}

function getSelectedMergeScope() {
  return (
    document.querySelector('input[name="mergeScope"]:checked')?.value ||
    "selected"
  );
}

function updateMergeDialogHelp() {
  const scope = getSelectedMergeScope();
  const selectedCount = selectedFeatures.getLength();
  const layerCount = wfsVectorSource?.getFeatures?.().length || 0;

  if (scope === "layer") {
    mergeSelectedHelp.textContent = `This will merge all ${layerCount} loaded features in the active editable layer.`;
    mergeStartSelect.style.display = "none";
    return;
  }

  mergeSelectedHelp.textContent = selectedCount
    ? `${selectedCount} selected feature${selectedCount === 1 ? "" : "s"} will be merged.`
    : "Use the editor select tool, then merge the selected features.";
  mergeStartSelect.style.display = "block";
}

function getMergeFeatures(scope) {
  if (scope === "layer") {
    return (wfsVectorSource?.getFeatures?.() || []).filter((feature) =>
      feature.getGeometry(),
    );
  }

  return selectedFeatures.getArray().filter((feature) => feature.getGeometry());
}

function getBaseGeometryType(feature) {
  const type = feature.getGeometry()?.getType?.();
  if (type?.includes("Point")) return "Point";
  if (type?.includes("LineString")) return "LineString";
  if (type?.includes("Polygon")) return "Polygon";
  return type || "";
}

function createMergedGeoJsonFeature(features, scope) {
  const turfApi = getTurf();

  if (!turfApi?.featureCollection) {
    alert(
      "Turf.js is not loaded. Check your internet connection and try again.",
    );
    return null;
  }

  const baseType = getBaseGeometryType(features[0]);
  const hasMixedTypes = features.some(
    (feature) => getBaseGeometryType(feature) !== baseType,
  );

  if (hasMixedTypes) {
    alert("Merge needs features with the same geometry type.");
    return null;
  }

  const format = new GeoJSON();
  const mapProjection = map.getView().getProjection().getCode();
  const geojsonFeatures = features.map((feature) =>
    format.writeFeatureObject(feature, {
      featureProjection: mapProjection,
      dataProjection: "EPSG:4326",
    }),
  );
  const featureCollection = turfApi.featureCollection(geojsonFeatures);
  let mergedGeoJson = null;

  if (baseType === "Polygon") {
    if (!turfApi.union) {
      alert("Turf union is not available.");
      return null;
    }

    try {
      mergedGeoJson = turfApi.union(featureCollection);
    } catch (error) {
      try {
        mergedGeoJson = geojsonFeatures.reduce((merged, feature) =>
          merged ? turfApi.union(merged, feature) : feature,
        );
      } catch (fallbackError) {
        console.error("Merge failed:", fallbackError);
        alert("The selected polygons could not be merged.");
        return null;
      }
    }
  } else if (turfApi.combine) {
    const combined = turfApi.combine(featureCollection);
    mergedGeoJson = combined.features?.[0] || null;
  }

  if (!mergedGeoJson) {
    alert("No merged geometry was created.");
    return null;
  }

  mergedGeoJson.properties = {
    ...(mergedGeoJson.properties || {}),
    merged_count: features.length,
    merge_scope: scope,
  };
  return mergedGeoJson;
}

function trackMergedSourceChanges(originalFeatures, mergedFeature) {
  originalFeatures.forEach((feature) => {
    feature.setStyle(null);
    wfsVectorSource.removeFeature(feature);

    const insertIndex = inserts.indexOf(feature);
    if (insertIndex > -1) {
      inserts.splice(insertIndex, 1);
    } else if (!deletes.some((item) => item.feature === feature)) {
      deletes.push({
        feature,
        featureID: feature.getId?.() || feature.get("fid") || null,
      });
    }

    const updateIndex = updates.indexOf(feature);
    if (updateIndex > -1) {
      updates.splice(updateIndex, 1);
    }
  });

  mergedFeature.set("geom", mergedFeature.getGeometry());
  mergedFeature.setId(`merge.${Date.now()}`);
  wfsVectorSource.addFeature(mergedFeature);
  inserts.push(mergedFeature);

  selectedFeatures.clear();
  activeSelectInteraction?.getFeatures?.().clear?.();
  updateSaveButtonState();
}

function applyMergeFromDialog() {
  const scope = getSelectedMergeScope();
  const features = getMergeFeatures(scope);

  if (features.length < 2) {
    if (scope === "selected") {
      alert("Select at least two features from the editor toolbar first.");
      activateSingleSelect();
      updateMergeDialogHelp();
      return;
    }

    alert(
      "The active editable layer needs at least two loaded features to merge.",
    );
    return;
  }

  const mergedGeoJson = createMergedGeoJsonFeature(features, scope);
  if (!mergedGeoJson) return;

  const format = new GeoJSON();
  const mapProjection = map.getView().getProjection().getCode();
  const mergedFeature = format.readFeature(mergedGeoJson, {
    dataProjection: "EPSG:4326",
    featureProjection: mapProjection,
  });

  trackMergedSourceChanges(features, mergedFeature);
  closeMergeDialog();
}

mergeFeatureButton.addEventListener("click", openMergeDialog);
mergeModalClose.addEventListener("click", closeMergeDialog);
mergeCancel.addEventListener("click", closeMergeDialog);
mergeApply.addEventListener("click", applyMergeFromDialog);
mergeStartSelect.addEventListener("click", () => {
  activateSingleSelect();
  updateMergeDialogHelp();
  closeMergeDialog();
});
document.querySelectorAll('input[name="mergeScope"]').forEach((input) => {
  input.addEventListener("change", updateMergeDialogHelp);
});
mergeModal.addEventListener("click", (event) => {
  if (event.target === mergeModal) {
    closeMergeDialog();
  }
});

const btnGeoprocess = document.getElementById("btnGeoprocess");
const btnGeoprocessDropdown = document.getElementById("btnGeoprocessDropdown");
const geoprocessOptions = document.getElementById("geoprocessOptions");
const btnIntersectLayers = document.getElementById("btnIntersectLayers");
const btnIntersectGeometry = document.getElementById("btnIntersectGeometry");
const btnClipDifference = document.getElementById("btnClipDifference");
const btnMergeLayers = document.getElementById("btnMergeLayers");
const btnVerticesLayer = document.getElementById("btnVerticesLayer");
const btnCentroidLayer = document.getElementById("btnCentroidLayer");
const btnPointOnFeatureLayer = document.getElementById("btnPointOnFeatureLayer");
const btnPointGrid = document.getElementById("btnPointGrid");
const btnGridScore = document.getElementById("btnGridScore");
const intersectModal = document.getElementById("intersectModal");
const intersectModalClose = document.getElementById("intersectModalClose");
const intersectCancel = document.getElementById("intersectCancel");
const intersectApply = document.getElementById("intersectApply");
const intersectLayerA = document.getElementById("intersectLayerA");
const intersectLayerB = document.getElementById("intersectLayerB");
const intersectGeometryModal = document.getElementById("intersectGeometryModal");
const intersectGeometryModalClose = document.getElementById(
  "intersectGeometryModalClose",
);
const intersectGeometryCancel = document.getElementById(
  "intersectGeometryCancel",
);
const intersectGeometryApply = document.getElementById(
  "intersectGeometryApply",
);
const intersectGeometryInputLayer = document.getElementById(
  "intersectGeometryInputLayer",
);
const intersectGeometryOverlayLayer = document.getElementById(
  "intersectGeometryOverlayLayer",
);
const intersectGeometryLayerName = document.getElementById(
  "intersectGeometryLayerName",
);
const clipDifferenceModal = document.getElementById("clipDifferenceModal");
const clipDifferenceModalClose = document.getElementById(
  "clipDifferenceModalClose",
);
const clipDifferenceCancel = document.getElementById("clipDifferenceCancel");
const clipDifferenceApply = document.getElementById("clipDifferenceApply");
const clipDifferenceInputLayer = document.getElementById(
  "clipDifferenceInputLayer",
);
const clipDifferenceClipLayer = document.getElementById(
  "clipDifferenceClipLayer",
);
const clipDifferenceLayerName = document.getElementById(
  "clipDifferenceLayerName",
);
const mergeLayersModal = document.getElementById("mergeLayersModal");
const mergeLayersModalClose = document.getElementById("mergeLayersModalClose");
const mergeLayersCancel = document.getElementById("mergeLayersCancel");
const mergeLayersApply = document.getElementById("mergeLayersApply");
const mergeLayerA = document.getElementById("mergeLayerA");
const mergeLayerB = document.getElementById("mergeLayerB");
const mergeLayersName = document.getElementById("mergeLayersName");
const verticesModal = document.getElementById("verticesModal");
const verticesModalClose = document.getElementById("verticesModalClose");
const verticesCancel = document.getElementById("verticesCancel");
const verticesApply = document.getElementById("verticesApply");
const verticesLayerSelect = document.getElementById("verticesLayerSelect");
const verticesLayerName = document.getElementById("verticesLayerName");
const centroidModal = document.getElementById("centroidModal");
const centroidModalClose = document.getElementById("centroidModalClose");
const centroidCancel = document.getElementById("centroidCancel");
const centroidApply = document.getElementById("centroidApply");
const centroidLayerSelect = document.getElementById("centroidLayerSelect");
const centroidLayerName = document.getElementById("centroidLayerName");
const pointOnFeatureModal = document.getElementById("pointOnFeatureModal");
const pointOnFeatureModalClose = document.getElementById(
  "pointOnFeatureModalClose",
);
const pointOnFeatureCancel = document.getElementById("pointOnFeatureCancel");
const pointOnFeatureApply = document.getElementById("pointOnFeatureApply");
const pointOnFeatureLayerSelect = document.getElementById(
  "pointOnFeatureLayerSelect",
);
const pointOnFeatureLayerName = document.getElementById(
  "pointOnFeatureLayerName",
);
const pointGridModal = document.getElementById("pointGridModal");
const pointGridModalClose = document.getElementById("pointGridModalClose");
const pointGridCancel = document.getElementById("pointGridCancel");
const pointGridApply = document.getElementById("pointGridApply");
const pointGridLayerSelect = document.getElementById("pointGridLayerSelect");
const pointGridSpacing = document.getElementById("pointGridSpacing");
const pointGridUnits = document.getElementById("pointGridUnits");
const pointGridLayerName = document.getElementById("pointGridLayerName");
const gridScoreModal = document.getElementById("gridScoreModal");
const gridScoreModalClose = document.getElementById("gridScoreModalClose");
const gridScoreCancel = document.getElementById("gridScoreCancel");
const gridScorePreview = document.getElementById("gridScorePreview");
const gridScoreRun = document.getElementById("gridScoreRun");
const gridScoreLayerSelect = document.getElementById("gridScoreLayerSelect");
const gridScoreRadius = document.getElementById("gridScoreRadius");
const gridScoreUnits = document.getElementById("gridScoreUnits");
const gridScoreStatus = document.getElementById("gridScoreStatus");
let currentGeoprocessLayerItems = [];
let currentGridScoreLayerItems = [];

const gridScoreCategoryDefinitions = [
  {
    value: "school",
    field: "schools_count",
    label: "Schools",
    query: '["amenity"="school"]',
    match: (tags) => tags.amenity === "school",
    weight: 2,
  },
  {
    value: "kindergarten",
    field: "kindergartens_count",
    label: "Kindergartens",
    query: '["amenity"="kindergarten"]',
    match: (tags) => tags.amenity === "kindergarten",
    weight: 2,
  },
  {
    value: "bus_stop",
    field: "bus_stops_count",
    label: "Bus Stops",
    query: '["highway"="bus_stop"]',
    extraQueries: ['["public_transport"="platform"]'],
    match: (tags) =>
      tags.highway === "bus_stop" || tags.public_transport === "platform",
    weight: 1.5,
  },
  {
    value: "park",
    field: "parks_count",
    label: "Parks",
    query: '["leisure"="park"]',
    match: (tags) => tags.leisure === "park",
    weight: 1,
  },
  {
    value: "hospital",
    field: "hospitals_count",
    label: "Hospitals",
    query: '["amenity"="hospital"]',
    match: (tags) => tags.amenity === "hospital",
    weight: 2,
  },
  {
    value: "police",
    field: "police_count",
    label: "Police",
    query: '["amenity"="police"]',
    match: (tags) => tags.amenity === "police",
    weight: 1,
  },
  {
    value: "fire_station",
    field: "fire_stations_count",
    label: "Fire Stations",
    query: '["amenity"="fire_station"]',
    match: (tags) => tags.amenity === "fire_station",
    weight: 1,
  },
];

const geoprocessResultStyle = new Style({
  stroke: new Stroke({ color: "#06b6d4", width: 3 }),
  fill: new Fill({ color: "rgba(6, 182, 212, 0.26)" }),
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: "rgba(6, 182, 212, 0.85)" }),
    stroke: new Stroke({ color: "#ffffff", width: 2 }),
  }),
});

function getGeoprocessLayerItems() {
  const items = [];

  function visitLayer(layer) {
    if (layer instanceof LayerGroup) {
      layer.getLayers().forEach(visitLayer);
      return;
    }

    if (layer instanceof VectorLayer) {
      if (layer.get("displayInLayerSwitcher") !== true) return;

      const layerSource = layer.getSource?.();
      const layerFeatures = layerSource?.getFeatures?.() || [];
      const firstFeature = layerFeatures.find((feature) =>
        feature.getGeometry?.(),
      );
      items.push({
        layer,
        source: layerSource,
        title: layer.get("title") || `Vector layer ${items.length + 1}`,
        features: layerFeatures.filter((feature) => feature.getGeometry?.()),
        geometryType: firstFeature ? getBaseGeometryType(firstFeature) : "",
        typeName: "",
        sourceType: "vector",
      });
      return;
    }
  }

  map.getLayers().forEach(visitLayer);
  return items;
}

function fillLayerSelect(selectElement, items) {
  selectElement.innerHTML = "";
  items.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    const sourceLabel = item.geometryType || "Vector";
    option.textContent = `${item.title} (${sourceLabel})`;
    selectElement.appendChild(option);
  });

  if (!items.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No processable layers found";
    option.disabled = true;
    option.selected = true;
    selectElement.appendChild(option);
  }
}

function getSelectedLayerItem(selectElement, items) {
  const index = Number(selectElement.value);
  return Number.isInteger(index) ? items[index] : null;
}

function prepareLayerDialog(selectA, selectB) {
  currentGeoprocessLayerItems = getGeoprocessLayerItems();
  fillLayerSelect(selectA, currentGeoprocessLayerItems);
  fillLayerSelect(selectB, currentGeoprocessLayerItems);

  if (currentGeoprocessLayerItems.length > 1) {
    selectB.value = "1";
  }

  return currentGeoprocessLayerItems.length;
}

async function loadGeoprocessFeatures(layerItem) {
  if (layerItem.sourceType === "vector") {
    layerItem.features = (layerItem.source?.getFeatures?.() || []).filter(
      (feature) => feature.getGeometry?.(),
    );
    const firstFeature = layerItem.features[0];
    layerItem.geometryType = firstFeature
      ? getBaseGeometryType(firstFeature)
      : "";
    return layerItem;
  }

  const typeName = layerItem.typeName;
  if (!typeName) {
    throw new Error(`Layer "${layerItem.title}" has no WFS type name.`);
  }

  const [layerWorkspace = workspaceName] = typeName.includes(":")
    ? typeName.split(":")
    : [workspaceName];
  const wfsUrl = getWfsGetFeatureUrl({
    workspace: layerWorkspace,
    typeName,
    version: "1.1.0",
    maxFeatures: 1000,
    srsName: map.getView().getProjection().getCode(),
  });
  const response = await fetch(wfsUrl);
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `Could not load ${layerItem.title}: HTTP ${response.status}`,
    );
  }

  if (responseText.trim().startsWith("<")) {
    const xml = new DOMParser().parseFromString(responseText, "text/xml");
    const exceptionText =
      xml.querySelector("ExceptionText")?.textContent ||
      xml.querySelector("ServiceException")?.textContent ||
      responseText.slice(0, 240);
    throw new Error(
      `GeoServer returned XML instead of GeoJSON for ${layerItem.title}: ${exceptionText}`,
    );
  }

  let geojson;
  try {
    geojson = JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `Could not parse GeoJSON for ${layerItem.title}: ${error.message}`,
    );
  }
  const format = new GeoJSON();
  layerItem.features = format.readFeatures(geojson, {
    dataProjection: map.getView().getProjection().getCode(),
    featureProjection: map.getView().getProjection().getCode(),
  });
  const firstFeature = layerItem.features.find((feature) =>
    feature.getGeometry?.(),
  );
  layerItem.geometryType = firstFeature
    ? getBaseGeometryType(firstFeature)
    : "";
  return layerItem;
}

function createEditableResultLayer(features, title) {
  const resultSource = new VectorSource({ features });
  const resultLayer = new VectorLayer({
    source: resultSource,
    title,
    displayInLayerSwitcher: true,
    visible: true,
    style: geoprocessResultStyle,
  });

  resultLayer.set("editableVector", true);
  resultLayer.set("geoprocessLayer", true);
  map.addLayer(resultLayer);
  registerPersistentVectorLayer(resultLayer, "geoprocess");

  const extent = resultSource.getExtent();
  if (features.length && extent.every(Number.isFinite)) {
    map.getView().fit(extent, {
      duration: 600,
      padding: [60, 60, 60, 60],
      maxZoom: 18,
    });
  }

  return resultLayer;
}

function createVerticesResultLayer(features, title) {
  const resultSource = new VectorSource({ features });
  const resultLayer = new VectorLayer({
    source: resultSource,
    title,
    displayInLayerSwitcher: true,
    visible: true,
    style: verticesResultStyle,
  });

  const mapProjection = map.getView().getProjection().getCode();
  features.forEach((feature) =>
    feature.set("_featureProjection", mapProjection),
  );
  resultLayer.set("editableVector", true);
  resultLayer.set("geoprocessLayer", true);
  resultLayer.set("geometryType", "Point");
  resultLayer.set("featureProjection", mapProjection);
  resultLayer.set("sourceProjection", mapProjection);
  resultLayer.set("attributeSchema", [
    { name: "source_layer", type: "text" },
    { name: "source_feature", type: "text" },
    { name: "vertex_index", type: "number" },
  ]);

  map.addLayer(resultLayer);
  registerPersistentVectorLayer(resultLayer, "vertices");

  const extent = resultSource.getExtent();
  if (features.length && extent.every(Number.isFinite)) {
    map.getView().fit(extent, {
      duration: 600,
      padding: [60, 60, 60, 60],
      maxZoom: 18,
    });
  }

  return resultLayer;
}

function createPointGridResultLayer(features, title, spacing, units) {
  const resultSource = new VectorSource({ features });
  const styleConfig = {
    strokeColor: "#0891b2",
    fillColor: "#06b6d4",
    strokeWidth: 2,
    pointSize: 6,
  };
  const resultLayer = new VectorLayer({
    source: resultSource,
    title,
    displayInLayerSwitcher: true,
    visible: true,
    style: createVectorLayerStyle(styleConfig),
  });

  const mapProjection = map.getView().getProjection().getCode();
  features.forEach((feature) => feature.set("_featureProjection", mapProjection));
  resultLayer.set("editableVector", true);
  resultLayer.set("createdVectorLayer", true);
  resultLayer.set("geoprocessLayer", true);
  resultLayer.set("pointGridLayer", true);
  resultLayer.set("geometryType", "Point");
  resultLayer.set("styleConfig", styleConfig);
  resultLayer.set("featureProjection", mapProjection);
  resultLayer.set("sourceProjection", mapProjection);
  resultLayer.set("gridSpacing", spacing);
  resultLayer.set("gridUnits", units);
  resultLayer.set("attributeSchema", [
    { name: "grid_id", type: "number" },
    { name: "source_layer", type: "text" },
    { name: "spacing", type: "number" },
    { name: "units", type: "text" },
  ]);

  map.addLayer(resultLayer);
  const gridSaved = ensurePersistentVectorLayerSaved(resultLayer, "pointGrid");
  if (!gridSaved) {
    alert(
      "The point grid was created, but browser storage could not save it. Check available local storage space.",
    );
  }

  const extent = resultSource.getExtent();
  if (features.length && extent.every(Number.isFinite)) {
    map.getView().fit(extent, {
      duration: 600,
      padding: [60, 60, 60, 60],
      maxZoom: 18,
    });
  }

  return resultLayer;
}

const PERSISTED_VECTOR_LAYERS_KEY = "mmPropertiesCreatedVectorLayers";
const PERSISTED_VECTOR_LAYER_INDEX_KEY =
  "mmPropertiesCreatedVectorLayerIndexV2";
const PERSISTED_VECTOR_LAYER_PREFIX = "mmPropertiesCreatedVectorLayerV2:";

function getPersistedVectorLayerIndex() {
  try {
    const raw = localStorage.getItem(PERSISTED_VECTOR_LAYER_INDEX_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    console.warn("Could not read saved vector layer index.", error);
    return [];
  }
}

function writePersistedVectorLayerIndex(ids) {
  localStorage.setItem(
    PERSISTED_VECTOR_LAYER_INDEX_KEY,
    JSON.stringify([...new Set(ids)]),
  );
}

function getPersistedVectorLayers() {
  const indexedRecords = getPersistedVectorLayerIndex()
    .map((id) => {
      try {
        const raw = localStorage.getItem(
          `${PERSISTED_VECTOR_LAYER_PREFIX}${id}`,
        );
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.warn(`Could not read saved vector layer ${id}.`, error);
        return null;
      }
    })
    .filter(Boolean);
  if (indexedRecords.length) return indexedRecords;

  try {
    const raw = localStorage.getItem(PERSISTED_VECTOR_LAYERS_KEY);
    const layers = raw ? JSON.parse(raw) : [];
    return Array.isArray(layers) ? layers : [];
  } catch (error) {
    console.warn("Could not read saved vector layers.", error);
    return [];
  }
}

function writePersistedVectorLayers(layers) {
  try {
    const previousIds = getPersistedVectorLayerIndex();
    const nextIds = layers.map((layer) => layer.id);
    layers.forEach((layer) => {
      localStorage.setItem(
        `${PERSISTED_VECTOR_LAYER_PREFIX}${layer.id}`,
        JSON.stringify(layer),
      );
    });
    previousIds
      .filter((id) => !nextIds.includes(id))
      .forEach((id) =>
        localStorage.removeItem(`${PERSISTED_VECTOR_LAYER_PREFIX}${id}`),
      );
    writePersistedVectorLayerIndex(nextIds);
    localStorage.removeItem(PERSISTED_VECTOR_LAYERS_KEY);
    return true;
  } catch (error) {
    console.warn("Could not save vector layers to local storage.", error);
    return false;
  }
}

function getPersistentLayerId(layer) {
  let id = layer.get("persistentLayerId");
  if (!id) {
    id = `local-vector-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    layer.set("persistentLayerId", id);
  }
  return id;
}

function getPersistentVectorStyleType(layer, layerKind) {
  if (layer.get("styleConfig")) return "created";
  if (layerKind === "pointGrid" || layer.get("pointGridLayer")) return "vertices";
  if (layer.get("geoprocessLayer")) return "geoprocess";
  return "geoprocess";
}

function getPersistentVectorLayerRecord(layer, layerKind = "vector") {
  const sourceProjection =
    layer.get("sourceProjection") ||
    layer.get("featureProjection") ||
    map.getView().getProjection().getCode();
  const format = new GeoJSON();
  const features = layer.getSource?.().getFeatures?.() || [];

  return {
    id: getPersistentLayerId(layer),
    title: layer.get("title") || "Vector layer",
    kind: layerKind,
    visible: layer.getVisible?.() !== false,
    geometryType: layer.get("geometryType") || "",
    featureProjection: layer.get("featureProjection") || sourceProjection,
    sourceProjection,
    attributeSchema: layer.get("attributeSchema") || [],
    styleConfig: layer.get("styleConfig") || null,
    styleType: getPersistentVectorStyleType(layer, layerKind),
    createdVectorLayer: Boolean(layer.get("createdVectorLayer")),
    geoprocessLayer: Boolean(layer.get("geoprocessLayer")),
    pointGridLayer: Boolean(layer.get("pointGridLayer")),
    gridScoreLayer: Boolean(layer.get("gridScoreLayer")),
    centroidLayer: Boolean(layer.get("centroidLayer")),
    pointOnFeatureLayer: Boolean(layer.get("pointOnFeatureLayer")),
    clipDifferenceLayer: Boolean(layer.get("clipDifferenceLayer")),
    intersectGeometryLayer: Boolean(layer.get("intersectGeometryLayer")),
    gridSpacing: layer.get("gridSpacing") || null,
    gridUnits: layer.get("gridUnits") || null,
    scoreRadiusMeters: layer.get("scoreRadiusMeters") || null,
    scoreCategories: layer.get("scoreCategories") || [],
    geojson: format.writeFeaturesObject(features, {
      dataProjection: sourceProjection,
      featureProjection: sourceProjection,
    }),
  };
}

function savePersistentVectorLayer(layer, layerKind = "vector") {
  if (!layer?.getSource?.()) return false;
  const record = getPersistentVectorLayerRecord(layer, layerKind);
  try {
    localStorage.setItem(
      `${PERSISTED_VECTOR_LAYER_PREFIX}${record.id}`,
      JSON.stringify(record),
    );
    const ids = getPersistedVectorLayerIndex();
    if (!ids.includes(record.id)) {
      writePersistedVectorLayerIndex([...ids, record.id]);
    }
    return true;
  } catch (error) {
    console.warn(
      `Could not save vector layer "${record.title}" to local storage.`,
      error,
    );
    return false;
  }
}

function deletePersistentVectorLayer(layer) {
  const persistentLayerId = layer?.get?.("persistentLayerId");
  if (!persistentLayerId) return;

  const layers = getPersistedVectorLayers();
  const remainingLayers = layers.filter(
    (record) => record.id !== persistentLayerId,
  );
  if (remainingLayers.length !== layers.length) {
    try {
      localStorage.removeItem(
        `${PERSISTED_VECTOR_LAYER_PREFIX}${persistentLayerId}`,
      );
      writePersistedVectorLayerIndex(
        getPersistedVectorLayerIndex().filter(
          (id) => id !== persistentLayerId,
        ),
      );
    } catch (error) {
      console.warn("Could not delete saved vector layer.", error);
    }
  }
}

function registerPersistentVectorLayer(layer, layerKind = "vector") {
  if (!layer?.getSource?.() || layer.get("persistentVectorRegistered")) return;
  layer.set("persistentVectorRegistered", true);
  layer.set("persistentLayerKind", layerKind);
  getPersistentLayerId(layer);

  const source = layer.getSource();
  let saveTimer = null;
  const scheduleSave = () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      if (!map.getLayers().getArray().includes(layer)) return;
      savePersistentVectorLayer(layer, layerKind);
    }, 250);
  };

  source.on("addfeature", scheduleSave);
  source.on("removefeature", scheduleSave);
  source.on("changefeature", scheduleSave);
  source.on("clear", scheduleSave);
  layer.on("change:visible", scheduleSave);
  layer.on("change:title", scheduleSave);
  layer.on("change:attributeSchema", scheduleSave);
  layer.on("change:styleConfig", scheduleSave);
  layer.on("change:featureProjection", scheduleSave);
  layer.on("change:sourceProjection", scheduleSave);
  savePersistentVectorLayer(layer, layerKind);
}

function ensurePersistentVectorLayerSaved(layer, layerKind) {
  registerPersistentVectorLayer(layer, layerKind);
  const saved = savePersistentVectorLayer(layer, layerKind);
  if (!saved) {
    console.warn(`Layer "${layer.get("title")}" could not be persisted.`);
    layer.set("persistenceError", true);
    return false;
  }

  layer.unset("persistenceError", true);

  window.setTimeout(() => {
    if (!map.getLayers().getArray().includes(layer)) return;
    savePersistentVectorLayer(layer, layerKind);
  }, 500);
  return true;
}

function getRestoredVectorLayerStyle(record) {
  if (record.styleConfig) return createVectorLayerStyle(record.styleConfig);
  if (record.styleType === "vertices") return verticesResultStyle;
  return geoprocessResultStyle;
}

function restorePersistedVectorLayers() {
  const records = getPersistedVectorLayers();
  if (!records.length) return;

  const format = new GeoJSON();
  records.forEach((record) => {
    try {
      const sourceProjection =
        record.sourceProjection ||
        record.featureProjection ||
        map.getView().getProjection().getCode();
      const features = format.readFeatures(record.geojson || {}, {
        dataProjection: sourceProjection,
        featureProjection: sourceProjection,
      });
      features.forEach((feature) =>
        feature.set("_featureProjection", sourceProjection, true),
      );
      const restoredLayer = new VectorLayer({
        title: record.title || "Vector layer",
        source: new VectorSource({ features }),
        visible: record.visible !== false,
        displayInLayerSwitcher: true,
        style: getRestoredVectorLayerStyle(record),
      });

      restoredLayer.set("persistentLayerId", record.id);
      restoredLayer.set("editableVector", true);
      restoredLayer.set("createdVectorLayer", Boolean(record.createdVectorLayer));
      restoredLayer.set("geoprocessLayer", Boolean(record.geoprocessLayer));
      restoredLayer.set("pointGridLayer", Boolean(record.pointGridLayer));
      restoredLayer.set("gridScoreLayer", Boolean(record.gridScoreLayer));
      restoredLayer.set("centroidLayer", Boolean(record.centroidLayer));
      restoredLayer.set(
        "pointOnFeatureLayer",
        Boolean(record.pointOnFeatureLayer),
      );
      restoredLayer.set(
        "clipDifferenceLayer",
        Boolean(record.clipDifferenceLayer),
      );
      restoredLayer.set(
        "intersectGeometryLayer",
        Boolean(record.intersectGeometryLayer),
      );
      restoredLayer.set("geometryType", record.geometryType || "");
      restoredLayer.set("attributeSchema", record.attributeSchema || []);
      restoredLayer.set("styleConfig", record.styleConfig || null);
      restoredLayer.set("featureProjection", record.featureProjection || sourceProjection);
      restoredLayer.set("sourceProjection", sourceProjection);
      if (record.gridSpacing) restoredLayer.set("gridSpacing", record.gridSpacing);
      if (record.gridUnits) restoredLayer.set("gridUnits", record.gridUnits);
      if (record.scoreRadiusMeters) {
        restoredLayer.set("scoreRadiusMeters", record.scoreRadiusMeters);
      }
      if (record.scoreCategories?.length) {
        restoredLayer.set("scoreCategories", record.scoreCategories);
      }

      map.addLayer(restoredLayer);
      registerPersistentVectorLayer(restoredLayer, record.kind || "vector");
    } catch (error) {
      console.warn("Could not restore saved vector layer.", record?.title, error);
    }
  });

  layerSwitcher?.drawPanel?.();
  window.setTimeout(() => layerSwitcher?.drawPanel?.(), 0);
}

restorePersistedVectorLayers();

map.getLayers().on("remove", (event) => {
  deletePersistentVectorLayer(event.element);
});

async function createPointGridFromLayer() {
  const layerItem = getSelectedLayerItem(
    pointGridLayerSelect,
    currentGeoprocessLayerItems,
  );
  if (!layerItem) {
    alert("Choose a polygon reference layer first.");
    return;
  }

  const turfApi = getTurf();
  if (!turfApi?.pointGrid || !turfApi?.booleanPointInPolygon) {
    alert("Turf point grid tools are not loaded.");
    return;
  }

  const spacing = Number(pointGridSpacing.value);
  const units = pointGridUnits.value || "meters";
  if (!Number.isFinite(spacing) || spacing <= 0) {
    alert("Set a positive grid spacing.");
    return;
  }

  pointGridApply.disabled = true;
  pointGridApply.textContent = "Creating...";

  try {
    await loadGeoprocessFeatures(layerItem);
    if (!layerItem.features?.length) {
      alert("The selected layer has no polygon features.");
      return;
    }

    const format = new GeoJSON();
    const polygonGeoJsonFeatures = layerItem.features
      .filter((feature) =>
        ["Polygon", "MultiPolygon"].includes(getBaseGeometryType(feature)),
      )
      .map((feature) =>
        format.writeFeatureObject(feature, {
          featureProjection: map.getView().getProjection().getCode(),
          dataProjection: "EPSG:4326",
        }),
      );

    if (!polygonGeoJsonFeatures.length) {
      alert("The selected layer does not contain polygon features.");
      return;
    }

    const collection = turfApi.featureCollection(polygonGeoJsonFeatures);
    const grid = turfApi.pointGrid(turfApi.bbox(collection), spacing, {
      units,
    });
    const pointFeatures = [];

    grid.features.forEach((pointFeature) => {
      const inside = polygonGeoJsonFeatures.some((polygonFeature) => {
        try {
          return turfApi.booleanPointInPolygon(pointFeature, polygonFeature);
        } catch (error) {
          console.warn("Point grid containment check failed:", error);
          return false;
        }
      });
      if (!inside) return;

      pointFeature.properties = {
        ...(pointFeature.properties || {}),
        grid_id: pointFeatures.length + 1,
        source_layer: layerItem.title,
        spacing,
        units,
      };
      pointFeatures.push(
        format.readFeature(pointFeature, {
          dataProjection: "EPSG:4326",
          featureProjection: map.getView().getProjection().getCode(),
        }),
      );
    });

    if (!pointFeatures.length) {
      alert("No grid points were created inside the selected polygon layer.");
      return;
    }

    const resultLayer = createPointGridResultLayer(
      pointFeatures,
      pointGridLayerName.value.trim() || `${layerItem.title} point grid`,
      spacing,
      units,
    );
    selectedLayer = resultLayer;
    vectorLayer = resultLayer;
    source = resultLayer.getSource();
    wfsVectorLayer = resultLayer;
    wfsVectorSource = source;
    layerTitle = resultLayer.get("title");
    layerName = layerTitle;
    layerType = "Point";
    closePointGridDialog();
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not create the point grid.");
  } finally {
    pointGridApply.disabled = false;
    pointGridApply.textContent = "Create Grid";
  }
}

function showFeaturesInAttributeTable(features) {
  const tableContainer = document.getElementById("attribute-table-container");
  tableContainer.hidden = false;
  populateAttributeTable(features);
  selectedAttributeFeatures = [...features];
  document
    .querySelectorAll("#attribute-table tbody tr")
    .forEach((row) => row.classList.add("highlighted-row"));
  updateAttributeZoomButton();
  syncAttributeSelectionLayer();
}

function openIntersectionDialog() {
  prepareLayerDialog(intersectLayerA, intersectLayerB);
  geoprocessOptions.classList.remove("dropdown-show");
  intersectModal.classList.add("open");
  intersectModal.setAttribute("aria-hidden", "false");
}

function getVerticesLayerItems() {
  return getGeoprocessLayerItems().filter(
    (item) => item.sourceType === "vector",
  );
}

function getPointGridLayerItems() {
  return getGeoprocessLayerItems().filter((item) =>
    ["Polygon", "MultiPolygon"].includes(item.geometryType),
  );
}

function getPolygonGeoprocessLayerItems() {
  return getPointGridLayerItems();
}

function getCentroidLayerItems() {
  return getPolygonGeoprocessLayerItems();
}

function getPointOnFeatureLayerItems() {
  return getGeoprocessLayerItems();
}

function getGridScoreLayerItems() {
  return getGeoprocessLayerItems().filter((item) => {
    if (item.sourceType !== "vector") return false;
    const hasPointGeometry = ["Point", "MultiPoint"].includes(
      item.geometryType,
    );
    return hasPointGeometry && item.layer.get("displayInLayerSwitcher") === true;
  });
}

function openVerticesDialog() {
  currentGeoprocessLayerItems = getVerticesLayerItems();
  fillLayerSelect(verticesLayerSelect, currentGeoprocessLayerItems);
  verticesLayerName.value = "Feature vertices";
  geoprocessOptions.classList.remove("dropdown-show");
  verticesModal.classList.add("open");
  verticesModal.setAttribute("aria-hidden", "false");
}

function closeVerticesDialog() {
  verticesModal.classList.remove("open");
  verticesModal.setAttribute("aria-hidden", "true");
}

function openCentroidDialog() {
  currentGeoprocessLayerItems = getCentroidLayerItems();
  fillLayerSelect(centroidLayerSelect, currentGeoprocessLayerItems);
  centroidLayerName.value = "Polygon centroids";
  geoprocessOptions.classList.remove("dropdown-show");
  centroidModal.classList.add("open");
  centroidModal.setAttribute("aria-hidden", "false");
}

function closeCentroidDialog() {
  centroidModal.classList.remove("open");
  centroidModal.setAttribute("aria-hidden", "true");
}

function openPointOnFeatureDialog() {
  currentGeoprocessLayerItems = getPointOnFeatureLayerItems();
  fillLayerSelect(pointOnFeatureLayerSelect, currentGeoprocessLayerItems);
  pointOnFeatureLayerName.value = "Point on feature";
  geoprocessOptions.classList.remove("dropdown-show");
  pointOnFeatureModal.classList.add("open");
  pointOnFeatureModal.setAttribute("aria-hidden", "false");
}

function closePointOnFeatureDialog() {
  pointOnFeatureModal.classList.remove("open");
  pointOnFeatureModal.setAttribute("aria-hidden", "true");
}

function openPointGridDialog() {
  currentGeoprocessLayerItems = getPointGridLayerItems();
  fillLayerSelect(pointGridLayerSelect, currentGeoprocessLayerItems);
  pointGridLayerName.value = "Point grid";
  pointGridSpacing.value = "25";
  pointGridUnits.value = "meters";
  geoprocessOptions.classList.remove("dropdown-show");
  pointGridModal.classList.add("open");
  pointGridModal.setAttribute("aria-hidden", "false");
}

function closePointGridDialog() {
  pointGridModal.classList.remove("open");
  pointGridModal.setAttribute("aria-hidden", "true");
}

function openGridScoreDialog() {
  currentGridScoreLayerItems = getGridScoreLayerItems();
  fillLayerSelect(gridScoreLayerSelect, currentGridScoreLayerItems);
  gridScoreRadius.value = "500";
  gridScoreUnits.value = "meters";
  setGridScoreStatus("Ready. One Overpass request will be sent for the grid extent plus radius.");
  geoprocessOptions.classList.remove("dropdown-show");
  gridScoreModal.classList.add("open");
  gridScoreModal.setAttribute("aria-hidden", "false");
}

function closeGridScoreDialog() {
  gridScoreModal.classList.remove("open");
  gridScoreModal.setAttribute("aria-hidden", "true");
}

function setGridScoreStatus(message, type = "") {
  if (!gridScoreStatus) return;
  gridScoreStatus.textContent = message;
  gridScoreStatus.classList.toggle("is-error", type === "error");
  gridScoreStatus.classList.toggle("is-success", type === "success");
  gridScoreStatus.classList.toggle("is-loading", type === "loading");
}

function setGridScoreProcessing(isProcessing) {
  gridScorePreview.disabled = isProcessing;
  gridScoreRun.disabled = isProcessing;
  gridScoreCancel.disabled = isProcessing;
  gridScoreModalClose.disabled = isProcessing;
  gridScoreLayerSelect.disabled = isProcessing;
  gridScoreRadius.disabled = isProcessing;
  gridScoreUnits.disabled = isProcessing;
}

function getSelectedGridScoreCategories() {
  return Array.from(
    document.querySelectorAll("#gridScoreCategories input:checked"),
  ).map((input) => input.value);
}

function getGridScoreOutputMode() {
  return (
    document.querySelector('input[name="gridScoreOutput"]:checked')?.value ||
    "copy"
  );
}

function getGridScoreRequestState() {
  const layerItem = getSelectedLayerItem(
    gridScoreLayerSelect,
    currentGridScoreLayerItems,
  );
  if (!layerItem) {
    throw new Error("Choose a point grid layer first.");
  }

  const radius = Number(gridScoreRadius.value);
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new Error("Set a valid search radius.");
  }

  const selectedValues = getSelectedGridScoreCategories();
  const categories = gridScoreCategoryDefinitions.filter((category) =>
    selectedValues.includes(category.value),
  );
  if (!categories.length) {
    throw new Error("Choose at least one category.");
  }

  const radiusMeters =
    gridScoreUnits.value === "kilometers" ? radius * 1000 : radius;

  return { layerItem, radius, radiusMeters, categories };
}

function getGridScorePointLonLats(features) {
  const mapProjection = map.getView().getProjection().getCode();
  return features
    .map((feature) => {
      const geometry = feature.getGeometry?.();
      if (!geometry) return null;
      const type = geometry.getType();
      const coordinate =
        type === "Point"
          ? geometry.getCoordinates()
          : type === "MultiPoint"
            ? geometry.getCoordinates()[0]
            : null;
      if (!coordinate) return null;
      const featureProjection =
        feature.get("_featureProjection") ||
        feature.get("featureProjection") ||
        mapProjection;
      const mapCoordinate =
        featureProjection === mapProjection
          ? coordinate
          : transform(coordinate, featureProjection, mapProjection);
      return { feature, lonLat: toLonLat(mapCoordinate, mapProjection) };
    })
    .filter(Boolean);
}

function getExpandedLonLatBbox(pointLonLats, radiusMeters) {
  const lons = pointLonLats.map((item) => item.lonLat[0]);
  const lats = pointLonLats.map((item) => item.lonLat[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const avgLat = (minLat + maxLat) / 2;
  const latBuffer = radiusMeters / 111320;
  const lonBuffer =
    radiusMeters /
    (111320 * Math.max(Math.cos((avgLat * Math.PI) / 180), 0.2));

  return [
    minLat - latBuffer,
    minLon - lonBuffer,
    maxLat + latBuffer,
    maxLon + lonBuffer,
  ];
}

function getGridScoreOverpassQuery(bbox, categories) {
  const [south, west, north, east] = bbox;
  const blocks = categories
    .flatMap((category) => [category.query, ...(category.extraQueries || [])])
    .map(
      (query) =>
        `node${query}(${south},${west},${north},${east});` +
        `way${query}(${south},${west},${north},${east});` +
        `relation${query}(${south},${west},${north},${east});`,
    )
    .join("");

  return `[out:json][timeout:35];(${blocks});out center tags;`;
}

async function fetchGridScorePlaces(bbox, categories) {
  const response = await fetch("https://overpass.kumi.systems/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({
      data: getGridScoreOverpassQuery(bbox, categories),
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `Overpass stopped with HTTP ${response.status}: ${responseText.slice(0, 180)}`,
    );
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new Error(`Overpass returned unreadable data: ${error.message}`);
  }

  const seen = new Set();
  return (data.elements || [])
    .map((element) => {
      const lon = element.lon ?? element.center?.lon;
      const lat = element.lat ?? element.center?.lat;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      const id = `${element.type}.${element.id}`;
      if (seen.has(id)) return null;
      seen.add(id);
      return { id, lonLat: [lon, lat], tags: element.tags || {} };
    })
    .filter(Boolean);
}

function scoreGridPoint(originLonLat, places, categories, radiusMeters) {
  const result = {};
  let totalServices = 0;
  let weightedScore = 0;

  categories.forEach((category) => {
    const count = places.filter(
      (place) =>
        category.match(place.tags) &&
        getHaversineDistanceMeters(originLonLat, place.lonLat) <= radiusMeters,
    ).length;
    result[category.field] = count;
    totalServices += count;
    weightedScore += count * category.weight;
  });

  result.services_count = totalServices;
  result.service_score = Math.round(weightedScore * 10) / 10;
  return result;
}

function addGridScoreFieldsToLayer(layer, categories) {
  const existingSchema = layer.get("attributeSchema") || [];
  const existingNames = new Set(existingSchema.map((field) => field.name));
  const newFields = [
    ...categories.map((category) => ({
      name: category.field,
      type: "number",
    })),
    { name: "services_count", type: "number" },
    { name: "service_score", type: "number" },
    { name: "score_radius_m", type: "number" },
  ].filter((field) => !existingNames.has(field.name));

  if (newFields.length) {
    layer.set("attributeSchema", [...existingSchema, ...newFields]);
  }
}

function createScoredGridCopy(layerItem, categories, radiusMeters) {
  const sourceProjection =
    layerItem.layer.get("sourceProjection") ||
    layerItem.layer.get("featureProjection") ||
    map.getView().getProjection().getCode();
  const styleConfig = {
    strokeColor: "#7c3aed",
    fillColor: "#8b5cf6",
    strokeWidth: 2,
    pointSize: 7,
  };
  const clonedFeatures = layerItem.features.map((feature) => {
    const clone = feature.clone();
    clone.setProperties(feature.getProperties());
    clone.set("_featureProjection", sourceProjection, true);
    return clone;
  });
  const resultLayer = new VectorLayer({
    source: new VectorSource({ features: clonedFeatures }),
    title: `${layerItem.title} - Nearby Score`,
    displayInLayerSwitcher: true,
    visible: true,
    style: createVectorLayerStyle(styleConfig),
  });

  resultLayer.set("editableVector", true);
  resultLayer.set("createdVectorLayer", true);
  resultLayer.set("geoprocessLayer", true);
  resultLayer.set("pointGridLayer", true);
  resultLayer.set("gridScoreLayer", true);
  resultLayer.set("geometryType", "Point");
  resultLayer.set("styleConfig", styleConfig);
  resultLayer.set("featureProjection", sourceProjection);
  resultLayer.set("sourceProjection", sourceProjection);
  resultLayer.set(
    "attributeSchema",
    layerItem.layer.get("attributeSchema") || [],
  );
  addGridScoreFieldsToLayer(resultLayer, categories);
  resultLayer.set("scoreRadiusMeters", radiusMeters);
  resultLayer.set(
    "scoreCategories",
    categories.map((category) => category.value),
  );
  map.addLayer(resultLayer);
  ensurePersistentVectorLayerSaved(resultLayer, "gridScore");
  return resultLayer;
}

function refreshOpenAttributeTableForLayer(layer) {
  const tableContainer = document.getElementById("attribute-table-container");
  if (tableContainer?.hidden || selectedLayer2 !== layer) return;
  attributeTableFeatures = (layer.getSource?.().getFeatures?.() || []).filter(
    (feature) => feature.getGeometry?.(),
  );
  refreshAttributeTableView();
}

async function runGridScoreAnalysis({ preview = false } = {}) {
  let state;
  try {
    state = getGridScoreRequestState();
  } catch (error) {
    setGridScoreStatus(error.message, "error");
    return;
  }

  const { layerItem, radiusMeters, categories } = state;
  const outputMode = preview ? "copy" : getGridScoreOutputMode();
  setGridScoreProcessing(true);
  setGridScoreStatus("Preparing point grid features...", "loading");

  let actionLayer = null;
  try {
    await loadGeoprocessFeatures(layerItem);
    if (!layerItem.features?.length) {
      throw new Error("The selected grid layer has no point features.");
    }

    actionLayer =
      outputMode === "copy"
        ? createScoredGridCopy(layerItem, categories, radiusMeters)
        : layerItem.layer;

    const targetFeatures =
      outputMode === "copy"
        ? actionLayer.getSource().getFeatures()
        : layerItem.features;
    const featuresToScore = preview
      ? targetFeatures.slice(0, 10)
      : targetFeatures;
    const pointLonLats = getGridScorePointLonLats(featuresToScore);
    if (!pointLonLats.length) {
      throw new Error("No readable point geometry was found.");
    }

    const bbox = getExpandedLonLatBbox(pointLonLats, radiusMeters);
    const bboxText = bbox.map((value) => value.toFixed(5)).join(", ");
    setGridScoreStatus(
      `Fetching OSM services from Overpass once. BBOX: ${bboxText}`,
      "loading",
    );
    const places = await fetchGridScorePlaces(bbox, categories);
    setGridScoreStatus(
      `Overpass returned ${places.length} services. Scoring ${featuresToScore.length} grid points...`,
      "loading",
    );

    pointLonLats.forEach(({ feature, lonLat }) => {
      const score = scoreGridPoint(lonLat, places, categories, radiusMeters);
      feature.setProperties({ ...score, score_radius_m: radiusMeters });
      feature.set("_featureProjection", actionLayer.get("sourceProjection"), true);
    });

    addGridScoreFieldsToLayer(actionLayer, categories);
    actionLayer.set("gridScoreLayer", true);
    actionLayer.set("scoreRadiusMeters", radiusMeters);
    actionLayer.set(
      "scoreCategories",
      categories.map((category) => category.value),
    );
    actionLayer.changed?.();
    savePersistentVectorLayer(
      actionLayer,
      actionLayer.get("persistentLayerKind") || "gridScore",
    );
    refreshOpenAttributeTableForLayer(actionLayer);
    setGridScoreStatus(
      `${preview ? "Preview" : "Analysis"} finished. ${featuresToScore.length} points scored from ${places.length} OSM services.`,
      "success",
    );
  } catch (error) {
    console.error("Grid score analysis failed:", error);
    if (outputMode === "copy" && actionLayer) {
      map.removeLayer(actionLayer);
    }
    setGridScoreStatus(error.message, "error");
  } finally {
    setGridScoreProcessing(false);
  }
}

async function createVerticesFromLayer() {
  const layerItem = getSelectedLayerItem(
    verticesLayerSelect,
    currentGeoprocessLayerItems,
  );
  if (!layerItem) {
    alert("Choose a vector layer first.");
    return;
  }

  const turfApi = getTurf();
  if (!turfApi?.explode) {
    alert("Turf explode is not loaded.");
    return;
  }

  await loadGeoprocessFeatures(layerItem);
  if (!layerItem.features?.length) {
    alert("The selected layer has no features.");
    return;
  }

  const mapProjection = map.getView().getProjection().getCode();
  const format = new GeoJSON();
  const vertexFeatures = [];

  layerItem.features.forEach((feature, featureIndex) => {
    const geoJsonFeature = format.writeFeatureObject(feature, {
      dataProjection: mapProjection,
      featureProjection: mapProjection,
    });
    const exploded = turfApi.explode(geoJsonFeature);
    const sourceFeatureId =
      feature.getId?.() || feature.get("fid") || String(featureIndex + 1);

    exploded.features.forEach((pointFeature, vertexIndex) => {
      pointFeature.properties = {
        ...(pointFeature.properties || {}),
        source_layer: layerItem.title,
        source_feature: String(sourceFeatureId),
        vertex_index: vertexIndex + 1,
      };
      vertexFeatures.push(
        format.readFeature(pointFeature, {
          dataProjection: mapProjection,
          featureProjection: mapProjection,
        }),
      );
    });
  });

  if (!vertexFeatures.length) {
    alert("No vertices were created from this layer.");
    return;
  }

  const resultLayer = createVerticesResultLayer(
    vertexFeatures,
    verticesLayerName.value.trim() || `${layerItem.title} vertices`,
  );
  selectedLayer = resultLayer;
  vectorLayer = resultLayer;
  source = resultLayer.getSource();
  wfsVectorLayer = resultLayer;
  wfsVectorSource = source;
  layerTitle = resultLayer.get("title");
  layerName = layerTitle;
  layerType = "Point";
  closeVerticesDialog();
}

function getCentroidAttributeSchema(layerItem, features) {
  const existingSchema = layerItem.layer.get("attributeSchema") || [];
  if (existingSchema.length) return existingSchema;

  const firstFeature = features.find((feature) => feature.getProperties);
  if (!firstFeature) return [];

  return Object.keys(firstFeature.getProperties())
    .filter((key) => key !== "geometry")
    .map((key) => {
      const value = firstFeature.get(key);
      return {
        name: key,
        type: typeof value === "number" ? "number" : "text",
      };
    });
}

async function createCentroidsFromLayer() {
  const layerItem = getSelectedLayerItem(
    centroidLayerSelect,
    currentGeoprocessLayerItems,
  );
  if (!layerItem) {
    alert("Choose a polygon layer first.");
    return;
  }

  const turfApi = getTurf();
  if (!turfApi?.centroid) {
    alert("Turf centroid is not loaded.");
    return;
  }

  centroidApply.disabled = true;
  centroidApply.textContent = "Creating...";

  try {
    await loadGeoprocessFeatures(layerItem);
    const polygonFeatures = (layerItem.features || []).filter((feature) =>
      ["Polygon", "MultiPolygon"].includes(getBaseGeometryType(feature)),
    );

    if (!polygonFeatures.length) {
      alert("The selected layer does not contain polygon features.");
      return;
    }

    const mapProjection = map.getView().getProjection().getCode();
    const format = new GeoJSON();
    const centroidFeatures = polygonFeatures.map((feature, index) => {
      const polygonObject = format.writeFeatureObject(feature, {
        featureProjection: mapProjection,
        dataProjection: "EPSG:4326",
      });
      const centroidObject = turfApi.centroid(polygonObject);
      centroidObject.properties = {
        ...(polygonObject.properties || {}),
        centroid_id: index + 1,
        source_layer: layerItem.title,
      };
      const centroidFeature = format.readFeature(centroidObject, {
        dataProjection: "EPSG:4326",
        featureProjection: mapProjection,
      });
      centroidFeature.set("_featureProjection", mapProjection, true);
      return centroidFeature;
    });

    const styleConfig = {
      strokeColor: "#be123c",
      fillColor: "#e11d48",
      strokeWidth: 2,
      pointSize: 7,
    };
    const centroidSource = new VectorSource({ features: centroidFeatures });
    const centroidLayer = new VectorLayer({
      source: centroidSource,
      title: centroidLayerName.value.trim() || `${layerItem.title} centroids`,
      displayInLayerSwitcher: true,
      visible: true,
      style: createVectorLayerStyle(styleConfig),
    });

    centroidLayer.set("editableVector", true);
    centroidLayer.set("createdVectorLayer", true);
    centroidLayer.set("geoprocessLayer", true);
    centroidLayer.set("centroidLayer", true);
    centroidLayer.set("geometryType", "Point");
    centroidLayer.set("styleConfig", styleConfig);
    centroidLayer.set("featureProjection", mapProjection);
    centroidLayer.set("sourceProjection", mapProjection);
    centroidLayer.set("attributeSchema", [
      ...getCentroidAttributeSchema(layerItem, polygonFeatures),
      { name: "centroid_id", type: "number" },
      { name: "source_layer", type: "text" },
    ]);

    map.addLayer(centroidLayer);
    ensurePersistentVectorLayerSaved(centroidLayer, "centroid");

    const extent = centroidSource.getExtent();
    if (centroidFeatures.length && extent.every(Number.isFinite)) {
      map.getView().fit(extent, {
        duration: 600,
        padding: [60, 60, 60, 60],
        maxZoom: 18,
      });
    }

    closeCentroidDialog();
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not create centroid layer.");
  } finally {
    centroidApply.disabled = false;
    centroidApply.textContent = "Create Centroids";
  }
}

async function createPointsOnFeaturesFromLayer() {
  const layerItem = getSelectedLayerItem(
    pointOnFeatureLayerSelect,
    currentGeoprocessLayerItems,
  );
  if (!layerItem) {
    alert("Choose a vector layer first.");
    return;
  }

  const turfApi = getTurf();
  if (!turfApi?.pointOnFeature) {
    alert("Turf pointOnFeature is not loaded.");
    return;
  }

  pointOnFeatureApply.disabled = true;
  pointOnFeatureApply.textContent = "Creating...";

  try {
    await loadGeoprocessFeatures(layerItem);
    const sourceFeatures = (layerItem.features || []).filter((feature) =>
      feature.getGeometry?.(),
    );

    if (!sourceFeatures.length) {
      alert("The selected layer has no features.");
      return;
    }

    const mapProjection = map.getView().getProjection().getCode();
    const format = new GeoJSON();
    const pointFeatures = sourceFeatures.map((feature, index) => {
      const sourceObject = format.writeFeatureObject(feature, {
        featureProjection: mapProjection,
        dataProjection: "EPSG:4326",
      });
      const pointObject = turfApi.pointOnFeature(sourceObject);
      pointObject.properties = {
        ...(sourceObject.properties || {}),
        point_on_feature_id: index + 1,
        source_layer: layerItem.title,
      };
      const pointFeature = format.readFeature(pointObject, {
        dataProjection: "EPSG:4326",
        featureProjection: mapProjection,
      });
      pointFeature.set("_featureProjection", mapProjection, true);
      return pointFeature;
    });

    const styleConfig = {
      strokeColor: "#166534",
      fillColor: "#22c55e",
      strokeWidth: 2,
      pointSize: 7,
    };
    const pointSource = new VectorSource({ features: pointFeatures });
    const pointLayer = new VectorLayer({
      source: pointSource,
      title:
        pointOnFeatureLayerName.value.trim() ||
        `${layerItem.title} point on feature`,
      displayInLayerSwitcher: true,
      visible: true,
      style: createVectorLayerStyle(styleConfig),
    });

    pointLayer.set("editableVector", true);
    pointLayer.set("createdVectorLayer", true);
    pointLayer.set("geoprocessLayer", true);
    pointLayer.set("pointOnFeatureLayer", true);
    pointLayer.set("geometryType", "Point");
    pointLayer.set("styleConfig", styleConfig);
    pointLayer.set("featureProjection", mapProjection);
    pointLayer.set("sourceProjection", mapProjection);
    pointLayer.set("attributeSchema", [
      ...getCentroidAttributeSchema(layerItem, sourceFeatures),
      { name: "point_on_feature_id", type: "number" },
      { name: "source_layer", type: "text" },
    ]);

    map.addLayer(pointLayer);
    ensurePersistentVectorLayerSaved(pointLayer, "pointOnFeature");

    const extent = pointSource.getExtent();
    if (pointFeatures.length && extent.every(Number.isFinite)) {
      map.getView().fit(extent, {
        duration: 600,
        padding: [60, 60, 60, 60],
        maxZoom: 18,
      });
    }

    closePointOnFeatureDialog();
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not create point-on-feature layer.");
  } finally {
    pointOnFeatureApply.disabled = false;
    pointOnFeatureApply.textContent = "Create Points";
  }
}

function closeIntersectionDialog() {
  intersectModal.classList.remove("open");
  intersectModal.setAttribute("aria-hidden", "true");
}

function openIntersectGeometryDialog() {
  currentGeoprocessLayerItems = getPolygonGeoprocessLayerItems();
  fillLayerSelect(intersectGeometryInputLayer, currentGeoprocessLayerItems);
  fillLayerSelect(intersectGeometryOverlayLayer, currentGeoprocessLayerItems);
  intersectGeometryLayerName.value = "Intersection geometry";
  if (currentGeoprocessLayerItems.length > 1) {
    intersectGeometryOverlayLayer.value = "1";
  }
  geoprocessOptions.classList.remove("dropdown-show");
  intersectGeometryModal.classList.add("open");
  intersectGeometryModal.setAttribute("aria-hidden", "false");
}

function closeIntersectGeometryDialog() {
  intersectGeometryModal.classList.remove("open");
  intersectGeometryModal.setAttribute("aria-hidden", "true");
}

function openClipDifferenceDialog() {
  currentGeoprocessLayerItems = getPolygonGeoprocessLayerItems();
  fillLayerSelect(clipDifferenceInputLayer, currentGeoprocessLayerItems);
  fillLayerSelect(clipDifferenceClipLayer, currentGeoprocessLayerItems);
  clipDifferenceLayerName.value = "Clipped difference";
  if (currentGeoprocessLayerItems.length > 1) {
    clipDifferenceClipLayer.value = "1";
  }
  geoprocessOptions.classList.remove("dropdown-show");
  clipDifferenceModal.classList.add("open");
  clipDifferenceModal.setAttribute("aria-hidden", "false");
}

function closeClipDifferenceDialog() {
  clipDifferenceModal.classList.remove("open");
  clipDifferenceModal.setAttribute("aria-hidden", "true");
}

function createIntersectingOverlayFeatures(inputLayerItem, overlayLayerItem) {
  const turfApi = getTurf();
  if (!turfApi?.booleanIntersects || !turfApi?.featureCollection) {
    alert(
      "Turf intersection is not loaded. Check your internet connection and try again.",
    );
    return [];
  }

  const format = new GeoJSON();
  const mapProjection = map.getView().getProjection().getCode();
  const results = [];
  const inputGeoJsonFeatures = inputLayerItem.features.map((feature) =>
    format.writeFeatureObject(feature, {
      featureProjection: mapProjection,
      dataProjection: "EPSG:4326",
    }),
  );

  overlayLayerItem.features.forEach((overlayFeature) => {
    const overlayGeoJson = format.writeFeatureObject(overlayFeature, {
      featureProjection: mapProjection,
      dataProjection: "EPSG:4326",
    });

    const intersectsInput = inputGeoJsonFeatures.some((inputGeoJson) => {
      try {
        return turfApi.booleanIntersects(inputGeoJson, overlayGeoJson);
      } catch (error) {
        console.warn("Intersection check failed:", error);
        return false;
      }
    });

    if (intersectsInput) {
      const selectedFeature = overlayFeature.clone();
      selectedFeature.setProperties({
        ...overlayFeature.getProperties(),
        selected_from_layer: overlayLayerItem.title,
        intersects_layer: inputLayerItem.title,
        source_id: overlayFeature.getId?.() || overlayFeature.get("fid") || "",
      });
      selectedFeature.setId(
        overlayFeature.getId?.() ||
          `selected-intersection.${Date.now()}.${results.length + 1}`,
      );
      results.push(selectedFeature);
    }
  });

  return results;
}

async function applyIntersectionDialog() {
  const layerItemA = getSelectedLayerItem(
    intersectLayerA,
    currentGeoprocessLayerItems,
  );
  const layerItemB = getSelectedLayerItem(
    intersectLayerB,
    currentGeoprocessLayerItems,
  );

  if (!layerItemA || !layerItemB || layerItemA === layerItemB) {
    alert("Choose two different layers.");
    return;
  }

  intersectApply.disabled = true;
  intersectApply.textContent = "Processing...";
  let loadedLayerA;
  let loadedLayerB;
  try {
    loadedLayerA = await loadGeoprocessFeatures(layerItemA);
    loadedLayerB = await loadGeoprocessFeatures(layerItemB);
  } catch (error) {
    console.error(error);
    alert(error.message || "Failed to load selected layers.");
    intersectApply.disabled = false;
    intersectApply.textContent = "Apply";
    return;
  }

  const results = createIntersectingOverlayFeatures(loadedLayerA, loadedLayerB);
  intersectApply.disabled = false;
  intersectApply.textContent = "Apply";
  if (!results.length) {
    alert("No overlay features intersect the input layer.");
    return;
  }

  showFeaturesInAttributeTable(results);
  closeIntersectionDialog();
}

function runTurfIntersect(turfApi, inputFeature, overlayFeature) {
  try {
    return turfApi.intersect(inputFeature, overlayFeature);
  } catch (error) {
    try {
      return turfApi.intersect(
        turfApi.featureCollection([inputFeature, overlayFeature]),
      );
    } catch (collectionError) {
      console.warn("Turf intersect failed:", error, collectionError);
      return null;
    }
  }
}

function createGeometryIntersectionFeatures(inputLayerItem, overlayLayerItem) {
  const turfApi = getTurf();
  if (!turfApi?.intersect || !turfApi?.featureCollection) {
    alert("Turf intersect is not loaded.");
    return [];
  }

  const format = new GeoJSON();
  const mapProjection = map.getView().getProjection().getCode();
  const inputGeoJsonFeatures = inputLayerItem.features
    .filter((feature) =>
      ["Polygon", "MultiPolygon"].includes(getBaseGeometryType(feature)),
    )
    .map((feature) =>
      format.writeFeatureObject(feature, {
        featureProjection: mapProjection,
        dataProjection: "EPSG:4326",
      }),
    );
  const overlayGeoJsonFeatures = overlayLayerItem.features
    .filter((feature) =>
      ["Polygon", "MultiPolygon"].includes(getBaseGeometryType(feature)),
    )
    .map((feature) =>
      format.writeFeatureObject(feature, {
        featureProjection: mapProjection,
        dataProjection: "EPSG:4326",
      }),
    );

  const results = [];
  inputGeoJsonFeatures.forEach((inputFeature, inputIndex) => {
    overlayGeoJsonFeatures.forEach((overlayFeature, overlayIndex) => {
      const intersection = runTurfIntersect(
        turfApi,
        inputFeature,
        overlayFeature,
      );
      if (!intersection) return;

      intersection.properties = {
        ...(inputFeature.properties || {}),
        intersect_input_layer: inputLayerItem.title,
        intersect_overlay_layer: overlayLayerItem.title,
        input_feature_index: inputIndex + 1,
        overlay_feature_index: overlayIndex + 1,
      };

      const readFeatures = format.readFeatures(intersection, {
        dataProjection: "EPSG:4326",
        featureProjection: mapProjection,
      });
      readFeatures.forEach((feature) => {
        feature.set("_featureProjection", mapProjection, true);
        results.push(feature);
      });
    });
  });

  return results;
}

async function applyIntersectGeometryDialog() {
  const inputLayerItem = getSelectedLayerItem(
    intersectGeometryInputLayer,
    currentGeoprocessLayerItems,
  );
  const overlayLayerItem = getSelectedLayerItem(
    intersectGeometryOverlayLayer,
    currentGeoprocessLayerItems,
  );

  if (!inputLayerItem || !overlayLayerItem || inputLayerItem === overlayLayerItem) {
    alert("Choose two different polygon layers.");
    return;
  }

  intersectGeometryApply.disabled = true;
  intersectGeometryApply.textContent = "Processing...";

  try {
    await loadGeoprocessFeatures(inputLayerItem);
    await loadGeoprocessFeatures(overlayLayerItem);
    const intersectionFeatures = createGeometryIntersectionFeatures(
      inputLayerItem,
      overlayLayerItem,
    );

    if (!intersectionFeatures.length) {
      alert("No overlapping geometry was created.");
      return;
    }

    const styleConfig = {
      strokeColor: "#7c2d12",
      fillColor: "#f97316",
      strokeWidth: 2,
      pointSize: 7,
    };
    const intersectionSource = new VectorSource({
      features: intersectionFeatures,
    });
    const intersectionLayer = new VectorLayer({
      source: intersectionSource,
      title:
        intersectGeometryLayerName.value.trim() ||
        `${inputLayerItem.title} intersection`,
      displayInLayerSwitcher: true,
      visible: true,
      style: createVectorLayerStyle(styleConfig),
    });
    const mapProjection = map.getView().getProjection().getCode();
    intersectionLayer.set("editableVector", true);
    intersectionLayer.set("createdVectorLayer", true);
    intersectionLayer.set("geoprocessLayer", true);
    intersectionLayer.set("intersectGeometryLayer", true);
    intersectionLayer.set("geometryType", "Polygon");
    intersectionLayer.set("styleConfig", styleConfig);
    intersectionLayer.set("featureProjection", mapProjection);
    intersectionLayer.set("sourceProjection", mapProjection);
    intersectionLayer.set("attributeSchema", [
      ...(inputLayerItem.layer.get("attributeSchema") || []),
      { name: "intersect_input_layer", type: "text" },
      { name: "intersect_overlay_layer", type: "text" },
      { name: "input_feature_index", type: "number" },
      { name: "overlay_feature_index", type: "number" },
    ]);

    map.addLayer(intersectionLayer);
    ensurePersistentVectorLayerSaved(intersectionLayer, "intersectGeometry");

    const extent = intersectionSource.getExtent();
    if (extent.every(Number.isFinite)) {
      map.getView().fit(extent, {
        duration: 600,
        padding: [60, 60, 60, 60],
        maxZoom: 18,
      });
    }

    closeIntersectGeometryDialog();
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not create intersection geometry.");
  } finally {
    intersectGeometryApply.disabled = false;
    intersectGeometryApply.textContent = "Create Intersection";
  }
}

function runTurfDifference(turfApi, inputFeature, clipFeature) {
  try {
    return turfApi.difference(inputFeature, clipFeature);
  } catch (error) {
    try {
      return turfApi.difference(turfApi.featureCollection([inputFeature, clipFeature]));
    } catch (collectionError) {
      console.warn("Turf difference failed:", error, collectionError);
      return null;
    }
  }
}

function createDifferenceFeatures(inputLayerItem, clipLayerItem) {
  const turfApi = getTurf();
  if (!turfApi?.difference || !turfApi?.featureCollection) {
    alert("Turf difference is not loaded.");
    return [];
  }

  const format = new GeoJSON();
  const mapProjection = map.getView().getProjection().getCode();
  const clipGeoJsonFeatures = clipLayerItem.features
    .filter((feature) =>
      ["Polygon", "MultiPolygon"].includes(getBaseGeometryType(feature)),
    )
    .map((feature) =>
      format.writeFeatureObject(feature, {
        featureProjection: mapProjection,
        dataProjection: "EPSG:4326",
      }),
    );

  const outputFeatures = [];
  inputLayerItem.features
    .filter((feature) =>
      ["Polygon", "MultiPolygon"].includes(getBaseGeometryType(feature)),
    )
    .forEach((feature, featureIndex) => {
      let currentDifference = format.writeFeatureObject(feature, {
        featureProjection: mapProjection,
        dataProjection: "EPSG:4326",
      });

      clipGeoJsonFeatures.forEach((clipFeature) => {
        if (!currentDifference) return;
        currentDifference = runTurfDifference(
          turfApi,
          currentDifference,
          clipFeature,
        );
      });

      if (!currentDifference) return;
      currentDifference.properties = {
        ...(currentDifference.properties || {}),
        clipped_from_layer: inputLayerItem.title,
        clipped_by_layer: clipLayerItem.title,
        difference_id: featureIndex + 1,
      };

      const readFeatures = format.readFeatures(currentDifference, {
        dataProjection: "EPSG:4326",
        featureProjection: mapProjection,
      });
      readFeatures.forEach((differenceFeature) => {
        differenceFeature.set("_featureProjection", mapProjection, true);
        outputFeatures.push(differenceFeature);
      });
    });

  return outputFeatures;
}

async function applyClipDifferenceDialog() {
  const inputLayerItem = getSelectedLayerItem(
    clipDifferenceInputLayer,
    currentGeoprocessLayerItems,
  );
  const clipLayerItem = getSelectedLayerItem(
    clipDifferenceClipLayer,
    currentGeoprocessLayerItems,
  );

  if (!inputLayerItem || !clipLayerItem || inputLayerItem === clipLayerItem) {
    alert("Choose two different polygon layers.");
    return;
  }

  clipDifferenceApply.disabled = true;
  clipDifferenceApply.textContent = "Processing...";

  try {
    await loadGeoprocessFeatures(inputLayerItem);
    await loadGeoprocessFeatures(clipLayerItem);
    const differenceFeatures = createDifferenceFeatures(
      inputLayerItem,
      clipLayerItem,
    );

    if (!differenceFeatures.length) {
      alert("No difference features were created. The input may be fully clipped.");
      return;
    }

    const styleConfig = {
      strokeColor: "#0f766e",
      fillColor: "#14b8a6",
      strokeWidth: 2,
      pointSize: 7,
    };
    const differenceSource = new VectorSource({ features: differenceFeatures });
    const differenceLayer = new VectorLayer({
      source: differenceSource,
      title:
        clipDifferenceLayerName.value.trim() ||
        `${inputLayerItem.title} difference`,
      displayInLayerSwitcher: true,
      visible: true,
      style: createVectorLayerStyle(styleConfig),
    });
    const mapProjection = map.getView().getProjection().getCode();
    differenceLayer.set("editableVector", true);
    differenceLayer.set("createdVectorLayer", true);
    differenceLayer.set("geoprocessLayer", true);
    differenceLayer.set("clipDifferenceLayer", true);
    differenceLayer.set("geometryType", "Polygon");
    differenceLayer.set("styleConfig", styleConfig);
    differenceLayer.set("featureProjection", mapProjection);
    differenceLayer.set("sourceProjection", mapProjection);
    differenceLayer.set("attributeSchema", [
      ...(inputLayerItem.layer.get("attributeSchema") || []),
      { name: "clipped_from_layer", type: "text" },
      { name: "clipped_by_layer", type: "text" },
      { name: "difference_id", type: "number" },
    ]);

    map.addLayer(differenceLayer);
    ensurePersistentVectorLayerSaved(differenceLayer, "clipDifference");

    const extent = differenceSource.getExtent();
    if (extent.every(Number.isFinite)) {
      map.getView().fit(extent, {
        duration: 600,
        padding: [60, 60, 60, 60],
        maxZoom: 18,
      });
    }

    closeClipDifferenceDialog();
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not create clip difference.");
  } finally {
    clipDifferenceApply.disabled = false;
    clipDifferenceApply.textContent = "Create Clip";
  }
}

function openMergeLayersDialog() {
  prepareLayerDialog(mergeLayerA, mergeLayerB);
  geoprocessOptions.classList.remove("dropdown-show");
  mergeLayersModal.classList.add("open");
  mergeLayersModal.setAttribute("aria-hidden", "false");
}

function closeMergeLayersDialog() {
  mergeLayersModal.classList.remove("open");
  mergeLayersModal.setAttribute("aria-hidden", "true");
}

async function applyMergeLayersDialog() {
  const layerItemA = getSelectedLayerItem(
    mergeLayerA,
    currentGeoprocessLayerItems,
  );
  const layerItemB = getSelectedLayerItem(
    mergeLayerB,
    currentGeoprocessLayerItems,
  );

  if (!layerItemA || !layerItemB || layerItemA === layerItemB) {
    alert("Choose two different layers.");
    return;
  }

  mergeLayersApply.disabled = true;
  mergeLayersApply.textContent = "Processing...";
  let loadedLayerA;
  let loadedLayerB;
  try {
    loadedLayerA = await loadGeoprocessFeatures(layerItemA);
    loadedLayerB = await loadGeoprocessFeatures(layerItemB);
  } catch (error) {
    console.error(error);
    alert(error.message || "Failed to load selected layers.");
    mergeLayersApply.disabled = false;
    mergeLayersApply.textContent = "Merge";
    return;
  }

  mergeLayersApply.disabled = false;
  mergeLayersApply.textContent = "Merge";

  if (loadedLayerA.geometryType !== loadedLayerB.geometryType) {
    alert("The two layers must have the same geometry type.");
    return;
  }

  const mergedFeatures = [
    ...loadedLayerA.features,
    ...loadedLayerB.features,
  ].map((feature, index) => {
    const clone = feature.clone();
    clone.setProperties(feature.getProperties());
    clone.setId(`merged-layer.${Date.now()}.${index + 1}`);
    return clone;
  });

  if (!mergedFeatures.length) {
    alert("No features were found to merge.");
    return;
  }

  createEditableResultLayer(
    mergedFeatures,
    mergeLayersName.value.trim() || "Merged layer",
  );
  closeMergeLayersDialog();
}

function positionGeoprocessDropdown() {
  const anchorRect = btnGeoprocess.getBoundingClientRect();
  geoprocessOptions.style.left = `${anchorRect.left}px`;
  geoprocessOptions.style.top = `${anchorRect.bottom + 6}px`;
}

function toggleGeoprocessDropdown(event) {
  event.stopPropagation();
  positionGeoprocessDropdown();
  geoprocessOptions.classList.toggle("dropdown-show");
}

btnGeoprocess.addEventListener("click", toggleGeoprocessDropdown);
btnGeoprocessDropdown.addEventListener("click", toggleGeoprocessDropdown);
window.addEventListener("resize", () => {
  if (geoprocessOptions.classList.contains("dropdown-show")) {
    positionGeoprocessDropdown();
  }
});
document.addEventListener("click", (event) => {
  if (
    !geoprocessOptions.contains(event.target) &&
    !btnGeoprocess.contains(event.target) &&
    !btnGeoprocessDropdown.contains(event.target)
  ) {
    geoprocessOptions.classList.remove("dropdown-show");
  }
});
btnIntersectLayers.addEventListener("click", openIntersectionDialog);
btnClipDifference.addEventListener("click", openClipDifferenceDialog);
btnMergeLayers.addEventListener("click", openMergeLayersDialog);
btnVerticesLayer.addEventListener("click", openVerticesDialog);
btnCentroidLayer.addEventListener("click", openCentroidDialog);
btnPointOnFeatureLayer.addEventListener("click", openPointOnFeatureDialog);
btnPointGrid.addEventListener("click", openPointGridDialog);
btnGridScore.addEventListener("click", openGridScoreDialog);
intersectModalClose.addEventListener("click", closeIntersectionDialog);
intersectCancel.addEventListener("click", closeIntersectionDialog);
intersectApply.addEventListener("click", applyIntersectionDialog);
btnIntersectGeometry.addEventListener("click", openIntersectGeometryDialog);
intersectGeometryModalClose.addEventListener(
  "click",
  closeIntersectGeometryDialog,
);
intersectGeometryCancel.addEventListener("click", closeIntersectGeometryDialog);
intersectGeometryApply.addEventListener("click", applyIntersectGeometryDialog);
clipDifferenceModalClose.addEventListener("click", closeClipDifferenceDialog);
clipDifferenceCancel.addEventListener("click", closeClipDifferenceDialog);
clipDifferenceApply.addEventListener("click", applyClipDifferenceDialog);
mergeLayersModalClose.addEventListener("click", closeMergeLayersDialog);
mergeLayersCancel.addEventListener("click", closeMergeLayersDialog);
mergeLayersApply.addEventListener("click", applyMergeLayersDialog);
verticesModalClose.addEventListener("click", closeVerticesDialog);
verticesCancel.addEventListener("click", closeVerticesDialog);
verticesApply.addEventListener("click", createVerticesFromLayer);
centroidModalClose.addEventListener("click", closeCentroidDialog);
centroidCancel.addEventListener("click", closeCentroidDialog);
centroidApply.addEventListener("click", createCentroidsFromLayer);
pointOnFeatureModalClose.addEventListener("click", closePointOnFeatureDialog);
pointOnFeatureCancel.addEventListener("click", closePointOnFeatureDialog);
pointOnFeatureApply.addEventListener("click", createPointsOnFeaturesFromLayer);
pointGridModalClose.addEventListener("click", closePointGridDialog);
pointGridCancel.addEventListener("click", closePointGridDialog);
pointGridApply.addEventListener("click", createPointGridFromLayer);
gridScoreModalClose.addEventListener("click", closeGridScoreDialog);
gridScoreCancel.addEventListener("click", closeGridScoreDialog);
gridScorePreview.addEventListener("click", () =>
  runGridScoreAnalysis({ preview: true }),
);
gridScoreRun.addEventListener("click", () =>
  runGridScoreAnalysis({ preview: false }),
);
intersectModal.addEventListener("click", (event) => {
  if (event.target === intersectModal) closeIntersectionDialog();
});
intersectGeometryModal.addEventListener("click", (event) => {
  if (event.target === intersectGeometryModal) closeIntersectGeometryDialog();
});
clipDifferenceModal.addEventListener("click", (event) => {
  if (event.target === clipDifferenceModal) closeClipDifferenceDialog();
});
mergeLayersModal.addEventListener("click", (event) => {
  if (event.target === mergeLayersModal) closeMergeLayersDialog();
});
verticesModal.addEventListener("click", (event) => {
  if (event.target === verticesModal) closeVerticesDialog();
});
centroidModal.addEventListener("click", (event) => {
  if (event.target === centroidModal) closeCentroidDialog();
});
pointOnFeatureModal.addEventListener("click", (event) => {
  if (event.target === pointOnFeatureModal) closePointOnFeatureDialog();
});
pointGridModal.addEventListener("click", (event) => {
  if (event.target === pointGridModal) closePointGridDialog();
});
gridScoreModal.addEventListener("click", (event) => {
  if (event.target === gridScoreModal) closeGridScoreDialog();
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
          }),
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
          }),
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
const attributeVisibleOnly = document.getElementById("attribute-visible-only");
const attributeRecordCount = document.getElementById("attribute-record-count");
let attributeLayerItems = [];

// Listen for layer selection changes
selectLayers.addEventListener("change", (event) => {
  const layerIndex = event.target.value;
  if (layerIndex) {
    getFields2(layerIndex); // Populate attributes based on selected layer
  }
});

function getLayers2() {
  attributeLayerSelect.innerHTML = "";
  attributeLayerItems = [];
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer...";
  attributeLayerSelect.appendChild(defaultOption);

  function addLayerOption(layer) {
    const source = layer.getSource?.();
    const params = source?.getParams?.();
    const typeName = params?.LAYERS || params?.layers;
    const isVectorLayer = layer instanceof VectorLayer;
    const displayInSwitcher = layer.get("displayInLayerSwitcher") === true;

    if (!typeName && !(isVectorLayer && displayInSwitcher)) {
      return;
    }

    const item = {
      layer,
      source,
      title: layer.get("title") || typeName || "Vector layer",
      typeName,
      sourceType: typeName ? "wfs" : "vector",
    };
    const option = document.createElement("option");
    option.value = String(attributeLayerItems.length);
    option.text =
      item.sourceType === "vector" ? `${item.title} (Vector)` : item.title;
    attributeLayerItems.push(item);
    attributeLayerSelect.appendChild(option);
  }

  function visitLayer(layer) {
    if (layer instanceof LayerGroup) {
      layer.getLayers().forEach(visitLayer);
      return;
    }

    addLayerOption(layer);
  }

  map.getLayers().forEach(visitLayer);
}

let layerIndex, selectedLayer2, tableLayerSelected;
let attributeTableFeatures = [];

function getVisibleAttributeFeatures(features) {
  const view = map.getView();
  const size = map.getSize();
  if (!size) return features;

  const extent = view.calculateExtent(size);
  const mapProjection = view.getProjection().getCode();
  return features.filter((feature) => {
    const geometry = getFeatureGeometryInMapProjection(feature, mapProjection);
    return geometry?.intersectsExtent(extent);
  });
}

function refreshAttributeTableView() {
  const previousSelectionKeys = new Set(
    selectedAttributeFeatures.map((feature) => getAttributeFeatureKey(feature)),
  );
  const featuresToShow = attributeVisibleOnly.checked
    ? getVisibleAttributeFeatures(attributeTableFeatures)
    : attributeTableFeatures;
  populateAttributeTable(featuresToShow);
  if (previousSelectionKeys.size) {
    restoreAttributeSelection(featuresToShow, previousSelectionKeys);
  }
  attributeRecordCount.textContent = `${featuresToShow.length} / ${attributeTableFeatures.length} records`;
}

map.on("moveend", () => {
  const tableContainer = document.getElementById("attribute-table-container");
  if (
    tableContainer.hidden ||
    !attributeVisibleOnly.checked ||
    !attributeTableFeatures.length
  ) {
    return;
  }

  refreshAttributeTableView();
});

document
  .getElementById("attributeTable")
  .addEventListener("click", async () => {
    const tableContainer = document.getElementById("attribute-table-container");
    tableContainer.hidden = !tableContainer.hidden;
    getLayers2();
  });

document
  .getElementById("close-attribute-table")
  .addEventListener("click", () => {
    const tableContainer = document.getElementById("attribute-table-container");
    tableContainer.hidden = true;
    clearAttributeSelection();
  });

attributeLayerSelect.addEventListener("change", (event) => {
  layerIndex = event.target.value;
  const selectedItem = attributeLayerItems[Number(layerIndex)];
  selectedLayer2 = selectedItem?.layer || null;
  getSelectedLayerTable(selectedItem);
});

attributeVisibleOnly.addEventListener("change", refreshAttributeTableView);

function getVectorAttributeFeatures(layerItem) {
  const layerProjection =
    layerItem.layer.get("featureProjection") ||
    layerItem.layer.get("sourceProjection") ||
    map.getView().getProjection().getCode();
  return (layerItem.source?.getFeatures?.() || [])
    .filter((feature) => feature.getGeometry?.())
    .map((feature) => {
      feature.set("_featureProjection", layerProjection, true);
      return feature;
    });
}

function setAttributeTableEditAvailability(canEditWithWfs) {
  const editButton = document.getElementById("edit-btn");
  const saveButton = document.getElementById("save-btn");
  if (editButton) editButton.disabled = !canEditWithWfs;
  if (saveButton) saveButton.disabled = true;
}

function getSelectedLayerTable(layerItem) {
  if (!layerItem) {
    tableLayerSelected = "";
    attributeTableFeatures = [];
    populateAttributeTable([]);
    attributeRecordCount.textContent = "0 / 0 records";
    setAttributeTableEditAvailability(false);
    return;
  }

  if (layerItem.sourceType === "vector") {
    tableLayerSelected = "";
    attributeTableFeatures = getVectorAttributeFeatures(layerItem);
    featuresInView = getVisibleAttributeFeatures(attributeTableFeatures);
    refreshAttributeTableView();
    setAttributeTableEditAvailability(false);
    return;
  }

  tableLayerSelected = layerItem.typeName;
  setAttributeTableEditAvailability(true);

  if (!tableLayerSelected) {
    console.warn("Selected layer does not expose WMS LAYERS params.");
    attributeTableFeatures = [];
    populateAttributeTable([]);
    attributeRecordCount.textContent = "0 / 0 records";
    setAttributeTableEditAvailability(false);
    return;
  }

  const [selectedWorkspace = workspaceName] = tableLayerSelected.split(":");
  const tableFeatureProjection = map.getView().getProjection().getCode();
  const layerWFS = getWfsGetFeatureUrl({
    workspace: selectedWorkspace,
    typeName: tableLayerSelected,
    srsName: tableFeatureProjection,
  });

  async function fetchData() {
    try {
      const response = await fetch(layerWFS);

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the JSON data
      const data = await response.json();
      featuresInView = [];
      attributeTableFeatures = [];
      if (data.features && data.features.length > 0) {
        const features = data.features.map((feature) => {
          const olFeature = new GeoJSON().readFeature(feature, {
            dataProjection: tableFeatureProjection,
            featureProjection: tableFeatureProjection,
          });
          olFeature.set("_featureProjection", tableFeatureProjection, true);
          return olFeature;
        });

        const vectorSource2 = new VectorSource({
          features: features,
        });
        ft = vectorSource2.getFeatures();
        attributeTableFeatures = ft;
        featuresInView = getVisibleAttributeFeatures(attributeTableFeatures);
      }

      refreshAttributeTableView();

      // You can now work with the data object
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  // Call the fetchData function
  fetchData();
}

let highlightedRow = null;
let selectedAttributeFeatures = [];

function updateAttributeZoomButton() {
  const hasSelection = selectedAttributeFeatures.length > 0;
  document.getElementById("zoom-btn").disabled = !hasSelection;
  document.getElementById("highlight-selected-btn").disabled = !hasSelection;
}

function getAttributeFeatureKey(feature) {
  return (
    feature.getId?.() ||
    feature.get("fid") ||
    feature.get("id") ||
    feature.get("gid") ||
    JSON.stringify(feature.getProperties())
  );
}

function restoreAttributeSelection(visibleFeatures, selectionKeys) {
  selectedAttributeFeatures = visibleFeatures.filter((feature) =>
    selectionKeys.has(getAttributeFeatureKey(feature)),
  );

  const rows = document.querySelectorAll("#attribute-table tbody tr");
  visibleFeatures.forEach((feature, index) => {
    if (selectionKeys.has(getAttributeFeatureKey(feature))) {
      rows[index]?.classList.add("highlighted-row");
    }
  });

  updateAttributeZoomButton();
  syncAttributeSelectionLayer();
}

function syncAttributeSelectionLayer() {
  attributeSelectionSource.clear();
  const mapProjection = map.getView().getProjection().getCode();
  selectedAttributeFeatures.forEach((feature) => {
    const clone = feature.clone();
    clone.setProperties(feature.getProperties());
    const featureProjection =
      feature.get("_featureProjection") || mapProjection;
    if (featureProjection !== mapProjection) {
      clone.getGeometry()?.transform(featureProjection, mapProjection);
      clone.set("_featureProjection", mapProjection, true);
    }
    attributeSelectionSource.addFeature(clone);
  });
}

function clearAttributeSelection() {
  selectedAttributeFeatures = [];
  highlightedRow = null;
  document
    .querySelectorAll("#attribute-table tbody tr.highlighted-row")
    .forEach((row) => row.classList.remove("highlighted-row"));
  attributeSelectionSource.clear();
  updateAttributeZoomButton();
}

function selectSingleAttributeFeature(row, feature) {
  clearAttributeSelection();
  selectedAttributeFeatures = [feature];
  row.classList.add("highlighted-row");
  highlightedRow = row;
  updateAttributeZoomButton();
}

function toggleAttributeFeatureSelection(row, feature, additive = false) {
  if (!additive) {
    selectSingleAttributeFeature(row, feature);
    return;
  }

  const existingIndex = selectedAttributeFeatures.indexOf(feature);

  if (existingIndex >= 0) {
    selectedAttributeFeatures.splice(existingIndex, 1);
    row.classList.remove("highlighted-row");
  } else {
    selectedAttributeFeatures.push(feature);
    row.classList.add("highlighted-row");
    highlightedRow = row;
  }

  updateAttributeZoomButton();
}

function zoomToSelectedAttributeFeatures() {
  if (!selectedAttributeFeatures.length) return;

  zoomToFeatureExtent(selectedAttributeFeatures);
}

document
  .getElementById("zoom-btn")
  .addEventListener("click", zoomToSelectedAttributeFeatures);

document
  .getElementById("highlight-selected-btn")
  .addEventListener("click", syncAttributeSelectionLayer);

function populateAttributeTable(features) {
  const tableHeaders = document.getElementById("table-headers");
  const tableBody = document.getElementById("table-body");
  clearAttributeSelection();

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
    (header) => header !== "geometry",
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

  // Populate table rows with feature attributes
  features.forEach((feature) => {
    const row = tableBody.insertRow();
    headers.forEach((header) => {
      const cell = row.insertCell();
      cell.textContent = feature.get(header) || "";
    });

    row.addEventListener("click", (event) =>
      toggleAttributeFeatureSelection(row, feature, event.shiftKey),
    );
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
  const tableEditProjection =
    map?.getView?.().getProjection?.().getCode?.() || "EPSG:3857";
  const wfsUrl = getWfsGetFeatureUrl({
    workspace,
    typeName: tableLayerSelected,
    version: "1.0.0",
    maxFeatures: 500,
    srsName: tableEditProjection,
  });

  // Load features (manual fetch avoids OL loader event quirks)
  fetch(wfsUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
      return res.json();
    })
    .then((json) => {
      const fmt = new GeoJSON();
      loadedFeatures = fmt.readFeatures(json, {
        dataProjection: tableEditProjection,
        featureProjection: tableEditProjection,
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
  btnSelect.classList.remove("active");
  addNewFeature.classList.remove("active");
  deleteFeature.classList.remove("active");
  const [workspace, layerName] = tableLayerSelected.split(":");

  // 1) Load features fresh from WFS (GeoJSON)
  const wfsUrl = getWfsGetFeatureUrl({
    workspace,
    typeName: tableLayerSelected,
    version: "1.0.0",
    maxFeatures: 1000,
    srsName: map?.getView?.().getProjection?.().getCode?.() || "EPSG:3857",
  });

  fetch(wfsUrl)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(async (json) => {
      const fmt = new GeoJSON();
      const mapSrs =
        map?.getView?.().getProjection?.().getCode?.() || "EPSG:3857";
      const features = fmt.readFeatures(json, {
        dataProjection: mapSrs,
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
        document.querySelectorAll("#attribute-table thead th"),
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

      const layerNativeProjection =
        await getLayerNativeProjection(tableLayerSelected);
      const transactionUpdates = cloneFeaturesForProjection(
        updatedFeatures,
        mapSrs,
        layerNativeProjection,
      );
      transactionUpdates.forEach((feature) => {
        feature.setGeometryName(GEOM_NAME);
      });

      // 4) Write WFS-T Update
      const wfs = new WFS();
      const node = wfs.writeTransaction(
        [], // inserts
        transactionUpdates, // updates
        [], // deletes
        {
          featureNS: `${workspace}@org`,
          featurePrefix: workspace,
          featureType: layerName,
          srsName: layerNativeProjection,
        },
      );

      const xml = new XMLSerializer().serializeToString(node);

      return fetch(getGeoServerProxyOwsUrl(workspace), {
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

function getFeatureGeometryInMapProjection(feature, mapProjection) {
  const geometry = feature.getGeometry();
  if (!geometry) return null;

  const featureProjection = feature.get("_featureProjection") || mapProjection;
  if (featureProjection === mapProjection) {
    return geometry;
  }

  return geometry.clone().transform(featureProjection, mapProjection);
}

// Function to zoom to a feature's extent
function zoomToFeatureExtent(featureOrFeatures) {
  const features = Array.isArray(featureOrFeatures)
    ? featureOrFeatures
    : [featureOrFeatures];
  const mapProjection = map.getView().getProjection().getCode();
  const extent = features.reduce((combinedExtent, feature) => {
    const geometry = getFeatureGeometryInMapProjection(feature, mapProjection);
    if (!geometry) return combinedExtent;

    const featureExtent = geometry.getExtent();
    if (!combinedExtent) return [...featureExtent];

    combinedExtent[0] = Math.min(combinedExtent[0], featureExtent[0]);
    combinedExtent[1] = Math.min(combinedExtent[1], featureExtent[1]);
    combinedExtent[2] = Math.max(combinedExtent[2], featureExtent[2]);
    combinedExtent[3] = Math.max(combinedExtent[3], featureExtent[3]);
    return combinedExtent;
  }, null);

  if (!extent) return;

  map.getView().fit(extent, { duration: 1000, padding: [50, 50, 50, 50] });
}

// Apply filter function to filter rows based on input values
function applyFilter(features) {
  const tableBody = document.getElementById("table-body");
  const filterInputs = Array.from(
    document.querySelectorAll("#table-headers input"),
  );
  const headers = filterInputs.map((input) =>
    input.placeholder.replace("Filter ", ""),
  );

  // Clear existing table body content
  tableBody.innerHTML = "";
  clearAttributeSelection();

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
    row.addEventListener("click", (event) => {
      toggleAttributeFeatureSelection(row, feature, event.shiftKey);
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
    },
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
    document.querySelectorAll("#table-headers th"),
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
      `Comparing feature "${featureValue}" with table cell "${cellValue}"`,
    ); // Debug: Log comparison

    const match = featureValue === cellValue;

    console.log("Row match result:", match); // Log whether the row was matched

    // Apply the highlight class if there's a match
    if (match) {
      const feature = featuresInView?.[rows.indexOf(row)];
      if (feature && !selectedAttributeFeatures.includes(feature)) {
        selectedAttributeFeatures.push(feature);
      }
      row.classList.add("highlighted-row");
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      highlightedRow = row;
      updateAttributeZoomButton();

      // Exit the loop once a match is found
      return;
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
  "https://geoportal.asig.gov.al/service/adresar/wms?request=GetCapabilities",
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
  "https://geoportal.asig.gov.al/service/wmts?request=getCapabilities",
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

// addArcgisTileLayer(map, mapServerUrl, ["states", "Detailed Counties"]);

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
let loadedExternalService = null;

const externalServiceTypeInput = document.getElementById("externalServiceType");
const externalServiceUrlInput = document.getElementById("externalServiceUrl");
const externalServiceLayerNameInput = document.getElementById(
  "externalServiceLayerName",
);
const externalWmsLayerNameInput = document.getElementById(
  "externalWmsLayerName",
);
const externalServiceTerrainInput = document.getElementById(
  "externalServiceTerrain",
);
const externalServiceForm = document.getElementById("externalServiceForm");
const externalServiceStatus = document.getElementById("externalServiceStatus");
const externalServiceLayers = document.getElementById("externalServiceLayers");
const addExternalServiceLayerButton = document.getElementById(
  "addExternalServiceLayer",
);
const externalCesiumImageryLayerByOlLayer = new WeakMap();

const externalArcgisVectorStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: "rgba(0, 166, 200, 0.85)" }),
    stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
  }),
  stroke: new Stroke({ color: "rgba(0, 166, 200, 0.9)", width: 2 }),
  fill: new Fill({ color: "rgba(0, 166, 200, 0.18)" }),
});

const verticesResultStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: "rgba(239, 68, 68, 0.9)" }),
    stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
  }),
});

function setExternalServiceStatus(message, isError = false) {
  externalServiceStatus.textContent = message || "";
  externalServiceStatus.style.color = isError ? "#b91c1c" : "#64748b";
}

function normalizeExternalServiceUrl(url) {
  return url
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function getArcgisServiceParts(url) {
  const match = normalizeExternalServiceUrl(url).match(
    /\/(FeatureServer|MapServer|ImageServer)(?:\/(\d+))?$/i,
  );
  if (!match) return null;

  return {
    serverType: match[1],
    layerId: match[2] ?? null,
    serviceUrl: normalizeExternalServiceUrl(url),
    rootUrl: normalizeExternalServiceUrl(url).replace(/\/\d+$/, ""),
  };
}

function inferExternalServiceType(url, selectedType) {
  const parts = getArcgisServiceParts(url);
  if (!parts) return selectedType;

  const typeName = parts.serverType.toLowerCase();
  if (typeName === "featureserver") return "arcgis-feature";
  if (typeName === "mapserver") return "arcgis-map";
  if (typeName === "imageserver") return "arcgis-image";
  return selectedType;
}

async function fetchArcgisServiceMetadata(serviceUrl) {
  const response = await fetch(
    `${normalizeExternalServiceUrl(serviceUrl)}?f=pjson`,
  );
  if (!response.ok) {
    throw new Error(`ArcGIS metadata failed with status ${response.status}`);
  }

  const metadata = await response.json();
  if (metadata.error) {
    throw new Error(metadata.error.message || "ArcGIS returned an error.");
  }
  return metadata;
}

function getExternalServicesGroup() {
  const existing = map
    .getLayers()
    .getArray()
    .find(
      (layer) =>
        layer instanceof LayerGroup &&
        layer.get("title") === "External Services",
    );

  if (existing) return existing;

  const group = new LayerGroup({
    title: "External Services",
    displayInLayerSwitcher: true,
    layers: [],
  });
  map.addLayer(group);
  return group;
}

function addExternalLayerToMap(layer) {
  layer.set("displayInLayerSwitcher", true);
  getExternalServicesGroup().getLayers().push(layer);
}

function canExternalServiceDrapeOnTerrain(type) {
  return ["wms", "wmts", "arcgis-map", "arcgis-image"].includes(type);
}

function getExternalTerrainDrapeEnabled(type) {
  return Boolean(
    externalServiceTerrainInput?.checked &&
      canExternalServiceDrapeOnTerrain(type),
  );
}

function setExternalTerrainCheckboxState() {
  if (!externalServiceTerrainInput || !externalServiceTypeInput) return;
  const canDrape = canExternalServiceDrapeOnTerrain(externalServiceTypeInput.value);
  externalServiceTerrainInput.disabled = !canDrape;
  externalServiceTerrainInput.closest("label")?.classList.toggle(
    "text-muted",
    !canDrape,
  );
  if (!canDrape) externalServiceTerrainInput.checked = false;
}

async function createCesiumProviderForExternalLayer(layer) {
  const viewer = initCesiumViewer();
  const Cesium = window.Cesium;
  if (!viewer || !Cesium || !layer) return null;

  const serviceType = layer.get("externalServiceType");
  if (serviceType === "wms") {
    return new Cesium.WebMapServiceImageryProvider({
      url: layer.get("externalServiceUrl"),
      layers: layer.get("externalWmsLayerName"),
      parameters: {
        service: "WMS",
        transparent: true,
        format: "image/png",
        tiled: true,
        styles: "",
      },
      credit: layer.get("title") || "External WMS",
    });
  }

  if (serviceType === "wmts" && Cesium.WebMapTileServiceImageryProvider) {
    return new Cesium.WebMapTileServiceImageryProvider({
      url: layer.get("externalServiceUrl"),
      layer: layer.get("wmtsLayerIdentifier"),
      style: layer.get("wmtsStyle") || "",
      format: layer.get("wmtsFormat") || "image/png",
      tileMatrixSetID: layer.get("wmtsMatrixSet"),
      maximumLevel: 22,
      credit: layer.get("title") || "External WMTS",
    });
  }

  if (serviceType === "arcgis-image" && Cesium.UrlTemplateImageryProvider) {
    const imageUrl =
      layer.get("arcgisRootUrl") ||
      layer.get("arcgisServiceUrl") ||
      layer.get("externalServiceUrl");
    const separator = imageUrl.includes("?") ? "&" : "?";
    return new Cesium.UrlTemplateImageryProvider({
      url:
        `${imageUrl}/exportImage${separator}` +
        "f=image&format=png32&transparent=true" +
        "&bbox={westProjected},{southProjected},{eastProjected},{northProjected}" +
        "&bboxSR=3857&imageSR=3857&size=256,256",
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      tileWidth: 256,
      tileHeight: 256,
      credit: layer.get("title") || "External ArcGIS Image Service",
    });
  }

  if (serviceType === "arcgis-map" && Cesium.ArcGisMapServerImageryProvider) {
    const arcgisUrl =
      layer.get("arcgisRootUrl") ||
      layer.get("arcgisServiceUrl") ||
      layer.get("externalServiceUrl");
    const providerOptions = {
      layers: layer.get("arcgisLayerId") || undefined,
      enablePickFeatures: false,
      credit: layer.get("title") || "External ArcGIS",
    };
    if (Cesium.ArcGisMapServerImageryProvider.fromUrl) {
      return Cesium.ArcGisMapServerImageryProvider.fromUrl(
        arcgisUrl,
        providerOptions,
      );
    }
    return new Cesium.ArcGisMapServerImageryProvider({
      url: arcgisUrl,
      ...providerOptions,
    });
  }

  return null;
}

async function addExternalLayerToCesiumTerrain(layer) {
  if (!layer || externalCesiumImageryLayerByOlLayer.has(layer)) return;

  const provider = await createCesiumProviderForExternalLayer(layer);
  if (!provider || !cesiumViewer) return;

  const imageryLayer = cesiumViewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.show = layer.getVisible?.() !== false;
  imageryLayer.alpha = 0.9;
  externalCesiumImageryLayerByOlLayer.set(layer, imageryLayer);
  layer.on?.("change:visible", () => {
    const cesiumLayer = externalCesiumImageryLayerByOlLayer.get(layer);
    if (cesiumLayer) cesiumLayer.show = layer.getVisible();
  });
  setMapMode3d(true);
}

async function addExternalLayerToTerrainIfRequested(layer, type) {
  if (!getExternalTerrainDrapeEnabled(type)) return;
  await addExternalLayerToCesiumTerrain(layer);
}

function getServiceLayerTitle(metadata, fallbackUrl, customName = "") {
  return (
    customName.trim() ||
    metadata?.name ||
    metadata?.mapName ||
    metadata?.serviceDescription ||
    normalizeExternalServiceUrl(fallbackUrl).split("/").at(-2) ||
    "External service"
  );
}

function getCurrentMapProjectionCode() {
  return map.getView().getProjection().getCode();
}

async function addArcgisFeatureLayer(serviceUrl, titleOverride = "") {
  const parts = getArcgisServiceParts(serviceUrl);
  const layerUrl = parts?.serviceUrl || normalizeExternalServiceUrl(serviceUrl);
  const metadata = await fetchArcgisServiceMetadata(layerUrl);
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    returnGeometry: "true",
    f: "json",
    resultRecordCount: "2000",
    outSR: "4326",
  });
  const response = await fetch(`${layerUrl}/query?${params}`);
  if (!response.ok) {
    throw new Error(
      `ArcGIS feature query failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(
      data.error.message || "ArcGIS feature query returned an error.",
    );
  }

  const featureProjection = getCurrentMapProjectionCode();
  const features = new EsriJSON().readFeatures(data, {
    dataProjection: "EPSG:4326",
    featureProjection,
  });
  features.forEach((feature) =>
    feature.set("_featureProjection", featureProjection),
  );

  const source = new VectorSource({ features });
  const layer = new VectorLayer({
    title: getServiceLayerTitle(metadata, layerUrl, titleOverride),
    source,
    style: externalArcgisVectorStyle,
    displayInLayerSwitcher: true,
  });
  layer.set("editableVector", true);
  layer.set("externalServiceType", "arcgis-feature");
  layer.set("arcgisFeatureServiceUrl", layerUrl);
  layer.set("arcgisMetadata", metadata);
  layer.set("featureProjection", featureProjection);
  addExternalLayerToMap(layer);

  const extent = source.getExtent();
  if (features.length && extent.every(Number.isFinite)) {
    map.getView().fit(extent, {
      duration: 600,
      padding: [50, 50, 50, 50],
      maxZoom: 18,
    });
  }

  return layer;
}

async function addArcgisMapLayer(serviceUrl, titleOverride = "") {
  const parts = getArcgisServiceParts(serviceUrl);
  const rootUrl = parts?.rootUrl || normalizeExternalServiceUrl(serviceUrl);
  const metadataUrl = parts?.serviceUrl || rootUrl;
  const metadata = await fetchArcgisServiceMetadata(metadataUrl);
  const params = {
    FORMAT: "png32",
    TRANSPARENT: true,
  };
  if (parts?.layerId) {
    params.LAYERS = `show:${parts.layerId}`;
  }

  const layer = new TileLayer({
    title: getServiceLayerTitle(metadata, metadataUrl, titleOverride),
    visible: true,
    source: new TileArcGISRest({
      url: rootUrl,
      params,
      crossOrigin: "anonymous",
    }),
    displayInLayerSwitcher: true,
  });
  layer.set("externalServiceType", "arcgis-map");
  layer.set("arcgisServiceUrl", metadataUrl);
  layer.set("arcgisRootUrl", rootUrl);
  layer.set("arcgisLayerId", parts?.layerId || "");
  layer.set("arcgisMetadata", metadata);
  addExternalLayerToMap(layer);
  return layer;
}

async function addArcgisImageLayer(serviceUrl, titleOverride = "") {
  const imageUrl = normalizeExternalServiceUrl(serviceUrl);
  const metadata = await fetchArcgisServiceMetadata(imageUrl);
  const layer = new ImageLayer({
    title: getServiceLayerTitle(metadata, imageUrl, titleOverride),
    visible: true,
    source: new ImageArcGISRest({
      url: imageUrl,
      params: {
        FORMAT: "png32",
        TRANSPARENT: true,
      },
      ratio: 1,
      crossOrigin: "anonymous",
    }),
    displayInLayerSwitcher: true,
  });
  layer.set("externalServiceType", "arcgis-image");
  layer.set("arcgisServiceUrl", imageUrl);
  layer.set("arcgisRootUrl", imageUrl);
  layer.set("arcgisMetadata", metadata);
  addExternalLayerToMap(layer);
  return layer;
}

function addExternalWmsLayer(serviceUrl, layerName, titleOverride = "") {
  const layer = new TileLayer({
    title: titleOverride.trim() || layerName,
    visible: true,
    source: new TileWMS({
      url: serviceUrl.trim(),
      params: {
        LAYERS: layerName.trim(),
        TILED: true,
        FORMAT: "image/png",
        TRANSPARENT: true,
      },
      serverType: "geoserver",
      crossOrigin: "anonymous",
    }),
    displayInLayerSwitcher: true,
  });
  layer.set("externalServiceType", "wms");
  layer.set("externalServiceUrl", serviceUrl.trim());
  layer.set("externalWmsLayerName", layerName.trim());
  addExternalLayerToMap(layer);
  return layer;
}

function getWmtsCapabilitiesUrl(serviceUrl) {
  const trimmedUrl = serviceUrl.trim();
  if (/request=getcapabilities/i.test(trimmedUrl)) return trimmedUrl;
  const separator = trimmedUrl.includes("?") ? "&" : "?";
  return `${trimmedUrl}${separator}SERVICE=WMTS&REQUEST=GetCapabilities`;
}

async function fetchWmtsMetadata(serviceUrl) {
  const response = await fetch(getWmtsCapabilitiesUrl(serviceUrl));
  if (!response.ok) {
    throw new Error(`WMTS capabilities failed with status ${response.status}`);
  }
  const text = await response.text();
  return new WMTSCapabilities().read(text);
}

function getWmtsLayerTitle(layer) {
  return layer?.Title || layer?.Identifier || layer?.Abstract || "WMTS layer";
}

function getWmtsMatrixSet(layer, metadata) {
  const links = layer?.TileMatrixSetLink || [];
  const matrixSets = metadata?.Contents?.TileMatrixSet || [];
  const preferredCodes = [
    getCurrentMapProjectionCode(),
    "EPSG:3857",
    "GoogleMapsCompatible",
    "EPSG:900913",
    "EPSG:6870",
    "EPSG:4326",
  ];

  for (const code of preferredCodes) {
    const link = links.find((item) => item.TileMatrixSet === code);
    if (link) return link.TileMatrixSet;
  }

  const compatibleLink = links.find((link) =>
    matrixSets.some((matrixSet) => matrixSet.Identifier === link.TileMatrixSet),
  );
  return compatibleLink?.TileMatrixSet || links[0]?.TileMatrixSet;
}

function addExternalWmtsLayer(serviceUrl, wmtsLayer, metadata) {
  const matrixSet = getWmtsMatrixSet(wmtsLayer, metadata);
  if (!matrixSet) {
    throw new Error(
      `No WMTS matrix set found for ${getWmtsLayerTitle(wmtsLayer)}.`,
    );
  }

  const options = optionsFromCapabilities(metadata, {
    layer: wmtsLayer.Identifier,
    matrixSet,
  });

  const layer = new TileLayer({
    title: getWmtsLayerTitle(wmtsLayer),
    visible: true,
    source: new WMTS(options),
    displayInLayerSwitcher: true,
  });
  layer.set("externalServiceType", "wmts");
  layer.set("externalServiceUrl", serviceUrl);
  layer.set("wmtsLayerIdentifier", wmtsLayer.Identifier);
  layer.set("wmtsMatrixSet", matrixSet);
  layer.set("wmtsStyle", options.style || options.styleName || "");
  layer.set("wmtsFormat", options.format || "image/png");
  addExternalLayerToMap(layer);
  return layer;
}

async function addLoadedExternalServiceLayer(
  serviceUrl,
  type,
  titleOverride = "",
) {
  if (type === "arcgis-feature") {
    const parts = getArcgisServiceParts(serviceUrl);
    const metadata = loadedExternalService?.metadata;
    if (
      !parts?.layerId &&
      Array.isArray(metadata?.layers) &&
      metadata.layers.length
    ) {
      for (const serviceLayer of metadata.layers) {
        await addArcgisFeatureLayer(
          `${parts.rootUrl}/${serviceLayer.id}`,
          serviceLayer.name,
        );
      }
      return null;
    }
    return addArcgisFeatureLayer(serviceUrl, titleOverride);
  }

  if (type === "arcgis-map") {
    return addArcgisMapLayer(serviceUrl, titleOverride);
  }

  if (type === "arcgis-image") {
    return addArcgisImageLayer(serviceUrl, titleOverride);
  }

  if (type === "wmts") {
    const metadata =
      loadedExternalService?.metadata || (await fetchWmtsMetadata(serviceUrl));
    const layerName = externalServiceLayerNameInput.value.trim();
    const wmtsLayer =
      metadata?.Contents?.Layer?.find(
        (layer) =>
          layer.Identifier === layerName ||
          getWmtsLayerTitle(layer) === layerName,
      ) || metadata?.Contents?.Layer?.[0];
    if (!wmtsLayer) throw new Error("No WMTS layer was found.");
    return addExternalWmtsLayer(serviceUrl, wmtsLayer, metadata);
  }

  const wmsLayerName = externalWmsLayerNameInput.value.trim();
  if (!wmsLayerName) {
    throw new Error("Type the WMS layer name before adding it.");
  }
  return addExternalWmsLayer(serviceUrl, wmsLayerName, titleOverride);
}

function renderExternalServiceLayers(serviceUrl, serviceType, metadata) {
  const serviceLayers =
    serviceType === "wmts"
      ? metadata?.Contents?.Layer || []
      : metadata.layers || [];
  externalServiceLayers.innerHTML = "";

  if (!serviceLayers.length) {
    externalServiceLayers.textContent =
      serviceType === "arcgis-image"
        ? "This Image Service can be added directly from the Service tab."
        : "No child layers were returned. You can add the service directly.";
    return;
  }

  const parts = getArcgisServiceParts(serviceUrl);
  serviceLayers.forEach((serviceLayer) => {
    const row = document.createElement("div");
    row.className = "external-service-layer-row";

    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "external-service-layer-title";
    title.textContent =
      serviceType === "wmts"
        ? getWmtsLayerTitle(serviceLayer)
        : serviceLayer.name || `Layer ${serviceLayer.id}`;
    const meta = document.createElement("div");
    meta.className = "external-service-layer-meta";
    meta.textContent =
      serviceType === "wmts"
        ? serviceLayer.Identifier
        : `ID ${serviceLayer.id}${
            serviceLayer.geometryType ? ` - ${serviceLayer.geometryType}` : ""
          }`;
    info.append(title, meta);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Add";
    button.addEventListener("click", async () => {
      try {
        const serviceLayerTitle =
          serviceType === "wmts"
            ? getWmtsLayerTitle(serviceLayer)
            : serviceLayer.name;
        setExternalServiceStatus(`Adding ${serviceLayerTitle}...`);
        let addedLayer = null;
        if (serviceType === "wmts") {
          addedLayer = await addExternalWmtsLayer(serviceUrl, serviceLayer, metadata);
        } else if (serviceType === "arcgis-feature") {
          const childUrl = `${parts.rootUrl}/${serviceLayer.id}`;
          addedLayer = await addArcgisFeatureLayer(childUrl, serviceLayer.name);
        } else {
          const childUrl = `${parts.rootUrl}/${serviceLayer.id}`;
          addedLayer = await addArcgisMapLayer(childUrl, serviceLayer.name);
        }
        await addExternalLayerToTerrainIfRequested(addedLayer, serviceType);
        setExternalServiceStatus(`${serviceLayerTitle} added to the map.`);
      } catch (error) {
        console.error(error);
        setExternalServiceStatus(error.message, true);
      }
    });

    row.append(info, button);
    externalServiceLayers.append(row);
  });
}

function updateExternalServiceInputs() {
  const isWms = externalServiceTypeInput.value === "wms";
  document.querySelectorAll(".external-wms-only").forEach((element) => {
    element.style.display = isWms ? "" : "none";
  });
  setExternalTerrainCheckboxState();
  externalServiceUrlInput.placeholder =
    externalServiceTypeInput.value === "wmts"
      ? "https://.../wmts?request=GetCapabilities"
      : "https://.../arcgis/rest/services/.../FeatureServer";
  addExternalServiceLayerButton.disabled =
    !externalServiceUrlInput.value.trim();
}

externalServiceTypeInput.addEventListener(
  "change",
  updateExternalServiceInputs,
);
externalServiceUrlInput.addEventListener("input", () => {
  loadedExternalService = null;
  addExternalServiceLayerButton.disabled =
    !externalServiceUrlInput.value.trim();
});

externalServiceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const serviceUrl = normalizeExternalServiceUrl(externalServiceUrlInput.value);
  if (!serviceUrl) return;

  try {
    setExternalServiceStatus("Reading service metadata...");
    const serviceType = inferExternalServiceType(
      serviceUrl,
      externalServiceTypeInput.value,
    );
    externalServiceTypeInput.value = serviceType;
    updateExternalServiceInputs();

    if (serviceType === "wms") {
      loadedExternalService = { serviceUrl, serviceType, metadata: null };
      addExternalServiceLayerButton.disabled = false;
      setExternalServiceStatus("Type the WMS layer name, then add the layer.");
      externalServiceLayers.textContent =
        "WMS layer listing is not loaded here yet. Add one layer by name from the Service tab.";
      return;
    }

    if (serviceType === "wmts") {
      const metadata = await fetchWmtsMetadata(serviceUrl);
      loadedExternalService = { serviceUrl, serviceType, metadata };
      const firstLayer = metadata?.Contents?.Layer?.[0];
      externalServiceLayerNameInput.value =
        externalServiceLayerNameInput.value ||
        (firstLayer ? getWmtsLayerTitle(firstLayer) : "");
      renderExternalServiceLayers(serviceUrl, serviceType, metadata);
      addExternalServiceLayerButton.disabled = !firstLayer;
      setExternalServiceStatus(
        firstLayer
          ? "WMTS loaded. Add it directly or choose a layer."
          : "WMTS loaded, but no layers were found.",
        !firstLayer,
      );
      const layersTab = document.getElementById("service-layers-tab");
      bootstrap.Tab.getOrCreateInstance(layersTab).show();
      return;
    }

    const metadata = await fetchArcgisServiceMetadata(serviceUrl);
    loadedExternalService = { serviceUrl, serviceType, metadata };
    externalServiceLayerNameInput.value =
      externalServiceLayerNameInput.value ||
      getServiceLayerTitle(metadata, serviceUrl);
    renderExternalServiceLayers(serviceUrl, serviceType, metadata);
    addExternalServiceLayerButton.disabled = false;
    setExternalServiceStatus(
      "Service loaded. Add it directly or choose a child layer.",
    );

    const layersTab = document.getElementById("service-layers-tab");
    bootstrap.Tab.getOrCreateInstance(layersTab).show();
  } catch (error) {
    console.error(error);
    loadedExternalService = null;
    addExternalServiceLayerButton.disabled = true;
    setExternalServiceStatus(error.message, true);
  }
});

addExternalServiceLayerButton.addEventListener("click", async () => {
  const serviceUrl =
    loadedExternalService?.serviceUrl ||
    normalizeExternalServiceUrl(externalServiceUrlInput.value);
  const serviceType = inferExternalServiceType(
    serviceUrl,
    loadedExternalService?.serviceType || externalServiceTypeInput.value,
  );

  try {
    setExternalServiceStatus("Adding service to map...");
    const addedLayer = await addLoadedExternalServiceLayer(
      serviceUrl,
      serviceType,
      externalServiceLayerNameInput.value,
    );
    await addExternalLayerToTerrainIfRequested(addedLayer, serviceType);
    setExternalServiceStatus("Layer added to the map.");
  } catch (error) {
    console.error(error);
    setExternalServiceStatus(error.message, true);
  }
});

updateExternalServiceInputs();

function openAddDataModal(tabId = "service-tab") {
  const tabButton = document.getElementById(tabId);
  if (tabButton) bootstrap.Tab.getOrCreateInstance(tabButton).show();
  new bootstrap.Modal(document.getElementById("uploadModal")).show();
}

document.getElementById("add-data").addEventListener("click", () => {
  openAddDataModal("service-tab");
});

document
  .getElementById("manage-geoserver-layers")
  ?.addEventListener("click", () => {
    new bootstrap.Modal(
      document.getElementById("geoserverManagerModal"),
    ).show();
    loadGeoServerManagerData();
  });

const geoserverLayerGroupsList = document.getElementById(
  "geoserverLayerGroupsList",
);
const geoserverLayersList = document.getElementById("geoserverLayersList");
const geoserverStylesList = document.getElementById("geoserverStylesList");
const geoserverNewGroupBtn = document.getElementById("geoserverNewGroupBtn");
const geoserverNewGroupForm = document.getElementById("geoserverNewGroupForm");
const geoserverNewGroupName = document.getElementById("geoserverNewGroupName");
const geoserverNewGroupLayers = document.getElementById(
  "geoserverNewGroupLayers",
);
const geoserverNewGroupStatus = document.getElementById(
  "geoserverNewGroupStatus",
);
const geoserverPublishGroupBtn = document.getElementById(
  "geoserverPublishGroupBtn",
);
const geoserverUpdateGroupForm = document.getElementById(
  "geoserverUpdateGroupForm",
);
const geoserverUpdateGroupName = document.getElementById(
  "geoserverUpdateGroupName",
);
const geoserverUpdateGroupLayers = document.getElementById(
  "geoserverUpdateGroupLayers",
);
const geoserverUpdateGroupStyles = document.getElementById(
  "geoserverUpdateGroupStyles",
);
const geoserverUpdateGroupStatus = document.getElementById(
  "geoserverUpdateGroupStatus",
);
const geoserverSaveGroupUpdateBtn = document.getElementById(
  "geoserverSaveGroupUpdateBtn",
);
const geoserverNewLayerBtn = document.getElementById("geoserverNewLayerBtn");
const geoserverNewLayerForm = document.getElementById("geoserverNewLayerForm");
const geoserverNewLayerName = document.getElementById("geoserverNewLayerName");
const geoserverNewLayerGeometry = document.getElementById(
  "geoserverNewLayerGeometry",
);
const geoserverNewLayerStatus = document.getElementById(
  "geoserverNewLayerStatus",
);
const geoserverPublishLayerBtn = document.getElementById(
  "geoserverPublishLayerBtn",
);
const geoserverManagerWorkspace = "test";
const geoserverManagerDatastore = "postgres";
const geoserverManagerWmsUrl = `http://localhost:8080/geoserver/${geoserverManagerWorkspace}/wms`;
let geoserverManagerLayers = [];
let geoserverUpdateGroupStyleByLayer = new Map();
const geoserverLayerStyleCache = new Map();
let geoserverStyleLegendLayerByStyle = new Map();

function normalizeManagerItems(data, preferredKeys = []) {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  for (const key of preferredKeys) {
    const value = data?.[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nestedItems = normalizeManagerItems(value, preferredKeys);
      if (nestedItems.length) return nestedItems;
    }
  }

  const commonKeys = [
    "layerGroup",
    "layerGroups",
    "layergroup",
    "layergroups",
    "featureType",
    "featureTypes",
    "layer",
    "layers",
    "items",
    "results",
  ];

  for (const key of commonKeys) {
    const value = data?.[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nestedItems = normalizeManagerItems(value, preferredKeys);
      if (nestedItems.length) return nestedItems;
    }
  }

  const firstArray = Object.values(data || {}).find(Array.isArray);
  if (firstArray) return firstArray;

  const objectEntries = Object.entries(data || {}).filter(
    ([, value]) => value && typeof value === "object",
  );
  if (objectEntries.length) {
    return objectEntries.map(([key, value]) => ({
      name: value.name || value.title || key,
      ...value,
    }));
  }

  return [];
}

function getManagerItemName(item) {
  if (typeof item === "string") return item;
  return (
    item.name ||
    item.layerName ||
    item.layer_name ||
    item.title ||
    item.id ||
    item.layer_group ||
    item.layerGroup ||
    "Unnamed"
  );
}

function getManagerItemMeta(item) {
  if (typeof item === "string") return "";
  return (
    item.workspace ||
    item.datastore ||
    item.type ||
    item.geometryType ||
    item.nativeName ||
    item.href ||
    ""
  );
}

function renderManagerLoading(container, message) {
  container.innerHTML = `<div class="geoserver-manager-empty">${message}</div>`;
}

function renderManagerError(container, message, afterElement = null) {
  const errorBox = document.createElement("div");
  errorBox.className = "geoserver-manager-empty geoserver-manager-empty--error";
  errorBox.textContent = message;

  if (afterElement) {
    afterElement.insertAdjacentElement("afterend", errorBox);
    return;
  }

  container.innerHTML = "";
  container.appendChild(errorBox);
}

function renderManagerDetails(
  container,
  details,
  afterElement = null,
  summaryHtml = "",
) {
  let summaryBox = null;
  if (summaryHtml) {
    summaryBox = document.createElement("div");
    summaryBox.className = "geoserver-manager-summary";
    summaryBox.innerHTML = summaryHtml;
  }

  const detailBox = document.createElement("div");
  detailBox.className = "geoserver-manager-details";
  detailBox.textContent = JSON.stringify(details, null, 2);

  if (afterElement) {
    if (summaryBox) {
      afterElement.insertAdjacentElement("afterend", summaryBox);
      summaryBox.insertAdjacentElement("afterend", detailBox);
    } else {
      afterElement.insertAdjacentElement("afterend", detailBox);
    }
    detailBox.scrollIntoView({ block: "nearest" });
    return detailBox;
  }

  if (summaryBox) container.appendChild(summaryBox);
  container.appendChild(detailBox);
  return detailBox;
}

function renderManagerDetailActions(container, actions, afterElement = null) {
  if (!actions?.length) return null;

  const actionBar = document.createElement("div");
  actionBar.className = "geoserver-manager-detail-actions";

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "geoserver-manager-detail-action";
    button.textContent = action.label;
    button.addEventListener("click", (event) =>
      action.onClick?.(event, button),
    );
    actionBar.appendChild(button);
  });

  if (afterElement) {
    afterElement.insertAdjacentElement("afterend", actionBar);
    return actionBar;
  }

  container.appendChild(actionBar);
  return actionBar;
}

function removeAdjacentManagerDetails(row) {
  while (
    row.nextElementSibling?.classList.contains("geoserver-manager-summary") ||
    row.nextElementSibling?.classList.contains("geoserver-manager-details") ||
    row.nextElementSibling?.classList.contains(
      "geoserver-manager-detail-actions",
    )
  ) {
    row.nextElementSibling.remove();
  }
}

function setGeoServerNewLayerStatus(message, type = "") {
  if (!geoserverNewLayerStatus) return;
  geoserverNewLayerStatus.hidden = !message;
  geoserverNewLayerStatus.textContent = message || "";
  geoserverNewLayerStatus.className = `geoserver-create-status${
    type ? ` geoserver-create-status--${type}` : ""
  }`;
}

function setGeoServerNewGroupStatus(message, type = "") {
  if (!geoserverNewGroupStatus) return;
  geoserverNewGroupStatus.hidden = !message;
  geoserverNewGroupStatus.textContent = message || "";
  geoserverNewGroupStatus.className = `geoserver-create-status${
    type ? ` geoserver-create-status--${type}` : ""
  }`;
}

function setGeoServerUpdateGroupStatus(message, type = "") {
  if (!geoserverUpdateGroupStatus) return;
  geoserverUpdateGroupStatus.hidden = !message;
  geoserverUpdateGroupStatus.textContent = message || "";
  geoserverUpdateGroupStatus.className = `geoserver-create-status${
    type ? ` geoserver-create-status--${type}` : ""
  }`;
}

function renderGeoServerGroupLayerPicker(container, selectedLayerNames = []) {
  if (!container) return;
  container.innerHTML = "";
  const selectedLayers = new Set(
    selectedLayerNames.flatMap((name) => [name, getComparableLayerName(name)]),
  );
  const layerNames = geoserverManagerLayers
    .map(getManagerItemName)
    .filter((name) => name && name !== "Unnamed");

  if (!layerNames.length) {
    container.innerHTML =
      '<div class="geoserver-manager-empty">No layers available.</div>';
    return;
  }

  layerNames.forEach((name) => {
    const option = document.createElement("label");
    option.className = "geoserver-create-layer-option";
    option.innerHTML = `
      <input type="checkbox" value="${escapeNearbyHtml(name)}"${
        selectedLayers.has(name) ||
        selectedLayers.has(getComparableLayerName(name))
          ? " checked"
          : ""
      } />
      <span>${escapeNearbyHtml(name)}</span>
    `;
    container.appendChild(option);
  });
}

function getSelectedGeoServerGroupLayers(container) {
  const seen = new Set();
  return Array.from(container?.querySelectorAll("input:checked") || []).reduce(
    (layers, input) => {
      const layerName = input.value;
      const comparableName = getComparableLayerName(layerName);
      if (!seen.has(comparableName)) {
        seen.add(comparableName);
        layers.push(layerName);
      }
      return layers;
    },
    [],
  );
}

function getComparableLayerName(name) {
  return String(name || "")
    .split(":")
    .pop();
}

function getLayerStyleMapKey(layerName) {
  return getComparableLayerName(layerName).toLowerCase();
}

function getStyleName(style) {
  if (!style) return "";
  if (typeof style === "string") return style;
  return style.name || style.title || style.id || "";
}

function getFirstAvailableStyleName(styles) {
  if (!styles) return "";
  if (typeof styles === "string") return styles;
  if (Array.isArray(styles)) return getStyleName(styles[0]);
  if (Array.isArray(styles.style)) return getStyleName(styles.style[0]);
  return getStyleName(styles.style || styles);
}

function getAvailableLayerStyleNames(styles) {
  if (!styles) return [];
  if (typeof styles === "string") return [styles];
  if (Array.isArray(styles)) {
    return styles.map(getStyleName).filter(Boolean);
  }
  if (Array.isArray(styles.style)) {
    return styles.style.map(getStyleName).filter(Boolean);
  }
  return [getStyleName(styles.style || styles)].filter(Boolean);
}

function getDefaultLayerStyleName(data) {
  return (
    getStyleName(data?.layer?.defaultStyle) ||
    getStyleName(data?.restLayer?.layer?.defaultStyle) ||
    getStyleName(data?.featureType?.layer?.defaultStyle) ||
    getStyleName(data?.featureType?.defaultStyle) ||
    getStyleName(data?.defaultStyle) ||
    getFirstAvailableStyleName(data?.featureType?.styles) ||
    getFirstAvailableStyleName(data?.styles)
  );
}

function isUsableGeoServerStyleName(styleName) {
  const value = String(styleName || "")
    .trim()
    .toLowerCase();
  return Boolean(value) && value !== "assigned style" && value !== "default";
}

function getStyleDisplayName(style) {
  return getStyleName(style) || getManagerItemName(style);
}

function getStyleMeta(style) {
  if (!style || typeof style === "string") return "";
  return (
    style.workspace ||
    style.type ||
    style.format ||
    style.kind ||
    style.description ||
    style.href ||
    ""
  );
}

function getStyleLegendKeys(styleName) {
  const qualifiedStyleName = String(styleName || "").trim();
  const plainStyleName = getComparableLayerName(qualifiedStyleName);
  return [
    qualifiedStyleName.toLowerCase(),
    plainStyleName.toLowerCase(),
  ].filter(Boolean);
}

async function buildStyleLegendLayerLookup(layers) {
  geoserverStyleLegendLayerByStyle = new Map();
  const layerNames = layers
    .map(getManagerItemName)
    .filter((name) => name && name !== "Unnamed");

  const results = await Promise.allSettled(
    layerNames.map(async (layerName) => {
      const restLayerDetails = await fetchGeoServerRestLayerDetails(layerName);
      const styleName = getStyleName(restLayerDetails?.layer?.defaultStyle);
      const legendLayer =
        restLayerDetails?.layer?.resource?.name ||
        getGeoServerQualifiedLayerName(layerName);
      return { styleName, legendLayer };
    }),
  );

  results.forEach((result) => {
    if (result.status !== "fulfilled" || !result.value.styleName) return;
    getStyleLegendKeys(result.value.styleName).forEach((key) => {
      geoserverStyleLegendLayerByStyle.set(key, result.value.legendLayer);
    });
  });
}

function getLegendLayerForStyle(styleName) {
  return (
    geoserverStyleLegendLayerByStyle.get(String(styleName || "").toLowerCase()) ||
    geoserverStyleLegendLayerByStyle.get(
      getComparableLayerName(styleName).toLowerCase(),
    ) ||
    (styleName.includes(":")
      ? styleName
      : `${geoserverManagerWorkspace}:${styleName}`)
  );
}

async function fetchGeoServerWorkspaceStyles() {
  const requestOptions = {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`),
        Accept: "application/json",
      },
      credentials: "include",
    };
  const urls = [
    `http://${host}:${port}/geoserver/rest/workspaces/${encodeURIComponent(geoserverManagerWorkspace)}/styles.json`,
    `http://localhost:8000/geoserver-proxy/${geoserverManagerWorkspace}/rest/workspaces/${encodeURIComponent(geoserverManagerWorkspace)}/styles.json`,
  ];
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json().catch(async () => ({
        message: await response.text().catch(() => ""),
      }));

      if (!response.ok) {
        throw new Error(
          `Workspace styles failed with status ${response.status} at ${url}`,
        );
      }

      return normalizeManagerItems(data, [
        "style",
        "styles",
        "items",
        "results",
      ]);
    } catch (error) {
      lastError = error;
      console.warn(error);
    }
  }

  throw lastError || new Error("Workspace styles request failed.");
}

function renderStyleCategory(title, styles, emptyMessage) {
  const rows = styles.length
    ? styles
        .map((style) => {
          const name = getStyleDisplayName(style);
          const details = style.details || style.raw || style;
          const meta = style.layer
            ? `Layer: ${style.layer}`
            : getStyleMeta(details || style);
          const legendLayer = getLegendLayerForStyle(name);
          const legendUrl =
            `http://localhost:8000/geoserver-proxy/${geoserverManagerWorkspace}/wms?` +
            new URLSearchParams({
              REQUEST: "GetLegendGraphic",
              VERSION: "1.0.0",
              FORMAT: "image/png",
              WIDTH: "20",
              HEIGHT: "20",
              LAYER: legendLayer,
            }).toString();
          return `
            <button
              type="button"
              class="geoserver-manager-style-row"
              data-legend-url="${escapeNearbyHtml(legendUrl)}"
              data-style-name="${escapeNearbyHtml(name)}"
            >
              <span>
                <strong>${escapeNearbyHtml(name)}</strong>
                ${meta ? `<small>${escapeNearbyHtml(meta)}</small>` : ""}
              </span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          `;
        })
        .join("")
    : `<div class="geoserver-manager-empty">${emptyMessage}</div>`;

  return `
    <section class="geoserver-manager-style-section">
      <h6>${escapeNearbyHtml(title)} <span>${styles.length}</span></h6>
      ${rows}
    </section>
  `;
}

function attachGeoServerStyleLegendToggles() {
  geoserverStylesList
    ?.querySelectorAll(".geoserver-manager-style-row")
    .forEach((row) => {
      row.addEventListener("click", () => {
        if (row.dataset.expanded === "true") {
          row.dataset.expanded = "false";
          row.classList.remove("active");
          row.nextElementSibling?.classList.contains(
            "geoserver-manager-legend",
          ) && row.nextElementSibling.remove();
          return;
        }

        geoserverStylesList
          .querySelectorAll(".geoserver-manager-style-row")
          .forEach((button) => {
            button.dataset.expanded = "false";
            button.classList.remove("active");
          });
        geoserverStylesList
          .querySelectorAll(".geoserver-manager-legend")
          .forEach((legend) => legend.remove());

        row.dataset.expanded = "true";
        row.classList.add("active");

        const legend = document.createElement("div");
        legend.className = "geoserver-manager-legend";
        legend.innerHTML = `
          <img
            src="${row.dataset.legendUrl}"
            alt="${escapeNearbyHtml(row.dataset.styleName || "Style")} legend"
          />
        `;
        row.insertAdjacentElement("afterend", legend);
      });
    });
}

async function loadGeoServerManagerStyles(layers = []) {
  renderManagerLoading(geoserverStylesList, "Loading styles...");

  try {
    await buildStyleLegendLayerLookup(layers);
    const styles = await fetchGeoServerWorkspaceStyles();
    geoserverStylesList.innerHTML = renderStyleCategory(
      "Workspace Styles",
      styles,
      "No workspace styles returned.",
    );
    attachGeoServerStyleLegendToggles();
  } catch (error) {
    console.error(error);
    renderManagerError(
      geoserverStylesList,
      error.message || "Could not load styles.",
    );
  }
}

function renderLayerStyleSummary(details) {
  const assignedStyle = getDefaultLayerStyleName(details);
  const availableStyles = getAvailableLayerStyleNames(
    details?.featureType?.styles || details?.styles || details?.layer?.styles,
  );
  const styles = availableStyles.length
    ? availableStyles
    : assignedStyle
      ? [assignedStyle]
      : [];

  return `
    <div class="geoserver-manager-summary-row">
      <span>Assigned style</span>
      <strong>${escapeNearbyHtml(assignedStyle || "No style returned")}</strong>
    </div>
    <div class="geoserver-manager-summary-row">
      <span>Available styles</span>
      <div class="geoserver-manager-style-chips">
        ${
          styles.length
            ? styles
                .map(
                  (style) =>
                    `<em${style === assignedStyle ? ' class="active"' : ""}>${escapeNearbyHtml(style)}</em>`,
                )
                .join("")
            : "<em>No styles returned</em>"
        }
      </div>
    </div>
  `;
}

async function fetchGeoServerRestLayerDetails(layerName) {
  const qualifiedLayerName = getGeoServerQualifiedLayerName(layerName);
  const response = await fetch(
    `http://${host}:${port}/geoserver/rest/layers/${encodeURI(qualifiedLayerName)}.json`,
    {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`),
        Accept: "application/json",
      },
      credentials: "include",
    },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Could not read REST layer style for ${qualifiedLayerName}.`,
    );
  }

  return data;
}

async function getGeoServerLayerStyle(layerName) {
  const layerNameOnly = getComparableLayerName(layerName);
  const cacheKey = getLayerStyleMapKey(layerNameOnly);
  if (
    geoserverLayerStyleCache.has(cacheKey) &&
    isUsableGeoServerStyleName(geoserverLayerStyleCache.get(cacheKey))
  ) {
    return geoserverLayerStyleCache.get(cacheKey);
  }

  try {
    const restLayerDetails =
      await fetchGeoServerRestLayerDetails(layerNameOnly);
    const restStyleName = getDefaultLayerStyleName(restLayerDetails);
    if (restStyleName) {
      geoserverLayerStyleCache.set(cacheKey, restStyleName);
      return restStyleName;
    }
  } catch (error) {
    console.warn(error);
  }

  const response = await fetch(
    `http://localhost:8000/api/groups/${geoserverManagerWorkspace}/${geoserverManagerDatastore}/${encodeURIComponent(layerNameOnly)}/`,
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok)
    throw new Error(`Could not read style for ${layerNameOnly}.`);
  const styleName = getDefaultLayerStyleName(data);
  geoserverLayerStyleCache.set(cacheKey, styleName);
  return styleName;
}

async function ensureGeoServerLayerStyles(layerNames, forceRefresh = false) {
  await Promise.all(
    layerNames.map(async (layerName) => {
      const styleKey = getLayerStyleMapKey(layerName);
      const currentStyle = geoserverUpdateGroupStyleByLayer.get(styleKey);
      if (!forceRefresh && isUsableGeoServerStyleName(currentStyle)) return;
      if (forceRefresh) {
        geoserverLayerStyleCache.delete(styleKey);
      }
      const styleName = await getGeoServerLayerStyle(layerName);
      if (styleName) {
        geoserverUpdateGroupStyleByLayer.set(styleKey, styleName);
      }
    }),
  );
}

async function readAssignedStylesForUpdateGroup(layerNames) {
  const results = await Promise.allSettled(
    layerNames.map(async (layerName) => {
      const restLayerDetails = await fetchGeoServerRestLayerDetails(layerName);
      return {
        layerName,
        styleName: getStyleName(restLayerDetails?.layer?.defaultStyle),
      };
    }),
  );

  let failed = false;
  results.forEach((result) => {
    if (result.status === "rejected") {
      failed = true;
      console.warn(result.reason);
      return;
    }

    const { layerName, styleName } = result.value;
    if (styleName) {
      geoserverUpdateGroupStyleByLayer.set(
        getLayerStyleMapKey(layerName),
        styleName,
      );
    }
  });

  return !failed;
}

function normalizeLayerGroupLayerNames(layer) {
  if (!layer) return [];
  if (typeof layer === "string") return [layer];
  if (Array.isArray(layer)) {
    return layer.flatMap(normalizeLayerGroupLayerNames);
  }

  const name = getManagerItemName(layer);
  if (name && name !== "Unnamed") return [name];

  return normalizeLayerGroupLayerNames(
    layer.published ||
      layer.publishables ||
      layer.layer ||
      layer.layers ||
      layer.featureType ||
      layer.featureTypes,
  );
}

function getLayerGroupLayerNames(details) {
  const layers =
    details?.layer ||
    details?.layers ||
    details?.layerGroup?.publishables?.published?.name ||
    details?.layerGroup?.publishables?.published ||
    details?.layerGroup?.layers?.layer?.name ||
    details?.layerGroup?.layers?.layer ||
    [];

  return normalizeLayerGroupLayerNames(layers);
}

function normalizeLayerGroupStyleNames(style) {
  if (!style) return [];
  if (typeof style === "string") return [style];
  if (Array.isArray(style)) {
    return style.flatMap(normalizeLayerGroupStyleNames);
  }

  const name = getManagerItemName(style);
  if (name && name !== "Unnamed") return [name];

  return normalizeLayerGroupStyleNames(
    style.style || style.styles || style.defaultStyle,
  );
}

function getLayerGroupStyleNames(details) {
  const styles =
    details?.style ||
    details?.styles ||
    details?.layerGroup?.styles?.style?.name ||
    details?.layerGroup?.styles?.style ||
    [];

  return normalizeLayerGroupStyleNames(styles);
}

function createLayerGroupStyleMap(layerNames, styleNames) {
  const styleMap = new Map();
  layerNames.forEach((layerName, index) => {
    const styleName = styleNames[index] || "";
    styleMap.set(getLayerStyleMapKey(layerName), styleName);
  });
  return styleMap;
}

async function renderGeoServerUpdateGroupStyleRows() {
  if (!geoserverUpdateGroupStyles) return;
  geoserverUpdateGroupStyles
    .querySelectorAll("input[data-layer]")
    .forEach((input) => {
      const inputStyle = input.value.trim();
      if (isUsableGeoServerStyleName(inputStyle)) {
        geoserverUpdateGroupStyleByLayer.set(
          getLayerStyleMapKey(input.dataset.layer),
          inputStyle,
        );
      }
    });
  const selectedLayers = getSelectedGeoServerGroupLayers(
    geoserverUpdateGroupLayers,
  );
  geoserverUpdateGroupStyles.innerHTML = "";

  if (!selectedLayers.length) {
    geoserverUpdateGroupStyles.innerHTML =
      '<div class="geoserver-manager-empty">Select layers to set styles.</div>';
    return;
  }

  try {
    setGeoServerUpdateGroupStatus("Reading assigned styles...");
    const allStylesRead =
      await readAssignedStylesForUpdateGroup(selectedLayers);
    setGeoServerUpdateGroupStatus(
      allStylesRead ? "" : "Some assigned styles could not be read.",
      allStylesRead ? "" : "error",
    );
  } catch (error) {
    console.error(error);
    setGeoServerUpdateGroupStatus(
      "Could not auto-read one of the layer styles.",
      "error",
    );
  }

  selectedLayers.forEach((layerName) => {
    const styleName =
      geoserverUpdateGroupStyleByLayer.get(getLayerStyleMapKey(layerName)) ||
      "";
    const row = document.createElement("label");
    row.className = "geoserver-update-style-row";
    row.innerHTML = `
      <span title="${escapeNearbyHtml(layerName)}">${escapeNearbyHtml(layerName)}</span>
      <input
        type="text"
        data-layer="${escapeNearbyHtml(layerName)}"
        value="${escapeNearbyHtml(styleName)}"
        placeholder="assigned style"
        readonly
        required
      />
    `;
    geoserverUpdateGroupStyles.appendChild(row);
  });
}

function getSelectedGeoServerGroupStyles() {
  return Array.from(
    geoserverUpdateGroupStyles?.querySelectorAll("input[data-layer]") || [],
  ).map((input) => input.value.trim());
}

function openGeoServerUpdateGroupModal(groupName, details = {}) {
  if (!geoserverUpdateGroupForm) return;
  geoserverUpdateGroupForm.reset();
  setGeoServerUpdateGroupStatus("");
  geoserverUpdateGroupName.value = groupName;
  const layerNames = getLayerGroupLayerNames(details);
  geoserverUpdateGroupStyleByLayer = createLayerGroupStyleMap(
    layerNames,
    getLayerGroupStyleNames(details),
  );
  renderGeoServerGroupLayerPicker(geoserverUpdateGroupLayers, layerNames);
  geoserverUpdateGroupLayers
    ?.querySelectorAll("input[type='checkbox']")
    .forEach((checkbox) =>
      checkbox.addEventListener("change", renderGeoServerUpdateGroupStyleRows),
    );
  renderGeoServerUpdateGroupStyleRows();
  new bootstrap.Modal(
    document.getElementById("geoserverUpdateGroupModal"),
  ).show();
}

function getGeoServerLayerGroupWmsName(groupName) {
  return groupName.includes(":")
    ? groupName
    : `${geoserverManagerWorkspace}:${groupName}`;
}

function getGeoServerQualifiedLayerName(layerName) {
  return layerName.includes(":")
    ? layerName
    : `${geoserverManagerWorkspace}:${layerName}`;
}

function getGeoServerLayerGroupSwitcherLayer(groupName) {
  return map
    .getLayers()
    .getArray()
    .find(
      (layer) =>
        layer.get("geoserverManagerLayerGroup") === true &&
        layer.get("geoserverManagerLayerGroupName") === groupName,
    );
}

function isGeoServerLayerGroupInSwitcher(groupName) {
  return Boolean(getGeoServerLayerGroupSwitcherLayer(groupName));
}

function refreshLayerSwitcherPanel() {
  layerSwitcher?.drawPanel?.();
}

function createGeoServerManagerWmsLayer(layerName, title) {
  let layerTitle = title;
  try {
    layerTitle = parseLayerInfo(layerName).layerTitle2;
  } catch (error) {
    layerTitle = title || getComparableLayerName(layerName);
  }

  const layer = new ImageLayer({
    source: new ImageWMS({
      url: `http://localhost:8000/geoserver-proxy/${geoserverManagerWorkspace}/wms`,
      params: {
        LAYERS: layerName,
        VERSION: "1.1.1",
      },
      ratio: 1,
      serverType: "geoserver",
      crossOrigin: "anonymous",
    }),
    visible: true,
    title: layerTitle,
    information: "Kufiri i tokësor i republikës së Shqipërisë",
    displayInLayerSwitcher: true,
  });
  layer.set("geoserverManagerLayerGroupChild", true);
  return layer;
}

function toggleGeoServerLayerGroupInSwitcher(groupName, details = {}) {
  const existingLayer = getGeoServerLayerGroupSwitcherLayer(groupName);
  if (existingLayer) {
    const childLayers = existingLayer.getLayers?.().getArray?.() || [];
    layersArray = layersArray.filter((layer) => !childLayers.includes(layer));
    map.removeLayer(existingLayer);
    refreshLayerSwitcherPanel();
    return false;
  }

  const childLayerNames = getLayerGroupLayerNames(details);
  const publishedLayerNames = childLayerNames.length
    ? childLayerNames
    : [getGeoServerLayerGroupWmsName(groupName)];
  const layerGroupLayer = new LayerGroup({
    title: groupName,
    visible: true,
    layers: publishedLayerNames.map((layerName) =>
      createGeoServerManagerWmsLayer(
        getGeoServerQualifiedLayerName(layerName),
        getComparableLayerName(layerName),
      ),
    ),
    openInLayerSwitcher: true,
    displayInLayerSwitcher: true,
  });
  layerGroupLayer.set("geoserverManagerLayerGroup", true);
  layerGroupLayer.set("geoserverManagerLayerGroupName", groupName);
  layersArray.push(...layerGroupLayer.getLayers().getArray());
  map.addLayer(layerGroupLayer);
  refreshLayerSwitcherPanel();
  return true;
}

function renderManagerList(container, items, options) {
  container.innerHTML = "";
  let activeRow = null;

  if (!items.length) {
    container.innerHTML = `<div class="geoserver-manager-empty">${options.emptyMessage}</div>`;
    return;
  }

  items.forEach((item) => {
    const name = getManagerItemName(item);
    const meta = getManagerItemMeta(item);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "geoserver-manager-row";
    row.innerHTML = `
      <span>
        <strong>${escapeNearbyHtml(name)}</strong>
        ${meta ? `<small>${escapeNearbyHtml(meta)}</small>` : ""}
      </span>
      <i class="fa-solid fa-chevron-right"></i>
    `;

    row.addEventListener("click", async () => {
      if (row.dataset.expanded === "true") {
        row.classList.remove("active");
        row.dataset.expanded = "false";
        removeAdjacentManagerDetails(row);
        activeRow = null;
        return;
      }

      container.querySelectorAll(".geoserver-manager-row").forEach((button) => {
        button.classList.remove("active");
        button.dataset.expanded = "false";
      });
      container
        .querySelectorAll(".geoserver-manager-details")
        .forEach((detail) => detail.remove());
      container
        .querySelectorAll(".geoserver-manager-summary")
        .forEach((detail) => detail.remove());
      container
        .querySelectorAll(".geoserver-manager-detail-actions")
        .forEach((detail) => detail.remove());
      row.classList.add("active");
      row.dataset.expanded = "true";
      activeRow = row;

      try {
        const details = await options.fetchDetails(name);
        if (activeRow !== row || row.dataset.expanded !== "true") return;
        const detailBox = renderManagerDetails(
          container,
          details,
          row,
          options.getSummary?.(details, name) || "",
        );
        if (options.getActions) {
          renderManagerDetailActions(
            container,
            options.getActions(name, details),
            detailBox || row,
          );
        }
      } catch (error) {
        console.error(error);
        renderManagerError(container, `Could not read ${name}.`, row);
      }
    });

    container.appendChild(row);
  });
}

async function loadGeoServerManagerData() {
  renderManagerLoading(geoserverLayerGroupsList, "Loading layer groups...");
  renderManagerLoading(geoserverLayersList, "Loading layers...");
  renderManagerLoading(geoserverStylesList, "Waiting for layers...");

  try {
    const response = await fetch("http://localhost:8000/api/layergroups/");
    if (!response.ok) {
      throw new Error(`Layer groups failed with status ${response.status}`);
    }
    const data = await response.json();
    const layerGroups = normalizeManagerItems(data, [
      "layerGroups",
      "layerGroup",
      "layergroups",
      "layergroup",
      "groups",
      "items",
      "results",
    ]);

    renderManagerList(geoserverLayerGroupsList, layerGroups, {
      emptyMessage: "No layer groups returned.",
      getActions: (groupName, details) => [
        {
          label: isGeoServerLayerGroupInSwitcher(groupName)
            ? "Hide from LayerSwitcher"
            : "Show in LayerSwitcher",
          onClick: (event, button) => {
            const isVisibleInSwitcher = toggleGeoServerLayerGroupInSwitcher(
              groupName,
              details,
            );
            if (button) {
              button.textContent = isVisibleInSwitcher
                ? "Hide from LayerSwitcher"
                : "Show in LayerSwitcher";
            }
          },
        },
        {
          label: "Update Group",
          onClick: () => openGeoServerUpdateGroupModal(groupName, details),
        },
      ],
      fetchDetails: async (groupName) => {
        const detailResponse = await fetch(
          `http://localhost:8000/api/layergroups/${encodeURIComponent(groupName)}/`,
        );
        if (!detailResponse.ok) {
          throw new Error(
            `Layer group details failed with status ${detailResponse.status}`,
          );
        }
        return detailResponse.json();
      },
    });
  } catch (error) {
    console.error(error);
    renderManagerError(
      geoserverLayerGroupsList,
      "Could not load layer groups.",
    );
  }

  try {
    const response = await fetch(
      `http://localhost:8000/api/groups/${geoserverManagerWorkspace}/${geoserverManagerDatastore}/`,
    );
    if (!response.ok) {
      throw new Error(`Layers failed with status ${response.status}`);
    }
    const data = await response.json();
    const layers = normalizeManagerItems(data, [
      "layers",
      "layer",
      "featureTypes",
      "featureType",
      "items",
      "results",
    ]);
    geoserverManagerLayers = layers;

    renderManagerList(geoserverLayersList, layers, {
      emptyMessage: "No layers returned.",
      getSummary: (details) => renderLayerStyleSummary(details),
      fetchDetails: async (layerName) => {
        const detailResponse = await fetch(
          `http://localhost:8000/api/groups/${geoserverManagerWorkspace}/${geoserverManagerDatastore}/${encodeURIComponent(layerName)}/`,
        );
        if (!detailResponse.ok) {
          throw new Error(
            `Layer details failed with status ${detailResponse.status}`,
          );
        }
        const layerDetails = await detailResponse.json();
        try {
          const restLayer = await fetchGeoServerRestLayerDetails(layerName);
          return {
            ...layerDetails,
            restLayer,
          };
        } catch (error) {
          console.warn(error);
          return layerDetails;
        }
      },
    });
    loadGeoServerManagerStyles(layers);
  } catch (error) {
    console.error(error);
    renderManagerError(geoserverLayersList, "Could not load layers.");
    loadGeoServerManagerStyles([]);
  }
}

async function createGeoServerLayerGroup(groupName, layerNames) {
  const response = await fetch("http://localhost:8000/api/layergroups/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: groupName,
      layer: layerNames,
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.detail ||
      data.error ||
      data.message ||
      `Create layer group failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function updateGeoServerLayerGroup(groupName, layerNames, styleNames) {
  const hasSingleLayer = layerNames.length === 1;
  const response = await fetch(
    `http://localhost:8000/api/layergroups/${encodeURIComponent(groupName)}/`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: groupName,
        layer: hasSingleLayer ? layerNames[0] : layerNames,
        style: hasSingleLayer ? styleNames[0] : styleNames,
      }),
    },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.detail ||
      data.error ||
      data.message ||
      `Update layer group failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function createGeoServerLayer(layerName, geometryType) {
  const response = await fetch(
    `http://localhost:8000/api/groups/${geoserverManagerWorkspace}/${geoserverManagerDatastore}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: layerName,
        geometry: geometryType,
      }),
    },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.detail ||
      data.error ||
      data.message ||
      `Create layer failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

geoserverNewLayerBtn?.addEventListener("click", () => {
  geoserverNewLayerForm?.reset();
  setGeoServerNewLayerStatus("");
  new bootstrap.Modal(document.getElementById("geoserverNewLayerModal")).show();
  setTimeout(() => geoserverNewLayerName?.focus(), 150);
});

geoserverNewGroupBtn?.addEventListener("click", () => {
  geoserverNewGroupForm?.reset();
  setGeoServerNewGroupStatus("");
  renderGeoServerGroupLayerPicker(geoserverNewGroupLayers);
  new bootstrap.Modal(document.getElementById("geoserverNewGroupModal")).show();
  setTimeout(() => geoserverNewGroupName?.focus(), 150);
});

geoserverNewGroupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const groupName = geoserverNewGroupName?.value.trim();
  const layerNames = getSelectedGeoServerGroupLayers(geoserverNewGroupLayers);

  if (!groupName) {
    setGeoServerNewGroupStatus("Fill the group name.", "error");
    return;
  }

  if (!layerNames.length) {
    setGeoServerNewGroupStatus("Layergroup cannot have 0 layers.", "error");
    return;
  }

  geoserverPublishGroupBtn.disabled = true;
  setGeoServerNewGroupStatus("Publishing layer group...");

  try {
    await createGeoServerLayerGroup(groupName, layerNames);
    setGeoServerNewGroupStatus("Layer group created successfully.", "success");
    await loadGeoServerManagerData();
    setTimeout(() => {
      bootstrap.Modal.getInstance(
        document.getElementById("geoserverNewGroupModal"),
      )?.hide();
    }, 700);
  } catch (error) {
    console.error("Create layer group failed:", error);
    setGeoServerNewGroupStatus(
      error.message || "Could not create layer group.",
      "error",
    );
  } finally {
    geoserverPublishGroupBtn.disabled = false;
  }
});

geoserverUpdateGroupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const groupName = geoserverUpdateGroupName?.value.trim();
  const layerNames = getSelectedGeoServerGroupLayers(
    geoserverUpdateGroupLayers,
  );

  if (!groupName) {
    setGeoServerUpdateGroupStatus("Missing layer group name.", "error");
    return;
  }

  if (!layerNames.length) {
    setGeoServerUpdateGroupStatus("Layergroup cannot have 0 layers.", "error");
    return;
  }

  try {
    const allStylesRead = await readAssignedStylesForUpdateGroup(layerNames);
    await renderGeoServerUpdateGroupStyleRows();
    if (!allStylesRead) {
      setGeoServerUpdateGroupStatus(
        "Could not read every assigned layer style.",
        "error",
      );
      return;
    }
  } catch (error) {
    console.error(error);
    setGeoServerUpdateGroupStatus("Could not auto-read layer styles.", "error");
    return;
  }

  const styleNames = getSelectedGeoServerGroupStyles();

  if (
    styleNames.length !== layerNames.length ||
    styleNames.some((style) => !style)
  ) {
    setGeoServerUpdateGroupStatus(
      "Could not find a style for each selected layer.",
      "error",
    );
    return;
  }

  geoserverSaveGroupUpdateBtn.disabled = true;
  setGeoServerUpdateGroupStatus("Updating layer group...");

  try {
    await updateGeoServerLayerGroup(groupName, layerNames, styleNames);
    setGeoServerUpdateGroupStatus(
      "Layer group updated successfully.",
      "success",
    );
    await loadGeoServerManagerData();
    setTimeout(() => {
      bootstrap.Modal.getInstance(
        document.getElementById("geoserverUpdateGroupModal"),
      )?.hide();
    }, 700);
  } catch (error) {
    console.error("Update layer group failed:", error);
    setGeoServerUpdateGroupStatus(
      error.message || "Could not update layer group.",
      "error",
    );
  } finally {
    geoserverSaveGroupUpdateBtn.disabled = false;
  }
});

geoserverNewLayerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const layerName = geoserverNewLayerName?.value.trim();
  const geometryType = geoserverNewLayerGeometry?.value;

  if (!layerName || !geometryType) {
    setGeoServerNewLayerStatus(
      "Fill the layer name and geometry type.",
      "error",
    );
    return;
  }

  geoserverPublishLayerBtn.disabled = true;
  setGeoServerNewLayerStatus("Publishing layer...");

  try {
    await createGeoServerLayer(layerName, geometryType);
    setGeoServerNewLayerStatus("Layer created successfully.", "success");
    await loadGeoServerManagerData();
    setTimeout(() => {
      bootstrap.Modal.getInstance(
        document.getElementById("geoserverNewLayerModal"),
      )?.hide();
    }, 700);
  } catch (error) {
    console.error("Create layer failed:", error);
    setGeoServerNewLayerStatus(
      error.message || "Could not create layer.",
      "error",
    );
  } finally {
    geoserverPublishLayerBtn.disabled = false;
  }
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
      }),
    );
  }

  // 2) draw lines with weight based on a property
  if (geomType === "LineString") {
    const width = props.road_rank ? props.road_rank * 2 : 1;
    styles.push(
      new Style({
        stroke: new Stroke({ color: "#607d8b", width }),
      }),
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
      }),
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
      }),
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
          }),
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
    fieldsContainer.querySelectorAll("input:checked"),
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
let heatmapLayerItems = [];

heatmapBtn.addEventListener("click", () => {
  populateHeatmapLayerSelect();
  heatmapModal.showModal();
});

function populateHeatmapLayerSelect() {
  layerSelectInHeatmap.innerHTML = "";
  heatmapLayerItems = [];
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a layer...";
  layerSelectInHeatmap.appendChild(defaultOption);

  function addHeatmapOption(layer) {
    if (!layer.getVisible?.()) return;
    const source = layer.getSource?.();
    const params = source?.getParams?.();
    const typeName = params?.LAYERS || params?.layers;
    const isSwitcherVector =
      layer instanceof VectorLayer &&
      layer.get("displayInLayerSwitcher") === true;

    if (!typeName && !isSwitcherVector) return;

    if (isSwitcherVector) {
      const features = source?.getFeatures?.() || [];
      const hasPointFeature = features.some((feature) =>
        ["Point", "MultiPoint"].includes(feature.getGeometry?.()?.getType?.()),
      );
      if (!hasPointFeature) return;
    }

    const item = {
      layer,
      source,
      typeName,
      sourceType: typeName ? "wfs" : "vector",
      title: layer.get("title") || typeName || "Vector layer",
    };
    const option = document.createElement("option");
    option.value = String(heatmapLayerItems.length);
    option.text =
      item.sourceType === "vector" ? `${item.title} (Vector)` : item.title;
    heatmapLayerItems.push(item);
    layerSelectInHeatmap.appendChild(option);
  }

  function visitLayer(layer) {
    if (layer instanceof LayerGroup) {
      layer.getLayers().forEach(visitLayer);
      return;
    }
    addHeatmapOption(layer);
  }

  map.getLayers().forEach(visitLayer);
}

function getHeatmapVectorFeatures(layerItem) {
  const mapProjection = map.getView().getProjection().getCode();
  const featureProjection =
    layerItem.layer.get("featureProjection") ||
    layerItem.layer.get("sourceProjection") ||
    mapProjection;

  return (layerItem.source?.getFeatures?.() || [])
    .filter((feature) =>
      ["Point", "MultiPoint"].includes(feature.getGeometry?.()?.getType?.()),
    )
    .map((feature) => {
      const clone = feature.clone();
      clone.setProperties(feature.getProperties());
      if (featureProjection !== mapProjection) {
        clone.getGeometry()?.transform(featureProjection, mapProjection);
      }
      clone.set("_featureProjection", mapProjection, true);
      return clone;
    });
}

function getNumericFieldsFromFeatures(features) {
  const firstFeature = features.find((feature) => feature.getProperties);
  if (!firstFeature) return [];
  return Object.keys(firstFeature.getProperties()).filter((key) => {
    if (key === "geometry") return false;
    return features.some((feature) => Number.isFinite(Number(feature.get(key))));
  });
}

function getHeatmapWfsUrl(layerItem) {
  const layerParams = layerItem.typeName;
  const [workspace, layerName] = layerParams.split(":");
  const params = layerItem.source?.getParams?.() || {};
  const cqlFilter = params.CQL_FILTER;
  const baseUrl =
    `http://${host}:${port}/geoserver/${workspace}/ows?` +
    `service=WFS&version=1.1.0&request=GetFeature` +
    `&typeName=${workspace}:${layerName}` +
    `&outputFormat=application/json&srsName=EPSG:3857`;

  if (!cqlFilter) return baseUrl;
  return `${baseUrl}&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
}

document
  .getElementById("layerSelectInHeatmap")
  .addEventListener("change", async function () {
    const weightFieldSelect = document.getElementById("weightFieldSelect");
    weightFieldSelect.innerHTML = '<option value="">None (uniform)</option>';

    const idx = parseInt(this.value, 10);
    if (isNaN(idx)) return;

    const layerItem = heatmapLayerItems[idx];
    if (!layerItem) return;

    if (layerItem.sourceType === "vector") {
      const fields = getNumericFieldsFromFeatures(
        getHeatmapVectorFeatures(layerItem),
      );
      fields.forEach((field) => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = field;
        weightFieldSelect.appendChild(option);
      });
      return;
    }

    const wfsUrl = getHeatmapWfsUrl(layerItem);

    async function fetchAndExtractKeys(url) {
      const response = await fetch(url);
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

    layerItem.layer.set("wfsUrl", wfsUrl); // store for later use
  });

document
  .getElementById("heatmapForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const idx = parseInt(layerSelectInHeatmap.value, 10);
    if (isNaN(idx)) return;

    const selectedItem = heatmapLayerItems[idx];
    if (!selectedItem) return;

    const weightField = document.getElementById("weightFieldSelect").value;
    const blur = parseInt(document.getElementById("blurRange").value, 10);
    const radius = parseInt(document.getElementById("radiusRange").value, 10);

    if (window.heatmapLayer) map.removeLayer(window.heatmapLayer);

    const vectorSource =
      selectedItem.sourceType === "vector"
        ? new VectorSource({
            features: getHeatmapVectorFeatures(selectedItem),
          })
        : new VectorSource({
            url: selectedItem.layer.get("wfsUrl") || getHeatmapWfsUrl(selectedItem),
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

        // Normalize between 0 and 1 based on actual dataset range
        if (maxWeight === minWeight) return raw > 0 ? 1 : 0;
        return (raw - minWeight) / (maxWeight - minWeight);
      },
      title: "Heatmap Layer",
    });

    map.addLayer(window.heatmapLayer);
    window.heatmapLayer.setZIndex(98);

    function updateHeatmapLegend() {
      const featuresHeatmap = vectorSource.getFeatures();
      if (!featuresHeatmap.length) return;

      if (!weightField) {
        // Uniform weights (all 1)
        minWeight = 0;
        maxWeight = 1;
      } else {
        const weights = featuresHeatmap.map(
          (f) => parseFloat(f.get(weightField)) || 0,
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
    }

    if (selectedItem.sourceType === "vector") {
      updateHeatmapLegend();
    } else {
      vectorSource.on("change", () => {
        if (vectorSource.getState() !== "ready") return;
        updateHeatmapLegend();
      });
    }

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
const OPEN_ROUTE_SERVICE_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFhZjdlYThlODJiOWEyYmY5MTk4MzU1OTk5ODZiMGFhMTg2OTBkNmZiYTJmNzgxNGU1ZDlmODYwIiwiaCI6Im11cm11cjY0In0=";

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

    document.getElementById("clickCoordDisplay").textContent =
      `Start Point: ${x.toFixed(5)}, ${y.toFixed(5)}`;

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
        10,
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
          Authorization: OPEN_ROUTE_SERVICE_API_KEY,
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

// NEARBY ANALYSIS
const nearbyAnalysisBtn = document.getElementById("nearbyAnalysisBtn");
const nearbySidebar = document.getElementById("nearbySidebar");
const nearbySidebarClose = document.getElementById("nearbySidebarClose");
const nearbyResults = document.getElementById("nearbyResults");
const nearbySidebarSubtitle = document.getElementById("nearbySidebarSubtitle");
const sharedChatSidebar = document.getElementById("chatSidebar");
const geoAdvisorSidebar = document.getElementById("geoAdvisorSidebar");
const geoAdvisorClose = document.getElementById("geoAdvisorClose");
const geoAdvisorResults = document.getElementById("geoAdvisorResults");
const geoAdvisorSubtitle = document.getElementById("geoAdvisorSubtitle");
const nearbyCategoryToggle = document.getElementById("nearbyCategoryToggle");
const nearbyCategoryPanel = document.getElementById("nearbyCategoryPanel");
const nearbyCategoryLabel = document.getElementById("nearbyCategoryLabel");
let nearbyPickActive = false;
let nearbyMarkerLayer = null;
let nearbyResultsLayer = null;
let nearbyHighlightLayer = null;
let nearbyRouteLayer = null;
let nearbyBusRouteLayer = null;
let nearbyOriginCoordinate = null;
let nearbyRouteRequestId = 0;
let nearbyLastPlaces = [];
let geoAdvisorChart = null;
let geoAdvisorCompareChart = null;
let geoAdvisorTotalChart = null;
let geoAdvisorCurrentContext = null;
let currentSidebarPanel = "assistant";

const nearbyCategories = [
  {
    key: "school",
    group: "school",
    label: "School",
    query: '["amenity"="school"]',
  },
  {
    key: "kindergarten",
    group: "kindergarten",
    label: "Kindergarten",
    query: '["amenity"="kindergarten"]',
  },
  {
    key: "hospital",
    group: "hospital",
    label: "Hospital",
    query: '["amenity"="hospital"]',
  },
  { key: "park", group: "park", label: "Park", query: '["leisure"="park"]' },
  {
    key: "police",
    group: "police",
    label: "Police Station",
    query: '["amenity"="police"]',
  },
  {
    key: "fire_station",
    group: "fire_station",
    label: "Fire Station",
    query: '["amenity"="fire_station"]',
  },
  {
    key: "bus_stop",
    group: "bus_stop",
    label: "Bus Stop",
    query: '["highway"="bus_stop"]',
  },
  {
    key: "bus_platform",
    group: "bus_stop",
    label: "Bus Stop",
    query: '["public_transport"="platform"]',
  },
];
const NEARBY_ROUTE_LIMIT = 10;

function updateSidebarPanelTabs(activePanel) {
  document.querySelectorAll("[data-sidebar-panel]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.sidebarPanel === activePanel,
    );
  });
}

function showSidebarPanel(activePanel) {
  currentSidebarPanel = activePanel;
  const grid = document.querySelector(".grid-container");
  const showNearby = activePanel === "nearby";
  const showGeoAdvisor = activePanel === "geoAdvisor";

  nearbySidebar.hidden = !showNearby;
  if (geoAdvisorSidebar) geoAdvisorSidebar.hidden = !showGeoAdvisor;
  if (sharedChatSidebar)
    sharedChatSidebar.hidden = showNearby || showGeoAdvisor;
  grid?.classList.toggle("nearby-open", showNearby || showGeoAdvisor);
  grid?.classList.remove("chat-collapsed");
  chatSidebarToggle?.setAttribute("aria-expanded", "true");
  updateSidebarPanelTabs(activePanel);

  window.setTimeout(() => {
    map.updateSize();
  }, 150);
}

function setNearbySidebarOpen(open) {
  showSidebarPanel(open ? "nearby" : "assistant");
}

function setGeoAdvisorSidebarOpen(open) {
  showSidebarPanel(open ? "geoAdvisor" : "assistant");
}

function formatNearbyDistance(meters) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2)} km`
    : `${Math.round(meters)} m`;
}

function formatNearbyDuration(seconds) {
  if (!Number.isFinite(seconds)) return "n/a";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes} min`;
}

function estimateNearbyDuration(distanceMeters, speedKmh) {
  const roadFactor = 1.25;
  const metersPerSecond = (speedKmh * 1000) / 3600;
  return (distanceMeters * roadFactor) / metersPerSecond;
}

function getNearbyDurationText(place, mode) {
  const duration = mode === "car" ? place.carDuration : place.walkDuration;
  if (Number.isFinite(duration)) {
    return `${formatNearbyDuration(duration)} <small class="nearby-time-source nearby-time-source--route">Route</small>`;
  }

  const estimatedSeconds = estimateNearbyDuration(
    place.distance,
    mode === "car" ? 35 : 5,
  );
  return `${formatNearbyDuration(estimatedSeconds)} <small class="nearby-time-source nearby-time-source--estimate">Estimate</small>`;
}

function escapeNearbyHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getHaversineDistanceMeters(a, b) {
  const radius = 6371008.8;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function getNearbyLabelText(name) {
  const text = String(name || "");
  return text.length > 28 ? `${text.slice(0, 25)}...` : text;
}

function getNearbyCategoryColor(category) {
  const colors = {
    School: "#2563eb",
    Hospital: "#dc2626",
    Park: "#16a34a",
    "Police Station": "#7c3aed",
    "Fire Station": "#f97316",
    "Bus Stop": "#0891b2",
  };
  return colors[category] || "#334155";
}

function getNearbyCategorySymbol(category) {
  const symbols = {
    School: "🏫",
    Hospital: "H",
    Park: "🌳",
    "Police Station": "P",
    "Fire Station": "🚒",
    "Bus Stop": "🚌",
  };
  return symbols[category] || "•";
}

function getNearbyPlaceStyle(feature) {
  const category = feature.get("category");
  const color = getNearbyCategoryColor(category);
  const symbol = getNearbyCategorySymbol(category);

  return [
    new Style({
      image: new CircleStyle({
        radius: 11,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: "#ffffff", width: 3 }),
      }),
    }),
    new Style({
      text: new Text({
        text: symbol,
        offsetY: symbol.length > 1 ? 1 : 0,
        font:
          symbol === "H" || symbol === "P"
            ? "bold 12px Calibri,sans-serif"
            : "14px sans-serif",
        fill: new Fill({ color: "#ffffff" }),
        stroke: new Stroke({ color: "rgba(15, 23, 42, 0.35)", width: 1 }),
      }),
    }),
    new Style({
      text: new Text({
        text: getNearbyLabelText(feature.get("name")),
        offsetY: -22,
        font: "12px Calibri,sans-serif",
        fill: new Fill({ color: "#111827" }),
        stroke: new Stroke({ color: "#ffffff", width: 3 }),
      }),
    }),
  ];
}

function getNearbyHighlightStyle(feature) {
  return [
    new Style({
      image: new CircleStyle({
        radius: 13,
        fill: new Fill({ color: "rgba(250, 204, 21, 0.25)" }),
        stroke: new Stroke({ color: "#facc15", width: 4 }),
      }),
    }),
    ...getNearbyPlaceStyle(feature),
  ];
}

function getRouteLineCoordinateSets(geometry) {
  if (!geometry) return [];
  const type = geometry.getType();
  if (type === "LineString") return [geometry.getCoordinates()];
  if (type === "MultiLineString") return geometry.getCoordinates();
  return [];
}

function createDirectionalRouteStyle({ color, width, lineDash, arrowColor }) {
  const lineStyle = new Style({
    stroke: new Stroke({
      color,
      width,
      lineDash,
    }),
  });

  return (feature) => {
    const styles = [lineStyle];
    const coordinateSets = getRouteLineCoordinateSets(feature.getGeometry());

    coordinateSets.forEach((coordinates) => {
      if (coordinates.length < 2) return;
      const step = Math.max(2, Math.floor(coordinates.length / 4));

      for (let index = step; index < coordinates.length; index += step) {
        const start = coordinates[index - 1];
        const end = coordinates[index];
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        if (!dx && !dy) continue;

        styles.push(
          new Style({
            geometry: new Point(end),
            image: new RegularShape({
              points: 3,
              radius: Math.max(6, width + 1),
              angle: Math.PI / 2,
              rotation: -Math.atan2(dy, dx),
              rotateWithView: true,
              fill: new Fill({ color: arrowColor || color }),
              stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
            }),
          }),
        );
      }
    });

    return styles;
  };
}

const nearbyCarRouteStyle = createDirectionalRouteStyle({
  color: "#1a73e8",
  width: 7,
});

const nearbyWalkRouteStyle = createDirectionalRouteStyle({
  color: "#64748b",
  width: 4,
  lineDash: [10, 10],
  arrowColor: "#334155",
});

const nearbyBusRouteStyle = createDirectionalRouteStyle({
  color: "#0ea5e9",
  width: 5,
});

function getNearbyRouteStyle(profile) {
  return profile === "foot-walking"
    ? nearbyWalkRouteStyle
    : nearbyCarRouteStyle;
}

function getSelectedNearbyCategories() {
  const selectedValues = Array.from(
    nearbyCategoryPanel?.querySelectorAll("input:checked") || [],
  ).map((input) => input.value);

  if (!selectedValues.length || selectedValues.includes("all")) {
    return nearbyCategories;
  }

  return nearbyCategories.filter((category) =>
    selectedValues.includes(category.group),
  );
}

function updateNearbyCategoryLabel() {
  const checkedInputs = Array.from(
    nearbyCategoryPanel?.querySelectorAll("input:checked") || [],
  );
  const selectedValues = checkedInputs.map((input) => input.value);

  if (!selectedValues.length || selectedValues.includes("all")) {
    nearbyCategoryLabel.textContent = "All";
    return;
  }

  nearbyCategoryLabel.textContent = checkedInputs
    .map((input) => input.parentElement.textContent.trim())
    .join(", ");
}

function positionNearbyCategoryPanel() {
  nearbyCategoryPanel.style.left = "0";
  nearbyCategoryPanel.style.top = "calc(100% + 4px)";
}

nearbyCategoryToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  positionNearbyCategoryPanel();
  nearbyCategoryPanel.hidden = !nearbyCategoryPanel.hidden;
});

nearbyCategoryPanel?.addEventListener("click", (event) => {
  event.stopPropagation();
});

nearbyCategoryPanel?.addEventListener("change", (event) => {
  const changed = event.target;
  const allInput = nearbyCategoryPanel.querySelector('input[value="all"]');
  const checkedInputs = Array.from(
    nearbyCategoryPanel.querySelectorAll("input:checked"),
  );

  if (changed.value === "all" && changed.checked) {
    nearbyCategoryPanel
      .querySelectorAll('input:not([value="all"])')
      .forEach((input) => {
        input.checked = false;
      });
  } else if (changed.value !== "all" && changed.checked) {
    allInput.checked = false;
  } else if (!checkedInputs.length) {
    allInput.checked = true;
  }

  updateNearbyCategoryLabel();
});

document.addEventListener("click", () => {
  if (nearbyCategoryPanel) nearbyCategoryPanel.hidden = true;
});

window.addEventListener("resize", () => {
  if (nearbyCategoryPanel && !nearbyCategoryPanel.hidden) {
    positionNearbyCategoryPanel();
  }
});

function getOverpassQuery([lon, lat], radius = 2000) {
  const categories = getSelectedNearbyCategories();
  const blocks = categories
    .map(
      (category) =>
        `node${category.query}(around:${radius},${lat},${lon});` +
        `way${category.query}(around:${radius},${lat},${lon});` +
        `relation${category.query}(around:${radius},${lat},${lon});`,
    )
    .join("");
  return `[out:json][timeout:25];(${blocks});out center tags;`;
}

function getOverpassBusRoutesQuery([lon, lat], radius = 90) {
  return `[out:json][timeout:25];relation["type"="route"]["route"="bus"](around:${radius},${lat},${lon});out tags geom;`;
}

function getNearbyCategory(tags = {}) {
  if (tags.amenity === "school") return "School";
  if (tags.amenity === "kindergarten") return "Kindergarten";
  if (tags.amenity === "hospital") return "Hospital";
  if (tags.leisure === "park") return "Park";
  if (tags.amenity === "police") return "Police Station";
  if (tags.amenity === "fire_station") return "Fire Station";
  if (tags.highway === "bus_stop" || tags.public_transport === "platform") {
    return "Bus Stop";
  }
  return "Nearby Place";
}

function getNearbyPlaceDetails(tags = {}) {
  const details = [
    tags.operator && `Operator: ${tags.operator}`,
    tags["addr:street"] && `Street: ${tags["addr:street"]}`,
    tags["addr:housenumber"] && `No: ${tags["addr:housenumber"]}`,
    tags["addr:city"] && `City: ${tags["addr:city"]}`,
    tags.opening_hours && `Hours: ${tags.opening_hours}`,
    tags.phone && `Phone: ${tags.phone}`,
    tags.website && `Website: ${tags.website}`,
    tags.wheelchair && `Wheelchair: ${tags.wheelchair}`,
  ].filter(Boolean);

  return details.slice(0, 5);
}

async function fetchNearbyPlaces(originLonLat) {
  const response = await fetch("https://overpass.kumi.systems/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ data: getOverpassQuery(originLonLat) }),
  });
  if (!response.ok) {
    throw new Error(`Overpass request failed with status ${response.status}`);
  }

  const data = await response.json();
  const seen = new Set();
  return (data.elements || [])
    .map((element) => {
      const lon = element.lon ?? element.center?.lon;
      const lat = element.lat ?? element.center?.lat;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      const id = `${element.type}.${element.id}`;
      if (seen.has(id)) return null;
      seen.add(id);
      const tags = element.tags || {};
      return {
        id,
        name: tags.name || getNearbyCategory(tags),
        category: getNearbyCategory(tags),
        details: getNearbyPlaceDetails(tags),
        osmType: element.type,
        osmId: element.id,
        lonLat: [lon, lat],
        distance: getHaversineDistanceMeters(originLonLat, [lon, lat]),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);
}

function clearNearbyResultLayers() {
  if (nearbyResultsLayer) map.removeLayer(nearbyResultsLayer);
  if (nearbyHighlightLayer) map.removeLayer(nearbyHighlightLayer);
  if (nearbyRouteLayer) map.removeLayer(nearbyRouteLayer);
  if (nearbyBusRouteLayer) map.removeLayer(nearbyBusRouteLayer);
  nearbyResultsLayer = null;
  nearbyHighlightLayer = null;
  nearbyRouteLayer = null;
  nearbyBusRouteLayer = null;
}

function createNearbyResultFeature(place) {
  return new Feature({
    geometry: new Point(
      fromLonLat(place.lonLat, map.getView().getProjection()),
    ),
    placeId: place.id,
    name: place.name,
    category: place.category,
    distance: place.distance,
  });
}

function displayNearbyPlacesOnMap(places) {
  clearNearbyResultLayers();
  const features = places.map(createNearbyResultFeature);
  nearbyResultsLayer = new VectorLayer({
    source: new VectorSource({ features }),
    style: getNearbyPlaceStyle,
    displayInLayerSwitcher: false,
  });
  nearbyResultsLayer.setZIndex(180);
  map.addLayer(nearbyResultsLayer);

  nearbyHighlightLayer = new VectorLayer({
    source: new VectorSource(),
    style: getNearbyHighlightStyle,
    displayInLayerSwitcher: false,
  });
  nearbyHighlightLayer.setZIndex(181);
  map.addLayer(nearbyHighlightLayer);

  nearbyRouteLayer = new VectorLayer({
    source: new VectorSource(),
    style: nearbyCarRouteStyle,
    displayInLayerSwitcher: false,
  });
  nearbyRouteLayer.setZIndex(179);
  map.addLayer(nearbyRouteLayer);

  nearbyBusRouteLayer = new VectorLayer({
    source: new VectorSource(),
    style: nearbyBusRouteStyle,
    displayInLayerSwitcher: false,
  });
  nearbyBusRouteLayer.setZIndex(178);
  map.addLayer(nearbyBusRouteLayer);
}

function scrollNearbyCardIntoView(placeId) {
  const card = Array.from(nearbyResults.querySelectorAll(".nearby-card")).find(
    (item) => item.dataset.placeId === placeId,
  );
  if (!card) return;

  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  card.focus({ preventScroll: true });
}

function highlightNearbyPlace(placeId, shouldZoom = true) {
  const place = nearbyLastPlaces.find((item) => item.id === placeId);
  if (!place || !nearbyHighlightLayer) return;

  const highlightFeature = createNearbyResultFeature(place);
  nearbyHighlightLayer.getSource().clear();
  nearbyHighlightLayer.getSource().addFeature(highlightFeature);

  nearbyResults
    .querySelectorAll(".nearby-card")
    .forEach((card) =>
      card.classList.toggle(
        "nearby-card--active",
        card.dataset.placeId === placeId,
      ),
    );

  if (shouldZoom) {
    map.getView().animate({
      center: fromLonLat(place.lonLat, map.getView().getProjection()),
      zoom: Math.max(map.getView().getZoom() || 14, 17),
      duration: 450,
    });
  }
}

function getNearbyPlaceIdAtPixel(pixel) {
  let nearbyPlaceId = null;
  map.forEachFeatureAtPixel(
    pixel,
    (feature) => {
      nearbyPlaceId = feature.get("placeId");
      return Boolean(nearbyPlaceId);
    },
    {
      hitTolerance: 8,
      layerFilter: (layer) =>
        layer === nearbyResultsLayer || layer === nearbyHighlightLayer,
    },
  );
  return nearbyPlaceId;
}

function getGeoAdvisorValueText(value) {
  if (!Number.isFinite(value)) return "n/a";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

async function getReferenceZoneFeatureAtCoordinate(coordinate) {
  const pixel = map.getPixelFromCoordinate(coordinate);
  let features = [];

  if (typeof referenceZones2025Layer.getFeatures === "function") {
    features = await referenceZones2025Layer.getFeatures(pixel);
  }

  if (!features.length) {
    features = getVectorTileFeaturesAtPixel(referenceZones2025Layer, pixel);
  }

  return features[0] || null;
}

function renderGeoAdvisorChart(values) {
  const canvas = document.getElementById("geoAdvisorChart");
  if (!canvas) return;
  if (geoAdvisorChart) geoAdvisorChart.destroy();

  geoAdvisorChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["2019", "2023", "2025"],
      datasets: [
        {
          label: "Reference value",
          data: values,
          borderColor: "#1a73e8",
          backgroundColor: "rgba(26, 115, 232, 0.16)",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1a73e8",
          tension: 0.25,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: false },
      },
    },
  });
}

function parseGeoAdvisorNumber(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/,/g, ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function getGeoAdvisorPercentText(percent) {
  if (!Number.isFinite(percent)) return "n/a";
  return `${Math.abs(percent).toFixed(1)}%`;
}

function renderGeoAdvisorCompareChart(
  referencePrice,
  userPrice,
  referenceTotal,
  propertyValue,
) {
  const canvas = document.getElementById("geoAdvisorCompareChart");
  if (!canvas) return;
  if (geoAdvisorCompareChart) geoAdvisorCompareChart.destroy();

  geoAdvisorCompareChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Reference m²", "Your m²"],
      datasets: [
        {
          label: "Value per square meter",
          data: [referencePrice, userPrice],
          backgroundColor: [
            "rgba(26, 115, 232, 0.72)",
            "rgba(249, 115, 22, 0.72)",
          ],
          borderColor: ["#1a73e8", "#f97316"],
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: "Value for square meters",
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });

  const totalCanvas = document.getElementById("geoAdvisorTotalChart");
  if (!totalCanvas) return;
  if (geoAdvisorTotalChart) geoAdvisorTotalChart.destroy();

  geoAdvisorTotalChart = new Chart(totalCanvas, {
    type: "bar",
    data: {
      labels: ["Reference total", "Your total"],
      datasets: [
        {
          label: "Total value",
          data: [referenceTotal, propertyValue],
          backgroundColor: [
            "rgba(26, 115, 232, 0.72)",
            "rgba(249, 115, 22, 0.72)",
          ],
          borderColor: ["#1a73e8", "#f97316"],
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: "Total value",
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });
}

function calculateGeoAdvisorProperty() {
  if (!geoAdvisorCurrentContext) return;

  const valueInput = document.getElementById("geoAdvisorPropertyValue");
  const areaInput = document.getElementById("geoAdvisorPropertyArea");
  const output = document.getElementById("geoAdvisorCalculationResult");
  const propertyValue = parseGeoAdvisorNumber(valueInput?.value);
  const propertyArea = parseGeoAdvisorNumber(areaInput?.value);
  const referencePrice = geoAdvisorCurrentContext.value2025;

  if (!output) return;

  if (!Number.isFinite(referencePrice)) {
    output.innerHTML =
      '<div class="nearby-empty">The reference zone does not have a readable 2025 price.</div>';
    return;
  }

  if (
    !propertyValue ||
    propertyValue <= 0 ||
    !propertyArea ||
    propertyArea <= 0
  ) {
    output.innerHTML =
      '<div class="geo-advisor-calculation__hint">Enter a property value and area greater than zero.</div>';
    return;
  }

  const userPrice = propertyValue / propertyArea;
  const referenceTotal = referencePrice * propertyArea;
  const differencePerSquareMeter = userPrice - referencePrice;
  const differenceTotal = propertyValue - referenceTotal;
  const percentDifference = (differencePerSquareMeter / referencePrice) * 100;
  const percentBadgeText =
    differencePerSquareMeter >= 0
      ? `+${getGeoAdvisorPercentText(percentDifference)}`
      : `-${getGeoAdvisorPercentText(percentDifference)}`;
  const isModerateDifference = Math.abs(differencePerSquareMeter) <= 10000;
  const differenceToneClass = isModerateDifference
    ? "geo-advisor-difference--moderate"
    : differencePerSquareMeter >= 0
      ? "geo-advisor-difference--positive"
      : "geo-advisor-difference--negative";
  const toneClass =
    differencePerSquareMeter >= 0
      ? "geo-advisor-comparison--above"
      : "geo-advisor-comparison--below";

  output.innerHTML = `
    <div class="geo-advisor-comparison ${toneClass}">
      <div>
        <div class="geo-advisor-card__label">Price per m²</div>
        <div class="geo-advisor-price-pair">
          <div>
            <span>Your price</span>
            <b>${escapeNearbyHtml(getGeoAdvisorValueText(userPrice))}</b>
            <small class="geo-advisor-percent-badge ${differenceToneClass}">${escapeNearbyHtml(percentBadgeText)}</small>
          </div>
          <div>
            <span>Reference</span>
            <b>${escapeNearbyHtml(getGeoAdvisorValueText(referencePrice))}</b>
          </div>
          <div class="geo-advisor-difference ${differenceToneClass}">
            <span>Difference</span>
            <b>${escapeNearbyHtml(getGeoAdvisorValueText(differencePerSquareMeter))}</b>
          </div>
        </div>
      </div>
      <div>
        <div class="geo-advisor-card__label">Total value</div>
        <div class="geo-advisor-price-pair">
          <div>
            <span>Your total</span>
            <b>${escapeNearbyHtml(getGeoAdvisorValueText(propertyValue))}</b>
            <small class="geo-advisor-percent-badge ${differenceToneClass}">${escapeNearbyHtml(percentBadgeText)}</small>
          </div>
          <div>
            <span>Reference total</span>
            <b>${escapeNearbyHtml(getGeoAdvisorValueText(referenceTotal))}</b>
          </div>
          <div class="geo-advisor-difference ${differenceToneClass}">
            <span>Difference</span>
            <b>${escapeNearbyHtml(getGeoAdvisorValueText(differenceTotal))}</b>
          </div>
        </div>
      </div>
      <div class="geo-advisor-compare-chart">
        <canvas id="geoAdvisorCompareChart"></canvas>
      </div>
      <div class="geo-advisor-compare-chart">
        <canvas id="geoAdvisorTotalChart"></canvas>
      </div>
    </div>
  `;

  renderGeoAdvisorCompareChart(
    referencePrice,
    userPrice,
    referenceTotal,
    propertyValue,
  );
}

function bindGeoAdvisorCalculator() {
  const calculateButton = document.getElementById("geoAdvisorCalculate");
  calculateButton?.addEventListener("click", calculateGeoAdvisorProperty);
  document
    .querySelectorAll("#geoAdvisorPropertyValue, #geoAdvisorPropertyArea")
    .forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          calculateGeoAdvisorProperty();
        }
      });
    });
}

async function analyzeGeoAdvisorLocation(coordinate) {
  if (!geoAdvisorResults) return;

  geoAdvisorResults.innerHTML =
    '<div class="nearby-loading">Reading reference zone...</div>';

  const lonLat = toLonLat(coordinate);
  geoAdvisorSubtitle.textContent = `${lonLat[1].toFixed(5)}, ${lonLat[0].toFixed(5)}`;

  const wasVisible = referenceZones2025Layer.getVisible();
  referenceZones2025Layer.setVisible(true);
  map.renderSync();
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const feature = await getReferenceZoneFeatureAtCoordinate(coordinate);
  if (!feature) {
    referenceZones2025Layer.setVisible(wasVisible);
    geoAdvisorCurrentContext = null;
    geoAdvisorResults.innerHTML =
      '<div class="nearby-empty">No reference zone feature was found at this location. Try zooming in or enabling reference_zones_2025.</div>';
    return;
  }

  const zoneName = getLabelProperty(feature) || "Unnamed zone";
  const values = [2019, 2023, 2025].map((year) =>
    getNumericFeatureValueForYear(feature, year),
  );
  const value2025 = values[2];
  geoAdvisorCurrentContext = {
    zoneName,
    values,
    value2025,
  };

  geoAdvisorResults.innerHTML = `
    <div class="geo-advisor-card">
      <div>
        <div class="geo-advisor-card__label">Reference zone</div>
        <div class="geo-advisor-card__name">${escapeNearbyHtml(zoneName)}</div>
      </div>
      <div>
        <div class="geo-advisor-card__label">2025 value</div>
        <div class="geo-advisor-card__value">${escapeNearbyHtml(getGeoAdvisorValueText(value2025))}</div>
      </div>
      <div class="geo-advisor-card__meta">
        2019: ${escapeNearbyHtml(getGeoAdvisorValueText(values[0]))}
        &nbsp; 2023: ${escapeNearbyHtml(getGeoAdvisorValueText(values[1]))}
        &nbsp; 2025: ${escapeNearbyHtml(getGeoAdvisorValueText(values[2]))}
      </div>
      <div class="geo-advisor-chart">
        <canvas id="geoAdvisorChart"></canvas>
      </div>
      <div class="geo-advisor-calculator">
        <div class="geo-advisor-card__label">Property calculator</div>
        <label>
          <span>Property value</span>
          <input id="geoAdvisorPropertyValue" type="number" min="0" step="0.01" placeholder="e.g. 120000" />
        </label>
        <label>
          <span>Property area m²</span>
          <input id="geoAdvisorPropertyArea" type="number" min="0" step="0.01" placeholder="e.g. 85" />
        </label>
        <button id="geoAdvisorCalculate" type="button">Calculate</button>
      </div>
      <div id="geoAdvisorCalculationResult" class="geo-advisor-calculation-result">
        <div class="geo-advisor-calculation__hint">
          Add value and area to compare your price per m² with the 2025 reference price.
        </div>
      </div>
    </div>
  `;
  renderGeoAdvisorChart(values);
  bindGeoAdvisorCalculator();
}

async function fetchNearbyRouteFeature(
  originLonLat,
  destinationLonLat,
  profile,
) {
  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
    {
      method: "POST",
      headers: {
        Authorization: OPEN_ROUTE_SERVICE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [originLonLat, destinationLonLat],
      }),
    },
  );

  if (!response.ok) return null;

  const geojson = await response.json();
  const routeGeoJson = geojson.features?.[0];
  if (!routeGeoJson) return null;

  return new GeoJSON().readFeature(routeGeoJson, {
    dataProjection: "EPSG:4326",
    featureProjection: map.getView().getProjection(),
  });
}

function createNearbyStraightPathFeature(place) {
  return new Feature({
    geometry: new LineString([
      nearbyOriginCoordinate,
      fromLonLat(place.lonLat, map.getView().getProjection()),
    ]),
  });
}

async function updateNearbyPath(place, profile = "driving-car") {
  if (!nearbyRouteLayer || !nearbyOriginCoordinate) return;

  const requestId = ++nearbyRouteRequestId;
  nearbyBusRouteLayer?.getSource().clear();
  nearbyRouteLayer.setStyle(getNearbyRouteStyle(profile));
  nearbyRouteLayer.getSource().clear();
  nearbyRouteLayer
    .getSource()
    .addFeature(createNearbyStraightPathFeature(place));

  const originLonLat = toLonLat(nearbyOriginCoordinate);
  try {
    const routeFeature = await fetchNearbyRouteFeature(
      originLonLat,
      place.lonLat,
      profile,
    );
    if (requestId !== nearbyRouteRequestId || !routeFeature) return;
    nearbyRouteLayer.getSource().clear();
    nearbyRouteLayer.getSource().addFeature(routeFeature);
  } catch (error) {
    console.warn(
      "Nearby route path unavailable; showing straight line.",
      error,
    );
  }
}

function getNearbyBusRouteName(route) {
  const tags = route.tags || {};
  return (
    tags.ref ||
    tags.name ||
    tags.route_ref ||
    tags.operator ||
    `Route ${route.osmId}`
  );
}

function createNearbyBusRouteFeature(route) {
  return new Feature({
    geometry: new MultiLineString(route.segments),
    name: route.name,
    osmId: route.osmId,
  });
}

function getNearbyBusRouteCardHtml(place) {
  if (place.category !== "Bus Stop") return "";

  if (place.busRoutesLoading) {
    return `<div class="nearby-bus-routes">Reading bus lines...</div>`;
  }

  if (place.busRoutesError) {
    return `<div class="nearby-bus-routes nearby-bus-routes--empty">${escapeNearbyHtml(place.busRoutesError)}</div>`;
  }

  if (!place.busRoutes) {
    return `
      <div class="nearby-bus-routes">
        <button type="button" class="nearby-bus-routes__load" data-load-bus-routes>
          Show bus lines
        </button>
      </div>
    `;
  }

  if (!place.busRoutes.length) {
    return `<div class="nearby-bus-routes nearby-bus-routes--empty">No OSM bus route relations found near this stop.</div>`;
  }

  return `
    <div class="nearby-bus-routes">
      <div class="nearby-bus-routes__label">Bus lines</div>
      <div class="nearby-bus-routes__chips">
        ${place.busRoutes
          .map(
            (route, index) => `
              <button type="button" data-bus-route-index="${index}">
                ${escapeNearbyHtml(route.name)}
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

async function fetchNearbyBusRoutes(place) {
  const response = await fetch("https://overpass.kumi.systems/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({
      data: getOverpassBusRoutesQuery(place.lonLat),
    }),
  });

  if (!response.ok) {
    throw new Error(`Bus routes request failed with status ${response.status}`);
  }

  const data = await response.json();
  return (data.elements || [])
    .filter((element) => element.type === "relation")
    .map((element) => {
      const segments = (element.members || [])
        .map((member) =>
          (member.geometry || [])
            .filter(
              (point) =>
                Number.isFinite(point.lon) && Number.isFinite(point.lat),
            )
            .map((point) =>
              fromLonLat([point.lon, point.lat], map.getView().getProjection()),
            ),
        )
        .filter((segment) => segment.length > 1);

      if (!segments.length) return null;

      return {
        osmId: element.id,
        tags: element.tags || {},
        name: getNearbyBusRouteName({
          osmId: element.id,
          tags: element.tags || {},
        }),
        segments,
      };
    })
    .filter(Boolean);
}

function updateNearbyBusRoutesSection(place) {
  const card = Array.from(nearbyResults.querySelectorAll(".nearby-card")).find(
    (item) => item.dataset.placeId === place.id,
  );
  const section = card?.querySelector("[data-bus-routes-section]");
  if (!section) return;

  section.innerHTML = getNearbyBusRouteCardHtml(place);
  bindNearbyBusRouteButtons(card, place);
}

function showNearbyBusRoute(route) {
  if (!nearbyBusRouteLayer) return;

  nearbyRouteLayer?.getSource().clear();
  nearbyBusRouteLayer.getSource().clear();
  nearbyBusRouteLayer
    .getSource()
    .addFeature(createNearbyBusRouteFeature(route));

  const extent = nearbyBusRouteLayer.getSource().getExtent();
  map.getView().fit(extent, {
    padding: [80, 420, 80, 80],
    duration: 450,
    maxZoom: 16,
  });
}

async function loadNearbyBusRoutes(place) {
  if (place.busRoutes || place.busRoutesLoading) return;

  place.busRoutesLoading = true;
  updateNearbyBusRoutesSection(place);

  try {
    place.busRoutes = await fetchNearbyBusRoutes(place);
    place.busRoutesError = null;
  } catch (error) {
    console.warn("Nearby bus routes unavailable.", error);
    place.busRoutesError = "Could not read OSM bus lines for this stop.";
  } finally {
    place.busRoutesLoading = false;
    updateNearbyBusRoutesSection(place);
  }
}

function bindNearbyBusRouteButtons(card, place) {
  card
    .querySelector("[data-load-bus-routes]")
    ?.addEventListener("click", (event) => {
      event.stopPropagation();
      loadNearbyBusRoutes(place);
    });

  card.querySelectorAll("[data-bus-route-index]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const route = place.busRoutes?.[Number(button.dataset.busRouteIndex)];
      if (!route) return;
      highlightNearbyPlace(place.id, false);
      showNearbyBusRoute(route);
    });
  });
}

async function fetchOrsDurations(originLonLat, places, profile) {
  if (!places.length) return [];
  const locations = [originLonLat, ...places.map((place) => place.lonLat)];

  let durations = [];
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/matrix/${profile}`,
      {
        method: "POST",
        headers: {
          Authorization: OPEN_ROUTE_SERVICE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locations,
          sources: [0],
          destinations: places.map((_, index) => index + 1),
          metrics: ["duration"],
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      durations = data.durations?.[0] || [];
    } else {
      console.warn(`ORS matrix ${profile} failed:`, await response.text());
    }
  } catch (error) {
    console.warn(`ORS matrix ${profile} failed:`, error);
  }

  const missingIndexes = places
    .map((_, index) => index)
    .filter((index) => !Number.isFinite(durations[index]));

  if (!missingIndexes.length) return durations;

  await Promise.all(
    missingIndexes.slice(0, NEARBY_ROUTE_LIMIT).map(async (index) => {
      durations[index] = await fetchOrsDirectionDuration(
        originLonLat,
        places[index].lonLat,
        profile,
      );
    }),
  );

  return durations;
}

async function fetchOrsDirectionDuration(
  originLonLat,
  destinationLonLat,
  profile,
) {
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
      {
        method: "POST",
        headers: {
          Authorization: OPEN_ROUTE_SERVICE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [originLonLat, destinationLonLat],
        }),
      },
    );

    if (!response.ok) {
      console.warn(`ORS directions ${profile} failed:`, await response.text());
      return null;
    }

    const data = await response.json();
    return data.features?.[0]?.properties?.summary?.duration ?? null;
  } catch (error) {
    console.warn(`ORS directions ${profile} failed:`, error);
    return null;
  }
}

function renderNearbyResults(places) {
  if (!places.length) {
    nearbyResults.innerHTML =
      '<div class="nearby-empty">No nearby OSM features found.</div>';
    return;
  }

  const routeNote = places.some(
    (place) =>
      !Number.isFinite(place.carDuration) ||
      !Number.isFinite(place.walkDuration),
  )
    ? `<div class="nearby-route-note">ORS route times are unavailable for one or more results, so estimated times are shown from straight-line distance.</div>`
    : "";

  nearbyResults.innerHTML =
    routeNote +
    places
      .map(
        (place) => `
        <article class="nearby-card" data-place-id="${escapeNearbyHtml(place.id)}" tabindex="0">
          <div class="nearby-card__top">
            <div>
              <div class="nearby-card__title">${escapeNearbyHtml(place.name)}</div>
              <div class="nearby-card__type">${escapeNearbyHtml(place.category)}</div>
            </div>
            <div class="nearby-card__distance">${formatNearbyDistance(place.distance)}</div>
          </div>
          <div class="nearby-card__meta">
            OSM ${escapeNearbyHtml(place.osmType)} ${escapeNearbyHtml(place.osmId)}
          </div>
          ${
            place.details?.length
              ? `<ul class="nearby-card__details">${place.details
                  .map((detail) => `<li>${escapeNearbyHtml(detail)}</li>`)
                  .join("")}</ul>`
              : '<div class="nearby-card__details nearby-card__details--empty">No extra OSM details returned.</div>'
          }
          <div class="nearby-card__times">
            <button type="button" data-route-profile="driving-car">
              Car: ${getNearbyDurationText(place, "car")}
            </button>
            <button type="button" data-route-profile="foot-walking">
              Walk: ${getNearbyDurationText(place, "walk")}
            </button>
          </div>
          <div data-bus-routes-section>
            ${getNearbyBusRouteCardHtml(place)}
          </div>
        </article>
      `,
      )
      .join("");

  nearbyResults.querySelectorAll(".nearby-card").forEach((card) => {
    const openPlace = () => highlightNearbyPlace(card.dataset.placeId, true);
    card.addEventListener("click", openPlace);
    card.querySelectorAll("[data-route-profile]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openPlace();
        const place = nearbyLastPlaces.find(
          (item) => item.id === card.dataset.placeId,
        );
        if (place) updateNearbyPath(place, button.dataset.routeProfile);
      });
    });
    const place = nearbyLastPlaces.find(
      (item) => item.id === card.dataset.placeId,
    );
    if (place) bindNearbyBusRouteButtons(card, place);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPlace();
      }
    });
  });
}

function setNearbyMarker(coordinate) {
  if (nearbyMarkerLayer) map.removeLayer(nearbyMarkerLayer);
  nearbyMarkerLayer = new VectorLayer({
    source: new VectorSource({
      features: [
        new Feature({
          geometry: new Point(coordinate),
        }),
      ],
    }),
    style: new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: "rgba(239, 68, 68, 0.95)" }),
        stroke: new Stroke({ color: "#ffffff", width: 2 }),
      }),
    }),
    displayInLayerSwitcher: false,
  });
  map.addLayer(nearbyMarkerLayer);
}

async function runNearbyAnalysis(coordinate) {
  setNearbySidebarOpen(true);
  nearbyOriginCoordinate = coordinate;
  setNearbyMarker(coordinate);
  nearbyResults.innerHTML =
    '<div class="nearby-loading">Reading OpenStreetMap and routes...</div>';

  const originLonLat = toLonLat(coordinate);
  nearbySidebarSubtitle.textContent = `${originLonLat[1].toFixed(5)}, ${originLonLat[0].toFixed(5)}`;
  analyzeGeoAdvisorLocation(coordinate);

  try {
    const places = await fetchNearbyPlaces(originLonLat);
    nearbyLastPlaces = places;
    displayNearbyPlacesOnMap(places);
    renderNearbyResults(places);
    if (places[0]) highlightNearbyPlace(places[0].id, false);

    const routeTargets = places.slice(0, NEARBY_ROUTE_LIMIT);
    const [carDurations, walkDurations] = await Promise.all([
      fetchOrsDurations(originLonLat, routeTargets, "driving-car"),
      fetchOrsDurations(originLonLat, routeTargets, "foot-walking"),
    ]);

    routeTargets.forEach((place, index) => {
      place.carDuration = carDurations[index];
      place.walkDuration = walkDurations[index];
    });

    renderNearbyResults(places);
    if (places[0]) highlightNearbyPlace(places[0].id, false);
  } catch (error) {
    console.error(error);
    nearbyResults.innerHTML = `<div class="nearby-empty">${error.message}</div>`;
  }
}

function activateNearbyPick() {
  nearbyPickActive = true;
  nearbyAnalysisBtn.classList.add("active");
  setNearbySidebarOpen(true);
  nearbyResults.innerHTML =
    '<div class="nearby-empty">Click anywhere on the map to analyze nearby services.</div>';
}

nearbyAnalysisBtn.addEventListener("click", activateNearbyPick);
nearbySidebarClose.addEventListener("click", () => setNearbySidebarOpen(false));
geoAdvisorClose?.addEventListener("click", () =>
  setGeoAdvisorSidebarOpen(false),
);
document.querySelectorAll("[data-sidebar-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    showSidebarPanel(button.dataset.sidebarPanel);
  });
});
map.on("click", (event) => {
  if (!nearbyPickActive) return;
  nearbyPickActive = false;
  nearbyAnalysisBtn.classList.remove("active");
  runNearbyAnalysis(event.coordinate);
});

map.on("click", (event) => {
  if (nearbyPickActive) return;

  const nearbyPlaceId = getNearbyPlaceIdAtPixel(event.pixel);
  if (!nearbyPlaceId) return;

  setNearbySidebarOpen(true);
  highlightNearbyPlace(nearbyPlaceId, false);
  scrollNearbyCardIntoView(nearbyPlaceId);
});

map.on("pointermove", (event) => {
  if (event.dragging || nearbyPickActive) return;

  const nearbyPlaceId = getNearbyPlaceIdAtPixel(event.pixel);
  const target = map.getTargetElement();
  if (target) {
    target.style.cursor = nearbyPlaceId ? "pointer" : "";
  }
});

//Site Selection
// Elements
const siteSelectionBtn = document.getElementById("site-selection");
const siteSelectionModal = document.getElementById("siteSelectionModal");

const demandSelect = document.getElementById("demandLayerSelect");
const facilitiesSelect = document.getElementById("existingLayerSelect");

const candidateLayerType = document.getElementById("candidateLayerType");
const candidateLayerNameWrapper = document.getElementById(
  "candidateLayerNameWrapper",
);
const candidateLayerSelectWrapper = document.getElementById(
  "candidateLayerSelectWrapper",
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
    makeDefaultOption("Select candidate layer..."),
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
      ":",
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
let xyCsvRows = [];
let xyCsvHeaders = [];

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      index++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index++;
      row.push(value.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

function setXyCsvStatus(message, isError = false) {
  const status = document.getElementById("xyCsvStatus");
  status.textContent = message || "";
  status.style.color = isError ? "#b91c1c" : "#64748b";
}

function populateXyCsvColumns(headers) {
  const xSelect = document.getElementById("xyCsvXColumn");
  const ySelect = document.getElementById("xyCsvYColumn");
  xSelect.innerHTML = "";
  ySelect.innerHTML = "";

  headers.forEach((header) => {
    const xOption = new Option(header, header);
    const yOption = new Option(header, header);
    xSelect.add(xOption);
    ySelect.add(yOption);
  });

  const findColumn = (patterns) =>
    headers.find((header) =>
      patterns.some((pattern) => header.toLowerCase().includes(pattern)),
    );
  const xColumn = findColumn(["x", "lon", "lng", "east"]);
  const yColumn = findColumn(["y", "lat", "north"]);

  if (xColumn) xSelect.value = xColumn;
  if (yColumn) ySelect.value = yColumn;
}

function renderXyPointList() {
  const list = document.getElementById("xyPointList");
  list.innerHTML = "";
  xyPoints.forEach((point, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. X: ${point.x}, Y: ${point.y}`;
    list.appendChild(li);
  });
}

// open modal when button clicked
document.getElementById("add-xy").addEventListener("click", () => {
  xyPoints = [];
  xyCsvRows = [];
  xyCsvHeaders = [];
  document.getElementById("xyPointList").innerHTML = "";
  document.getElementById("xyCsvFile").value = "";
  document.getElementById("xyCsvColumns").hidden = true;
  document.getElementById("xyLayerName").value = "";
  setXyCsvStatus("");
  document.getElementById("xyModal").style.display = "block";
});

// close modal
document.getElementById("xyClose").addEventListener("click", () => {
  document.getElementById("xyModal").style.display = "none";
});

// CREATE EMPTY VECTOR LAYER
const vectorLayerModal = document.getElementById("vectorLayerModal");
const vectorFieldsList = document.getElementById("vectorFieldsList");

function openVectorLayerModal() {
  document.getElementById("vectorLayerName").value = "";
  document.getElementById("vectorGeometryType").value = "Point";
  document.getElementById("vectorStrokeColor").value = "#2563eb";
  document.getElementById("vectorFillColor").value = "#60a5fa";
  document.getElementById("vectorStrokeWidth").value = "2";
  document.getElementById("vectorPointSize").value = "7";
  vectorFieldsList.innerHTML = "";
  addVectorFieldRow("name", "text");
  vectorLayerModal.style.display = "flex";
}

function closeVectorLayerModal() {
  vectorLayerModal.style.display = "none";
}

function addVectorFieldRow(fieldName = "", fieldType = "text") {
  const row = document.createElement("div");
  row.className = "vector-field-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Field name";
  nameInput.value = fieldName;

  const typeSelect = document.createElement("select");
  ["text", "number", "date", "boolean"].forEach((type) => {
    typeSelect.add(new Option(type, type));
  });
  typeSelect.value = fieldType;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "vector-field-remove";
  removeButton.textContent = "x";
  removeButton.title = "Remove field";
  removeButton.addEventListener("click", () => row.remove());

  row.append(nameInput, typeSelect, removeButton);
  vectorFieldsList.appendChild(row);
}

function getVectorLayerFields() {
  const fields = [];
  const names = new Set();

  vectorFieldsList.querySelectorAll(".vector-field-row").forEach((row) => {
    const [nameInput, typeSelect] = row.querySelectorAll("input, select");
    const name = nameInput.value.trim();
    const type = typeSelect.value;

    if (!name || names.has(name)) return;
    if (["geometry", "geom", "the_geom", "wkb_geometry"].includes(name)) return;

    names.add(name);
    fields.push({ name, type });
  });

  return fields;
}

function hexToRgba(hex, alpha = 1) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function createVectorLayerStyle(config) {
  const stroke = new Stroke({
    color: config.strokeColor,
    width: config.strokeWidth,
  });
  const fill = new Fill({
    color: hexToRgba(config.fillColor, 0.28),
  });

  return new Style({
    image: new CircleStyle({
      radius: config.pointSize,
      fill: new Fill({ color: config.fillColor }),
      stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
    }),
    stroke,
    fill,
  });
}

function createEmptyVectorLayer() {
  const createdLayerName = document
    .getElementById("vectorLayerName")
    .value.trim();
  const geometryType = document.getElementById("vectorGeometryType").value;
  const fields = getVectorLayerFields();

  if (!createdLayerName) {
    alert("Type a layer name first.");
    return;
  }

  const styleConfig = {
    strokeColor: document.getElementById("vectorStrokeColor").value,
    fillColor: document.getElementById("vectorFillColor").value,
    strokeWidth:
      Number(document.getElementById("vectorStrokeWidth").value) || 2,
    pointSize: Number(document.getElementById("vectorPointSize").value) || 7,
  };
  const layerProjection = map.getView().getProjection().getCode();
  const createdVectorSource = new VectorSource();
  const createdVectorLayer = new VectorLayer({
    title: createdLayerName,
    source: createdVectorSource,
    style: createVectorLayerStyle(styleConfig),
    displayInLayerSwitcher: true,
  });

  createdVectorLayer.set("editableVector", true);
  createdVectorLayer.set("createdVectorLayer", true);
  createdVectorLayer.set("geometryType", geometryType);
  createdVectorLayer.set("attributeSchema", fields);
  createdVectorLayer.set("styleConfig", styleConfig);
  createdVectorLayer.set("featureProjection", layerProjection);
  createdVectorLayer.set("sourceProjection", layerProjection);

  map.addLayer(createdVectorLayer);
  registerPersistentVectorLayer(createdVectorLayer, "created");
  selectedLayer = createdVectorLayer;
  layerTitle = createdLayerName;
  layerName = layerTitle;
  layerType = geometryType;
  vectorLayer = createdVectorLayer;
  source = createdVectorSource;
  wfsVectorLayer = createdVectorLayer;
  wfsVectorSource = createdVectorSource;
  closeVectorLayerModal();
}

document
  .getElementById("create-vector-layer")
  .addEventListener("click", openVectorLayerModal);
document
  .getElementById("vectorLayerClose")
  .addEventListener("click", closeVectorLayerModal);
document
  .getElementById("createVectorLayerCancel")
  .addEventListener("click", closeVectorLayerModal);
document
  .getElementById("addVectorField")
  .addEventListener("click", () => addVectorFieldRow());
document
  .getElementById("createVectorLayerApply")
  .addEventListener("click", createEmptyVectorLayer);

document
  .getElementById("xyCsvFile")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    xyCsvRows = [];
    xyCsvHeaders = [];
    document.getElementById("xyCsvColumns").hidden = true;

    if (!file) {
      setXyCsvStatus("");
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsvText(text);
      if (rows.length < 2) {
        throw new Error(
          "CSV must contain a header row and at least one data row.",
        );
      }

      xyCsvHeaders = rows[0].map(
        (header, index) => header || `Column ${index + 1}`,
      );
      xyCsvRows = rows.slice(1).map((row) =>
        xyCsvHeaders.reduce((record, header, index) => {
          record[header] = row[index] ?? "";
          return record;
        }, {}),
      );

      populateXyCsvColumns(xyCsvHeaders);
      document.getElementById("xyCsvColumns").hidden = false;
      document.getElementById("xyLayerName").value ||= file.name.replace(
        /\.csv$/i,
        "",
      );
      setXyCsvStatus(`${xyCsvRows.length} CSV rows loaded.`);
    } catch (error) {
      console.error(error);
      setXyCsvStatus(error.message, true);
    }
  });

document.getElementById("xyLoadCsvPoints").addEventListener("click", () => {
  const xColumn = document.getElementById("xyCsvXColumn").value;
  const yColumn = document.getElementById("xyCsvYColumn").value;

  if (!xyCsvRows.length || !xColumn || !yColumn) {
    setXyCsvStatus("Load a CSV and choose X/Y columns first.", true);
    return;
  }

  let skipped = 0;
  const csvPoints = xyCsvRows
    .map((row) => {
      const x = Number(String(row[xColumn]).replace(",", "."));
      const y = Number(String(row[yColumn]).replace(",", "."));
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        skipped++;
        return null;
      }
      return { x, y, properties: row };
    })
    .filter(Boolean);

  xyPoints.push(...csvPoints);
  renderXyPointList();
  setXyCsvStatus(
    `Added ${csvPoints.length} CSV points${skipped ? `, skipped ${skipped}` : ""}.`,
    skipped > 0 && csvPoints.length === 0,
  );
});

// GEOREFERENCE IMAGE
let georefImageUrl = null;
let georefImageSize = null;
let georefImageScale = 1;
let georefTiepoints = [];
let georefActiveTiepointIndex = null;
let georefPickingMapPoint = false;
let georefPanState = null;
let georefAbsolutePoint = null;
let georefAbsolutePoints = [];

function readGeorefNumber(id) {
  const value = Number(document.getElementById(id).value);
  if (Number.isNaN(value)) {
    throw new Error(`Missing or invalid value: ${id}`);
  }

  return value;
}

function transformGeorefCoordinate(coord, inputProjection) {
  const mapProjection = map.getView().getProjection().getCode();
  return inputProjection === mapProjection
    ? coord
    : transform(coord, inputProjection, mapProjection);
}

function getGeorefImagePixelFromEvent(preview, event) {
  if (!georefImageSize) return null;

  const rect = preview.getBoundingClientRect();
  const sourceX = ((event.clientX - rect.left) / rect.width) * georefImageSize.width;
  const sourceY = ((event.clientY - rect.top) / rect.height) * georefImageSize.height;

  if (
    sourceX < 0 ||
    sourceY < 0 ||
    sourceX > georefImageSize.width ||
    sourceY > georefImageSize.height
  ) {
    return null;
  }

  return { sourceX, sourceY };
}

function getLinearFit(sourceValues, targetValues, axisName) {
  const count = sourceValues.length;
  const sourceMean =
    sourceValues.reduce((sum, value) => sum + value, 0) / count;
  const targetMean =
    targetValues.reduce((sum, value) => sum + value, 0) / count;
  let numerator = 0;
  let denominator = 0;

  sourceValues.forEach((sourceValue, index) => {
    const sourceDelta = sourceValue - sourceMean;
    numerator += sourceDelta * (targetValues[index] - targetMean);
    denominator += sourceDelta * sourceDelta;
  });

  if (!Number.isFinite(denominator) || denominator === 0) {
    throw new Error(`Use points with different source ${axisName} values.`);
  }

  const scale = numerator / denominator;
  const offset = targetMean - scale * sourceMean;
  if (!Number.isFinite(scale) || !Number.isFinite(offset)) {
    throw new Error(`Could not calculate ${axisName} georeference scale.`);
  }

  return { scale, offset };
}

function getGeorefExtentFromControlPoints(points, inputProjection) {
  if (!georefImageSize) {
    throw new Error("Upload an image first so its pixel size can be read.");
  }

  const completePoints = points
    .filter(
      (point) =>
        Number.isFinite(point.sourceX) &&
        Number.isFinite(point.sourceY) &&
        Number.isFinite(point.destX) &&
        Number.isFinite(point.destY),
    )
    .map((point) => {
      const mapCoord = transformGeorefCoordinate(
        [point.destX, point.destY],
        inputProjection,
      );
      return {
        sourceX: point.sourceX,
        sourceY: point.sourceY,
        mapX: mapCoord[0],
        mapY: mapCoord[1],
      };
    });

  if (completePoints.length < 2) {
    throw new Error("Georeferencing needs at least two complete point pairs.");
  }

  const xFit = getLinearFit(
    completePoints.map((point) => point.sourceX),
    completePoints.map((point) => point.mapX),
    "X",
  );
  const yFit = getLinearFit(
    completePoints.map((point) => point.sourceY),
    completePoints.map((point) => point.mapY),
    "Y",
  );

  const left = xFit.offset;
  const right = xFit.offset + xFit.scale * georefImageSize.width;
  const top = yFit.offset;
  const bottom = yFit.offset + yFit.scale * georefImageSize.height;

  return [
    Math.min(left, right),
    Math.min(bottom, top),
    Math.max(left, right),
    Math.max(bottom, top),
  ];
}

function getGeorefExtentFromAbsolute(inputProjection) {
  if (!georefImageSize) {
    throw new Error("Upload an image first so its pixel size can be read.");
  }

  if (georefAbsolutePoints.length < 2) {
    throw new Error("Absolute mode needs at least two added point pairs.");
  }

  return getGeorefExtentFromControlPoints(georefAbsolutePoints, inputProjection);
}

function getGeorefExtentFromTiepoints(inputProjection) {
  if (!georefImageSize) {
    throw new Error("Upload an image first so its pixel size can be read.");
  }

  const completeTiepoints = georefTiepoints.filter(
    (point) =>
      Number.isFinite(point.sourceX) &&
      Number.isFinite(point.sourceY) &&
      Number.isFinite(point.destX) &&
      Number.isFinite(point.destY),
  );

  if (completeTiepoints.length < 2) {
    throw new Error("Tie point mode needs at least two complete point pairs.");
  }

  return getGeorefExtentFromControlPoints(completeTiepoints, inputProjection);
}

function addGeoreferencedImageLayer(extent) {
  const layerName =
    document.getElementById("georefLayerName").value.trim() ||
    "Georeferenced image";
  const opacity = Number(document.getElementById("georefOpacity").value);
  const imageLayer = new ImageLayer({
    source: new ImageStatic({
      url: georefImageUrl,
      imageExtent: extent,
      projection: map.getView().getProjection(),
    }),
    opacity,
    title: layerName,
    displayInLayerSwitcher: true,
  });

  imageLayer.set("georeferencedImage", true);
  map.addLayer(imageLayer);
  map.getView().fit(extent, { duration: 600, padding: [40, 40, 40, 40] });
}

function formatGeorefValue(value) {
  return Number.isFinite(value) ? value.toFixed(3) : "";
}

function renderGeorefTiepoints() {
  const body = document.getElementById("georefTiepointBody");
  const viewport = document.getElementById("georefImageViewport");
  body.innerHTML = "";
  viewport
    .querySelectorAll(".georef-image-point")
    .forEach((pointEl) => pointEl.remove());

  georefTiepoints.forEach((point, index) => {
    const row = body.insertRow();
    row.insertCell().textContent = String(index + 1);
    row.insertCell().textContent = formatGeorefValue(point.sourceX);
    row.insertCell().textContent = formatGeorefValue(point.sourceY);
    row.insertCell().textContent = formatGeorefValue(point.destX);
    row.insertCell().textContent = formatGeorefValue(point.destY);
    row.addEventListener("click", () => {
      georefActiveTiepointIndex = index;
    });

    if (Number.isFinite(point.sourceX) && Number.isFinite(point.sourceY)) {
      const marker = document.createElement("div");
      marker.className = "georef-image-point";
      marker.style.left = `${point.sourceX * georefImageScale}px`;
      marker.style.top = `${point.sourceY * georefImageScale}px`;
      marker.innerHTML = `<span>${index + 1}</span>`;
      viewport.appendChild(marker);
    }
  });
}

function addGeorefTiepoint() {
  georefTiepoints.push({
    sourceX: null,
    sourceY: null,
    destX: null,
    destY: null,
  });
  georefActiveTiepointIndex = georefTiepoints.length - 1;
  renderGeorefTiepoints();
}

function setGeorefImageScale(nextScale) {
  georefImageScale = Math.max(0.25, Math.min(nextScale, 6));
  document.getElementById("georefImagePreview").style.transform =
    `scale(${georefImageScale})`;
  document.getElementById("georefAbsoluteImagePreview").style.transform =
    `scale(${georefImageScale})`;
  renderGeorefTiepoints();
  renderGeorefAbsolutePoint();
}

function zoomGeorefImageAt(
  nextScale,
  clientX,
  clientY,
  viewportId = "georefImageViewport",
) {
  const viewport = document.getElementById(viewportId);
  const rect = viewport.getBoundingClientRect();
  const oldScale = georefImageScale;
  const clampedScale = Math.max(0.25, Math.min(nextScale, 6));
  const imageX = (viewport.scrollLeft + clientX - rect.left) / oldScale;
  const imageY = (viewport.scrollTop + clientY - rect.top) / oldScale;

  setGeorefImageScale(clampedScale);
  viewport.scrollLeft = imageX * clampedScale - (clientX - rect.left);
  viewport.scrollTop = imageY * clampedScale - (clientY - rect.top);
}

function startGeorefImagePan(event, viewportId) {
  if (!event.shiftKey) return;

  const viewport = document.getElementById(viewportId);
  georefPanState = {
    viewportId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
  };
  viewport.classList.add("georef-panning");
  event.preventDefault();
}

function resetGeorefTiepoints() {
  georefTiepoints = [];
  georefActiveTiepointIndex = null;
  georefPickingMapPoint = false;
  georefDestinationSource.clear();
  georefCursorOverlay.setPosition(undefined);
  renderGeorefTiepoints();
}

function ensureActiveGeorefTiepoint() {
  if (georefActiveTiepointIndex === null) {
    addGeorefTiepoint();
  }

  return georefTiepoints[georefActiveTiepointIndex];
}

function setGeorefSourcePoint(event) {
  const preview = document.getElementById("georefImagePreview");
  if (!georefImageUrl || !georefImageSize) return;

  const sourcePixel = getGeorefImagePixelFromEvent(preview, event);
  if (!sourcePixel) return;

  const point = ensureActiveGeorefTiepoint();
  point.sourceX = sourcePixel.sourceX;
  point.sourceY = sourcePixel.sourceY;
  renderGeorefTiepoints();
}

function setGeorefDestinationPoint(coordinate) {
  if (georefActiveTiepointIndex === null) {
    alert("Add or select a tie point first.");
    return;
  }

  const inputProjection = document.getElementById("georefProjection").value;
  const mapProjection = map.getView().getProjection().getCode();
  const destination =
    inputProjection === mapProjection
      ? coordinate
      : transform(coordinate, mapProjection, inputProjection);
  const point = georefTiepoints[georefActiveTiepointIndex];

  point.destX = destination[0];
  point.destY = destination[1];
  const existingFeature = georefDestinationSource
    .getFeatures()
    .find(
      (feature) => feature.get("tiepointIndex") === georefActiveTiepointIndex,
    );

  if (existingFeature) {
    existingFeature.getGeometry().setCoordinates(coordinate);
  } else {
    georefDestinationSource.addFeature(
      new Feature({
        geometry: new Point(coordinate),
        label: georefActiveTiepointIndex + 1,
        tiepointIndex: georefActiveTiepointIndex,
      }),
    );
  }

  georefPickingMapPoint = false;
  georefCursorOverlay.setPosition(undefined);
  renderGeorefTiepoints();
}

function renderGeorefAbsolutePoint() {
  const viewport = document.getElementById("georefAbsoluteImageViewport");
  const body = document.getElementById("georefAbsolutePointBody");
  body.innerHTML = "";
  viewport
    .querySelectorAll(".georef-image-point")
    .forEach((pointEl) => pointEl.remove());

  georefAbsolutePoints.forEach((point, index) => {
    const row = body.insertRow();
    row.insertCell().textContent = String(index + 1);
    row.insertCell().textContent = formatGeorefValue(point.sourceX);
    row.insertCell().textContent = formatGeorefValue(point.sourceY);
    row.insertCell().textContent = formatGeorefValue(point.destX);
    row.insertCell().textContent = formatGeorefValue(point.destY);

    const marker = document.createElement("div");
    marker.className = "georef-image-point";
    marker.style.left = `${point.sourceX * georefImageScale}px`;
    marker.style.top = `${point.sourceY * georefImageScale}px`;
    marker.innerHTML = `<span>${index + 1}</span>`;
    viewport.appendChild(marker);
  });

  if (georefAbsolutePoint) {
    const marker = document.createElement("div");
    marker.className = "georef-image-point";
    marker.style.left = `${georefAbsolutePoint.sourceX * georefImageScale}px`;
    marker.style.top = `${georefAbsolutePoint.sourceY * georefImageScale}px`;
    marker.innerHTML = "<span>+</span>";
    viewport.appendChild(marker);
  }
}

function setGeorefAbsoluteSourcePoint(event) {
  if (!georefImageUrl || !georefImageSize) return;

  const preview = document.getElementById("georefAbsoluteImagePreview");
  const sourcePixel = getGeorefImagePixelFromEvent(preview, event);
  if (!sourcePixel) return;

  georefAbsolutePoint = sourcePixel;
  document.getElementById("georefAbsPx").value =
    sourcePixel.sourceX.toFixed(3);
  document.getElementById("georefAbsPy").value =
    sourcePixel.sourceY.toFixed(3);
  renderGeorefAbsolutePoint();
}

function resetGeorefAbsolutePoint() {
  georefAbsolutePoint = null;
  georefAbsolutePoints = [];
  document.getElementById("georefAbsPx").value = "";
  document.getElementById("georefAbsPy").value = "";
  document.getElementById("georefAbsMapX").value = "";
  document.getElementById("georefAbsMapY").value = "";
  renderGeorefAbsolutePoint();
}

function addGeorefAbsolutePoint() {
  if (!georefAbsolutePoint) {
    throw new Error("Click one source point on the uploaded image first.");
  }

  const destX = readGeorefNumber("georefAbsMapX");
  const destY = readGeorefNumber("georefAbsMapY");

  georefAbsolutePoints.push({
    sourceX: georefAbsolutePoint.sourceX,
    sourceY: georefAbsolutePoint.sourceY,
    destX,
    destY,
  });
  georefAbsolutePoint = null;
  document.getElementById("georefAbsPx").value = "";
  document.getElementById("georefAbsPy").value = "";
  document.getElementById("georefAbsMapX").value = "";
  document.getElementById("georefAbsMapY").value = "";
  renderGeorefAbsolutePoint();
}

document.getElementById("georef-image").addEventListener("click", () => {
  document.getElementById("georefModal").style.display = "block";
});

document.getElementById("georefClose").addEventListener("click", () => {
  document.getElementById("georefModal").style.display = "none";
  georefPickingMapPoint = false;
  georefCursorOverlay.setPosition(undefined);
});

document.getElementById("georefMode").addEventListener("change", (event) => {
  const useTiepoints = event.target.value === "tiepoints";
  document.getElementById("georefExtentFields").hidden = useTiepoints;
  document.getElementById("georefTiepointFields").hidden = !useTiepoints;
});

document
  .getElementById("georefImageFile")
  .addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (georefImageUrl) {
      URL.revokeObjectURL(georefImageUrl);
    }

    georefImageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      georefImageSize = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      const preview = document.getElementById("georefImagePreview");
      preview.src = georefImageUrl;
      preview.style.width = `${image.naturalWidth}px`;
      preview.style.height = `${image.naturalHeight}px`;
      const absolutePreview = document.getElementById(
        "georefAbsoluteImagePreview",
      );
      absolutePreview.src = georefImageUrl;
      absolutePreview.style.width = `${image.naturalWidth}px`;
      absolutePreview.style.height = `${image.naturalHeight}px`;
      resetGeorefTiepoints();
      resetGeorefAbsolutePoint();
    };
    image.src = georefImageUrl;
  });

document
  .getElementById("georefImagePreview")
  .addEventListener("click", (event) => {
    if (event.shiftKey) return;
    setGeorefSourcePoint(event);
  });

document
  .getElementById("georefImageViewport")
  .addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomGeorefImageAt(
      georefImageScale * zoomFactor,
      event.clientX,
      event.clientY,
      "georefImageViewport",
    );
  });

document
  .getElementById("georefImageViewport")
  .addEventListener("mousedown", (event) => {
    startGeorefImagePan(event, "georefImageViewport");
  });

document
  .getElementById("georefAbsoluteImagePreview")
  .addEventListener("click", (event) => {
    if (event.shiftKey) return;
    setGeorefAbsoluteSourcePoint(event);
  });

document
  .getElementById("georefAbsoluteImageViewport")
  .addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomGeorefImageAt(
      georefImageScale * zoomFactor,
      event.clientX,
      event.clientY,
      "georefAbsoluteImageViewport",
    );
  });

document
  .getElementById("georefAbsoluteImageViewport")
  .addEventListener("mousedown", (event) => {
    startGeorefImagePan(event, "georefAbsoluteImageViewport");
  });

window.addEventListener("mousemove", (event) => {
  if (!georefPanState) return;

  const viewport = document.getElementById(georefPanState.viewportId);
  viewport.scrollLeft =
    georefPanState.scrollLeft - (event.clientX - georefPanState.startX);
  viewport.scrollTop =
    georefPanState.scrollTop - (event.clientY - georefPanState.startY);
});

window.addEventListener("mouseup", () => {
  if (!georefPanState) return;

  const viewport = document.getElementById(georefPanState.viewportId);
  georefPanState = null;
  viewport.classList.remove("georef-panning");
});

document.getElementById("georefAddPoint").addEventListener("click", () => {
  addGeorefTiepoint();
});

document.getElementById("georefPickMapPoint").addEventListener("click", () => {
  if (georefActiveTiepointIndex === null) {
    alert("Add or select a tie point first.");
    return;
  }

  georefPickingMapPoint = true;
  georefCursorLabel.textContent = String(georefActiveTiepointIndex + 1);
  georefCursorOverlay.setPosition(map.getView().getCenter());
  document.getElementById("georefModal").style.display = "none";
});

document.getElementById("georefResetPoints").addEventListener("click", () => {
  resetGeorefTiepoints();
});

document.getElementById("georefZoomIn").addEventListener("click", () => {
  setGeorefImageScale(georefImageScale * 1.25);
});

document.getElementById("georefZoomOut").addEventListener("click", () => {
  setGeorefImageScale(georefImageScale / 1.25);
});

document.getElementById("georefAbsZoomIn").addEventListener("click", () => {
  setGeorefImageScale(georefImageScale * 1.25);
});

document.getElementById("georefAbsZoomOut").addEventListener("click", () => {
  setGeorefImageScale(georefImageScale / 1.25);
});

document
  .getElementById("georefAbsResetPoint")
  .addEventListener("click", resetGeorefAbsolutePoint);

document.getElementById("georefAbsAddPoint").addEventListener("click", () => {
  try {
    addGeorefAbsolutePoint();
  } catch (error) {
    alert(error.message);
  }
});

map.on("click", (event) => {
  if (!georefPickingMapPoint) return;

  setGeorefDestinationPoint(event.coordinate);
  document.getElementById("georefModal").style.display = "block";
});

map.on("pointermove", (event) => {
  if (!georefPickingMapPoint) return;

  georefCursorOverlay.setPosition(event.coordinate);
});

document.getElementById("georefApply").addEventListener("click", () => {
  try {
    if (!georefImageUrl) {
      throw new Error("Choose a PNG or JPEG image first.");
    }

    const inputProjection = document.getElementById("georefProjection").value;
    const mode = document.getElementById("georefMode").value;
    const extent =
      mode === "tiepoints"
        ? getGeorefExtentFromTiepoints(inputProjection)
        : getGeorefExtentFromAbsolute(inputProjection);

    addGeoreferencedImageLayer(extent);
    document.getElementById("georefModal").style.display = "none";
  } catch (error) {
    alert(error.message);
  }
});

// add point
document.getElementById("xyAddPoint").addEventListener("click", () => {
  const x = parseFloat(document.getElementById("xyX").value);
  const y = parseFloat(document.getElementById("xyY").value);

  if (isNaN(x) || isNaN(y)) {
    alert("⚠️ Please enter valid coordinates.");
    return;
  }

  xyPoints.push({ x, y, properties: {} });
  renderXyPointList();

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
  const layerName =
    document.getElementById("xyLayerName").value.trim() || "XY points";

  const mapCrs = map.getView().getProjection(); // usually EPSG:3857

  if (xyPoints.length === 0) {
    alert("⚠️ No points added!");
    return;
  }

  // Build point features
  const pointFeatures = xyPoints.map((c) => {
    const coords = transform([c.x, c.y], inputCrs, mapCrs);
    const feature = new Feature({
      ...c.properties,
      source_x: c.x,
      source_y: c.y,
      source_crs: inputCrs,
      geometry: new Point(coords),
    });
    feature.set("_featureProjection", mapCrs.getCode());
    return feature;
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
    title: layerName,
    displayInLayerSwitcher: true,
  });
  pointLayer.set("editableVector", true);
  pointLayer.set("featureProjection", mapCrs.getCode());
  pointLayer.set("sourceProjection", inputCrs);

  // Add to map
  map.addLayer(pointLayer);
  registerPersistentVectorLayer(pointLayer, "xy");

  // Zoom to extent
  map.getView().fit(vectorSource.getExtent(), {
    padding: [20, 20, 20, 20],
    maxZoom: 18,
  });

  console.log("✅ Point layer added with", xyPoints.length, "points");

  // Close modal
  document.getElementById("xyModal").style.display = "none";
});

// _________________________________________________________________________________
// Drag Features

const btnTranslate = document.getElementById("btnTranslate");
let translateInteraction = null;

btnTranslate.addEventListener("click", () => {
  if (!selectedFeatures.getLength()) {
    alert("⚠️ Please select features to move first.");
    return;
  }

  btnTranslate.classList.add("active");

  translateInteraction = new Translate({
    features: selectedFeatures,
  });

  map.addInteraction(translateInteraction);

  // Handle translate end
  translateInteraction.on("translateend", (event) => {
    event.features.forEach((feature) => {
      console.log(feature);
      console.log(event.features);

      if (feature.getId()) {
        if (!updates.includes(feature)) {
          updates.push(feature);
          console.log("Feature moved, queued for update:", feature.getId());
        }
      } else {
        console.log("Moved unsaved feature (still in inserts).");
      }
    });
    updateSaveButtonState();
  });
  console.log("🖐️ Translate interaction active");
});

function updateSaveButtonState() {
  const hasChanges =
    inserts.length > 0 || updates.length > 0 || deletes.length > 0;
  document.getElementById("btnSave").disabled = !hasChanges;
}

//Rotate Features

const btnRotate = document.getElementById("btnRotate");
let rotateInteraction = null;

rotateInteraction = new ol_interaction_Transform({
  enableRotatedTransform: true,
  rotate: true,
  scale: false,
  translateFeature: false,
  translate: false,
});

let rotateActive = false;

btnRotate.addEventListener("click", () => {
  clearInteractions();
  clearToolbarButtons();
  if (!rotateActive) {
    map.addInteraction(rotateInteraction);
    rotateActive = true;
    btnRotate.classList.add("active");

    // Handle rotation end directly
    rotateInteraction.on("rotateend", (event) => {
      const feats = event.features || (event.feature ? [event.feature] : []);
      feats.forEach((feature) => {
        if (feature.getId()) {
          if (!updates.includes(feature)) {
            updates.push(feature);
            console.log("Feature rotated, queued for update:", feature.getId());
          }
        } else {
          console.log("Rotated unsaved feature (still in inserts).");
        }
      });
      updateSaveButtonState();
    });

    console.log("🔄 Rotate interaction active");
  } else {
    map.removeInteraction(rotateInteraction);
    rotateActive = false;
    btnRotate.classList.remove("active");
    console.log("❌ Rotate interaction disabled");
  }
});

//SCALE FEATURES

const btnScale = document.getElementById("btnScale");
let scaleInteraction = null;

scaleInteraction = new ol_interaction_Transform({
  enableRotatedTransform: false, // not needed for scaling
  rotate: false,
  scale: true,
  translateFeature: false,
  translate: false,
});

let scaleActive = false;

btnScale.addEventListener("click", () => {
  clearInteractions();
  clearToolbarButtons();
  if (!scaleActive) {
    map.addInteraction(scaleInteraction);
    scaleActive = true;
    btnScale.classList.add("active");

    // Handle scale end directly
    scaleInteraction.on("scaleend", (event) => {
      const feats = event.features || (event.feature ? [event.feature] : []);
      feats.forEach((feature) => {
        if (feature.getId()) {
          if (!updates.includes(feature)) {
            updates.push(feature);
            console.log("Feature scaled, queued for update:", feature.getId());
          }
        } else {
          console.log("Scaled unsaved feature (still in inserts).");
        }
      });
      updateSaveButtonState();
    });

    console.log("📏 Scale interaction active");
  } else {
    map.removeInteraction(scaleInteraction);
    scaleActive = false;
    btnScale.classList.remove("active");
    console.log("❌ Scale interaction disabled");
  }
});

// COPY PASTE FEATURES

// 1. Get your button
const btnClone = document.getElementById("btnClone");

// 2. Create a Transform interaction (acts as selection tool)
let cloneTransformInteraction = new ol_interaction_Transform({
  enableRotatedTransform: false,
  rotate: false,
  scale: false,
  stretch: false,
  translateFeature: true,
});

// 3. Create CopyPaste interaction, linked to transform selection
let copyPasteInteraction = new ol_interaction_CopyPaste({
  features: cloneTransformInteraction.getFeatures(),
  source: wfsVectorSource,
  destination: wfsVectorSource,
});

// 4. Toggle Clone mode with button
let cloneActive = false;

btnClone.addEventListener("click", () => {
  if (!cloneActive) {
    // enable transform + copy/paste
    map.addInteraction(cloneTransformInteraction);
    map.addInteraction(copyPasteInteraction);
    cloneActive = true;
    btnClone.classList.add("active");

    // Listen for copy/cut/paste events
    copyPasteInteraction.on("copy", (e) => {
      const copied = cloneTransformInteraction.getFeatures().getArray();
      console.log("📋 Copied features:", copied);
    });

    copyPasteInteraction.on("cut", (e) => {
      const cut = cloneTransformInteraction.getFeatures().getArray();
      console.log("✂️ Cut features:", cut);

      cut.forEach((f) => {
        // Remove from source immediately
        wfsVectorSource.removeFeature(f);

        // Track for delete if it has an ID (already saved in DB)
        if (f.getId()) {
          deletes.push({ feature: f });
        }

        // If it's a new unsaved feature, also remove from inserts
        const idx = inserts.indexOf(f);
        if (idx > -1) {
          inserts.splice(idx, 1);
        }
      });

      // Clear selection after cut
      cloneTransformInteraction.select();
    });

    copyPasteInteraction.on("paste", (e) => {
      console.log("📌 Pasted features:", e.features);

      e.features.forEach((f) => {
        // Extract geometry
        const geom = f.getGeometry();
        f.set("geom", geom);
        f.setGeometryName("geom");
        if (f.get("geometry")) {
          f.unset("geometry", true);
        }

        wfsVectorSource.addFeature(f);

        // 🔹 Make feature follow the cursor
        const moveFeature = (evt) => {
          const coord = evt.coordinate;
          const featureGeom = f.getGeometry();

          if (featureGeom.getType() === "Point") {
            featureGeom.setCoordinates(coord);
          } else {
            // For Polygon / LineString: translate centroid to cursor
            const extent = featureGeom.getExtent();
            console.log(extent);

            const center = getCenter(extent);
            const dx = coord[0] - center[0];
            const dy = coord[1] - center[1];
            featureGeom.translate(dx, dy);
          }
        };

        map.on("pointermove", moveFeature);

        // 🔹 Finalize on click
        const finalizePlacement = () => {
          map.un("pointermove", moveFeature);

          if (!inserts.includes(f)) {
            inserts.push(f);
          }
          updateSaveButtonState();

          // Stop listening after placing
          map.un("click", finalizePlacement);

          console.log(
            "📌 Feature placed at:",
            f.getGeometry().getCoordinates(),
          );
        };
        map.once("click", finalizePlacement);
      });

      updateSaveButtonState();

      // Auto-select pasted features
      cloneTransformInteraction.select();
      e.features.forEach((f) => cloneTransformInteraction.select(f, true));
    });

    console.log("📋 Copy/Paste active (Ctrl+C / Ctrl+X / Ctrl+V)");
  } else {
    map.removeInteraction(cloneTransformInteraction);
    map.removeInteraction(copyPasteInteraction);
    cloneActive = false;
    btnClone.classList.remove("active");
    console.log("❌ Copy/Paste disabled");
  }
});

function clearInteractions() {
  // Reset styles of selected features before clearing
  if (selectedFeatures && selectedFeatures.getLength() > 0) {
    selectedFeatures.forEach((f) => f.setStyle(null));
    selectedFeatures.clear();
  }

  const interactions = [
    activeSelectInteraction,
    modifyInteraction,
    drawInteraction,
    snapInteraction,
    rotateInteraction,
    scaleInteraction,
    copyPasteInteraction,
    cloneTransformInteraction,
  ];

  interactions.forEach((i) => {
    if (i) {
      map.removeInteraction(i);
    }
  });

  // reset references
  activeSelectInteraction = null;
  modifyInteraction = null;
  drawInteraction = null;
  snapInteraction = null;

  // reset active flags too
  rotateActive = false;
  scaleActive = false;
  cloneActive = false;

  // ✅ Handle SnapGuides separately
  if (snapGuidesActive) {
    map.removeInteraction(snapGuidesInteraction);
    snapGuidesActive = false;
    snapGuideBtn.classList.remove("active");
    console.log("❌ SnapGuides Interaction OFF (clearInteractions)");
  }

  console.log("🧹 All interactions cleared");
}

function clearToolbarButtons() {
  const buttons = [
    btnSelect,
    btnSelectSingle,
    btnSelectRectangle,
    btnEditGeom,
    btnAdd,
    btnSnap,
    btnSnapGuides,
    btnRotate,
    btnScale,
    btnClone,
    splitFeatureButton,
  ];

  buttons.forEach((btn) => btn.classList.remove("active"));
  console.log("🔲 Toolbar buttons reset");
}

//PIN SHARED VERTICES TOGETHER

// PIN BUTTON
let pinEnabled = false;
const btnPin = document.getElementById("btnPin");

btnPin.addEventListener("click", () => {
  pinEnabled = !pinEnabled;
  btnPin.classList.toggle("active", pinEnabled);
  console.log("📌 Pin mode:", pinEnabled ? "ON" : "OFF");
});

function removeCollinearVertices(geom, tolerance = 1e-9) {
  const isCollinear = (a, b, c) => {
    // area of triangle (a,b,c) = 0 when collinear
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    return Math.abs(area) < tolerance;
  };

  const cleanRing = (ring) => {
    if (ring.length <= 3) return ring;
    const cleaned = [ring[0]];

    for (let i = 1; i < ring.length - 1; i++) {
      const prev = cleaned[cleaned.length - 1];
      const curr = ring[i];
      const next = ring[i + 1];
      if (!isCollinear(prev, curr, next)) {
        cleaned.push(curr);
      }
    }

    cleaned.push(ring[ring.length - 1]); // close ring
    return cleaned;
  };

  if (geom.getType() === "Polygon") {
    const rings = geom.getCoordinates().map(cleanRing);
    geom.setCoordinates(rings);
  }

  if (geom.getType() === "MultiPolygon") {
    const polys = geom.getCoordinates().map((rings) => rings.map(cleanRing));
    geom.setCoordinates(polys);
  }
}

function fixPolygon(geom) {
  const closeRing = (ring) => {
    // remove duplicates
    let cleaned = ring.filter(
      (pt, i, arr) =>
        i === 0 || pt[0] !== arr[i - 1][0] || pt[1] !== arr[i - 1][1],
    );
    // ensure closure
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      cleaned.push([...first]);
    }
    return cleaned;
  };

  if (geom.getType() === "Polygon") {
    geom.setCoordinates(geom.getCoordinates().map(closeRing));
  }
  if (geom.getType() === "MultiPolygon") {
    geom.setCoordinates(
      geom.getCoordinates().map((rings) => rings.map(closeRing)),
    );
  }
}

function syncClosure(feature) {
  const geom = feature.getGeometry();

  if (geom.getType() === "Polygon") {
    const rings = geom.getCoordinates();
    rings.forEach((ring, i) => {
      if (ring.length > 2) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          // only fix closure inside this feature
          ring[ring.length - 1] = [...first];
        }
      }
    });
    geom.setCoordinates(rings);
  }

  if (geom.getType() === "MultiPolygon") {
    const polys = geom.getCoordinates();
    polys.forEach((rings, i) => {
      rings.forEach((ring, j) => {
        if (ring.length > 2) {
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            ring[ring.length - 1] = [...first];
          }
        }
      });
    });
    geom.setCoordinates(polys);
  }
}

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const chatSidebarToggle = document.getElementById("chatSidebarToggle");
const gridContainer = document.querySelector(".grid-container");

const chatbotReplies = [
  {
    terms: ["measure", "length", "area", "distance"],
    text: "Use the ruler buttons in the top toolbar for length or area. Keep Clear previous measure checked if you want each new measurement to replace the last one.",
  },
  {
    terms: ["layer", "layers", "switch", "basemap", "wms"],
    text: "Use the layer switcher on the map to turn layers on or off. If you add new data, it will appear as a map layer after the upload or creation step completes.",
  },
  {
    terms: ["search", "attribute", "select"],
    text: "For attribute workflows, use Search By Attributes to filter records or Select By Attributes to highlight matching features on the map.",
  },
  {
    terms: ["edit", "draw", "save", "feature"],
    text: "Open Edit layer from the toolbar, then choose add, select, edit geometry, delete, or save from the edit toolbar on the left side of the map.",
  },
  {
    terms: ["print", "export", "pdf"],
    text: "Use the Print button in the toolbar to prepare a printable map output. Make sure the map is zoomed to the area you want before printing.",
  },
  {
    terms: ["coordinate", "xy", "location", "gps"],
    text: "Use XY Coordinates to add a point from typed coordinates, or Your Current Location to center the map near your device position.",
  },
  {
    terms: ["heatmap", "chart", "graphic"],
    text: "Use Create Heatmap for density-style visualization, or Add Graphic to build a chart from fields in one of your layers.",
  },
];

function addChatMessage(author, text, type) {
  const message = document.createElement("div");
  message.className = `chat-message chat-message--${type}`;

  const authorEl = document.createElement("div");
  authorEl.className = "chat-message__author";
  authorEl.textContent = author;

  const bubble = document.createElement("div");
  bubble.className = "chat-message__bubble";
  bubble.textContent = text;

  message.append(authorEl, bubble);
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getChatbotReply(message) {
  const normalized = message.toLowerCase();
  const match = chatbotReplies.find((reply) =>
    reply.terms.some((term) => normalized.includes(term)),
  );

  if (match) {
    return match.text;
  }

  return "I can help with map tools, layers, attribute search, measuring, editing, coordinates, heatmaps, charts, and printing. Try asking about one of those workflows.";
}

function getLayerParam(layer) {
  const params = layer.getSource?.()?.getParams?.();
  return params?.LAYERS || params?.layers || "";
}

function getLayerAgentItems(layers, groupTitle = "") {
  const items = [];

  layers.forEach((layer) => {
    const title = layer.get("title") || layer.get("name") || "";
    const layerParam = getLayerParam(layer);
    const arcgisFeatureServiceUrl = layer.get("arcgisFeatureServiceUrl") || "";
    const childLayers = layer.getLayers?.();

    if (title || layerParam || arcgisFeatureServiceUrl) {
      items.push({
        layer,
        title,
        groupTitle,
        layerParam,
        arcgisFeatureServiceUrl,
        visible: layer.getVisible?.() ?? true,
      });
    }

    if (childLayers) {
      items.push(...getLayerAgentItems(childLayers, title || groupTitle));
    }
  });

  return items;
}

function normalizeAgentText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_:-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findAgentLayer(message) {
  const normalizedMessage = normalizeAgentText(message);
  const layers = getLayerAgentItems(map.getLayers()).filter(
    (item) => item.title || item.layerParam,
  );

  return layers.find((item) => {
    const title = normalizeAgentText(item.title);
    const layerParam = normalizeAgentText(item.layerParam);
    const shortLayerParam = normalizeAgentText(
      item.layerParam.split(":").pop(),
    );

    return (
      (title && normalizedMessage.includes(title)) ||
      (layerParam && normalizedMessage.includes(layerParam)) ||
      (shortLayerParam && normalizedMessage.includes(shortLayerParam))
    );
  });
}

function findAgentLayerByName(layerName) {
  const normalizedLayerName = normalizeAgentText(layerName);
  if (!normalizedLayerName) return null;

  const layers = getLayerAgentItems(map.getLayers()).filter(
    (item) => item.title || item.layerParam,
  );

  return layers.find((item) => {
    const names = [
      item.title,
      item.layerParam,
      item.layerParam?.split(":").pop(),
    ].map(normalizeAgentText);

    return names.some(
      (name) =>
        name &&
        (name === normalizedLayerName ||
          name.includes(normalizedLayerName) ||
          normalizedLayerName.includes(name)),
    );
  });
}

function formatAgentLayerName(item) {
  return item.title || item.layerParam || "Unnamed layer";
}

function summarizeFeatureProperties(properties) {
  return Object.entries(properties || {})
    .filter(([key, value]) => key !== "geometry" && value !== null)
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

async function fetchWfsFeatureSample(layerParam, maxFeatures = 5) {
  const qualifiedLayer = layerParam.includes(":")
    ? layerParam
    : `${workspaceName}:${layerParam}`;
  const [workspace] = qualifiedLayer.split(":");
  const params = new URLSearchParams({
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typeName: qualifiedLayer,
    outputFormat: "application/json",
    maxFeatures: String(maxFeatures),
  });

  const response = await fetch(`/geoserver-proxy/${workspace}/ows?${params}`);
  if (!response.ok) {
    throw new Error(`WFS request failed with status ${response.status}`);
  }

  return response.json();
}

async function fetchArcgisFeatureSample(serviceUrl, maxFeatures = 5) {
  const response = await fetch(
    `${serviceUrl}/query?` +
      new URLSearchParams({
        where: "1=1",
        outFields: "*",
        returnGeometry: "false",
        f: "geojson",
        resultRecordCount: String(maxFeatures),
      }),
  );

  if (!response.ok) {
    throw new Error(`ArcGIS query failed with status ${response.status}`);
  }

  return response.json();
}

async function getArcgisMetadata(layerMatch) {
  const existingMetadata = layerMatch.layer.get("arcgisMetadata");
  if (existingMetadata) return existingMetadata;

  const response = await fetch(`${layerMatch.arcgisFeatureServiceUrl}?f=pjson`);
  if (!response.ok) {
    throw new Error(
      `ArcGIS metadata request failed with status ${response.status}`,
    );
  }

  const metadata = await response.json();
  layerMatch.layer.set("arcgisMetadata", metadata);
  return metadata;
}

function summarizeArcgisMetadata(metadata) {
  const fields = metadata.fields || [];
  const renderer = metadata.drawingInfo?.renderer || {};
  const fieldNames = fields
    .slice(0, 12)
    .map((field) => `${field.name} (${field.type})`)
    .join(", ");

  return [
    `Name: ${metadata.name || "Unknown"}`,
    `Geometry: ${metadata.geometryType || "Unknown"}`,
    `Object ID field: ${metadata.objectIdField || "Unknown"}`,
    `Display field: ${metadata.displayField || "Unknown"}`,
    `Renderer: ${renderer.type || "Unknown"}`,
    `Fields: ${fieldNames || "None returned"}`,
  ].join("\n");
}

async function getChatAction(message) {
  const normalized = message.toLowerCase();
  const asksForZoom =
    normalized.includes("zoom") ||
    normalized.includes("go to") ||
    normalized.includes("center") ||
    normalized.includes("fly to");

  if (
    normalized.includes("list layers") ||
    normalized.includes("show layers") ||
    normalized.includes("visible layers")
  ) {
    return {
      name: "list-map-layers",
      run: async () => {
        const layers = getLayerAgentItems(map.getLayers())
          .filter((item) => item.title || item.layerParam)
          .map((item) => {
            const name = formatAgentLayerName(item);
            return `${item.visible ? "visible" : "hidden"} - ${name}`;
          })
          .slice(0, 40);

        return layers.length
          ? `Map layers:\n${layers.join("\n")}`
          : "I could not find any map layers.";
      },
    };
  }

  if (
    normalized.includes("geoserver layers") ||
    normalized.includes("layers from geoserver") ||
    normalized.includes("read layers from geoserver")
  ) {
    return {
      name: "list-geoserver-layers",
      run: async () => {
        const response = await fetch(`/api/groups/${workspaceName}/postgres/`);
        if (!response.ok) {
          throw new Error(
            `GeoServer layer request failed with ${response.status}`,
          );
        }

        const layers = await response.json();
        if (!Array.isArray(layers) || !layers.length) {
          return "GeoServer did not return any layers.";
        }

        return `GeoServer layers:\n${layers
          .map((layer) => `${layer.name} (${layer.geometry_type})`)
          .join("\n")}`;
      },
    };
  }

  const layerMatch = findAgentLayer(message);

  if (
    layerMatch &&
    (normalized.includes("hide") ||
      normalized.includes("turn off") ||
      normalized.includes("remove layer"))
  ) {
    return {
      name: "hide-layer",
      run: async () => {
        layerMatch.layer.setVisible(false);
        return `Done. I hid ${formatAgentLayerName(layerMatch)}.`;
      },
    };
  }

  if (
    layerMatch &&
    (normalized.includes("show") ||
      normalized.includes("turn on") ||
      normalized.includes("display layer"))
  ) {
    return {
      name: "show-layer",
      run: async () => {
        layerMatch.layer.setVisible(true);
        return `Done. I showed ${formatAgentLayerName(layerMatch)}.`;
      },
    };
  }

  if (
    layerMatch &&
    layerMatch.arcgisFeatureServiceUrl &&
    (normalized.includes("metadata") ||
      normalized.includes("symbology") ||
      normalized.includes("simbology") ||
      normalized.includes("renderer") ||
      normalized.includes("details") ||
      normalized.includes("fields"))
  ) {
    return {
      name: "read-arcgis-metadata",
      run: async () => {
        const metadata = await getArcgisMetadata(layerMatch);
        return `ArcGIS Feature Service metadata for ${formatAgentLayerName(
          layerMatch,
        )}:\n${summarizeArcgisMetadata(metadata)}`;
      },
    };
  }

  if (
    layerMatch &&
    layerMatch.arcgisFeatureServiceUrl &&
    (normalized.includes("features") ||
      normalized.includes("records") ||
      normalized.includes("read data") ||
      normalized.includes("query"))
  ) {
    return {
      name: "read-arcgis-features",
      run: async () => {
        const geojson = await fetchArcgisFeatureSample(
          layerMatch.arcgisFeatureServiceUrl,
        );
        const features = geojson.features || [];

        if (!features.length) {
          return `I queried ${formatAgentLayerName(
            layerMatch,
          )}, but ArcGIS returned no features.`;
        }

        const sample = features
          .slice(0, 5)
          .map((feature, index) => {
            const summary = summarizeFeatureProperties(feature.properties);
            return `${index + 1}. ${summary || "No properties"}`;
          })
          .join("\n");

        return `I read ${features.length} feature(s) from ${formatAgentLayerName(
          layerMatch,
        )}.\n${sample}`;
      },
    };
  }

  if (
    layerMatch &&
    layerMatch.layerParam &&
    (normalized.includes("wfs") ||
      normalized.includes("features") ||
      normalized.includes("records") ||
      normalized.includes("read data"))
  ) {
    return {
      name: "read-wfs-features",
      run: async () => {
        const geojson = await fetchWfsFeatureSample(layerMatch.layerParam);
        const features = geojson.features || [];

        if (!features.length) {
          return `I read ${formatAgentLayerName(layerMatch)}, but WFS returned no features.`;
        }

        const sample = features
          .slice(0, 5)
          .map((feature, index) => {
            const summary = summarizeFeatureProperties(feature.properties);
            return `${index + 1}. ${summary || "No properties"}`;
          })
          .join("\n");

        return `I read ${features.length} feature(s) from ${formatAgentLayerName(
          layerMatch,
        )}.\n${sample}`;
      },
    };
  }

  return null;
}

function getVisibleLayerTitles(layers) {
  const titles = [];

  layers.forEach((layer) => {
    const title = layer.get("title");
    const childLayers = layer.getLayers?.();

    if (layer.getVisible?.() && title) {
      titles.push(title);
    }

    if (childLayers) {
      titles.push(...getVisibleLayerTitles(childLayers));
    }
  });

  return titles;
}

function getAllLayerTitlesForAgent(layers) {
  return getLayerAgentItems(layers)
    .filter((item) => item.title || item.layerParam)
    .map((item) => ({
      title: item.title,
      layerParam: item.layerParam,
      groupTitle: item.groupTitle,
      visible: item.visible,
      arcgisFeatureServiceUrl: item.arcgisFeatureServiceUrl,
    }))
    .slice(0, 120);
}

function getBaseLayerAgentItems() {
  return (
    baseLayerGroup
      ?.getLayers()
      ?.getArray()
      ?.map((layer) => ({
        layer,
        title: layer.get("title") || layer.get("name") || "",
        visible: layer.getVisible?.() ?? false,
      }))
      ?.filter((item) => item.title) || []
  );
}

function getBaseLayerTitlesForAgent() {
  return getBaseLayerAgentItems().map((item) => ({
    title: item.title,
    visible: item.visible,
  }));
}

function findAgentBaseLayerByName(baseLayerName) {
  const normalizedBaseLayerName = normalizeAgentText(baseLayerName);
  if (!normalizedBaseLayerName) return null;

  return getBaseLayerAgentItems().find((item) => {
    const title = normalizeAgentText(item.title);
    return (
      title === normalizedBaseLayerName ||
      title.includes(normalizedBaseLayerName) ||
      normalizedBaseLayerName.includes(title) ||
      (normalizedBaseLayerName.includes("satellite") &&
        title.includes("satellite")) ||
      (normalizedBaseLayerName.includes("imagery") && title.includes("imagery"))
    );
  });
}

function getChatMapContext() {
  const view = map.getView();
  const resolution = view.getResolution();

  return {
    center: view.getCenter(),
    zoom: view.getZoom(),
    projection: view.getProjection().getCode(),
    scale: resolution
      ? Math.round(resolutionToGeoServerScale(resolution, view))
      : null,
    map_mode: isCesiumMode ? "3d" : "2d",
    terrain_enabled: isCesiumTerrainEnabled,
    visible_layers: getVisibleLayerTitles(map.getLayers()),
    base_layers: getBaseLayerTitlesForAgent(),
    layers: getAllLayerTitlesForAgent(map.getLayers()),
  };
}

async function getBackendChatReply(message) {
  const response = await fetch("/api/custom/chat/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      map_context: getChatMapContext(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || "The backend chat request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

function getAgentLayerExtent(layerMatch) {
  const layer = layerMatch?.layer;
  const source = layer?.getSource?.();
  const vectorExtent = source?.getExtent?.();

  if (
    Array.isArray(vectorExtent) &&
    vectorExtent.every(Number.isFinite) &&
    vectorExtent[0] !== Infinity &&
    vectorExtent[2] !== -Infinity
  ) {
    return vectorExtent;
  }

  const layerExtent = layer?.getExtent?.();
  if (Array.isArray(layerExtent) && layerExtent.every(Number.isFinite)) {
    return layerExtent;
  }

  return null;
}

async function zoomToNominatimPlace(query) {
  const searchText = String(query || "").trim();
  if (!searchText) throw new Error("Place search query is required.");

  const response = await fetch(
    "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({
        q: searchText,
        format: "json",
        limit: "1",
        addressdetails: "1",
      }),
  );

  if (!response.ok) {
    throw new Error(`Nominatim request failed with status ${response.status}`);
  }

  const results = await response.json();
  const place = results?.[0];
  if (!place) throw new Error(`No place found for ${searchText}.`);

  const view = map.getView();
  const projection = view.getProjection();
  const boundingBox = place.boundingbox?.map(Number);

  if (
    Array.isArray(boundingBox) &&
    boundingBox.length === 4 &&
    boundingBox.every(Number.isFinite)
  ) {
    const [south, north, west, east] = boundingBox;
    const bottomLeft = fromLonLat([west, south], projection);
    const topRight = fromLonLat([east, north], projection);
    view.fit([bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]], {
      duration: 800,
      padding: [60, 60, 60, 60],
      maxZoom: 16,
    });
  } else {
    const lon = Number(place.lon);
    const lat = Number(place.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      throw new Error(`Nominatim returned invalid coordinates for ${searchText}.`);
    }
    view.animate({
      center: fromLonLat([lon, lat], projection),
      zoom: 14,
      duration: 800,
    });
  }

  return place.display_name || searchText;
}

async function executeBackendAgentAction(action) {
  if (!action?.type) return null;

  if (action.type === "zoom_to_tirana") {
    const view = map.getView();
    view.animate({
      center: fromLonLat([19.8189, 41.3275], view.getProjection()),
      zoom: 14,
      duration: 700,
    });
    return "Zoomed to Tirana.";
  }

  if (action.type === "toggle_layer_visibility") {
    const layerMatch = findAgentLayerByName(action.layer);
    if (!layerMatch) throw new Error(`Layer not found: ${action.layer}`);
    layerMatch.layer.setVisible(Boolean(action.value));
    return `${Boolean(action.value) ? "Showed" : "Hid"} ${formatAgentLayerName(
      layerMatch,
    )}.`;
  }

  if (action.type === "set_map_mode") {
    const mode = String(action.mode || "").toLowerCase();
    if (mode !== "2d" && mode !== "3d") {
      throw new Error(`Invalid map mode: ${action.mode}`);
    }

    setMapMode3d(mode === "3d");
    return `Switched to ${mode.toUpperCase()} mode.`;
  }

  if (action.type === "set_base_layer") {
    const baseLayerMatch = findAgentBaseLayerByName(action.base_layer);
    if (!baseLayerMatch) {
      throw new Error(`Base layer not found: ${action.base_layer}`);
    }

    getBaseLayerAgentItems().forEach((item) => {
      item.layer.setVisible(item.layer === baseLayerMatch.layer);
    });
    if (isCesiumMode) {
      setCesiumBaseLayerFromOpenLayers(baseLayerMatch.layer);
    }
    return `Changed base layer to ${baseLayerMatch.title}.`;
  }

  if (action.type === "set_elevation_tool") {
    setMapMode3d(true);
    setCesiumElevationTooltipEnabled(Boolean(action.value));
    return `${Boolean(action.value) ? "Turned on" : "Turned off"} elevation readout.`;
  }

  if (action.type === "set_terrain") {
    await setCesiumTerrainEnabled(Boolean(action.value));
    return `${Boolean(action.value) ? "Turned on" : "Turned off"} 3D terrain.`;
  }

  if (action.type === "set_map_scale") {
    setMapScaleDenominator(action.scale);
    return `Set map scale to 1:${Math.round(Number(action.scale))}.`;
  }

  if (action.type === "zoom_to_place") {
    const placeName = await zoomToNominatimPlace(action.query);
    return `Zoomed to ${placeName}.`;
  }

  if (action.type === "zoom_to_layer") {
    const layerMatch = findAgentLayerByName(action.layer);
    if (!layerMatch) throw new Error(`Layer not found: ${action.layer}`);
    const extent = getAgentLayerExtent(layerMatch);
    if (!extent) throw new Error(`No local extent found for ${action.layer}`);
    map.getView().fit(extent, {
      duration: 800,
      padding: [60, 60, 60, 60],
      maxZoom: 18,
    });
    return `Zoomed to ${formatAgentLayerName(layerMatch)}.`;
  }

  if (action.type === "select_layer") {
    const layerMatch = findAgentLayerByName(action.layer);
    if (!layerMatch) throw new Error(`Layer not found: ${action.layer}`);
    attributeLayerSelect.value = formatAgentLayerName(layerMatch);
    attributeLayerSelect.dispatchEvent(new Event("change"));
    return `Selected ${formatAgentLayerName(layerMatch)}.`;
  }

  if (action.type === "search_layer_features") {
    return `Search requested for ${action.layer}: ${action.query}`;
  }

  if (action.type === "set_layer_style") {
    return `Style change requested for ${action.layer}: ${action.style}`;
  }

  if (action.type === "run_site_selection") {
    return "Site selection action queued.";
  }

  return `Unknown action ignored: ${action.type}`;
}

async function executeBackendAgentActions(actions = []) {
  const results = [];

  for (const action of actions) {
    try {
      const result = await executeBackendAgentAction(action);
      if (result) results.push(result);
    } catch (error) {
      results.push(error.message);
      console.warn("Backend agent action failed:", action, error);
    }
  }

  return results;
}

if (chatForm && chatInput && chatMessages) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    addChatMessage("You", message, "user");
    chatInput.value = "";

    try {
      const data = await getBackendChatReply(message);
      const actionResults = await executeBackendAgentActions(data.actions);
      const reply = [data.reply, ...actionResults]
        .filter(Boolean)
        .join("\n");
      addChatMessage("Assistant", reply || "Done.", "bot");
    } catch (error) {
      if (error.status === 401 || error.status === 503) {
        addChatMessage("Assistant", error.message, "bot");
        console.warn("Backend chatbot configuration error:", error);
        return;
      }

      const action = await getChatAction(message);
      if (action) {
        try {
          const runReply = await action.run();
          const actionReply = action.reply || runReply;
          addChatMessage("Assistant", actionReply, "bot");
        } catch (actionError) {
          addChatMessage(
            "Assistant",
            `I found the ${action.name} tool, but it failed: ${actionError.message}`,
            "bot",
          );
          console.warn("Chat action failed:", actionError);
        }
        return;
      }

      addChatMessage("Assistant", getChatbotReply(message), "bot");
      console.warn("Backend chatbot unavailable:", error);
    }
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });
}

if (chatSidebarToggle && gridContainer) {
  chatSidebarToggle.addEventListener("click", () => {
    const isCollapsed = gridContainer.classList.toggle("chat-collapsed");
    chatSidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
    const toggleIcon = chatSidebarToggle.querySelector("i");
    if (toggleIcon) {
      toggleIcon.classList.toggle("fa-chevron-left", isCollapsed);
      toggleIcon.classList.toggle("fa-chevron-right", !isCollapsed);
    }
    if (gridContainer.classList.contains("nearby-open")) {
      nearbySidebar.hidden = isCollapsed || currentSidebarPanel !== "nearby";
      if (geoAdvisorSidebar) {
        geoAdvisorSidebar.hidden =
          isCollapsed || currentSidebarPanel !== "geoAdvisor";
      }
      if (sharedChatSidebar) sharedChatSidebar.hidden = true;
    } else if (sharedChatSidebar) {
      sharedChatSidebar.hidden = isCollapsed;
    }

    window.setTimeout(() => {
      map.updateSize();
    }, 250);
  });
}

function createKadasterWmsLayer(title, url) {
  return new TileLayer({
    title,
    visible: false,
    minZoom: 15,
    maxZoom: 22,
    footprintDiscovery: true,
    displayInLayerSwitcher: true,
    source: new TileWMS({
      url,
      params: {
        VERSION: "1.1.1",
        LAYERS: "ndertesa,pasuri",
        STYLES: "",
        FORMAT: "image/png",
        TRANSPARENT: true,
        SRS: "EPSG:3857",
      },
      crossOrigin: "anonymous",
    }),
  });
}

function createAsigZrppWmsLayer(title, layerName) {
  return new TileLayer({
    title,
    visible: false,
    minZoom: 15,
    maxZoom: 22,
    footprintDiscovery: true,
    displayInLayerSwitcher: true,
    source: new TileWMS({
      url: "https://geoportal.asig.gov.al/service/zrpp/wms",
      params: {
        VERSION: "1.1.1",
        LAYERS: layerName,
        STYLES: "",
        FORMAT: "image/png",
        TRANSPARENT: true,
        SRS: "EPSG:3857",
      },
      crossOrigin: "anonymous",
    }),
  });
}

const kadasterWmsGroup = new LayerGroup({
  title: "Kadaster WMS",
  openInLayerSwitcher: true,
  displayInLayerSwitcher: true,
  layers: [
    createKadasterWmsLayer("Himare WMS", "https://apps.kadaster.al/himarewms"),
    createKadasterWmsLayer("Dhermi WMS", "https://apps.kadaster.al/dhermiwms"),
    createKadasterWmsLayer("Palase WMS", "https://apps.kadaster.al/palasewms"),
    createAsigZrppWmsLayer(
      "P Kadastrale ASHK 04/2025",
      "p_kadastrale_ashk_042025",
    ),
    createAsigZrppWmsLayer(
      "Parcela Kadastrale QKD 04/2025",
      "parcela_kadastrale_qkd_042025",
    ),
  ],
});

map.addLayer(kadasterWmsGroup);

const footprintBoxStyle = new Style({
  fill: new Fill({ color: "rgba(26, 115, 232, 0.08)" }),
  stroke: new Stroke({
    color: "rgba(26, 115, 232, 0.85)",
    width: 2,
    lineDash: [8, 6],
  }),
});

const footprintBoxHighlightStyle = new Style({
  fill: new Fill({ color: "rgba(249, 115, 22, 0.1)" }),
  stroke: new Stroke({
    color: "rgba(249, 115, 22, 0.9)",
    width: 2,
    lineDash: [8, 6],
  }),
});

const footprintSource = new VectorSource();
const footprintLayer = new VectorLayer({
  title: "Automatic coverage boxes",
  source: footprintSource,
  style: (feature) => [
    feature.get("isMultiLayer")
      ? footprintBoxHighlightStyle
      : footprintBoxStyle,
    new Style({
      text: new Text({
        text: feature.get("label") || "",
        font: "bold 12px Calibri,sans-serif",
        fill: new Fill({ color: "#0f172a" }),
        stroke: new Stroke({ color: "#ffffff", width: 3 }),
        overflow: true,
      }),
    }),
  ],
  displayInLayerSwitcher: false,
});
footprintLayer.setZIndex(170);
map.addLayer(footprintLayer);

let footprintUpdateTimer = null;
let footprintRequestId = 0;

function getFootprintDiscoveryLayers() {
  const layers = [];
  kadasterWmsGroup.getLayers().forEach((layer) => {
    if (layer.get("footprintDiscovery")) layers.push(layer);
  });
  return layers;
}

function isLayerOutOfScale(layer) {
  const zoom = map.getView().getZoom() || 0;
  const minZoom = layer.getMinZoom?.() ?? -Infinity;
  const maxZoom = layer.getMaxZoom?.() ?? Infinity;
  return zoom <= minZoom || zoom > maxZoom;
}

function makeFootprintCellGeometry(extent) {
  const [minX, minY, maxX, maxY] = extent;
  return new Polygon([
    [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY],
    ],
  ]);
}

function extentIntersectsOrNear(a, b, tolerance) {
  return !(
    a[2] + tolerance < b[0] ||
    b[2] + tolerance < a[0] ||
    a[3] + tolerance < b[1] ||
    b[3] + tolerance < a[1]
  );
}

function mergeExtents(a, b) {
  return [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3]),
  ];
}

function clusterFootprintHits(hits) {
  const resolution = map.getView().getResolution() || 1;
  const tolerance = resolution * 100;
  const clusters = [];

  hits.forEach((hit) => {
    let cluster = clusters.find((item) =>
      extentIntersectsOrNear(item.extent, hit.extent, tolerance),
    );

    if (!cluster) {
      clusters.push({
        extent: hit.extent,
        layerTitles: new Set([hit.layerTitle]),
      });
      return;
    }

    cluster.extent = mergeExtents(cluster.extent, hit.extent);
    cluster.layerTitles.add(hit.layerTitle);
  });

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        if (
          extentIntersectsOrNear(
            clusters[i].extent,
            clusters[j].extent,
            tolerance,
          )
        ) {
          clusters[i].extent = mergeExtents(
            clusters[i].extent,
            clusters[j].extent,
          );
          clusters[j].layerTitles.forEach((title) =>
            clusters[i].layerTitles.add(title),
          );
          clusters.splice(j, 1);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  return clusters;
}

async function hasWmsFeatureAtCoordinate(layer, coordinate) {
  const source = layer.getSource();
  const url = source.getFeatureInfoUrl(
    coordinate,
    map.getView().getResolution(),
    map.getView().getProjection(),
    {
      INFO_FORMAT: "application/json",
      FEATURE_COUNT: 1,
    },
  );

  if (!url) return false;

  try {
    const response = await fetch(url);
    const text = await response.text();
    if (!response.ok || !text.trim()) return false;

    try {
      const json = JSON.parse(text);
      return Boolean(json.features?.length);
    } catch (_) {
      return !/exception|serviceexception|no features/i.test(text);
    }
  } catch (error) {
    console.warn("Footprint discovery failed:", layer.get("title"), error);
    return false;
  }
}

async function sampleFootprintLayer(layer, requestId) {
  const size = map.getSize();
  if (!size) return [];

  const cols = 7;
  const rows = 7;
  const hits = [];
  const cellWidth = size[0] / cols;
  const cellHeight = size[1] / rows;

  for (let col = 0; col < cols; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      if (requestId !== footprintRequestId) return [];

      const pixel = [(col + 0.5) * cellWidth, (row + 0.5) * cellHeight];
      const coordinate = map.getCoordinateFromPixel(pixel);
      const hasFeature = await hasWmsFeatureAtCoordinate(layer, coordinate);
      if (!hasFeature) continue;

      const minCoordinate = map.getCoordinateFromPixel([
        col * cellWidth,
        (row + 1) * cellHeight,
      ]);
      const maxCoordinate = map.getCoordinateFromPixel([
        (col + 1) * cellWidth,
        row * cellHeight,
      ]);
      hits.push({
        layerTitle: layer.get("title"),
        extent: [
          Math.min(minCoordinate[0], maxCoordinate[0]),
          Math.min(minCoordinate[1], maxCoordinate[1]),
          Math.max(minCoordinate[0], maxCoordinate[0]),
          Math.max(minCoordinate[1], maxCoordinate[1]),
        ],
      });
    }
  }

  return hits;
}

function renderFootprintClusters(hits) {
  footprintSource.clear();
  const clusters = clusterFootprintHits(hits);

  clusters.forEach((cluster) => {
    const titles = Array.from(cluster.layerTitles);
    footprintSource.addFeature(
      new Feature({
        geometry: makeFootprintCellGeometry(cluster.extent),
        label:
          titles.length > 1 ? `${titles.length} layers with data` : titles[0],
        isMultiLayer: titles.length > 1,
      }),
    );
  });
}

async function updateAutomaticFootprints() {
  const requestId = ++footprintRequestId;
  const activeLayers = getFootprintDiscoveryLayers().filter(
    (layer) => layer.getVisible() && isLayerOutOfScale(layer),
  );

  if (!activeLayers.length) {
    footprintSource.clear();
    return;
  }

  const allHits = [];
  for (const layer of activeLayers) {
    const layerHits = await sampleFootprintLayer(layer, requestId);
    if (requestId !== footprintRequestId) return;
    allHits.push(...layerHits);
  }

  renderFootprintClusters(allHits);
}

function scheduleAutomaticFootprints() {
  window.clearTimeout(footprintUpdateTimer);
  footprintUpdateTimer = window.setTimeout(updateAutomaticFootprints, 250);
}

map.on("moveend", scheduleAutomaticFootprints);
getFootprintDiscoveryLayers().forEach((layer) => {
  layer.on("change:visible", scheduleAutomaticFootprints);
});
scheduleAutomaticFootprints();
