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

const mapOptions = {
  "tilt": 0,
  "heading": 0,
  "zoom": 18,
  "center": { lat: 24.9877, lng: 121.5756 }, // 設立地圖起始中心點
  "mapId": "ca4f444e44fa22da"
}

// Fetch the api key from the server side
async function fetchApiKey() {
  try {
    const response = await fetch('http://localhost:8080/api/key');
    const data = await response.json();
    const apiKey = data.apiKey;
    // Use the retrieved apiKey for your client-side operations
    console.log(apiKey);
    return apiKey;
  } catch (error) {
    console.error('Error fetching API key:', error);
    throw error;
  }
}

function addFloorPlan(lat, lng, floor_plan) {
  const floorPlanGeometry = new THREE.PlaneGeometry(10, 10); // Adjust the size as needed
  const floorPlanTexture = new THREE.TextureLoader().load(floor_plan); // Provide the path to your floor plan image
  const floorPlanMaterial = new THREE.MeshBasicMaterial({ map: floorPlanTexture });
  const floorPlan = new THREE.Mesh(floorPlanGeometry, floorPlanMaterial);
  
  // Convert latitude and longitude to 3D position
  const position3D = convertLatLngToPosition(lat, lng);
  floorPlan.position.copy(position3D);

  return floorPlan; // Return the floorPlan mesh
}



function convertLatLngToPosition(lat, lng) {
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);
  // Convert latitude and longitude to X and Z coordinates assuming a spherical coordinate system
  const radius = 1; // Radius of the sphere
  const x = radius * Math.cos(latRad) * Math.cos(lngRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lngRad);

  return new THREE.Vector3(x, y, z);
}

async function initMap() {    
  const apiKey = await fetchApiKey();
  const loader = new Loader({
    // 換成你的 Api Key
    apiKey: apiKey,
    version: "weekly",
    libraries: ["places"],
  });

  const mapDiv = document.getElementById("map");
  await loader.load();
  return new google.maps.Map(mapDiv, mapOptions);
}

