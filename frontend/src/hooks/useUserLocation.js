import { useState, useEffect } from 'react';

function formatCoordinates(lat, lon) {
  if (lat == null || lon == null) return '';
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr} ${lonStr}`;
}

export default function useUserLocation() {
  const [location, setLocation] = useState(() => {
    try {
      const cached = localStorage.getItem('user_geo_location');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      city: 'Detecting Location...',
      region: '',
      country: '',
      latitude: null,
      longitude: null,
      coordsFormatted: '',
      fullAddress: 'Locating weather station...',
      loading: true,
    };
  });

  useEffect(() => {
    let isMounted = true;

    async function reverseGeocode(lat, lon) {
      try {
        // Fast, keyless reverse geocoder
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (!res.ok) throw new Error('Geocoding failed');
        const data = await res.json();

        const city = data.locality || data.city || data.principalSubdivision || 'Current Location';
        const region = data.principalSubdivision || '';
        const country = data.countryName || '';
        const coordsFormatted = formatCoordinates(lat, lon);
        const fullAddress = [city, region, country].filter(Boolean).join(', ');

        const locObj = {
          city,
          region,
          country,
          latitude: lat,
          longitude: lon,
          coordsFormatted,
          fullAddress,
          loading: false,
        };

        if (isMounted) {
          setLocation(locObj);
          localStorage.setItem('user_geo_location', JSON.stringify(locObj));
        }
      } catch (err) {
        // Fallback to coordinates only if geocoding fails
        if (isMounted) {
          const locObj = {
            city: 'Local Station',
            region: '',
            country: '',
            latitude: lat,
            longitude: lon,
            coordsFormatted: formatCoordinates(lat, lon),
            fullAddress: formatCoordinates(lat, lon),
            loading: false,
          };
          setLocation(locObj);
        }
      }
    }

    async function detectByIP() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('IP lookup failed');
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const city = data.city || data.region || 'Current Location';
          const region = data.region || '';
          const country = data.country_name || '';
          const lat = data.latitude;
          const lon = data.longitude;
          const coordsFormatted = formatCoordinates(lat, lon);
          const fullAddress = [city, region, country].filter(Boolean).join(', ');

          const locObj = {
            city,
            region,
            country,
            latitude: lat,
            longitude: lon,
            coordsFormatted,
            fullAddress,
            loading: false,
          };

          if (isMounted) {
            setLocation(locObj);
            localStorage.setItem('user_geo_location', JSON.stringify(locObj));
          }
        }
      } catch (err) {
        if (isMounted) {
          setLocation((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // If browser geolocation is denied or unavailable, fallback to IP-based lookup
          detectByIP();
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      detectByIP();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return location;
}
