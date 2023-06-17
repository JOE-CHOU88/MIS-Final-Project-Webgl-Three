// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Loader } from '@googlemaps/js-api-loader';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const apiOptions = {
  // 換成你的 Api Key
  "apiKey": "AIzaSyCgrUn9CL-iT4lwAc86COi_nblyQdLm_w0",
};

const mapOptions = {
  "tilt": 0,
  "heading": 0,
  "zoom": 18,
  "center": { lat: 24.9877, lng: 121.5756 }, // 設立地圖起始中心點
  "mapId": "ca4f444e44fa22da"
}

async function initMap() {    
  const mapDiv = document.getElementById("map");
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load()      
  return new google.maps.Map(mapDiv, mapOptions);
}

async function initWebGLOverlayView (map) {
  let scene, renderer, camera, loader;
  const webGLOverlayView = new google.maps.WebGLOverlayView();

  // 實作生命週期掛鉤
  webGLOverlayView.onAdd = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    // 將光源新增至場景中
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.75 );
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    scene.add(directionalLight);

    // // Add landmarks
    // const landmarkPositions = [
    //   { lat: 24.9873, lng: 121.5754 },
    //   // Add more landmark positions as needed
    // ];

    // const markerGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    // const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // loader = new GLTFLoader();

    // landmarkPositions.forEach((position) => {
    //   const { lat, lng } = position;
    //   const position3D = convertLatLngToPosition(lat, lng); // Function to convert lat/lng to 3D position

    //   loader.load(
    //     'pin.gltf',
    //     (gltf) => {
    //       const landmark = gltf.scene;
    //       landmark.position.copy(position3D);
    //       scene.add(landmark);
    //     },
    //     undefined,
    //     (error) => {
    //       console.error('Error loading landmark model:', error);
    //     }
    //   );
    // });

    loader = new GLTFLoader();
      const source = 'pin.gltf';
      loader.load(
        source,
        gltf => {
          gltf.scene.scale.set(25,25,25);
          gltf.scene.rotation.x = 180 * Math.PI/180;
          scene.add(gltf.scene);
        }
      );
  }

  webGLOverlayView.onContextRestored = ({gl}) => {
    // 設定 WebGL 轉譯器
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });

    renderer.autoClear = false;
  }

  webGLOverlayView.onDraw = ({gl, transformer}) => {
    const latLngAltitudeLiteral = {
      lat: mapOptions.center.lat,
      lng: mapOptions.center.lng,
      altitude: 100
    }

    const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    // 顯示場景
    webGLOverlayView.requestRedraw();
    renderer.render(scene, camera);
    renderer.resetState();
  }
  // 在地圖上新增疊加層例項
  webGLOverlayView.setMap(map);
}

(async () => {
  const map = await initMap();
  initWebGLOverlayView(map);
})();