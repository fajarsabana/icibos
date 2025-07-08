import { fetchLocations } from "./supabase.js";
const polygonColorMap = {};


export async function setupMap() {
    if (!window.map || !(window.map instanceof L.Map)) {
        window.map = initializeMap();  // ✅ Assign the map globally
        console.log("✅ Map initialized successfully.");
    }
    await loadMapAndSidebar(window.map);
    enableDoubleClickMarker(window.map);

    document.getElementById("resetMapBtn").addEventListener("click", () => {
  if (window.map) {
    window.map.setView([-2.5489, 118.0149], 5);
    document.getElementById("wilusInfoBox").style.opacity = 1;
  }
});

window.map.on("zoomstart", () => {
  document.getElementById("wilusInfoBox").style.opacity = 0;
});

window.map.on("zoomend", () => {
  const zoom = window.map.getZoom();
  if (zoom <= 6) {
    document.getElementById("wilusInfoBox").style.opacity = 1;
  }
});

}

// ✅ Ensure `setupMap()` runs on page load
document.addEventListener("DOMContentLoaded", async function () {
    await setupMap();  // ✅ Run setupMap when the page loads
});



// ✅ Initialize Leaflet Map
export function initializeMap() {
    const map = L.map("map", {
        zoomControl: true,    
        scrollWheelZoom: true,
        dragging: true,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 60
    }).setView([-2.5489, 118.0149], 5); // Default center: Indonesia

    const baseMaps = {
        "OpenStreetMap": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }),
        "Esri Satellite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Tiles © Esri"
        }),
        "Carto Light": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            attribution: "&copy; Carto"
        })
    };
    
    baseMaps["OpenStreetMap"].addTo(map); // default layer
    
    L.control.layers(baseMaps).addTo(map); // ✅ add layer switcher
    
    console.log("✅ Leaflet Map Initialized");
    return map;
}




document.addEventListener("DOMContentLoaded", function () {
    const checkButton = document.getElementById("checkCoordinateBtn");

    if (checkButton) {
        checkButton.addEventListener("click", function () {
            const lat = parseFloat(document.getElementById("latInput").value);
            const lng = parseFloat(document.getElementById("lngInput").value);
            const resultBox = document.getElementById("coordinateResult");

            if (isNaN(lat) || isNaN(lng)) {
                resultBox.textContent = "❌ Please enter valid coordinates.";
                resultBox.style.color = "red";
                return;
            }

            console.log(`Checking coordinates: Latitude ${lat}, Longitude ${lng}`);

            // ✅ Loop through existing polygons to check if point is inside
            let isInside = false;
            map.eachLayer((layer) => {
                if (layer instanceof L.Polygon) {
                    if (layer.getBounds().contains([lat, lng])) {
                        isInside = true;
                    }
                }
            });

            // ✅ Display the result
            if (isInside) {
                resultBox.textContent = "✅ The coordinate is inside the mapped area!";
                resultBox.style.color = "limegreen";
            } else {
                resultBox.textContent = "❌ The coordinate is outside the mapped area.";
                resultBox.style.color = "red";
            }

            // ✅ Optional: Add a temporary marker at the inputted coordinate
            L.marker([lat, lng], { icon: customIcon }).addTo(map)
                .bindPopup(`📍 Checked Location:<br>Lat: ${lat}, Lng: ${lng}`)
                .openPopup();
        });
    }
});


// ✅ Custom Marker Icon
const customIcon = L.icon({
    iconUrl: "images/marker.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
});

