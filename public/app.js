// app.js


document.addEventListener('DOMContentLoaded', () => {
 // --- Global variables to keep track ---
 let selectedCoords = null;   // coordinates the user picks (from map or location list)
 let tempMarker = null;       // temporary marker for the place being reviewed
 let markers = [];            // array of markers for reviews shown on the map
 let allReviews = [];         // reviews pulled from backend
 let allLocations = [];       // places fetched (local or global search)


 // map setup — default view around College Park, MD
 const map = L.map('map').setView([38.99, -76.94], 13);


 // add map tiles from OpenStreetMap
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
   attribution: '&copy; OpenStreetMap contributors',
   // don't wrap the world horizontally — prevents duplicate continents when zoomed out
   noWrap: true
 }).addTo(map);


 // Grab UI elements
 // sidebar has a single Locations header; only need the locations button for mode switching
 const tabLocationsBtn = document.getElementById('tabLocations');
 const listContainer = document.getElementById('listContainer');


 const cityInput = document.getElementById('cityInput');
 const stateInput = document.getElementById('stateInput');
 const countrySelect = document.getElementById('countrySelect');
 const sidebarPlaceNameInput = document.getElementById('placeNameInput');
 // categorySelect is the preferred category token selector
 const btnGlobalSearch = document.getElementById('searchPlacesBtn');
 const categorySelect = document.getElementById('categorySelect');
 const radiusKmInput = document.getElementById('radiusKmInput');
 const progressiveFallbackCheckbox = document.getElementById('progressiveFallbackCheckbox');
 const reviewCityInput = document.getElementById('reviewCityInput');
 const reviewStateInput = document.getElementById('reviewStateInput');
 const reviewCountryInput = document.getElementById('reviewCountryInput');
 const reviewPlaceNameInput = document.getElementById('reviewPlaceNameInput');
 const reviewAddressInput = document.getElementById('reviewAddressInput');
 const reviewFormErrors = document.getElementById('reviewFormErrors');
 const reviewCoordsDisplay = document.getElementById('reviewCoordsDisplay');
 const submitTabBtn = document.getElementById('submit-tab');
 const pastTabBtn = document.getElementById('past-tab');
 const tabSubmit = document.getElementById('tabSubmit');
 const tabPast = document.getElementById('tabPast');
 const locationsList = document.getElementById('locationsList');
 const filterCity = document.getElementById('filterCity');
 const filterState = document.getElementById('filterState');
 const filterCountry = document.getElementById('filterCountry');
 const filterCategoryInput = document.getElementById('filterCategoryInput');
 const tabReviewLocationBtn = document.getElementById('tabReviewLocationBtn');
 const tabReviewPlaceBtn = document.getElementById('tabReviewPlaceBtn');
 const tabReviewLocation = document.getElementById('tabReviewLocation');
 const tabReviewPlace = document.getElementById('tabReviewPlace');


 let currentMode = 'locations';       // either "reviews", "locations", or "globalSearch"
 let globalSearchResults = [];      // store results from global place search
 let globalSearchMarkers = [];      // markers for global search results
 let isSearching = false;           // whether a global search is in progress
 const defaultLocationString = 'College Park, MD';
 // common typed category -> Geoapify category token mapping (expandable)
 const CATEGORY_MAP = {
   'coffee': 'catering.cafe',
   'cafe': 'catering.cafe',
   'coffee shop': 'catering.cafe',
   'supermarket': 'commercial.supermarket',
   'grocery': 'commercial.supermarket',
   'grocery store': 'commercial.supermarket',
   'super mart': 'commercial.supermarket',
   'convenience': 'commercial.convenience',
   'convenience store': 'commercial.convenience',
   'bodega': 'commercial.convenience',
   'corner store': 'commercial.convenience',
   'produce': 'commercial.food_and_drink.fruit_and_vegetable',
   'farmers market': 'commercial.food_and_drink.fruit_and_vegetable',
   'market': 'commercial.marketplace',
   'marketplace': 'commercial.marketplace',
   'restaurant': 'catering.restaurant',
   'bar': 'entertainment.bar',
   'pub': 'entertainment.pub',
   'bakery': 'catering.bakery',
   'cinema': 'entertainment.cinema',
   'pharmacy': 'healthcare.pharmacy',
   'hospital': 'healthcare.hospital',
   'gas station': 'service.vehicle.fuel',
   'fuel': 'service.vehicle.fuel',
   'gas': 'service.vehicle.fuel',
   'petrol': 'service.vehicle.fuel',
   'petrol station': 'service.vehicle.fuel'
 };


 // marker cluster groups & custom icons
 const poiCluster = L.markerClusterGroup();
 const reviewCluster = L.markerClusterGroup();
 map.addLayer(poiCluster);
 map.addLayer(reviewCluster);


 const poiIcon = L.divIcon({ className: 'poi-icon', iconSize: [14, 14] });
 const reviewIcon = L.divIcon({ className: 'review-icon', iconSize: [14, 14] });


 // The server provides API endpoints at /api/* so the API key remains server-side.


 // tab switching logic
 if (tabLocationsBtn) tabLocationsBtn.addEventListener('click', () => {
   currentMode = 'locations';
   clearGlobalSearchUI();
   renderList();
 });


 // Use Bootstrap tab events: when Past Reviews tab is shown, show reviews list
 if (pastTabBtn) {
   pastTabBtn.addEventListener('shown.bs.tab', () => {
     currentMode = 'reviews';
     renderList();
   });
 }
 if (submitTabBtn) {
   submitTabBtn.addEventListener('shown.bs.tab', () => {
     // focus submit mode
     currentMode = 'submit';
   });
 }


 // (old small review sub-tabs removed — using single inputs now)


 // when user clicks on the map, choose location manually
 map.on('click', (e) => {
   selectedCoords = e.latlng;
   document.getElementById('selectedCoords').textContent =
     `Lat: ${selectedCoords.lat.toFixed(4)}, Lng: ${selectedCoords.lng.toFixed(4)}`;


   if (tempMarker) map.removeLayer(tempMarker);
   tempMarker = L.marker(selectedCoords).addTo(map);


   // Clear any place name pre‑filled in the sidebar
   if (sidebarPlaceNameInput) sidebarPlaceNameInput.value = '';
 });


 // --- Add a review marker to the map for a review object ---
 function addMarker(review) {
   // ensure coords shape matches Leaflet expectation
   const coords = review.coords && review.coords.lat !== undefined ? [review.coords.lat, review.coords.lng] : review.coords;
   const popupParts = [];
   popupParts.push(`<strong>Place:</strong> ${review.placeName || 'Unknown'}`);
   // include a short excerpt of comments in the popup
   if (review.comments) {
     const excerpt = review.comments.length > 120 ? review.comments.slice(0, 117) + '...' : review.comments;
     popupParts.push(`<strong>Comments:</strong> ${excerpt}`);
   }
   if (review.challenges) {
     const ch = review.challenges;
     const challengesHtml = Object.keys(ch).map(k => `${k}: ${ch[k] === null ? 'N/A' : ch[k]}`).join('<br/>');
     popupParts.push(`<strong>Challenges:</strong><br/>${challengesHtml}`);
   }
   if (review.coords) popupParts.push(`<strong>Coords:</strong> ${review.coords.lat?.toFixed(6) || ''}, ${review.coords.lng?.toFixed(6) || ''}`);


   const marker = L.marker(coords, { icon: reviewIcon }).bindPopup(popupParts.join('<br/>'));
   markers.push(marker);
   reviewCluster.addLayer(marker);
 }


 // --- Clear global search input UI when switching tabs ---
 function clearGlobalSearchUI() {
   if (cityInput) cityInput.value = '';
   if (stateInput) stateInput.value = '';
   if (countrySelect) countrySelect.value = '';
   if (sidebarPlaceNameInput) sidebarPlaceNameInput.value = '';
   if (categorySelect) categorySelect.value = '';
   globalSearchResults = [];
   clearSearchMarkers();
 }


 function showMessage(msg) {
   const mb = document.getElementById('messageBox');
   if (!mb) return;
   // include a small Bootstrap spinner to the left of the message
   const spinner = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>`;
   mb.innerHTML = `${spinner}${msg}`;
   mb.classList.remove('d-none');
 }
 function hideMessage() {
   const mb = document.getElementById('messageBox');
   if (!mb) return;
   mb.classList.add('d-none');
   mb.innerHTML = '';
 }


 function clearSearchMarkers() {
   globalSearchMarkers.forEach(m => {
     try {
       poiCluster.removeLayer(m);
       if (map.hasLayer(m)) map.removeLayer(m);
     } catch (e) { /* ignore */ }
   });
   globalSearchMarkers = [];
 }


 // --- Render the sidebar list based on current mode ---
 function renderList() {
   // clear both review list and sidebar locations list
   if (listContainer) listContainer.innerHTML = '';
   if (locationsList) locationsList.innerHTML = '';


   if (currentMode === 'reviews') {
     // show all review items
     // apply filters from Past Reviews filters if present
     const fCity = (filterCity && filterCity.value || '').trim().toLowerCase();
     const fState = (filterState && filterState.value || '').trim().toLowerCase();
     const fCountry = (filterCountry && filterCountry.value || '').trim().toLowerCase();
     const fCat = (filterCategoryInput && filterCategoryInput.value || '').trim().toLowerCase();


     allReviews.filter(r => {
       if (!r.location) return true;
       if (fCity && (!r.location.city || !r.location.city.toLowerCase().includes(fCity))) return false;
       if (fState && (!r.location.state || !r.location.state.toLowerCase().includes(fState))) return false;
       if (fCountry && (!r.location.country || !r.location.country.toLowerCase().includes(fCountry))) return false;
       if (fCat) {
         const pname = (r.placeName || '').toLowerCase();
         const rc = (r.category || '').toLowerCase();
         if (!pname.includes(fCat) && !rc.includes(fCat)) return false;
       }
       return true;
     }).forEach((review, i) => {
       const item = document.createElement('li');
       item.className = 'list-group-item list-group-item-action';
       item.textContent = `${review.placeName || 'Unknown'} – Noise: ${review.noise}, Lighting: ${review.lighting}`;
       item.style.cursor = 'pointer';


       item.addEventListener('click', () => {
         map.setView(review.coords, 16);
         if (markers[i]) markers[i].openPopup();


         selectedCoords = review.coords;
         document.getElementById('selectedCoords').textContent =
           `Lat: ${selectedCoords.lat.toFixed(4)}, Lng: ${selectedCoords.lng.toFixed(4)}`;
         if (sidebarPlaceNameInput) sidebarPlaceNameInput.value = review.placeName || '';
         if (reviewPlaceNameInput) reviewPlaceNameInput.value = review.placeName || '';
         if (reviewCityInput) reviewCityInput.value = (review.location && review.location.city) || '';
         if (reviewStateInput) reviewStateInput.value = (review.location && review.location.state) || '';
         if (reviewCountryInput) reviewCountryInput.value = (review.location && review.location.country) || '';
         if (reviewCoordsDisplay) reviewCoordsDisplay.textContent = `Coords: ${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`;


         if (tempMarker) map.removeLayer(tempMarker);
         tempMarker = L.marker(selectedCoords).addTo(map);
       });


       listContainer.appendChild(item);
     });


   } else if (currentMode === 'locations') {
     // show locally fetched places (with optional category filter)
 const typedCat = (categorySelect && categorySelect.value || '').trim().toLowerCase();


     allLocations
       .filter(loc => {
         // match by typed category token or name
         if (typedCat) {
           const nameMatch = loc.name && loc.name.toLowerCase().includes(typedCat);
           const catMatch = loc.category && loc.category.toLowerCase().includes(typedCat);
           return nameMatch || catMatch;
         }
         return true;
       })
       .forEach((loc) => {
         const item = document.createElement('li');
         item.className = 'list-group-item list-group-item-action';
         const cityPart = loc.city ? ` · ${loc.city}` : '';
         const addressHtml = loc.address ? `<div class="small text-muted">${loc.address}${cityPart}</div>` : (loc.city ? `<div class="small text-muted">${loc.city}</div>` : '');
         item.innerHTML = `<div><strong>${loc.name}</strong>${addressHtml}</div>`;
         item.style.cursor = 'pointer';


         item.addEventListener('click', () => {
           map.setView(loc.coords, 16);
           selectedCoords = loc.coords;
           document.getElementById('selectedCoords').textContent =
             `Lat: ${loc.coords.lat.toFixed(4)}, Lng: ${loc.coords.lng.toFixed(4)}`;
             if (sidebarPlaceNameInput) sidebarPlaceNameInput.value = loc.name;
             if (reviewPlaceNameInput) reviewPlaceNameInput.value = loc.name;
             if (reviewAddressInput) reviewAddressInput.value = loc.address || '';
             if (reviewCityInput) reviewCityInput.value = loc.city || '';
             if (reviewStateInput) reviewStateInput.value = loc.state || '';
             if (reviewCountryInput) reviewCountryInput.value = loc.country || (countrySelect && countrySelect.value) || '';
             if (reviewCoordsDisplay) reviewCoordsDisplay.textContent = `Coords: ${loc.coords.lat.toFixed(6)}, ${loc.coords.lng.toFixed(6)}`;


           if (tempMarker) map.removeLayer(tempMarker);
           tempMarker = L.marker(selectedCoords).addTo(map);
         });


         if (locationsList) locationsList.appendChild(item); else listContainer.appendChild(item);
       });


   } else if (currentMode === 'globalSearch') {
     // show results from global search via Geoapify
     if (globalSearchResults.length === 0) {
       // if a search is currently running, don't show "No places found" yet
       if (isSearching) {
         // leave list empty while searching
         if (locationsList) locationsList.innerHTML = '';
         else listContainer.innerHTML = '';
         return;
       }


       if (locationsList) locationsList.innerHTML = '<li class="list-group-item">No places found.</li>';
       else listContainer.innerHTML = '<li class="list-group-item">No places found.</li>';
       return;
     }


     globalSearchResults.forEach(place => {
       const item = document.createElement('li');
       item.className = 'list-group-item list-group-item-action';
 const pName = place.properties.name || 'Unnamed place';
 const pCat = place.properties.categories ? place.properties.categories[0] : 'Unknown category';
 const pAddress = place.properties.formatted || [place.properties.address_line1, place.properties.address_line2].filter(Boolean).join(', ');
 const cityPart = place.properties.city ? ` · ${place.properties.city}` : '';
 const addressHtml = pAddress ? `<div class="small text-muted">${pAddress}${cityPart}</div>` : (place.properties.city ? `<div class="small text-muted">${place.properties.city}</div>` : '');
 item.innerHTML = `<div><strong>${pName}</strong>${addressHtml}</div>`;
 item.style.cursor = 'pointer';


         item.addEventListener('click', () => {
           const lat = place.properties.lat;
           const lon = place.properties.lon;
           const coords = { lat, lng: lon };


           map.setView(coords, 16);
           selectedCoords = coords;


           document.getElementById('selectedCoords').textContent =
             `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}`;
           if (sidebarPlaceNameInput) sidebarPlaceNameInput.value = pName;
           if (reviewPlaceNameInput) reviewPlaceNameInput.value = pName;
           if (reviewAddressInput) reviewAddressInput.value = pAddress || '';
           // Try to fill city/state/country from place properties, fall back to sidebar inputs
           if (reviewCityInput) reviewCityInput.value = place.properties.city || cityInput.value || '';
           if (reviewStateInput) reviewStateInput.value = place.properties.state || stateInput.value || '';
           if (reviewCountryInput) reviewCountryInput.value = place.properties.country || (countrySelect && countrySelect.value) || '';
           if (reviewCoordsDisplay) reviewCoordsDisplay.textContent = `Coords: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;


           if (tempMarker) {
             map.removeLayer(tempMarker);
           }
           tempMarker = L.marker(coords).addTo(map);
         });


       if (locationsList) locationsList.appendChild(item); else listContainer.appendChild(item);
     });
   }
 }


 // --- Load reviews and local sample places on page load ---
 // outer DOMContentLoaded wrapper already exists; run initial load immediately
 (async function initialLoad() {
   try {
     const res = await fetch('/api/reviews');
     allReviews = await res.json();
     allReviews.forEach(addMarker);
   } catch (err) {
     console.error('couldn’t load reviews:', err);
   }


   await fetchLocations('catering.restaurant');
   renderList();
 })();


 // --- Fetch some nearby places in a fixed region (College Park area) ---
 async function fetchLocations(category = 'catering.restaurant') {
   try {
     const bounds = '-76.95,38.98,-76.93,39.00'; // bounding box around area


     // call server-side proxy to avoid exposing API key to the browser
     const url = `/api/places?categories=${encodeURIComponent(category)}&filter=rect:${bounds}&limit=50`;
     const resp = await fetch(url);
     const data = await resp.json();


     allLocations = data.features.map(f => ({
       name: f.properties.name || 'Unnamed',
       coords: { lat: f.properties.lat, lng: f.properties.lon },
       category: f.properties.categories && f.properties.categories[0] || 'other',
       city: f.properties.city || f.properties.county || '',
       state: f.properties.state || '',
       country: f.properties.country || '',
       address: f.properties.formatted || [f.properties.address_line1, f.properties.address_line2].filter(Boolean).join(', ')
     }));
     // ensure review country default from sidebar if present
 if (reviewCountryInput && !reviewCountryInput.value && countrySelect && countrySelect.value) reviewCountryInput.value = countrySelect.value;


   } catch (err) {
     console.error('couldn’t fetch places:', err);
     allLocations = [];
   }
 }


 // --- GLOBAL SEARCH FEATURE (two‐step API process) ---
 btnGlobalSearch.addEventListener('click', () => {
   const city = (cityInput && cityInput.value || '').trim();
   const state = (stateInput && stateInput.value || '').trim();
   const country = (countrySelect && countrySelect.value || '').trim();
   const nameText = (sidebarPlaceNameInput && sidebarPlaceNameInput.value || '').trim();
 // category is taken directly from the select (token values)
 const selectedCatVal = (categorySelect && categorySelect.value) || '';


   if (!country) {
     alert('Please enter a country for the location search.');
     return;
   }


   const locationText = [city, state, country].filter(Boolean).join(', ');


   // If the user selected a token from the dropdown, treat it as the category param directly
   let mappedCategory = '';
   if (selectedCatVal) mappedCategory = selectedCatVal;


 // clear any previous search results immediately and show searching message
 clearSearchMarkers();
 globalSearchResults = [];
 currentMode = 'globalSearch';
 isSearching = true;
 showMessage('Searching...');
 renderList();


 const effectiveName = nameText;
   const categoryParam = mappedCategory || '';
   runGeoSearch(locationText, effectiveName, categoryParam);
 });


 // pressing Enter behavior: listen on city/state/country to submit search when pressing Enter
 [cityInput, stateInput, countrySelect].forEach(inp => {
   if (!inp) return;
   inp.addEventListener('keypress', (e) => {
     if (e.key === 'Enter') btnGlobalSearch.click();
   });
 });


 // Apply / Clear filters buttons in Past Reviews
 const applyFiltersBtn = document.getElementById('applyFiltersBtn');
 const clearFiltersBtn = document.getElementById('clearFiltersBtn');
 if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => { currentMode = 'reviews'; renderList(); });
 if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
   if (filterCity) filterCity.value = '';
   if (filterState) filterState.value = '';
   if (filterCountry) filterCountry.value = '';
   if (filterCategoryInput) filterCategoryInput.value = '';
   renderList();
 });


 // --- Geoapify geocode -> place search ---
 async function runGeoSearch(locationText, nameText, category) {
   try {
     showMessage('Searching...');
     // 1. geocode city/country -> get bounding box via server proxy
     const geoUrl = `/api/geocode?query=${encodeURIComponent(locationText)}`;
     const geoResp = await fetch(geoUrl);
     // If the proxy returned an error (e.g. missing API key), surface it to the user
     if (!geoResp.ok) {
       let errMsg = `Geocode request failed (status ${geoResp.status})`;
       try {
         const jb = await geoResp.json();
         if (jb && jb.error) errMsg = jb.error;
       } catch (e) {
         try { const txt = await geoResp.text(); if (txt) errMsg = txt; } catch(_){}
       }
       alert(errMsg);
       hideMessage();
       isSearching = false;
       return;
     }


     const geoData = await geoResp.json();


     if (!geoData.features || geoData.features.length === 0) {
       alert('Location not found — try a different city/state/country or check your network/API key.');
       return;
     }


     const feature = geoData.features[0];


     // Aim: use a circle search centered on the geocoded point with a radius to capture POIs.
     // Get center coords from geometry or properties
     let centerLon, centerLat;
     if (feature.geometry && Array.isArray(feature.geometry.coordinates)) {
       centerLon = feature.geometry.coordinates[0];
       centerLat = feature.geometry.coordinates[1];
     } else if (feature.properties && typeof feature.properties.lon === 'number' && typeof feature.properties.lat === 'number') {
       centerLon = feature.properties.lon;
       centerLat = feature.properties.lat;
     }
     // Build a list of radii to try (meters). Start with user-provided radius (km) then expand if progressive fallback enabled.
     const userKm = (radiusKmInput && parseFloat(radiusKmInput.value)) || 100;
     const progressive = progressiveFallbackCheckbox ? progressiveFallbackCheckbox.checked : true;
     const firstRadius = Math.max(1000, Math.round(userKm * 1000));
     let radiiMeters = [firstRadius];
     if (progressive) {
       // try increasing multiples of the requested radius, cap at 500 km
       const multipliers = [2, 5, 10];
       multipliers.forEach(m => {
         const val = Math.min(firstRadius * m, 500000);
         if (!radiiMeters.includes(val)) radiiMeters.push(val);
       });
     }


     // If we don't have a usable center point, we'll try bbox/bounds once and not loop radii
     const useRect = !(typeof centerLon === 'number' && typeof centerLat === 'number');


 // sanitize category token (strip accidental trailing ":<num>" suffixes)
 const safeCategory = (category || '').toString().replace(/:\d+$/,'');
 globalSearchResults = [];


     // Helper to build circle or rect URL for a given radius
     const buildUrlForRadius = (r) => {
       if (!useRect) return `/api/places?filter=circle:${centerLon},${centerLat},${r}&limit=100`;
       if (Array.isArray(feature.bbox) && feature.bbox.length === 4) {
         const b = feature.bbox;
         return `/api/places?filter=rect:${b[0]},${b[1]},${b[2]},${b[3]}&limit=100`;
       }
       if (feature.properties && feature.properties.bounds) {
         const bb = feature.properties.bounds;
         return `/api/places?filter=rect:${bb.west},${bb.south},${bb.east},${bb.north}&limit=100`;
       }
       return null;
     };


     // Try each radius in sequence until we get results (or exhaust list)
     for (let ri = 0; ri < radiiMeters.length; ri++) {
       const rad = radiiMeters[ri];
       const baseUrl = buildUrlForRadius(rad);
       if (!baseUrl) break;


 let searchUrl = baseUrl;
 if (nameText) searchUrl += `&name=${encodeURIComponent(nameText)}`;
 if (category) searchUrl += `&categories=${encodeURIComponent(safeCategory)}`;


       try {
         showMessage(`Searching within ${Math.round(rad/1000)} km...`);
         const placesResp = await fetch(searchUrl);
         if (!placesResp.ok) {
           // surface proxy errors (rate limit, missing key, etc.) and stop
           let perr = `Places request failed (status ${placesResp.status})`;
           try {
             const pj = await placesResp.json();
             if (pj && pj.error) perr = pj.error;
           } catch (e) {
             try { const t = await placesResp.text(); if (t) perr = t; } catch(_){}
           }
           alert(perr);
           globalSearchResults = [];
           break;
         }
         const placesData = await placesResp.json();
         globalSearchResults = placesData.features || [];


         // If category search returned nothing, try sensible alternative categories at the same radius
         if ((globalSearchResults.length === 0) && category) {
           const altMap = {
             'commercial.supermarket': ['commercial.convenience', 'commercial.food_and_drink.fruit_and_vegetable', 'commercial.discount_store'],
             'catering.fast_food': ['catering.restaurant', 'catering.fast_food.pizza', 'catering.fast_food.burger', 'catering.fast_food.sandwich'],
             'commercial.shopping_mall': ['commercial.shopping_mall', 'commercial']
           };
           const alts = altMap[safeCategory] || [];
           for (const alt of alts) {
             const altUrl = baseUrl + `${nameText ? `&name=${encodeURIComponent(nameText)}` : ''}&categories=${encodeURIComponent(alt)}`;
             try {
               const aresp = await fetch(altUrl);
               const adata = await aresp.json();
               if (adata.features && adata.features.length > 0) {
                 globalSearchResults = adata.features;
                 break;
               }
             } catch (e) { /* continue */ }
           }
         }


         // If still empty and nameText is present, try a name-only search at the same radius
         if (globalSearchResults.length === 0 && nameText) {
           const connector = searchUrl.includes('?') ? '&' : '?';
           const nameOnlyUrl = baseUrl + `${connector}name=${encodeURIComponent(nameText)}`;
           try {
             const nresp = await fetch(nameOnlyUrl);
             const ndata = await nresp.json();
             globalSearchResults = ndata.features || [];
           } catch (e) { /* ignore */ }
         }


         // If we found results at this radius, stop expanding
         if (globalSearchResults.length > 0) break;


       } catch (err) {
         // ignore and try next radius
         console.warn('search attempt failed for radius', rad, err);
       }
     }


 isSearching = false;
 hideMessage();


     // If we requested a category and got no results, try sensible fallbacks:
 if ((globalSearchResults.length === 0) && category) {
       // try some alternative commercial categories for grocery-like searches
       const altMap = {
         'commercial.supermarket': ['commercial.convenience', 'commercial.food_and_drink.fruit_and_vegetable', 'commercial.discount_store'],
         'catering.fast_food': ['catering.restaurant', 'catering.fast_food.pizza', 'catering.fast_food.burger', 'catering.fast_food.sandwich'],
         'commercial.shopping_mall': ['commercial.shopping_mall', 'commercial']
       };


       const alts = altMap[safeCategory] || [];
       for (const alt of alts) {
         const altUrl = searchUrl.replace(`categories=${encodeURIComponent(safeCategory)}`, `categories=${encodeURIComponent(alt)}`);
         try {
           const aresp = await fetch(altUrl);
           const adata = await aresp.json();
           if (adata.features && adata.features.length > 0) {
             globalSearchResults = adata.features;
             break;
           }
         } catch (e) { /* continue to next alt */ }
       }


       // if still empty and we have a name bias, try a name-based search without categories
       if (globalSearchResults.length === 0 && nameText) {
         const nameOnlyUrl = searchUrl.replace(/(\?|&)categories=[^&]*/,'$1').replace(/&{2,}/g,'&');
         // ensure name param present
         const connector = nameOnlyUrl.includes('?') ? '&' : '?';
         const finalUrl = nameOnlyUrl + `${connector}name=${encodeURIComponent(nameText)}`;
         try {
           const nresp = await fetch(finalUrl);
           const ndata = await nresp.json();
           globalSearchResults = ndata.features || [];
         } catch (e) { /* ignore */ }
       }
     }


     // Draw markers for these search results
     clearSearchMarkers();
     globalSearchResults.forEach(place => {
       const lat = place.properties.lat;
       const lon = place.properties.lon;
       if (typeof lat === 'number' && typeof lon === 'number') {
         const m = L.marker([lat, lon], { icon: poiIcon });
         m.bindPopup(`<strong>${place.properties.name || 'Place'}</strong><br/>${place.properties.categories ? place.properties.categories[0] : ''}`);
         m.on('click', () => {
           selectedCoords = { lat, lng: lon };
           if (sidebarPlaceNameInput) sidebarPlaceNameInput.value = place.properties.name || '';
           if (reviewPlaceNameInput) reviewPlaceNameInput.value = place.properties.name || '';
           if (reviewAddressInput) reviewAddressInput.value = place.properties.formatted || '';
           if (reviewCityInput) reviewCityInput.value = place.properties.city || cityInput.value || '';
           if (reviewStateInput) reviewStateInput.value = place.properties.state || stateInput.value || '';
           if (reviewCountryInput) reviewCountryInput.value = place.properties.country || (countrySelect && countrySelect.value) || '';
           if (reviewCoordsDisplay) reviewCoordsDisplay.textContent = `Coords: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
           if (tempMarker) map.removeLayer(tempMarker);
           tempMarker = L.marker([lat, lon]).addTo(map);
         });
         poiCluster.addLayer(m);
         globalSearchMarkers.push(m);
       }
     });


     // If we added markers for the search, fit the map to their bounds so user sees results
     if (globalSearchMarkers.length > 0) {
       try {
         const latlngs = globalSearchMarkers.map(mm => mm.getLatLng());
         const bounds = L.latLngBounds(latlngs);
         if (bounds.isValid && bounds.isValid()) {
           map.fitBounds(bounds, { padding: [50, 50] });
         }
       } catch (e) { /* ignore fit errors */ }
     }


     renderList();
     hideMessage();


   } catch (err) {
     console.error('Error running global search:', err);
   }
 }


 // --- REVIEW FORM SUBMISSION ---
 const reviewForm = document.getElementById('reviewForm');
 if (reviewForm) {
   reviewForm.addEventListener('submit', async (e) => {
   e.preventDefault();
   // Clear previous form errors
   if (reviewFormErrors) {
     reviewFormErrors.classList.add('d-none');
     reviewFormErrors.innerHTML = '';
   }


   // client-side validation
   const errors = [];
   if (!selectedCoords) errors.push('Select a location on the map or pick a place from the list.');


   // Grab review values
   const comments = document.getElementById('review-text').value.trim();
   const placeName = (reviewPlaceNameInput && reviewPlaceNameInput.value.trim()) || 'Unknown';
   const city = (reviewCityInput && reviewCityInput.value.trim()) || '';
   const state = (reviewStateInput && reviewStateInput.value.trim()) || '';
   const country = (reviewCountryInput && reviewCountryInput.value.trim()) || '';
 const address = (reviewAddressInput && reviewAddressInput.value.trim()) || '';
   if (!country) errors.push('Country is required.');


   if (errors.length > 0) {
     if (reviewFormErrors) {
       reviewFormErrors.innerHTML = errors.map(e => `• ${e}`).join('<br/>');
       reviewFormErrors.classList.remove('d-none');
     } else {
       alert(errors.join('\n'));
     }
     return;
   }
  
   // Collect challenge rankings
   const challengeInputs = document.querySelectorAll('.challenge-rating');
   const challenges = {};
   challengeInputs.forEach(input => {
     const val = parseInt(input.value);
     challenges[input.dataset.challenge] = isNaN(val) ? null : val;
   });


   const reviewData = {
     coords: selectedCoords,
     placeName,
     location: { city, state, country, address },
     comments,
     challenges,
     created: new Date().toISOString()
   };


   try {
     const res = await fetch('/api/reviews', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(reviewData)
     });


     if (!res.ok) throw new Error('Failed to submit review');


     const saved = await res.json();
     allReviews.push(saved.review);


     addMarker(saved.review);
     renderList();


     reviewForm.reset();
     if (reviewFormErrors) {
       reviewFormErrors.classList.add('d-none');
       reviewFormErrors.innerHTML = '';
     }
     if (tempMarker) {
       map.removeLayer(tempMarker);
       tempMarker = null;
     }


     alert('Review submitted successfully!');


   } catch (err) {
     console.error(err);
     alert('Error submitting review.');
   }
 });
 }


 // Hide validation errors when user edits fields
 if (reviewForm) {
   reviewForm.addEventListener('input', () => {
     if (reviewFormErrors) {
       reviewFormErrors.classList.add('d-none');
       reviewFormErrors.innerHTML = '';
     }
   });
 }


 // Update slider value displays
 const challengeSliders = document.querySelectorAll('.challenge-rating[type="range"]');
 challengeSliders.forEach(slider => {
   const valueDisplay = slider.nextElementSibling;
  
   // Update display when slider changes
   slider.addEventListener('input', () => {
     if (valueDisplay && valueDisplay.classList.contains('slider-value')) {
       valueDisplay.textContent = slider.value;
     }
   });
 });


});


