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
  "mapId": "ca4f444e44fa22da",
}

let map;
let destination;

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

function addRectangle(lat, lng, width, height, color) {
  const rectangleGeometry = new THREE.BoxGeometry(width, height, 0);
  const rectangleMaterial = new THREE.MeshBasicMaterial({ color: color });
  const rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);

  // Convert latitude and longitude to 3D position
  const position3D = convertLatLngToPosition(lat, lng);
  rectangle.position.copy(position3D);

  scene.add(rectangle);
}

let marker = null;
let directionsRenderer = null;

// Function to handle search form submission
function handleSearchFormSubmit(event) {
  event.preventDefault();
  const searchTerm = document.getElementById('search-input').value;

  // Clear previous marker
  if (marker) {
    marker.setMap(null);
  }

  // Clear previous route
  if (directionsRenderer) {
    directionsRenderer.setMap(null);
  }

  // Create a PlacesService object to perform place searches
  const placesService = new google.maps.places.PlacesService(map);

  // Perform a place search based on the entered term
  placesService.textSearch({ query: searchTerm }, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Retrieve the first result
      let place = results[0];
      let lat = place.geometry.location.lat();
      let lng = place.geometry.location.lng();

      if (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) {
        // Move the map to the location
        map.setCenter({ lat, lng });
        map.setZoom(18); // Adjust the zoom level as desired

        // Add a marker at the location
        marker = addMarker(lat, lng, place)

      } else {
        console.error('Invalid coordinates:', place.geometry.location);
      }
    } else {
      console.error('Place search failed:', status);
    }
  });
}

function addMarker(lat, lng, place) {
  
  // Create a new instance of the Places service
  const service = new google.maps.places.PlacesService(map);

  marker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: map,
    title: place ? place.name : 'Unknown place', // If place is available, set to place.name. Otherwise, set to 'Unknown place'.
  });

  const latLng = new google.maps.LatLng(lat, lng);
  destination = latLng;

  marker.addListener('click', () => {    
    if (place) {
      // If place is available, display the detailed information of the place
      console.log(place); // Example: Log the place object to the console
      showDetailedInfo(place,latLng);
    } else {
      // If place is not available, perform a nearby search
      service.nearbySearch(
        {
          location: { lat: lat, lng: lng },
          radius: 1 // Adjust the radius as needed
        },
        function(results, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            const place = results[0]; // Get the first place from the search results
            addMarker(lat, lng, place); // Call addMarker recursively with the place parameter
          }
        }
      );
    }
  });

  return marker
}

// Create a variable to store the info window
let infoWindow = null; 

// When the marker is clicked, show infoWindow to display the detailed info & functions of the location
function showDetailedInfo(place, destination){
  // Close any previously opened info window
  if (infoWindow) {
    infoWindow.close();
  }

  // Create a new info window
  infoWindow = new google.maps.InfoWindow();

  // Fetch photo from place (with error handling)
  let photoUrl
  if (place && place.photos && place.photos.length > 0) {
    photoUrl = place.photos[0].getUrl({ maxWidth: 200 });
  } else {
    const placeId = place.place_id;
    const placesService = new google.maps.places.PlacesService(map);

    // Retrieve detailed place information using the place_id
    placesService.getDetails({ placeId: placeId }, (placeResult, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const photos = placeResult.photos;
        if (photos && photos.length > 0) {
          photoUrl = photos[0].getUrl({ maxWidth: 200 });
        } else {
          console.log("No photos available for this place");
        }
      } else {
        console.log("Failed to fetch details for this place");
      }
    });
  }
  console.log(photoUrl);

  if(place.name == undefined) {
    place.name = 'Unknown place';
  }

  // Set the content of the info window
  infoWindow.setContent(`
    <div style="text-align: center;">
      <img src="${photoUrl}" alt="No Photo Available">
      <h3>${place.name}</h3>
      <p>${place.formatted_address}</p>
      <!-- Add HTML elements for route planning, menu, comments, photos, and information -->
      <button id="planRouteButton">Plan Route</button>
    </div>
  `);
  
  // Open the info window at the marker's position
  infoWindow.open(map, marker);
}