// ✅ Function to Load Data & Populate Map + Sidebar
export async function loadMapAndSidebar(map) {
    const markerCluster = L.markerClusterGroup();
    const polygonLayerGroup = L.layerGroup();
    console.log("Fetching locations from Supabase...");
    const locations = await fetchLocations();
    console.log("Locations received:", locations);
    document.getElementById("wilusCount").textContent = locations.length;


    const sidebar = document.querySelector(".sidebar ul");
    if (!sidebar) {
        console.error("Sidebar list not found! Ensure index.html contains `<ul>` inside `.sidebar`.");
        return;
    }

    // ✅ Organize locations by "Pemegang Wilus" (Company Name)
    const groupedData = {};
    locations.forEach((location) => {
        if (!location["Pemegang Wilus"] || !location["Nama Lokasi"] || !location.geom) return;

        let company = location["Pemegang Wilus"];
        let place = location["Nama Lokasi"];

        if (!groupedData[company]) {
            groupedData[company] = [];
        }
        groupedData[company].push(location);
    });

    // ✅ Populate Sidebar & Map
    for (const company in groupedData) {
        let companyItem = document.createElement("li");
        companyItem.classList.add("parent-item");
        companyItem.textContent = company;

        let sublist = document.createElement("ul");
        sublist.classList.add("sublist");

        groupedData[company].forEach((location) => {
            let subItem = document.createElement("li");
            subItem.textContent = location["Nama Lokasi"];

            let shape; // Store either marker or polygon
            
            if (location.geom && location.geom.type === "Point") {  
                let [lng, lat] = location.geom.coordinates;
                shape = L.marker([lat, lng], { icon: customIcon });
                markerCluster.addLayer(shape);

                shape.bindPopup(`<b>${location["Nama Lokasi"]}</b><br>🏢 ${company}`);
            } 
                else if (location.geom && location.geom.type === "Polygon" && Array.isArray(location.geom.coordinates) && location.geom.coordinates.length > 0) {  
            let polygonCoordinates = location.geom.coordinates[0].map(coord => [coord[1], coord[0]]);

            const key = location["Nama Lokasi"];
            if (!polygonColorMap[key]) {
    polygonColorMap[key] = '#' + Math.floor(Math.random() * 16777215).toString(16);
}
           const randomColor = polygonColorMap[key];

        shape = L.polygon(polygonCoordinates, {
            color: randomColor,
            fillColor: randomColor,
            fillOpacity: 0.4,
            weight: 2
        })
            polygonLayerGroup.addLayer(shape); // Don't add to map yet, just to group

            // Make marker at polygon center:
            let center = shape.getBounds().getCenter();
            let marker = L.marker(center, { icon: customIcon });
            marker.bindPopup(`
                <b>📍 Lokasi Kawasan:</b> ${location["Nama Lokasi"]}<br>
                🏢 <b>Pemegang Wilus:</b> ${location["Pemegang Wilus"]}
            `);
            markerCluster.addLayer(marker);
        
            shape.feature = shape.feature || {};
            shape.feature.properties = {
                "Pemegang Wilus": location["Pemegang Wilus"] || "No Data",
                "Nama Lokasi": location["Nama Lokasi"] || "No Data"
            };
                    
        
        }


            // ✅ Click to Zoom into Shape
        subItem.addEventListener("click", function () {
            console.log("📍 Sidebar item clicked:", location["Nama Lokasi"], location.geom);

                            if (window.infoPanelOpen) {
                    openInfoPanel(
                        location["Nama Lokasi"],
                        `UID: ${location["UID"]}<br>Pemegang Wilus: ${location["Pemegang Wilus"]}`
                    );
                }

            if (location.geom && location.geom.type === "Point") {
                console.log("Zooming to Point:", location["Nama Lokasi"], location.geom.coordinates);
                map.setView([location.geom.coordinates[1], location.geom.coordinates[0]], 14); // Ensure correct order
            } 
            else if (location.geom && location.geom.type === "Polygon" 
            && Array.isArray(location.geom.coordinates) 
            && location.geom.coordinates.length > 0 
            && Array.isArray(location.geom.coordinates[0])) {  // ✅ Ensures valid polygon coordinates
            
            console.log("Zooming to Polygon:", location["Nama Lokasi"], location.geom.coordinates);
            
            let bounds = L.latLngBounds(location.geom.coordinates[0].map(coord => [coord[1], coord[0]]));
            map.fitBounds(bounds);
        }
            else {
                console.warn("No valid geometry for:", location["Nama Lokasi"]);
            }
        });


            sublist.appendChild(subItem);
        });

        companyItem.appendChild(sublist);
        sidebar.appendChild(companyItem);

              companyItem.addEventListener("click", function (event) {
    if (event.target === this) {
        console.log("📂 Toggling company list for:", company);
        this.classList.toggle("open");

        // ✅ Find the corresponding sublist and toggle visibility
        let sublist = this.querySelector(".sublist");
        if (sublist) {
            sublist.style.display = sublist.style.display === "none" ? "block" : "none";
        }
    }
});

    }

    console.log("✅ Map and Sidebar Loaded Successfully!");
    map.addLayer(markerCluster); // Show markers initially
    map.removeLayer(polygonLayerGroup); // ✅ hide polygon by default
    map.on("zoomend", () => {
    const zoom = map.getZoom();

    if (zoom >= 12) {
        map.removeLayer(markerCluster);
        map.addLayer(polygonLayerGroup);
    } else {
        map.addLayer(markerCluster);
        map.removeLayer(polygonLayerGroup);
    }
});


}

