// ============================================
// geo.js — Módulo de Inteligencia de Ubicación
// ============================================

const GeoLoc = (function () {
    const CACHE_KEY = 'vcorp_user_location';
    const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 horas

    // Provincias con cobertura de instalación
    const PROVINCIAS_COBERTURA = [
        // Costa
        'Guayas', 'Manabí', 'Los Ríos', 'El Oro', 'Esmeraldas', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
        // Sierra
        'Pichincha', 'Azuay', 'Tungurahua', 'Chimborazo', 'Cotopaxi', 'Imbabura', 'Loja', 'Carchi', 'Bolívar', 'Cañar'
    ];

    function getCachedLocation() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_TIME) {
                    return parsed.data;
                }
            }
        } catch (e) {
            console.error('Error reading geo cache', e);
        }
        return null;
    }

    function saveCacheLocation(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Error saving geo cache', e);
        }
    }

    // reverse geocoding via OpenStreetMap Nominatim (Free, no API Key needed)
    async function reverseGeocode(lat, lon) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
            if (!res.ok) throw new Error('Geocoding failed');
            const data = await res.json();

            const city = data.address.city || data.address.town || data.address.village || 'Desconocida';
            const state = data.address.state || 'Desconocido';
            const country = data.address.country || 'Desconocido';

            return { city, state, country, lat, lon };
        } catch (error) {
            console.error('Reverse Geocoding Error:', error);
            return null;
        }
    }

    function requestLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const geoData = await reverseGeocode(latitude, longitude);

                    if (geoData) {
                        saveCacheLocation(geoData);
                        resolve(geoData);
                    } else {
                        reject(new Error('Could not translate coordinates to address'));
                    }
                },
                (error) => {
                    reject(error);
                },
                { timeout: 10000, maximumAge: 60000 }
            );
        });
    }

    async function getUserLocation(forceRefresh = false) {
        if (!forceRefresh) {
            const cached = getCachedLocation();
            if (cached) return cached;
        }

        try {
            return await requestLocation();
        } catch (error) {
            console.warn('Geolocation failed or user denied:', error.message);
            return null;
        }
    }

    // Permite validar si en un futuro checkout por instalación, la provincia detectada tiene cobertura.
    function checkInstallationCoverage(state, country) {
        if (!state || !country) return false;

        // Solo Ecuador
        if (country.toLowerCase() !== 'ecuador') return false;

        // Normalizamos el string (quitar tildes para comparar)
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        const normalizedState = normalize(state);

        return PROVINCIAS_COBERTURA.some(p => normalize(p) === normalizedState);
    }

    return {
        getLocation: getUserLocation,
        hasCoverage: checkInstallationCoverage,
        CACHED_PROVINCES: PROVINCIAS_COBERTURA
    };
})();