// Route Planning
function calculateAndDisplayRoute(destination) {
  // Get the user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (currentPosition) => {
          let userLat = currentPosition.coords.latitude;
          let userLng = currentPosition.coords.longitude;

          // Create a directions service and renderer
          let directionsService = new google.maps.DirectionsService();
          directionsRenderer = new google.maps.DirectionsRenderer();

          directionsRenderer.setMap(map);

          let origin = new google.maps.LatLng(userLat, userLng);

          let request = {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
          };
          

          directionsService.route(request, (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsRenderer.setDirections(response);
            } else {
              console.log('Error calculating the route:', status);
            }
          });
        },
        (error) => {
          console.error("Error retrieving user's location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    } 
}


let parameter1;
let parameter2;
let queryString;
let url;
let newWindow;

// Function to handle button clicks
function infoWindowButtonClicked(tabTitle, tabParameter1, tabParameter2) {
  parameter1 = tabParameter1;
  parameter2 = tabParameter2;
  queryString = `?param1=${encodeURIComponent(parameter1)}&param2=${encodeURIComponent(parameter2)}`;
  url = `glb-model.html${queryString}`;
  newWindow = window.open(url, '_blank'); // Open the new page in a new tab/window
  // Set the title of the new window once it's fully loaded
  newWindow.onload = function() {
    newWindow.document.title = tabTitle;
  };
}

let buttonEventListeners = []; // Store the button event listeners

// Attach click event handlers to the buttons inside the info window
function attachButtonEventListeners(title, engName) {
  const buttons = document.querySelectorAll('.info-window-button');
  for (let i = 0; i < buttons.length; i++) {
    const buttonListener = function () {
      const buttonNumber = parseInt(buttons[i].getAttribute('data-button'));
      let tabTitle = title + buttonNumber + '樓';
      let tabParameter1 = engName + '-' + buttonNumber + 'F-cube.glb';
      let tabParameter2 = engName + '-' + buttonNumber + 'F-nav.glb';
      console.log(buttonNumber + "clicked!");
      console.log(tabTitle);
      infoWindowButtonClicked(tabTitle, tabParameter1, tabParameter2);
    };
    buttons[i].addEventListener('click', buttonListener);
    buttonEventListeners.push({ element: buttons[i], listener: buttonListener });
  }
}

// Function to remove click event listener from buttons
function removeButtonEventListeners() {
  buttonEventListeners.forEach(({ element, listener }) => {
    element.removeEventListener('click', listener);
  });
  buttonEventListeners = [];
}


function createFloorPlanWindow(map, lat, lng, title, engName, imgUrl, floorNumStart, floorNumEnd) {
  const SpatializedMarker = new google.maps.Marker({
    map,
    title: title,
    icon: {
      url: imgUrl,
      scaledSize: new google.maps.Size(36, 36),
      /**
       * The position at which to anchor an image in correspondence to the
       * location of the marker on the map. By default, the anchor is located
       * along the center point of the bottom of the image.
       */
      anchor: new google.maps.Point(18, 18),
    },
    position: {
      lat: lat,
      lng: lng,
    },
  });

  let buttons = '';
  for (let floor = floorNumStart; floor < floorNumEnd + 1; floor++) {
    buttons += `<button class="info-window-button" data-button="${floor}">${floor}F</button>`;
  }

  // Create the info window content
  const infoWindowContent = `
    <div>
      <img src=${imgUrl} style="max-width: 200px; display: block; margin: 0 auto;">
      <h3 style="text-align:center">${title}</h3>
      <div class="info-window-buttons" id="button-container">
        ${buttons}
      </div>
    </div>
  `;


  // Create the info window object
  infoWindow = new google.maps.InfoWindow({
    content: infoWindowContent,
  });


  // Add a click event listener to the marker
  SpatializedMarker.addListener('click', async function () {
    // Close any previously opened info windows
    if (infoWindow !== null) {
      removeButtonEventListeners();
      await infoWindow.close();
    }

    // Create a new info window when the marker is clicked
    infoWindow = new google.maps.InfoWindow({
      content: infoWindowContent,
    });

    // Open the new info window
    await infoWindow.open(map, SpatializedMarker);

    // Attach event listeners only once when the info window is first opened
    attachButtonEventListeners(title, engName);
  });
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

  // Initialize the map with the mapOptions
  map = new google.maps.Map(mapDiv, mapOptions);

  createFloorPlanWindow(map, 24.987115, 121.57695, '學思樓', 'Syue-Sih', "https://classroom.nccu.edu.tw/work/bding/06051520352401.jpg", 1, 4);
  createFloorPlanWindow(map, 24.9872, 121.5765, '研究大樓', 'Research', "https://classroom.nccu.edu.tw/work/bding/06051521042103.jpg", 1, 9);
  createFloorPlanWindow(map, 24.98656, 121.57655, '商學院', 'College-of-Commerce', "https://classroom.nccu.edu.tw/work/bding/06051521034602.jpg", 1, 9);
  createFloorPlanWindow(map, 24.9868, 121.57688, '逸仙樓', 'Yi-Xian', "https://classroom.nccu.edu.tw/work/bding/01904032317591.jpg", 1, 4);
  createFloorPlanWindow(map, 24.9862, 121.5751, '行政大樓', 'Administration', "https://lh3.googleusercontent.com/p/AF1QipOjNUeZCvP_ckYGg8BKWFW4Afeu7CS9iW4LnwYl=s1360-w1360-h1020", 2, 4);
  createFloorPlanWindow(map, 24.98677, 121.57395, '大勇樓', 'Da-Yong', "https://classroom.nccu.edu.tw/work/bding/01905020929035.jpg", 1, 4);
  createFloorPlanWindow(map, 24.9864, 121.57365, '綜合院館', 'General', "https://classroom.nccu.edu.tw/work/bding/06051521023603.jpg", 1, 11);
  createFloorPlanWindow(map, 24.98833, 121.57888, '達賢圖書館', 'Dah-Hsian-Library', "https://dhl.lib.nccu.edu.tw/var/file/1/1001/randimg/mobileadv_43_8688974_62372.jpg", 2, 8);
  createFloorPlanWindow(map, 24.982, 121.5726, '藝文中心', 'Art&Culture-Center', "https://classroom.nccu.edu.tw/work/bding/09012009250201.jpg", 1, 8);


  // Attach a click event listener to the map object
  google.maps.event.addListener(map, 'click', function(event) {
    // Retrieve the clicked location coordinates
    let lat = event.latLng.lat()
    let lng = event.latLng.lng()

    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);
    // const placesService = new google.maps.places.PlacesService(map);

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
        // const place = results[0];
        destination = latLng;
      } else {
        console.log('Geocoder failed due to:', status);
      }
    });
  });
}