// ✅ Double-Click to Add Marker
export function enableDoubleClickMarker(map) {
    let activeMarker = null;
    map.on("dblclick", function (e) {
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;

        if (activeMarker) {
            map.removeLayer(activeMarker);
        }

        activeMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        activeMarker.bindPopup(`📍 Marker placed here:<br>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`).openPopup();
        map.setView([lat, lng], 14);
    });

    console.log("✅ Double-Click Marker Enabled");
}

function filterSidebar() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let companies = document.querySelectorAll("#sidebar .parent-item"); // ✅ Selects Pemegang Wilus
    let locations = document.querySelectorAll("#sidebar .sublist li"); // ✅ Selects Nama Lokasi

    let anyMatch = false; // Track if any result is found

    companies.forEach((companyItem) => {
        let companyName = companyItem.textContent.toLowerCase();
        let sublist = companyItem.querySelector(".sublist"); // ✅ Find sublist under company
        let hasVisibleLocation = false; // Track if any child matches

        if (sublist) {
            let subItems = sublist.querySelectorAll("li");
            subItems.forEach((location) => {
                let locationName = location.textContent.toLowerCase();
                
                // ✅ If location matches, show it
                if (locationName.includes(input) || companyName.includes(input)) {
                    location.style.display = "block";
                    hasVisibleLocation = true;
                } else {
                    location.style.display = "none";
                }
            });
        }

        // ✅ Show company if:
        // - The company name matches the search OR
        // - Any of its locations are visible
        if (companyName.includes(input) || hasVisibleLocation) {
            companyItem.style.display = "block";
            if (sublist) sublist.style.display = "block"; // Keep it expanded
            anyMatch = true;
        } else {
            companyItem.style.display = "none";
            if (sublist) sublist.style.display = "none"; // Hide empty groups
        }
    });

    // ✅ If no results, show "No matches found"
    let sidebar = document.querySelector("#sidebar ul"); 
    let noResults = document.getElementById("noResults");

    if (!anyMatch) {
        if (!noResults) {
            noResults = document.createElement("li");
            noResults.id = "noResults";
            noResults.textContent = "No matches found";
            noResults.style.color = "white";
            sidebar.appendChild(noResults);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("searchInput").addEventListener("input", filterSidebar);
});







