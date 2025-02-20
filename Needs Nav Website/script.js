//9f5963fa208e4223b10d778013c55488
document.addEventListener("DOMContentLoaded", function () {
    initMap();
    fetchListings();

    // Enable search on "Enter" key press
    document.getElementById("searchBar").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            filterListings();
        }
    });

    // Search button functionality
    document.getElementById("searchButton").addEventListener("click", function () {
        filterListings();
    });
});

let allListings = []; // Store all listings globally

// Initialize the Map
let map;
function initMap() {
    map = L.map('map').setView([30.3322, -81.6557], 11); // Default center: Jacksonville

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

// Fetch Property Listings from API
function fetchListings() {
    const listingsContainer = document.getElementById("listingsContainer");
    listingsContainer.innerHTML = "<p>Loading listings...</p>";

    fetch("https://api.rentcast.io/v1/listings/sale?city=Jacksonville&state=FL", {
        method: "GET",
        headers: {
            "X-Api-Key": "9f5963fa208e4223b10d778013c55488" // Replace with your actual API key
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data || data.length === 0) {
            listingsContainer.innerHTML = "<p>No listings found.</p>";
            return;
        }
        allListings = data; // Store listings for filtering
        displayListings(data);
    })
    .catch(error => {
        listingsContainer.innerHTML = "<p>Failed to load listings.</p>";
        console.error("API Error:", error);
    });
}

// Display Listings
function displayListings(listings) {
    const listingsContainer = document.getElementById("listingsContainer");
    listingsContainer.innerHTML = ""; // Clear previous listings

    // Clear existing map markers before adding new ones
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    if (listings.length === 0) {
        listingsContainer.innerHTML = "<p>No listings match your filters.</p>";
        return;
    }

    listings.forEach(property => {
        const listingCard = document.createElement("div");
        listingCard.classList.add("listing-card");

        listingCard.innerHTML = `
            <img src="${property.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image+Available'}" alt="Property Image">
            <h3>${property.addressLine1}, ${property.city}, ${property.state} ${property.zipCode}</h3>
            <p><strong>Price:</strong> $${property.price.toLocaleString()}</p>
            <p><strong>Type:</strong> ${property.propertyType || "N/A"}</p>
            <p><strong>Beds:</strong> ${property.bedrooms || 0} | <strong>Baths:</strong> ${property.bathrooms || 0}</p>
            <button class="view-details-btn">View Details</button>
        `;

        listingsContainer.appendChild(listingCard);

        // Add a marker to the map
        if (property.latitude && property.longitude) {
            L.marker([property.latitude, property.longitude])
                .addTo(map)
                .bindPopup(`<strong>${property.addressLine1}, ${property.city}</strong><br>Price: $${property.price}<br>Type: ${property.propertyType || "N/A"}`);
        }
    });

    // Style the View Details button
    document.querySelectorAll(".view-details-btn").forEach(button => {
        button.style.backgroundColor = "green";
        button.style.color = "white";
        button.style.border = "none";
        button.style.padding = "10px 15px";
        button.style.cursor = "pointer";
    });
}

// **Filter Listings & Prioritize Zip Code Matches**
function filterListings() {
    const searchQuery = document.getElementById("searchBar").value.trim();
    const propertyType = document.getElementById("propertyType").value;
    const minPrice = document.getElementById("minPrice").value;
    const maxPrice = document.getElementById("maxPrice").value;
    const beds = document.getElementById("beds").value;
    const baths = document.getElementById("baths").value;

    let filteredListings = allListings.filter(property => {
        const matchZip = searchQuery && property.zipCode && property.zipCode.toString() === searchQuery;
        const matchSearch =
            searchQuery === "" ||
            matchZip ||
            (property.addressLine1 && property.addressLine1.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (property.city && property.city.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchType = propertyType === "" || property.propertyType === propertyType;
        const matchPrice =
            (minPrice === "" || property.price >= parseInt(minPrice)) &&
            (maxPrice === "" || property.price <= parseInt(maxPrice));
        const matchBeds = beds === "" || property.bedrooms >= parseInt(beds);
        const matchBaths = baths === "" || property.bathrooms >= parseInt(baths);

        return matchSearch && matchType && matchPrice && matchBeds && matchBaths;
    });

    // **Prioritize zip code matches**
    const zipCodeMatches = filteredListings.filter(property => property.zipCode && property.zipCode.toString() === searchQuery);
    const otherMatches = filteredListings.filter(property => !zipCodeMatches.includes(property));

    // **Sorted listings with zip code matches first**
    const sortedListings = [...zipCodeMatches, ...otherMatches];

    displayListings(sortedListings);
}
