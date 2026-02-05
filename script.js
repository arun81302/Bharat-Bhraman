 // ===== API CONFIGURATION =====
 const OPENTRIPMAP_API_KEY = '5ae2e3f221c38a28845f05b6e26fbd8ec10e7e15ee2c2c1aeb44eb67';
 const API_BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

 // ===== DOM ELEMENTS =====
 const hamburger = document.getElementById('hamburger');
 const navMenu = document.getElementById('nav-menu');
 const navLinks = document.querySelectorAll('.nav-link');
 const searchBtn = document.getElementById('search-btn');
 const searchInput = document.getElementById('search-input');
 const searchResults = document.getElementById('search-results');
 const loading = document.getElementById('loading');
 const backToTopBtn = document.getElementById('back-to-top');
 const navbar = document.getElementById('navbar');
 const contactForm = document.getElementById('contact-form');

 // ===== NAVIGATION FUNCTIONALITY =====
 hamburger.addEventListener('click', () => {
     navMenu.classList.toggle('active');
     const spans = hamburger.querySelectorAll('span');
     spans[0].style.transform = navMenu.classList.contains('active') ? 'rotate(45deg) translate(5px, 5px)' : 'none';
     spans[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
     spans[2].style.transform = navMenu.classList.contains('active') ? 'rotate(-45deg) translate(7px, -6px)' : 'none';
 });

 navLinks.forEach(link => {
     link.addEventListener('click', () => {
         navMenu.classList.remove('active');
         const spans = hamburger.querySelectorAll('span');
         spans[0].style.transform = 'none';
         spans[1].style.opacity = '1';
         spans[2].style.transform = 'none';
         navLinks.forEach(l => l.classList.remove('active'));
         link.classList.add('active');
     });
 });

 document.querySelectorAll('a[href^="#"]').forEach(anchor => {
     anchor.addEventListener('click', function (e) {
         e.preventDefault();
         const target = document.querySelector(this.getAttribute('href'));
         if (target) {
             target.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
     });
 });

 // ===== NAVBAR SCROLL EFFECT =====
 window.addEventListener('scroll', () => {
     if (window.scrollY > 100) {
         navbar.classList.add('scrolled');
         backToTopBtn.classList.add('show');
     } else {
         navbar.classList.remove('scrolled');
         backToTopBtn.classList.remove('show');
     }
 });

 backToTopBtn.addEventListener('click', () => {
     window.scrollTo({ top: 0, behavior: 'smooth' });
 });

 // ===== SEARCH FUNCTIONALITY =====
 searchBtn.addEventListener('click', () => {
     const query = searchInput.value.trim();
     if (query) {
         searchPlaces(query);
     } else {
         alert('Please enter a city name');
     }
 });

 searchInput.addEventListener('keypress', (e) => {
     if (e.key === 'Enter') {
         const query = searchInput.value.trim();
         if (query) searchPlaces(query);
     }
 });

 // Quick search function
 function quickSearch(city) {
     searchInput.value = city;
     searchPlaces(city);
 }

 // ===== MAIN SEARCH FUNCTION =====
 async function searchPlaces(city) {
     loading.style.display = 'block';
     searchResults.innerHTML = '';
     
     try {
         // Step 1: Get city coordinates with more flexible search
         const geoUrl = `${API_BASE_URL}/geoname?name=${encodeURIComponent(city)}&apikey=${OPENTRIPMAP_API_KEY}`;
         console.log('Fetching coordinates for:', city);
         
         const geoResponse = await fetch(geoUrl);
         
         if (!geoResponse.ok) {
             throw new Error(`City "${city}" not found. Try major cities like Delhi, Mumbai, Jaipur, Agra, or Bangalore.`);
         }
         
         const geoData = await geoResponse.json();
         console.log('Geo data:', geoData);
         
         if (!geoData.lat || !geoData.lon) {
             throw new Error(`Unable to find coordinates for "${city}". Please try another city.`);
         }
         
         const { lat, lon } = geoData;
         
         // Step 2: Search for places - increased radius for better results
         const radius = 15000; // 15km radius for more results
         const placesUrl = `${API_BASE_URL}/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=tourist_facilities,interesting_places,cultural,architecture,historic,museums,religion,monuments_and_memorials,burial_places,fortifications,archaeological_sites,palaces,churches,temples&rate=2&limit=30&apikey=${OPENTRIPMAP_API_KEY}`;
         
         console.log('Fetching places near:', lat, lon);
         const placesResponse = await fetch(placesUrl);
         
         if (!placesResponse.ok) {
             throw new Error('Failed to fetch tourist places. Please try again.');
         }
         
         const placesData = await placesResponse.json();
         console.log('Places found:', placesData.features ? placesData.features.length : 0);
         
         if (placesData.features && placesData.features.length > 0) {
             const places = placesData.features.slice(0, 12);
             
             const detailedPlaces = await Promise.all(
                 places.map(place => getPlaceDetails(place.properties.xid))
             );
             
             const validPlaces = detailedPlaces.filter(place => place && place.name);
             
             if (validPlaces.length > 0) {
                 displayResults(validPlaces, city);
             } else {
                 displayNoResults(city);
             }
         } else {
             displayNoResults(city);
         }
         
     } catch (error) {
         console.error('Search error:', error);
         searchResults.innerHTML = `
             <div class="error-message">
                 <i class="fas fa-exclamation-circle"></i>
                 <h3>Error</h3>
                 <p>${error.message}</p>
                 <p style="margin-top: 1rem;">Try searching for: Delhi, Mumbai, Jaipur, Agra, Varanasi, Bangalore, Kolkata, or Chennai</p>
             </div>
         `;
     } finally {
         loading.style.display = 'none';
     }
 }

 // ===== GET PLACE DETAILS =====
 async function getPlaceDetails(xid) {
     try {
         const detailsUrl = `${API_BASE_URL}/xid/${xid}?apikey=${OPENTRIPMAP_API_KEY}`;
         const response = await fetch(detailsUrl);
         
         if (!response.ok) return null;
         
         const data = await response.json();
         return data;
     } catch (error) {
         console.error('Error fetching place details:', error);
         return null;
     }
 }

 // ===== DISPLAY SEARCH RESULTS =====
 function displayResults(places, cityName) {
     searchResults.innerHTML = `
         <div style="grid-column: 1/-1; text-align: center; margin-bottom: 2rem;">
             <h3 style="color: var(--saffron);">Found ${places.length} places in ${cityName}</h3>
         </div>
     `;
     
     places.forEach((place, index) => {
         const card = document.createElement('div');
         card.className = 'result-card';
         card.style.animationDelay = `${index * 0.1}s`;
         
         const category = place.kinds ? 
             place.kinds.split(',')[0].replace(/_/g, ' ').toUpperCase() : 
             'TOURIST ATTRACTION';
         
         const description = place.wikipedia_extracts?.text || 
                           place.info?.descr || 
                           `A notable tourist destination in ${cityName} with rich cultural and historical significance.`;
         
         const shortDescription = description.length > 200 ? 
             description.substring(0, 200) + '...' : 
             description;
         
         const location = place.address?.city || 
                         place.address?.county || 
                         place.address?.state || 
                         cityName;
         
         card.innerHTML = `
             <h3>${place.name}</h3>
             <p class="location">
                 <i class="fas fa-map-marker-alt"></i>
                 ${location}
             </p>
             <p class="description">${shortDescription}</p>
             <span class="category">${category}</span>
         `;
         
         searchResults.appendChild(card);
         
         card.addEventListener('click', () => {
             if (place.wikipedia) {
                 window.open(place.wikipedia, '_blank');
             }
         });
     });
     
     searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }

 // ===== DISPLAY NO RESULTS =====
 function displayNoResults(city) {
     searchResults.innerHTML = `
         <div class="no-results">
             <i class="fas fa-search"></i>
             <h3>No results found for "${city}"</h3>
             <p>Try searching for major Indian cities like:</p>
             <p style="margin-top: 1rem;">Delhi, Mumbai, Jaipur, Agra, Varanasi, Bangalore, Kolkata, Chennai, Hyderabad, or Goa</p>
         </div>
     `;
 }

 // ===== CONTACT FORM =====
 contactForm.addEventListener('submit', (e) => {
     e.preventDefault();
     alert('Thank you for your message! We will get back to you soon.');
     contactForm.reset();
 });

 // ===== INITIALIZE =====
 window.addEventListener('load', () => {
     console.log('%c🇮🇳 BHARAT BHRAMAN Initialized', 'color: #FF9933; font-size: 20px; font-weight: bold;');
     console.log('%cExplore Incredible India!', 'color: #138808; font-size: 16px;');
 });