document.addEventListener("DOMContentLoaded", function () {
    const checkButton = document.getElementById("checkCoordinateBtn");

    // ✅ Store all markers in an array
    window.tempMarkers = [];

    if (checkButton) {
        checkButton.addEventListener("click", function () {
            const lat = parseFloat(document.getElementById("latInput").value);
            const lng = parseFloat(document.getElementById("lngInput").value);
            const resultBox = document.getElementById("coordinateResult");

            if (isNaN(lat) || isNaN(lng)) {
                resultBox.textContent = "❌ Please enter valid coordinates.";
                resultBox.style.color = "red";
                return;
            }

            console.log(`🔍 Checking coordinates: Latitude ${lat}, Longitude ${lng}`);

            // ✅ Ensure map is initialized before using it
            if (!window.map || !(window.map instanceof L.Map)) {
                console.error("❌ Map is not initialized or invalid.");
                resultBox.textContent = "❌ Map is not ready!";
                resultBox.style.color = "red";
                return;
            }

            let foundLocation = null;
            let foundCompany = "Unknown"; // Default value if no match
            let foundName = "Unknown"; // Default value if no match

            // ✅ Check if the point is inside any existing polygon
            window.map.eachLayer((layer) => {
                if (layer instanceof L.Polygon && layer.feature) {
                    if (layer.getBounds().contains([lat, lng])) {
                        foundLocation = layer;
                        foundCompany = layer.feature.properties["Pemegang Wilus"] || "Unknown";
                        foundName = layer.feature.properties["Nama Lokasi"] || "Unknown";
                    }
                }
            });

            // ✅ Display the result
            if (foundLocation) {
                resultBox.textContent = `✅ The coordinate is inside ${foundName} (Pemegang Wilus: ${foundCompany})!`;
                resultBox.style.color = "limegreen";
            } else {
                resultBox.textContent = "❌ The coordinate is outside the mapped area.";
                resultBox.style.color = "red";
            }

            // ✅ Remove all previous markers before adding a new one
            window.tempMarkers.forEach(marker => window.map.removeLayer(marker));
            window.tempMarkers = []; // ✅ Clear the array

            // ✅ Create Marker Popup with actual database values
            const popupContent = `
                <b>📍 Lokasi Kawasan</b>: ${foundName} <br>
                🏢 <b>Pemegang Wilus</b>: ${foundCompany}
            `;

            // ✅ Add new marker and store it in `window.tempMarkers`
            const newMarker = L.marker([lat, lng], { icon: customIcon })
                .addTo(window.map)
                .bindPopup(popupContent)
                .openPopup();

            window.tempMarkers.push(newMarker); // ✅ Store marker to remove later
        });
    }
    // ✅ Sidebar Resize Function
    const sidebar = document.getElementById("sidebar");
    const resizeHandle = document.getElementById("resize-handle");

    let isResizing = false;

    resizeHandle.addEventListener("mousedown", (event) => {
        isResizing = true;
        document.body.style.cursor = "ew-resize";
        event.preventDefault();
    });

    document.addEventListener("mousemove", (event) => {
        if (!isResizing) return;
        let newWidth = event.clientX; // Get cursor X position
        if (newWidth > 200 && newWidth < 500) { // ✅ Keep within min/max limits
            sidebar.style.width = newWidth + "px";
        }
    });

    document.addEventListener("mouseup", () => {
        isResizing = false;
        document.body.style.cursor = "default";
    });
});

window.infoPanelOpen = false;
// ✅ Open Info Panel
window.openInfoPanel = function(title, description) {
    const panel = document.getElementById("info-panel");
    panel.classList.remove("collapsed");  // 🔧 ensure it's visible
    panel.classList.add("show");

    document.getElementById("info-content").innerHTML = `
        <h4>${title}</h4>
        <p>${description}</p>
    `;
    window.infoPanelOpen = true;
}

// ✅ Close Info Panel
window.closeInfoPanel = function() {
    const panel = document.getElementById("info-panel");
    panel.classList.remove("show");
    panel.classList.add("collapsed");
    window.infoPanelOpen = false;
}


document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const infoPanel = document.getElementById("info-panel");
    const toggleSidebarHandle = document.getElementById("sidebar-toggle-handle");
    const toggleInfoPanelBtn = document.getElementById("toggleInfoPanel");

    if (toggleSidebarHandle) {
        toggleSidebarHandle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            toggleSidebarHandle.textContent = sidebar.classList.contains("collapsed") ? "▶" : "◀";
        });
    }

    if (toggleInfoPanelBtn) {
        toggleInfoPanelBtn.addEventListener("click", () => {
            infoPanel.classList.toggle("collapsed");
            toggleInfoPanelBtn.textContent = infoPanel.classList.contains("collapsed") ? "◀" : "▶";
        });
    }
});