async function initWebGLOverlayView () {
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
      // componentRestrictions: limit to Taiwan
      autocompleteService.getPlacePredictions({ input: input, componentRestrictions: { country: 'tw' } }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          // Clear previous suggestions
          suggestionsContainer.innerHTML = '';
    
          console.log(predictions)
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


    // Create the "Plan Route" button
    const planRouteButton = document.createElement('button');
    planRouteButton.textContent = 'Plan Route';

    // Style the "Plan Route" button
    // const planRouteButtonRect = planRouteButton.getBoundingClientRect();
    
    // Calculate the top and left position for the suggestions container
    // const top = planRouteButtonRect.bottom + window.pageYOffset;
    // const left = planRouteButtonRect.left + window.pageXOffset;

    planRouteButton.style.position = 'relative';
    planRouteButton.style.top = '10px';
    planRouteButton.style.left = `250px`;
    // planRouteButton.style.top = `${top + 10}px`;
    // planRouteButton.style.left = `${left + 250}px`;

    // Add event listener for the button click
    planRouteButton.addEventListener('click', function() {
      if (destination) {
        console.log('Plan Route clicked!');
        calculateAndDisplayRoute(destination);
      } else {
        console.log('No destination selected!');
      }
    });

    // Append the button to the map container
    mapContainer.appendChild(planRouteButton);

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
  await initMap();
  initWebGLOverlayView();
})();