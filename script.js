import { initializeMap, loadMapAndSidebar } from "./mapHandler.js"; // ✅ Correct import

document.addEventListener("DOMContentLoaded", async function () {
    // ✅ Prevent initializing the map twice
    if (document.getElementById("map")._leaflet_id) {
        console.warn("Map is already initialized, skipping...");
        return;
    }

    // ✅ Initialize the Map
    const map = initializeMap();

    // ✅ Load Map Data (Markers & Polygons)
    await loadMapAndSidebar(map);

    /* ───────────────────────────────────── */
    /* 📍 CLICK TO ADD MARKER & ZOOM         */
    /* ───────────────────────────────────── */

    let activeMarker = null;

    map.on("dblclick", function (e) {
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;

        // ✅ Remove previous marker if exists
        if (activeMarker) {
            map.removeLayer(activeMarker);
        }

        // ✅ Add new marker at clicked position
        activeMarker = L.marker([lat, lng]).addTo(map);
        activeMarker.bindPopup(
            `📍 You clicked here:<br>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
        ).openPopup();

        // ✅ Zoom into the marker
        map.setView([lat, lng], 14);
    });

    /* ───────────────────────────────────── */
    /* 📜 SIDEBAR CATEGORY CLICK HANDLING    */
    /* ───────────────────────────────────── */

    document.querySelectorAll(".parent-item").forEach((item) => {
        item.addEventListener("click", function () {
            this.classList.toggle("open"); // ✅ Toggle sublist visibility
        });
    });

    /* ───────────────────────────────────── */
    /* 🔄 ENSURE MAP RESIZES PROPERLY        */
    /* ───────────────────────────────────── */

    setTimeout(() => {
        map.invalidateSize();
    }, 500);
});