async function initWebGLOverlayView (map) {
  let scene, renderer, camera, loader;
  const webGLOverlayView = new google.maps.WebGLOverlayView();

  // 實作生命週期掛鉤
  webGLOverlayView.onAdd = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();

    // Add floor plan at specific latitude and longitude
    const floorPlanLat = 24.9873; // Replace with your desired latitude
    const floorPlanLng = 121.5754; // Replace with your desired longitude
    const floorPlan = addFloorPlan(floorPlanLat, floorPlanLng, 'floor_plan.jpg');
    scene.add(floorPlan);

    // const rectangleLat = 24.9873; // Replace with your desired latitude
    // const rectangleLng = 121.5754; // Replace with your desired longitude
    // const width = 5; // Replace with the desired width
    // const height = 3; // Replace with the desired height
    // const color = 0xff0000; // Replace with the desired color in hexadecimal format

    // const rectangle = addRectangle(rectangleLat, rectangleLng, width, height, color);
    // scene.add(rectangle);

    // 將光源新增至場景中
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.75 );
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    scene.add(directionalLight);

    // Create a PlacesService object to perform place searches
    const placesService = new google.maps.places.PlacesService(map);

    // Function to handle place search results
    function handleSearchResults(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Retrieve the first result and add a rectangle at its location
        const place = results[0];
        console.log(place)
        const { lat, lng } = place.geometry.location;
        const width = 5; // Replace with the desired width
        const height = 3; // Replace with the desired height
        const color = 0xff0000; // Replace with the desired color in hexadecimal format
        addRectangle(lat(), lng(), width, height, color);
      } else {
        console.error('Place search failed:', status);
      }
    }

    function addRectangle(lat, lng, width, height, color) {
      const rectangleGeometry = new THREE.BoxGeometry(width, height, 0);
      const rectangleMaterial = new THREE.MeshBasicMaterial({ color: color });
      const rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
    
      // Convert latitude and longitude to 3D position
      const position3D = convertLatLngToPosition(lat, lng);
      rectangle.position.copy(position3D);
    
      scene.add(rectangle);
    }

    // Function to handle search form submission
    function handleSearchFormSubmit(event) {
      event.preventDefault();
      const searchTerm = document.getElementById('search-input').value;

      // Perform a place search based on the entered term
      placesService.textSearch({ query: searchTerm }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          // Retrieve the first result
          const place = results[0];
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          if (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) {
            // Move the map to the location
            map.setCenter({ lat, lng });
            map.setZoom(18); // Adjust the zoom level as desired

            // Optional: Add a marker at the location
            const marker = new google.maps.Marker({
              position: { lat, lng },
              map: map,
              title: place.name
            });
          } else {
            console.error('Invalid coordinates:', place.geometry.location);
          }
        } else {
          console.error('Place search failed:', status);
        }
      });
    }

    // Create the search form elements
    const searchForm = document.createElement('form');
    searchForm.style.position = 'absolute';
    searchForm.style.top = '10px';
    searchForm.style.left = '10px';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'search-input';

    // Create an AutocompleteService object
    const autocompleteService = new google.maps.places.AutocompleteService();

    // Create a container for the suggestions dropdown
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.classList.add('suggestions-container');
    searchForm.appendChild(suggestionsContainer);

    // Listen for input event on search input field
    searchInput.addEventListener('input', () => {
      const input = searchInput.value;
      const inputRect = searchInput.getBoundingClientRect();
    
      // Calculate the top and left position for the suggestions container
      const top = inputRect.bottom + window.pageYOffset;
      const left = inputRect.left + window.pageXOffset;
    
      // Set the position of the suggestions container
      suggestionsContainer.style.position = 'absolute';
      suggestionsContainer.style.top = `${top}px`;
      suggestionsContainer.style.left = `${left}px`;
    
      // Set the background color and other styles for the suggestions container
      suggestionsContainer.style.backgroundColor = '#FFFFFF';
      suggestionsContainer.style.border = '1px solid #CCCCCC';
      suggestionsContainer.style.borderRadius = '4px';
      suggestionsContainer.style.padding = '8px';
    
      // Perform autocomplete prediction request
      autocompleteService.getPlacePredictions({ input: input }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          // Clear previous suggestions
          suggestionsContainer.innerHTML = '';
    
          // Create and display the dropdown list of suggestions
          predictions.forEach((prediction, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.textContent = prediction.description;
            suggestionItem.classList.add('suggestion-item');
    
            // Add additional styling for each suggestion item
            if (index !== predictions.length - 1) {
              suggestionItem.style.borderBottom = '1px solid #000000';
            }

            // Add hover effect to suggestion item
            suggestionItem.addEventListener('mouseenter', () => {
              suggestionItem.classList.add('suggestion-item-hover');
              suggestionItem.style.cursor = 'pointer'; // Set the cursor to hand
            });

            suggestionItem.addEventListener('mouseleave', () => {
              suggestionItem.classList.remove('suggestion-item-hover');
              suggestionItem.style.cursor = 'default'; // Set the cursor to default
            });
    
            // Add click event listener to each suggestion item
            suggestionItem.addEventListener('click', () => {
              searchInput.value = prediction.description;
              searchForm.addEventListener('submit', handleSearchFormSubmit);
            });
    
            suggestionsContainer.appendChild(suggestionItem);
          });
        }
      });
    });

    const searchButton = document.createElement('button');
    searchButton.type = 'submit';
    searchButton.textContent = 'Search';

    // Append the search form elements to the search form
    searchForm.appendChild(searchInput);
    searchForm.appendChild(searchButton);

    // Add event listener for form submission
    searchForm.addEventListener('submit', handleSearchFormSubmit);

    // Append the search form to the map container
    const mapContainer = map.getDiv();
    mapContainer.appendChild(searchForm);

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
    //   console.log(position)
    //   const position3D = convertLatLngToPosition(lat, lng); // Function to convert lat/lng to 3D position
    //   console.log(position3D)

    //   loader.load(
    //     'pin.gltf',
    //     (gltf) => {
    //       const landmark = gltf.scene;
    //       console.log(gltf.scene.scale)
    //       landmark.position.copy(position3D);
    //       scene.add(landmark);
    //     },
    //     undefined,
    //     (error) => {
    //       console.error('Error loading landmark model:', error);
    //     }
    //   );
    // });

    // loader = new GLTFLoader();
    // const source = 'pin.gltf';
    // loader.load(
    //   source,
    //   gltf => {
    //     gltf.scene.scale.set(25,25,25);
    //     gltf.scene.rotation.x = 180 * Math.PI/180;
    //     scene.add(gltf.scene);
    //   }
    // );
  }

  webGLOverlayView.onContextRestored = ({gl}) => {
    // 設定 WebGL 轉譯器
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
      clearColor: 0xffffff, // Set the color to match the floor plan background color
      alpha: true, // Enable transparency for the floor plan texture
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

// Main Function
(async () => {
  const map = await initMap();
  initWebGLOverlayView(map);
})();