'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useApp, Contact, TimelineEvent } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

// ============================================================================
// COMPREHENSIVE CITY COORDINATES DATABASE
// ============================================================================
// All cities are validated with correct latitude (-90 to 90) and longitude (-180 to 180)
const cityCoordinates: Record<string, { lat: number; lng: number; displayName: string }> = {
  // United States
  'new york': { lat: 40.7128, lng: -74.0060, displayName: 'New York, NY' },
  'new york, ny': { lat: 40.7128, lng: -74.0060, displayName: 'New York, NY' },
  'new york city': { lat: 40.7128, lng: -74.0060, displayName: 'New York, NY' },
  'nyc': { lat: 40.7128, lng: -74.0060, displayName: 'New York, NY' },
  'wilmington': { lat: 39.7391, lng: -75.5398, displayName: 'Wilmington, DE' },
  'wilmington, de': { lat: 39.7391, lng: -75.5398, displayName: 'Wilmington, DE' },
  'san francisco': { lat: 37.7749, lng: -122.4194, displayName: 'San Francisco, CA' },
  'san francisco, ca': { lat: 37.7749, lng: -122.4194, displayName: 'San Francisco, CA' },
  'los angeles': { lat: 34.0522, lng: -118.2437, displayName: 'Los Angeles, CA' },
  'los angeles, ca': { lat: 34.0522, lng: -118.2437, displayName: 'Los Angeles, CA' },
  'chicago': { lat: 41.8781, lng: -87.6298, displayName: 'Chicago, IL' },
  'chicago, il': { lat: 41.8781, lng: -87.6298, displayName: 'Chicago, IL' },
  'boston': { lat: 42.3601, lng: -71.0589, displayName: 'Boston, MA' },
  'boston, ma': { lat: 42.3601, lng: -71.0589, displayName: 'Boston, MA' },
  'newark': { lat: 40.7357, lng: -74.1724, displayName: 'Newark, NJ' },
  'newark, nj': { lat: 40.7357, lng: -74.1724, displayName: 'Newark, NJ' },
  'washington': { lat: 38.9072, lng: -77.0369, displayName: 'Washington, DC' },
  'washington, dc': { lat: 38.9072, lng: -77.0369, displayName: 'Washington, DC' },
  'miami': { lat: 25.7617, lng: -80.1918, displayName: 'Miami, FL' },
  'miami, fl': { lat: 25.7617, lng: -80.1918, displayName: 'Miami, FL' },
  'seattle': { lat: 47.6062, lng: -122.3321, displayName: 'Seattle, WA' },
  'seattle, wa': { lat: 47.6062, lng: -122.3321, displayName: 'Seattle, WA' },
  'austin': { lat: 30.2672, lng: -97.7431, displayName: 'Austin, TX' },
  'austin, tx': { lat: 30.2672, lng: -97.7431, displayName: 'Austin, TX' },
  'atlanta': { lat: 33.749, lng: -84.388, displayName: 'Atlanta, GA' },
  'atlanta, ga': { lat: 33.749, lng: -84.388, displayName: 'Atlanta, GA' },
  'philadelphia': { lat: 39.9526, lng: -75.1652, displayName: 'Philadelphia, PA' },
  'philadelphia, pa': { lat: 39.9526, lng: -75.1652, displayName: 'Philadelphia, PA' },
  'long island': { lat: 40.7891, lng: -73.1350, displayName: 'Long Island, NY' },
  'long island, ny': { lat: 40.7891, lng: -73.1350, displayName: 'Long Island, NY' },
  'virginia beach': { lat: 36.8529, lng: -75.9780, displayName: 'Virginia Beach, VA' },
  'virginia beach, va': { lat: 36.8529, lng: -75.9780, displayName: 'Virginia Beach, VA' },
  'tampa': { lat: 27.9506, lng: -82.4572, displayName: 'Tampa, FL' },
  'tampa, fl': { lat: 27.9506, lng: -82.4572, displayName: 'Tampa, FL' },
  'tampa, florida': { lat: 27.9506, lng: -82.4572, displayName: 'Tampa, FL' },
  'houston': { lat: 29.7604, lng: -95.3698, displayName: 'Houston, TX' },
  'houston, tx': { lat: 29.7604, lng: -95.3698, displayName: 'Houston, TX' },
  'houston, texas': { lat: 29.7604, lng: -95.3698, displayName: 'Houston, TX' },
  'houston texas': { lat: 29.7604, lng: -95.3698, displayName: 'Houston, TX' },
  'denver': { lat: 39.7392, lng: -104.9903, displayName: 'Denver, CO' },
  'denver, co': { lat: 39.7392, lng: -104.9903, displayName: 'Denver, CO' },
  'queens': { lat: 40.7282, lng: -73.7949, displayName: 'Queens, NY' },
  'queens, ny': { lat: 40.7282, lng: -73.7949, displayName: 'Queens, NY' },
  'las vegas': { lat: 36.1699, lng: -115.1398, displayName: 'Las Vegas, NV' },
  'las vegas, nv': { lat: 36.1699, lng: -115.1398, displayName: 'Las Vegas, NV' },
  'las vegas, ne': { lat: 36.1699, lng: -115.1398, displayName: 'Las Vegas, NV' }, // Handle typo (NE instead of NV)
  'westerville': { lat: 40.1262, lng: -82.9291, displayName: 'Westerville, OH' },
  'westerville, ohio': { lat: 40.1262, lng: -82.9291, displayName: 'Westerville, OH' },
  'westerville, oh': { lat: 40.1262, lng: -82.9291, displayName: 'Westerville, OH' },
  // Canada
  'montreal': { lat: 45.5017, lng: -73.5673, displayName: 'Montreal, QC' },
  'montreal, qc': { lat: 45.5017, lng: -73.5673, displayName: 'Montreal, QC' },
  'montreal, canada': { lat: 45.5017, lng: -73.5673, displayName: 'Montreal, QC' },
  'toronto': { lat: 43.6532, lng: -79.3832, displayName: 'Toronto, ON' },
  'toronto, on': { lat: 43.6532, lng: -79.3832, displayName: 'Toronto, ON' },
  'toronto, canada': { lat: 43.6532, lng: -79.3832, displayName: 'Toronto, ON' },
  'vancouver': { lat: 49.2827, lng: -123.1207, displayName: 'Vancouver, BC' },
  'vancouver, bc': { lat: 49.2827, lng: -123.1207, displayName: 'Vancouver, BC' },
  'ottawa': { lat: 45.4215, lng: -75.6972, displayName: 'Ottawa, ON' },
  'ottawa, ca': { lat: 45.4215, lng: -75.6972, displayName: 'Ottawa, ON' },
  'ottawa, on': { lat: 45.4215, lng: -75.6972, displayName: 'Ottawa, ON' },
  'ottawa, ontario': { lat: 45.4215, lng: -75.6972, displayName: 'Ottawa, ON' },
  'ottawa, canada': { lat: 45.4215, lng: -75.6972, displayName: 'Ottawa, ON' },
  // Europe
  'london': { lat: 51.5074, lng: -0.1278, displayName: 'London, UK' },
  'london, uk': { lat: 51.5074, lng: -0.1278, displayName: 'London, UK' },
  'paris': { lat: 48.8566, lng: 2.3522, displayName: 'Paris, France' },
  'paris, france': { lat: 48.8566, lng: 2.3522, displayName: 'Paris, France' },
  'warsaw': { lat: 52.2297, lng: 21.0122, displayName: 'Warsaw, Poland' },
  'warsaw, poland': { lat: 52.2297, lng: 21.0122, displayName: 'Warsaw, Poland' },
  'warszawa': { lat: 52.2297, lng: 21.0122, displayName: 'Warsaw, Poland' },
  'rome': { lat: 41.9028, lng: 12.4964, displayName: 'Rome, Italy' },
  'rome, italy': { lat: 41.9028, lng: 12.4964, displayName: 'Rome, Italy' },
  'roma': { lat: 41.9028, lng: 12.4964, displayName: 'Rome, Italy' },
  'roma, italy': { lat: 41.9028, lng: 12.4964, displayName: 'Rome, Italy' },
  'berlin': { lat: 52.5200, lng: 13.4050, displayName: 'Berlin, Germany' },
  'berlin, germany': { lat: 52.5200, lng: 13.4050, displayName: 'Berlin, Germany' },
  'zurich': { lat: 47.3769, lng: 8.5417, displayName: 'Zurich, Switzerland' },
  'zurich, switzerland': { lat: 47.3769, lng: 8.5417, displayName: 'Zurich, Switzerland' },
  'zürich': { lat: 47.3769, lng: 8.5417, displayName: 'Zurich, Switzerland' },
  'zürich, switzerland': { lat: 47.3769, lng: 8.5417, displayName: 'Zurich, Switzerland' },
  'prague': { lat: 50.0755, lng: 14.4378, displayName: 'Prague, Czech Republic' },
  'prague, czech': { lat: 50.0755, lng: 14.4378, displayName: 'Prague, Czech Republic' },
  'prague, czech republic': { lat: 50.0755, lng: 14.4378, displayName: 'Prague, Czech Republic' },
  // Other
  'chisinau': { lat: 47.0104, lng: 28.8638, displayName: 'Chisinau, Moldova' },
  'chisinau, moldova': { lat: 47.0104, lng: 28.8638, displayName: 'Chisinau, Moldova' },
  'delhi': { lat: 28.6139, lng: 77.2090, displayName: 'Delhi, India' },
  'delhi, india': { lat: 28.6139, lng: 77.2090, displayName: 'Delhi, India' },
  'new delhi': { lat: 28.6139, lng: 77.2090, displayName: 'Delhi, India' },
  'new delhi, india': { lat: 28.6139, lng: 77.2090, displayName: 'Delhi, India' },
  // Asia
  'tokyo': { lat: 35.6762, lng: 139.6503, displayName: 'Tokyo, Japan' },
  'tokyo, japan': { lat: 35.6762, lng: 139.6503, displayName: 'Tokyo, Japan' },
  'tokyo japan': { lat: 35.6762, lng: 139.6503, displayName: 'Tokyo, Japan' },
  'beijing': { lat: 39.9042, lng: 116.4074, displayName: 'Beijing, China' },
  'beijing, china': { lat: 39.9042, lng: 116.4074, displayName: 'Beijing, China' },
  'shanghai': { lat: 31.2304, lng: 121.4737, displayName: 'Shanghai, China' },
  'shanghai, china': { lat: 31.2304, lng: 121.4737, displayName: 'Shanghai, China' },
  'singapore': { lat: 1.3521, lng: 103.8198, displayName: 'Singapore' },
  'singapore, singapore': { lat: 1.3521, lng: 103.8198, displayName: 'Singapore' },
  'bangkok': { lat: 13.7563, lng: 100.5018, displayName: 'Bangkok, Thailand' },
  'bangkok, thailand': { lat: 13.7563, lng: 100.5018, displayName: 'Bangkok, Thailand' },
  'hong kong': { lat: 22.3193, lng: 114.1694, displayName: 'Hong Kong' },
  'hong kong, china': { lat: 22.3193, lng: 114.1694, displayName: 'Hong Kong' },
  'seoul': { lat: 37.5665, lng: 126.9780, displayName: 'Seoul, South Korea' },
  'seoul, south korea': { lat: 37.5665, lng: 126.9780, displayName: 'Seoul, South Korea' },
  'seoul, korea': { lat: 37.5665, lng: 126.9780, displayName: 'Seoul, South Korea' },
  'dubai': { lat: 25.2048, lng: 55.2708, displayName: 'Dubai, UAE' },
  'dubai, uae': { lat: 25.2048, lng: 55.2708, displayName: 'Dubai, UAE' },
  'dubai, united arab emirates': { lat: 25.2048, lng: 55.2708, displayName: 'Dubai, UAE' },
  'mumbai': { lat: 19.0760, lng: 72.8777, displayName: 'Mumbai, India' },
  'mumbai, india': { lat: 19.0760, lng: 72.8777, displayName: 'Mumbai, India' },
  'bangalore': { lat: 12.9716, lng: 77.5946, displayName: 'Bangalore, India' },
  'bangalore, india': { lat: 12.9716, lng: 77.5946, displayName: 'Bangalore, India' },
};

// Validate all coordinates in database
Object.entries(cityCoordinates).forEach(([key, coords]) => {
  if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
    console.error(`❌ INVALID COORDINATES in database for "${key}": [${coords.lat}, ${coords.lng}]`);
  }
});

interface LocationMarker {
  id: string;
  city: string;
  displayName: string;
  coordinates: { lat: number; lng: number };
  contacts: Contact[];
  source: 'timeline' | 'notes';
  startDate?: Date;
  endDate?: Date | null;
}

export default function MapPage() {
  const { timelineEvents, contacts } = useApp();
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [missingCities, setMissingCities] = useState<Set<string>>(new Set());
  const [localContacts, setLocalContacts] = useState<Contact[]>([]);
  const [localTimelineEvents, setLocalTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineSynced, setTimelineSynced] = useState(false);
  const [dynamicCities, setDynamicCities] = useState<Record<string, { lat: number; lng: number; displayName: string }>>({});
  const mapInstanceRef = useRef<any>(null);
  const lastContactsHashRef = useRef<string>('');
  const lastTimelineHashRef = useRef<string>('');
  const lastTimelineWatchHashRef = useRef<string>('');
  const lastStorageCheckRef = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geocodingCacheRef = useRef<Map<string, { lat: number; lng: number; displayName: string } | null>>(new Map());
  const userInteractedRef = useRef(false); // Track if user manually zoomed/panned
  const fitBoundsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMarkersHashRef = useRef<string>('');

  // ============================================================================
  // REACTIVE DATA SYNC: Direct localStorage sync ensures real-time updates
  // ============================================================================
  useEffect(() => {
    if (!user) {
      setLocalContacts([]);
      return;
    }

    const syncContacts = () => {
      const contactsKey = `contactChronicle_contacts_${user.id}`;
      const stored = localStorage.getItem(contactsKey);

      if (stored) {
        try {
          const storedContacts: Contact[] = JSON.parse(stored);
          
          // Create comprehensive hash that includes empty notes (for deletion detection)
          const storedHash = JSON.stringify(
            storedContacts.map(c => ({
              id: c.id,
              notes: c.notes || '', // Include empty string to detect deletions
              firstName: c.firstName,
              lastName: c.lastName
            }))
          );

          // Always check if hash changed (including empty notes)
          if (storedHash !== lastStorageCheckRef.current) {
            console.log('🔄 MAP: Contacts synced from localStorage');
            console.log(`  📊 Total: ${storedContacts.length}`);
            
            // Count contacts with and without notes
            const withNotes = storedContacts.filter(c => c.notes && c.notes.trim());
            const withEmptyNotes = storedContacts.filter(c => c.notes !== undefined && c.notes !== null && (!c.notes || !c.notes.trim()));
            console.log(`  📝 With notes: ${withNotes.length}`);
            console.log(`  🗑️ With empty notes (deleted): ${withEmptyNotes.length}`);
            
            // Log sample of contacts that had notes deleted
            if (withEmptyNotes.length > 0) {
              console.log(`  📋 Sample contacts with deleted notes:`, withEmptyNotes.slice(0, 3).map(c => ({
                name: `${c.firstName} ${c.lastName}`,
                notesValue: c.notes || '(empty)'
              })));
            }
            
            // Update local state with new array reference
            setLocalContacts([...storedContacts]);
            lastStorageCheckRef.current = storedHash;
            // Also update the hash ref used by the useEffect watcher
            lastContactsHashRef.current = storedHash;
            
            // Force map recalculation
            console.log(`  🗺️ Forcing map recalculation (mapKey increment)`);
            setMapKey(prev => prev + 1);
          }
        } catch (error) {
          console.error('❌ MAP: Error syncing contacts:', error);
        }
      }
    };

    // Initial sync
    syncContacts();

    // Poll localStorage every 50ms for very fast updates
    const pollInterval = setInterval(syncContacts, 50);

    // Listen for custom events
    const handleContactsUpdated = () => {
      console.log('🔔 MAP: contactsUpdated event received');
      syncContacts();
    };

    // Listen for storage events (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `contactChronicle_contacts_${user.id}` && e.newValue) {
        console.log('🔔 MAP: Storage event detected');
        syncContacts();
      }
    };

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔔 MAP: Page visible - checking for updates');
        syncContacts();
      }
    };

    window.addEventListener('contactsUpdated', handleContactsUpdated);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('contactsUpdated', handleContactsUpdated);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user]);

  // ============================================================================
  // TIMELINE SYNC: Sync timeline events from localStorage
  // ============================================================================
  useEffect(() => {
    if (!user) {
      setLocalTimelineEvents([]);
      return;
    }

    const syncTimeline = () => {
      const timelineKey = `contactChronicle_timeline_${user.id}`;
      const stored = localStorage.getItem(timelineKey);

      try {
        // Parse stored data or use empty array if null
        const storedTimeline: TimelineEvent[] = stored ? JSON.parse(stored) : [];
        
        // Create hash to detect changes (even for empty arrays)
        const storedHash = JSON.stringify(
          storedTimeline.map(e => ({
            id: e.id,
            monthYear: e.monthYear,
            professionalEvent: e.professionalEvent || '',
            personalEvent: e.personalEvent || '',
            geographicEvent: e.geographicEvent || '',
          }))
        );

        if (storedHash !== lastTimelineHashRef.current) {
          console.log('🔄 MAP: Timeline synced from localStorage');
          console.log(`  📊 Total events: ${storedTimeline.length}`);
          
          const geoEvents = storedTimeline.filter(e => e.geographicEvent && e.geographicEvent.trim());
          console.log(`  🌍 Geographic events: ${geoEvents.length}`);
          
          setLocalTimelineEvents([...storedTimeline]);
          setTimelineSynced(true);
          lastTimelineHashRef.current = storedHash;
          
          // Force map recalculation
          console.log(`  🗺️ Forcing map recalculation (timeline update)`);
          setMapKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('❌ MAP: Error syncing timeline:', error);
      }
    };

    // Initial sync
    syncTimeline();

    // Poll localStorage every 50ms for faster updates
    const pollInterval = setInterval(syncTimeline, 50);

    // Listen for custom events
    const handleTimelineUpdated = () => {
      console.log('🔔 MAP: timelineUpdated event received');
      syncTimeline();
    };

    // Listen for storage events (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `contactChronicle_timeline_${user.id}` && e.newValue) {
        console.log('🔔 MAP: Timeline storage event detected');
        syncTimeline();
      }
    };

    window.addEventListener('timelineUpdated', handleTimelineUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('timelineUpdated', handleTimelineUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // Use synced contacts or fallback to context
  const activeContacts = useMemo(() => {
    return localContacts.length > 0 ? localContacts : contacts;
  }, [localContacts, contacts]);

  // Use synced timeline events or fallback to context
  const activeTimelineEvents = useMemo(() => {
    // Prefer synced timeline events from localStorage once sync has occurred
    // If localTimelineEvents is empty and we haven't synced yet, use context
    // Once synced, always prefer localStorage data (even if empty array)
    if (timelineSynced) {
      return localTimelineEvents;
    }
    // Before sync, use context - but also check if context has data
    // If context has data and local doesn't, use context
    if (timelineEvents.length > 0 && localTimelineEvents.length === 0) {
      return timelineEvents;
    }
    return localTimelineEvents.length > 0 ? localTimelineEvents : timelineEvents;
  }, [localTimelineEvents, timelineEvents, timelineSynced]);

  // ============================================================================
  // DYNAMIC CITIES: Load from localStorage
  // ============================================================================
  useEffect(() => {
    if (!user) {
      setDynamicCities({});
      return;
    }

    const dynamicCitiesKey = `contactChronicle_dynamicCities_${user.id}`;
    const stored = localStorage.getItem(dynamicCitiesKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDynamicCities(parsed);
        console.log(`📦 Loaded ${Object.keys(parsed).length} dynamic cities from localStorage`);
      } catch (error) {
        console.error('Error loading dynamic cities:', error);
        setDynamicCities({});
      }
    }
  }, [user]);

  // Merge static and dynamic city databases
  const allCityCoordinates = useMemo(() => {
    return { ...cityCoordinates, ...dynamicCities };
  }, [dynamicCities]);

  // Save dynamic city to localStorage
  const saveDynamicCity = useCallback((cityName: string, coords: { lat: number; lng: number; displayName: string }) => {
    if (!user) return;

    const normalized = cityName.toLowerCase().trim();
    const updated = { ...dynamicCities, [normalized]: coords };
    setDynamicCities(updated);

    const dynamicCitiesKey = `contactChronicle_dynamicCities_${user.id}`;
    try {
      localStorage.setItem(dynamicCitiesKey, JSON.stringify(updated));
      console.log(`💾 Saved new city "${cityName}" to dynamic database`);
    } catch (error) {
      console.error('Error saving dynamic city:', error);
    }
  }, [user, dynamicCities]);

  // Geocode city using Next.js API route (fixes CORS issue)
  const geocodeCity = useCallback(async (cityName: string): Promise<{ lat: number; lng: number; displayName: string } | null> => {
    if (!cityName?.trim()) return null;

    // Check cache first
    if (geocodingCacheRef.current.has(cityName)) {
      return geocodingCacheRef.current.get(cityName) || null;
    }

    try {
      console.log(`🌐 Geocoding city: "${cityName}"`);
      const encodedCity = encodeURIComponent(cityName);
      const url = `/api/geocode?city=${encodedCity}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`❌ Geocoding failed for "${cityName}": ${response.status}`);
        geocodingCacheRef.current.set(cityName, null);
        return null;
      }

      const data = await response.json();
      
      if (data.error) {
        console.warn(`⚠️ Geocoding error for "${cityName}": ${data.error}`);
        geocodingCacheRef.current.set(cityName, null);
        return null;
      }

      if (data.lat && data.lng) {
        const coords = { 
          lat: data.lat, 
          lng: data.lng, 
          displayName: data.displayName || cityName 
        };
        
        // Cache the result
        geocodingCacheRef.current.set(cityName, coords);
        
        // Save to dynamic cities
        saveDynamicCity(cityName, coords);
        
        console.log(`✅ Geocoded "${cityName}" → ${coords.displayName} at [${coords.lat}, ${coords.lng}]`);
        return coords;
      } else {
        console.warn(`⚠️ No geocoding results for "${cityName}"`);
        geocodingCacheRef.current.set(cityName, null);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error geocoding "${cityName}":`, error);
      geocodingCacheRef.current.set(cityName, null);
      return null;
    }
  }, [saveDynamicCity]);

  // ============================================================================
  // UTILITY FUNCTIONS: Coordinate lookup and validation
  // ============================================================================
  // Synchronous lookup - checks static and dynamic databases
  const getCityCoordinates = useCallback((cityName: string): { lat: number; lng: number; displayName: string } | null => {
    if (!cityName?.trim()) return null;

    const normalized = cityName.toLowerCase().trim();

    // Check merged database (static + dynamic)
    if (allCityCoordinates[normalized]) {
      const coords = allCityCoordinates[normalized];
      // Validate coordinates
      if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
        console.error(`❌ Invalid coordinates for "${cityName}": [${coords.lat}, ${coords.lng}]`);
        return null;
      }
      return coords;
    }

    // Partial match in merged database
    for (const [key, coords] of Object.entries(allCityCoordinates)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        if (coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180) {
          return coords;
        }
      }
    }

    // Not found in database - trigger async geocoding in background
    const commonWords = new Set(['new', 'long', 'old', 'big', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'now', 'see', 'two', 'way', 'who', 'boy', 'did', 'let', 'put', 'say', 'she', 'too', 'use', 'lives', 'works', 'lived', 'worked', 'york', 'island', 'beach']);
    
    if (normalized.length > 3 && !commonWords.has(normalized) && !normalized.includes(',')) {
      // Trigger geocoding in background (don't await - will update map when done)
      geocodeCity(cityName).then((geocoded) => {
        if (geocoded) {
          console.log(`✅ New city geocoded: "${cityName}" - map will update`);
          // Force map recalculation after geocoding
          setMapKey(prev => prev + 1);
        } else {
          // Track as missing if geocoding failed
          setMissingCities(prev => {
            if (!prev.has(normalized)) {
              console.warn(`⚠️ CITY NOT FOUND (geocoding failed): "${cityName}"`);
              return new Set(prev).add(normalized);
            }
            return prev;
          });
        }
      }).catch((error) => {
        console.error(`❌ Error geocoding "${cityName}":`, error);
      });
    }

    return null;
  }, [allCityCoordinates, geocodeCity]);

  const validateCoordinates = useCallback((coords: { lat: number; lng: number }): boolean => {
    if (isNaN(coords.lat) || isNaN(coords.lng)) {
      console.error(`❌ Coordinates are NaN: [${coords.lat}, ${coords.lng}]`);
      return false;
    }
    if (coords.lat < -90 || coords.lat > 90) {
      console.error(`❌ Latitude out of range: ${coords.lat} (must be -90 to 90)`);
      return false;
    }
    if (coords.lng < -180 || coords.lng > 180) {
      console.error(`❌ Longitude out of range: ${coords.lng} (must be -180 to 180)`);
      return false;
    }
    return true;
  }, []);

  // ============================================================================
  // LOCATION EXTRACTION: Extract locations from timeline and notes
  // ============================================================================
  const extractLocationFromTimeline = useCallback((text: string): string | null => {
    if (!text?.trim()) return null;
    const patterns = [
      /(?:moved\s+to|lived\s+in|located\s+in)\s+([^,]+?)(?:,|$)/i,
      /(?:in|at)\s+([^,]+?)(?:,|\s*$)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        const location = match[1].trim();
        if (location.length > 2) return location;
      }
    }
    return text.trim();
  }, []);

  const extractLocationsFromNotes = useCallback((contact: Contact): string[] => {
    if (!contact.notes?.trim()) {
      console.log(`  ⚠️ Contact "${contact.firstName} ${contact.lastName}" has no notes`);
      return [];
    }

    const locations: string[] = [];
    const noteText = contact.notes;
    const noteTextLower = noteText.toLowerCase();

    console.log(`  🔍 Extracting locations from "${contact.firstName} ${contact.lastName}"`);
    console.log(`     Notes: "${noteText.substring(0, 200)}${noteText.length > 200 ? '...' : ''}"`);

    // STEP 1: Direct city name matching - check ALL city keys (static + dynamic)
    for (const [cityKey, coords] of Object.entries(allCityCoordinates)) {
      const cityKeyLower = cityKey.toLowerCase();
      
      // Skip very short keys
      if (cityKey.length < 3) continue;

      // Try multiple matching strategies
      const cityName = cityKey.split(',')[0].trim().toLowerCase();
      const cityNameWords = cityName.split(/\s+/);
      
      // Strategy 1: Full city key match (e.g., "new york, ny")
      if (noteTextLower.includes(cityKeyLower)) {
        // Use word boundary for better matching
        const escapedKey = cityKeyLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
        if (regex.test(noteText)) {
          if (!locations.some(l => l.toLowerCase() === cityKeyLower)) {
            locations.push(cityKey);
            console.log(`    ✅ Direct match: "${cityKey}"`);
            continue;
          }
        }
      }
      
      // Strategy 2: City name only (e.g., just "new york")
      if (cityNameWords.length > 1) {
        // Multi-word city - check if all words appear
        const allWordsFound = cityNameWords.every(word => {
          if (word.length < 3) return true; // Skip short words like "de", "ny"
          const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return wordRegex.test(noteText);
        });
        
        if (allWordsFound && !locations.some(l => {
          const locCityName = l.split(',')[0].trim().toLowerCase();
          return locCityName === cityName;
        })) {
          // Try to get coordinates using full key
          const coords = getCityCoordinates(cityKey);
          if (coords) {
            locations.push(cityKey);
            console.log(`    ✅ Multi-word match: "${cityKey}"`);
            continue;
          }
        }
      } else {
        // Single word city - use word boundary
        const escapedCity = cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBoundaryRegex = new RegExp(`\\b${escapedCity}\\b`, 'i');
        if (wordBoundaryRegex.test(noteText) && !locations.some(l => {
          const locCityName = l.split(',')[0].trim().toLowerCase();
          return locCityName === cityName;
        })) {
          const coords = getCityCoordinates(cityKey);
          if (coords) {
            locations.push(cityKey);
            console.log(`    ✅ Single-word match: "${cityKey}"`);
            continue;
          }
        }
      }
    }

    // STEP 2: Pattern matching for "City, State", "City State", "City Country", etc.
    const patterns = [
      // "City, State" or "City, Country"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|[A-Z]{2})\b/g,
      // "City State" (space separated)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      // "City ST" (state code)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\b/g,
      // "in/at/from/to City"
      /\b(?:in|at|from|to|near|by|lives?\s+in|works?\s+in|met\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      // Standalone capitalized words (potential cities)
      /\b([A-Z][a-z]{3,})\b/g,
    ];

    // Comprehensive skip words list (both capitalized and lowercase)
    const skipWords = new Set([
      // Articles and pronouns
      'The', 'the', 'This', 'this', 'That', 'that', 'These', 'these', 'Those', 'those',
      'There', 'there', 'Here', 'here', 'When', 'when', 'Where', 'where', 'What', 'what',
      'Who', 'who', 'How', 'how', 'Why', 'why',
      // Time references
      'First', 'first', 'Last', 'last', 'Next', 'next', 'Previous', 'previous',
      'Today', 'today', 'Yesterday', 'yesterday', 'Tomorrow', 'tomorrow',
      'Year', 'year', 'Years', 'years', 'Month', 'month', 'Months', 'months',
      'Week', 'week', 'Weeks', 'weeks', 'Day', 'day', 'Days', 'days',
      // Action verbs
      'Met', 'met', 'Meet', 'meet', 'Worked', 'worked', 'Work', 'work', 'Works', 'works',
      'Lived', 'lived', 'Live', 'live', 'Lives', 'lives', 'Moved', 'moved', 'Move', 'move',
      'Born', 'born', 'Grew', 'grew', 'Studied', 'studied', 'Study', 'study',
      'Graduated', 'graduated', 'Attended', 'attended', 'Joined', 'joined',
      'Left', 'left', 'Started', 'started', 'Ended', 'ended',
      // Prepositions and conjunctions
      'During', 'during', 'After', 'after', 'Before', 'before', 'Since', 'since',
      'Until', 'until', 'With', 'with', 'Without', 'without', 'From', 'from',
      'To', 'to', 'In', 'in', 'At', 'at', 'On', 'on', 'By', 'by', 'For', 'for',
      'And', 'and', 'Or', 'or', 'But', 'but', 'Not', 'not',
      // Quantifiers
      'All', 'all', 'Some', 'some', 'Many', 'many', 'Most', 'most', 'Each', 'each',
      'Every', 'every', 'Both', 'both', 'Either', 'either', 'Neither', 'neither',
      // Months
      'January', 'january', 'February', 'february', 'March', 'march', 'April', 'april',
      'May', 'may', 'June', 'june', 'July', 'july', 'August', 'august',
      'September', 'september', 'October', 'october', 'November', 'november', 'December', 'december'
    ]);

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(noteText)) !== null) {
        if (match[1]) {
          let cityToCheck = match[1].trim();
          
          // Skip common non-city words (case-insensitive check)
          if (skipWords.has(cityToCheck) || skipWords.has(cityToCheck.toLowerCase()) || skipWords.has(cityToCheck.charAt(0).toUpperCase() + cityToCheck.slice(1).toLowerCase())) {
            continue;
          }
          
          // Skip single words that are too short (likely not cities)
          if (cityToCheck.length < 4 && !cityToCheck.match(/^[A-Z][a-z]{2,3}$/)) {
            continue;
          }
          
          // Build variations to try
          const variations: string[] = [];
          if (match[2]) {
            const secondPart = match[2].trim();
            // Try with comma, without comma, and city only
            variations.push(`${cityToCheck}, ${secondPart}`);
            variations.push(`${cityToCheck} ${secondPart}`);
          }
          variations.push(cityToCheck);
          
          // Try each variation
          for (const variant of variations) {
            const coords = getCityCoordinates(variant);
            if (coords) {
              // Check if we already have this location (by coordinates, not name)
              const coordKey = `${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;
              const alreadyFound = locations.some(l => {
                const lCoords = getCityCoordinates(l);
                if (!lCoords) return false;
                const lCoordKey = `${lCoords.lat.toFixed(4)}_${lCoords.lng.toFixed(4)}`;
                return lCoordKey === coordKey;
              });
              
              if (!alreadyFound) {
                // Find the best matching key from merged database (static + dynamic)
                const bestKey = Object.keys(allCityCoordinates).find(key => {
                  const keyCoords = allCityCoordinates[key];
                  return Math.abs(keyCoords.lat - coords.lat) < 0.001 &&
                         Math.abs(keyCoords.lng - coords.lng) < 0.001;
                }) || variant;
                
                locations.push(bestKey);
                console.log(`    ✅ Pattern matched: "${variant}" → "${bestKey}"`);
                break; // Found a match, don't try other variations
              }
            }
          }
        }
      }
    }

    // Remove duplicates (by coordinates)
    const uniqueLocations: string[] = [];
    const seenCoords = new Set<string>();
    
    locations.forEach(loc => {
      const coords = getCityCoordinates(loc);
      if (coords) {
        const coordKey = `${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;
        if (!seenCoords.has(coordKey)) {
          seenCoords.add(coordKey);
          uniqueLocations.push(loc);
        }
      }
    });

    if (uniqueLocations.length > 0) {
      console.log(`    ✅ Extracted ${uniqueLocations.length} unique location(s):`, uniqueLocations);
    } else {
      console.log(`    ⚠️ No locations extracted`);
    }

    return uniqueLocations;
  }, [getCityCoordinates, allCityCoordinates]);

  const parseDate = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 2) {
        const month = parseInt(parts[0]);
        const year = parseInt(parts[1]);
        if (month >= 1 && month <= 12 && year > 2000) {
          return new Date(year, month - 1);
        }
      }
    }
    return null;
  }, []);

  // ============================================================================
  // LOCATION MARKERS: Calculate all markers from timeline and notes
  // ============================================================================
  const locationMarkers = useMemo(() => {
    console.log('🗺️ ===== RECALCULATING ALL LOCATION MARKERS =====');
    console.log(`  📊 Active contacts: ${activeContacts.length}`);
    console.log(`  📊 Timeline events: ${activeTimelineEvents.length}`);

    const markersMap = new Map<string, LocationMarker>();
    const contactsWithNotes = activeContacts.filter(c => c.notes && c.notes.trim());
    console.log(`  📝 Contacts with notes: ${contactsWithNotes.length}`);

    // Process timeline events (use activeTimelineEvents)
    const geoEvents = activeTimelineEvents
      .filter(e => e.geographicEvent?.trim())
      .map(e => ({ ...e, date: parseDate(e.monthYear) }))
      .filter(e => e.date)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());

    console.log(`  📍 Geographic events: ${geoEvents.length}`);

    geoEvents.forEach((event, idx) => {
      const locationName = extractLocationFromTimeline(event.geographicEvent!);
      if (!locationName) return;

      const cityData = getCityCoordinates(locationName);
      if (!cityData || !validateCoordinates(cityData)) {
        console.warn(`  ⚠️ No valid coordinates for timeline location: "${locationName}"`);
        return;
      }

      const coordKey = `${cityData.lat.toFixed(4)}_${cityData.lng.toFixed(4)}`;
      const endDate = idx < geoEvents.length - 1 ? geoEvents[idx + 1].date : null;

      if (!markersMap.has(coordKey)) {
        markersMap.set(coordKey, {
          id: `timeline-${event.id}`,
          city: locationName,
          displayName: cityData.displayName,
          coordinates: { lat: cityData.lat, lng: cityData.lng },
          contacts: [],
          source: 'timeline',
          startDate: event.date!,
          endDate,
        });
        console.log(`  ✅ Added timeline marker: ${cityData.displayName} at [${cityData.lat}, ${cityData.lng}]`);
      }
    });

    // Process contact notes - CRITICAL: Process ALL contacts with notes
    console.log(`  📝 Processing ${contactsWithNotes.length} contacts with notes for location extraction`);
    
    contactsWithNotes.forEach((contact, contactIdx) => {
      console.log(`    [${contactIdx + 1}/${contactsWithNotes.length}] Processing: ${contact.firstName} ${contact.lastName}`);
      const locations = extractLocationsFromNotes(contact);
      
      if (locations.length === 0) {
        console.log(`      ⚠️ No locations extracted from this contact's notes`);
      } else {
        console.log(`      ✅ Extracted ${locations.length} location(s) from notes`);
      }
      
      locations.forEach((locationName, locIdx) => {
        const cityData = getCityCoordinates(locationName);
        if (!cityData || !validateCoordinates(cityData)) {
          console.warn(`  ⚠️ No valid coordinates for note location: "${locationName}"`);
          return;
        }

        const coordKey = `${cityData.lat.toFixed(4)}_${cityData.lng.toFixed(4)}`;
        
        if (!markersMap.has(coordKey)) {
          markersMap.set(coordKey, {
            id: `notes-${contact.id}-${locationName}-${contactIdx}-${locIdx}`,
            city: locationName,
            displayName: cityData.displayName,
            coordinates: { lat: cityData.lat, lng: cityData.lng },
            contacts: [],
            source: 'notes',
          });
          console.log(`      ✅ Created new marker: ${cityData.displayName} at [${cityData.lat}, ${cityData.lng}]`);
        } else {
          console.log(`      📍 Marker already exists for: ${cityData.displayName}`);
        }

        const marker = markersMap.get(coordKey)!;
        if (!marker.contacts.find(c => c.id === contact.id)) {
          marker.contacts = [...marker.contacts, contact];
          console.log(`      ✅ Added contact to marker: ${cityData.displayName}`);
        }
      });
    });

    const markersArray = Array.from(markersMap.values());
    console.log(`✅ Total markers calculated: ${markersArray.length}`);
    markersArray.forEach((m, idx) => {
      console.log(`  [${idx + 1}] ${m.displayName} - ${m.contacts.length} contacts [${m.source}]`);
    });
    console.log('🗺️ ===========================================');

    return markersArray;
  }, [activeContacts, activeTimelineEvents, extractLocationFromTimeline, extractLocationsFromNotes, getCityCoordinates, validateCoordinates, parseDate, allCityCoordinates]);

  // ============================================================================
  // MAP CALCULATIONS: Center and bounds
  // ============================================================================
  const mapCenter = useMemo(() => {
    if (locationMarkers.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // Center of USA
    }
    const avgLat = locationMarkers.reduce((sum, m) => sum + m.coordinates.lat, 0) / locationMarkers.length;
    const avgLng = locationMarkers.reduce((sum, m) => sum + m.coordinates.lng, 0) / locationMarkers.length;
    return { lat: avgLat, lng: avgLng };
  }, [locationMarkers]);

  const mapBounds = useMemo(() => {
    if (locationMarkers.length === 0) {
      console.log('🗺️ No markers - bounds is null');
      return null;
    }

    const lats = locationMarkers.map(m => m.coordinates.lat);
    const lngs = locationMarkers.map(m => m.coordinates.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const isWorldwide = lngSpan > 50 || latSpan > 50;

    // Use percentage-based padding instead of fixed degrees
    const latPadding = latSpan * 0.1; // 10% padding
    const lngPadding = lngSpan * 0.1; // 10% padding
    
    // Ensure minimum padding for very close markers
    const minPadding = 0.5;
    const finalLatPadding = Math.max(latPadding, minPadding);
    const finalLngPadding = Math.max(lngPadding, minPadding);

    const bounds: [[number, number], [number, number]] = [
      [minLat - finalLatPadding, minLng - finalLngPadding],
      [maxLat + finalLatPadding, maxLng + finalLngPadding]
    ];

    console.log(`🗺️ Calculated bounds for ${locationMarkers.length} markers:`);
    console.log(`   Span: lat=${latSpan.toFixed(2)}, lng=${lngSpan.toFixed(2)}`);
    console.log(`   Padding: lat=${finalLatPadding.toFixed(2)}, lng=${finalLngPadding.toFixed(2)}`);
    console.log(`   Bounds: [${bounds[0][0].toFixed(4)}, ${bounds[0][1].toFixed(4)}] to [${bounds[1][0].toFixed(4)}, ${bounds[1][1].toFixed(4)}]`);
    console.log(`   Worldwide: ${isWorldwide}`);

    return bounds;
  }, [locationMarkers]);

  // ============================================================================
  // FORCE MAP UPDATE: When data changes
  // ============================================================================
  useEffect(() => {
    // Create comprehensive hash that includes full notes content to detect ANY change
    const contactsHash = JSON.stringify(
      activeContacts.map(c => ({ 
        id: c.id, 
        notes: c.notes || '', // Include empty string to detect when notes are deleted
        firstName: c.firstName,
        lastName: c.lastName
      }))
    );

    // Initialize on first run
    if (lastContactsHashRef.current === '') {
      lastContactsHashRef.current = contactsHash;
      // Don't skip first run if we have contacts - we want to show them
      if (activeContacts.length > 0) {
        console.log('🔄 MAP: Initial contacts detected - rendering map');
        const contactsWithNotes = activeContacts.filter(c => c.notes && c.notes.trim());
        console.log(`  📊 Total contacts: ${activeContacts.length}`);
        console.log(`  📊 Contacts with notes: ${contactsWithNotes.length}`);
        setMapKey(prev => prev + 1);
      }
      return;
    }

    if (contactsHash !== lastContactsHashRef.current) {
      console.log('🔄 MAP: Contacts data changed - forcing map update');
      const contactsWithNotes = activeContacts.filter(c => c.notes && c.notes.trim());
      const contactsWithoutNotes = activeContacts.filter(c => !c.notes || !c.notes.trim());
      console.log(`  📊 Contacts with notes: ${contactsWithNotes.length}`);
      console.log(`  📊 Contacts without notes: ${contactsWithoutNotes.length}`);
      
      // Log sample of contacts with notes to verify they're being detected
      if (contactsWithNotes.length > 0) {
        console.log(`  📝 Sample contacts with notes:`, contactsWithNotes.slice(0, 3).map(c => ({
          name: `${c.firstName} ${c.lastName}`,
          notesLength: c.notes?.length || 0,
          notesPreview: c.notes?.substring(0, 100)
        })));
      }
      
      lastContactsHashRef.current = contactsHash;
      setMapKey(prev => {
        const newKey = prev + 1;
        console.log(`  🗺️ Map key updated from ${prev} to ${newKey} - markers will recalculate`);
        return newKey;
      });
    }
  }, [activeContacts]);

  // Watch timeline events for changes and force map update
  useEffect(() => {
    // Create hash of timeline events to detect changes
    const timelineHash = JSON.stringify(
      activeTimelineEvents.map(e => ({
        id: e.id,
        monthYear: e.monthYear,
        professionalEvent: e.professionalEvent || '',
        personalEvent: e.personalEvent || '',
        geographicEvent: e.geographicEvent || '',
      }))
    );

    // Compare with previous hash (initialize on first run)
    if (lastTimelineWatchHashRef.current === '') {
      lastTimelineWatchHashRef.current = timelineHash;
      // Don't skip first run if we have timeline events - we want to show them
      if (activeTimelineEvents.length > 0) {
        console.log('🔄 MAP: Initial timeline events detected - rendering map');
        const geoEvents = activeTimelineEvents.filter(e => e.geographicEvent && e.geographicEvent.trim());
        console.log(`  📊 Total timeline events: ${activeTimelineEvents.length}`);
        console.log(`  🌍 Geographic events: ${geoEvents.length}`);
        setMapKey(prev => prev + 1);
      }
      return;
    }

    if (timelineHash !== lastTimelineWatchHashRef.current) {
      console.log('🔄 MAP: Timeline events changed - forcing map update');
      const geoEvents = activeTimelineEvents.filter(e => e.geographicEvent && e.geographicEvent.trim());
      console.log(`  📊 Total timeline events: ${activeTimelineEvents.length}`);
      console.log(`  🌍 Geographic events: ${geoEvents.length}`);
      
      lastTimelineWatchHashRef.current = timelineHash;
      setMapKey(prev => {
        const newKey = prev + 1;
        console.log(`  🗺️ Map key updated from ${prev} to ${newKey} - timeline markers will recalculate`);
        return newKey;
      });
    }
  }, [activeTimelineEvents]);

  // ============================================================================
  // LEAFLET SETUP
  // ============================================================================
  useEffect(() => {
    if (typeof window !== 'undefined' && isClient) {
      try {
        const L = require('leaflet');
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        console.log('✅ Leaflet icons configured');
      } catch (error) {
        console.error('❌ Error configuring Leaflet icons:', error);
      }
    }
  }, [isClient]);

  // ============================================================================
  // FIT MAP BOUNDS: Automatically adjust view to show all markers
  // ============================================================================
  // FIT MAP BOUNDS: Only fit bounds when markers actually change, respect user interaction
  // ============================================================================
  useEffect(() => {
    // Create hash of markers to detect actual changes
    const markersHash = JSON.stringify(
      locationMarkers.map(m => ({
        id: m.id,
        lat: m.coordinates.lat,
        lng: m.coordinates.lng,
      })).sort((a, b) => a.id.localeCompare(b.id))
    );

    // Skip if markers haven't actually changed
    if (markersHash === lastMarkersHashRef.current) {
      return;
    }

    lastMarkersHashRef.current = markersHash;

    if (!mapReady || !locationMarkers.length || !mapBounds) {
      console.log(`🗺️ Fit bounds skipped: mapReady=${mapReady}, markers=${locationMarkers.length}, bounds=${!!mapBounds}`);
      return;
    }

    // Don't auto-fit if user has manually interacted with map
    if (userInteractedRef.current) {
      console.log(`🗺️ Fit bounds skipped: user has interacted with map`);
      return;
    }

    // Clear any pending fitBounds
    if (fitBoundsTimeoutRef.current) {
      clearTimeout(fitBoundsTimeoutRef.current);
    }

    console.log(`🗺️ Attempting to fit bounds for ${locationMarkers.length} markers (markers changed)`);
    console.log(`   Bounds: [${mapBounds[0][0]}, ${mapBounds[0][1]}] to [${mapBounds[1][0]}, ${mapBounds[1][1]}]`);

    fitBoundsTimeoutRef.current = setTimeout(() => {
      try {
        const L = require('leaflet');
        if (!L) {
          console.error('❌ Leaflet not available');
          return;
        }

        // Try to get map instance from ref first
        let map = mapInstanceRef.current;
        
        // If not in ref, try to get from Leaflet's internal registry
        if (!map) {
          const maps = (L.Map as any)?._instances;
          if (!maps || maps.size === 0) {
            console.warn('⚠️ No map instances found in registry');
            return;
          }
          map = Array.from(maps.values())[maps.size - 1] as any;
        }

        if (!map) {
          console.error('❌ Map instance not found');
          return;
        }

        if (typeof map.fitBounds !== 'function') {
          console.error('❌ map.fitBounds is not a function');
          return;
        }

        if (!map._container || !map._container._leaflet_id) {
          console.warn('⚠️ Map container not initialized');
          return;
        }

        // Store map instance
        mapInstanceRef.current = map;

        // Create bounds
        const leafletBounds = L.latLngBounds(mapBounds[0], mapBounds[1]);
        const isWorldwide = Math.abs(mapBounds[1][1] - mapBounds[0][1]) > 50;

        // Fit bounds without animation to prevent blinking
        map.fitBounds(leafletBounds, {
          padding: isWorldwide ? [100, 100] : [50, 50],
          maxZoom: isWorldwide ? 10 : 15,
          animate: false // Disable animation to prevent blinking
        });

        console.log(`✅ Map fitted to bounds for ${locationMarkers.length} markers`);
      } catch (error) {
        console.error('❌ Error fitting map bounds:', error);
      }
    }, 500); // Reduced delay

    return () => {
      if (fitBoundsTimeoutRef.current) {
        clearTimeout(fitBoundsTimeoutRef.current);
      }
    };
  }, [mapReady, locationMarkers.length, mapBounds, locationMarkers]);

  // Track user interaction with map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    const handleUserInteraction = () => {
      userInteractedRef.current = true;
      console.log('🗺️ User interacted with map - disabling auto-fit bounds');
    };

    // Listen for zoom and pan events
    map.on('zoomstart', handleUserInteraction);
    map.on('dragstart', handleUserInteraction);
    map.on('zoom', handleUserInteraction);
    map.on('moveend', handleUserInteraction);

    return () => {
      map.off('zoomstart', handleUserInteraction);
      map.off('dragstart', handleUserInteraction);
      map.off('zoom', handleUserInteraction);
      map.off('moveend', handleUserInteraction);
    };
  }, [mapReady]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-purple-600">Loading map...</p>
            </div>
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  const contactsWithNotes = activeContacts.filter(c => c.notes && c.notes.trim());
  const timelineGeoEvents = activeTimelineEvents.filter(e => e.geographicEvent && e.geographicEvent.trim());

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-700">
              Location Map
            </h1>
            <div className="flex gap-2 flex-wrap">
              {locationMarkers.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      setMapKey(prev => prev + 1);
                      console.log('🔄 Manual map refresh triggered');
                    }}
                    className="px-4 py-2 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors whitespace-nowrap"
                  >
                    🔄 Refresh Map
                  </button>
                  <div className="px-4 py-2 text-sm bg-purple-50 text-purple-500 rounded-lg">
                    📍 {locationMarkers.length} location{locationMarkers.length !== 1 ? 's' : ''}
                  </div>
                </>
              )}
              <details className="px-4 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg cursor-pointer">
                <summary className="font-semibold">📊 Data Info</summary>
                <div className="absolute mt-2 p-3 bg-white border border-purple-200 rounded-lg shadow-lg z-50 text-left min-w-[250px]">
                  <p className="font-bold mb-2 text-purple-700">Current Data:</p>
                  <p>📍 Timeline events: {activeTimelineEvents.length}</p>
                  <p>🌍 Geographic events: {timelineGeoEvents.length}</p>
                  <p>👥 Total contacts: {activeContacts.length}</p>
                  <p>📝 Contacts with notes: {contactsWithNotes.length}</p>
                  <p className="mt-2 pt-2 border-t border-purple-200">
                    <span className="font-bold">Map locations: {locationMarkers.length}</span>
                  </p>
                  <p className="text-xs text-purple-500 mt-2">
                    Timeline: {locationMarkers.filter(p => p.source === 'timeline').length}<br/>
                    Notes: {locationMarkers.filter(p => p.source === 'notes').length}
                  </p>
                  {missingCities.size > 0 && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                      <p className="font-semibold text-orange-800 mb-1">⚠️ Missing Cities:</p>
                      <p className="text-orange-700">
                        {Array.from(missingCities).slice(0, 5).join(', ')}
                        {Array.from(missingCities).length > 5 && '...'}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>

          {locationMarkers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 sm:p-8 text-center">
              <p className="text-purple-500 mb-4">No geographic locations found.</p>
              <p className="text-sm text-purple-400 mb-2">
                Add geographic events in your timeline or mention locations in contact notes to see them on the map.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-purple-500 mb-1">
                  Click on a city marker to see contacts associated with that location.
                </p>
                <p className="text-xs sm:text-sm text-purple-400">
                  Found {locationMarkers.length} location{locationMarkers.length !== 1 ? 's' : ''} ({locationMarkers.filter(p => p.source === 'timeline').length} from timeline, {locationMarkers.filter(p => p.source === 'notes').length} from notes)
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden mb-4 sm:mb-6">
                <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] relative min-h-[400px] z-10">
                  <MapContainer
                    key={`map-${mapKey}`}
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={locationMarkers.length === 1 ? 10 : locationMarkers.length <= 5 ? 3 : 2}
                    minZoom={2}
                    maxZoom={18}
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                    dragging={true}
                    touchZoom={true}
                    zoomControl={true}
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                    className="z-10"
                    ref={(map) => {
                      if (map) {
                        mapInstanceRef.current = map;
                        setMapReady(true);
                        console.log('🗺️ Map container ready');
                      }
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {locationMarkers.map((marker, index) => {
                      // Validate coordinates before rendering
                      if (!validateCoordinates(marker.coordinates)) {
                        console.error(`❌ Skipping invalid marker: ${marker.displayName}`, marker.coordinates);
                        return null;
                      }

                      const position: [number, number] = [marker.coordinates.lat, marker.coordinates.lng];
                      
                      // Create a stable key that doesn't change unless marker data actually changes
                      const markerKey = `${marker.id}-${marker.source}-${marker.coordinates.lat.toFixed(4)}-${marker.coordinates.lng.toFixed(4)}`;

                      return (
                        <Marker
                          key={markerKey}
                          position={position}
                          eventHandlers={{
                            click: () => {
                              console.log(`📍 Marker clicked: ${marker.displayName}`);
                              setSelectedLocation(marker);
                            },
                            add: () => {
                              console.log(`✅ Marker ADDED to map: ${marker.displayName} at [${position[0]}, ${position[1]}]`);
                            },
                            remove: () => {
                              console.log(`🗑️ Marker REMOVED from map: ${marker.displayName}`);
                            },
                          }}
                        >
                          <Popup>
                            <div className="p-2">
                              <h3 className="font-semibold text-purple-700 mb-1">{marker.displayName}</h3>
                              {marker.source === 'timeline' && marker.startDate && (
                                <p className="text-xs text-purple-500 mb-2">
                                  {marker.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                                  {marker.endDate
                                    ? marker.endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : 'Present'}
                                </p>
                              )}
                              <p className="text-xs text-purple-400">
                                {marker.contacts.length} contact{marker.contacts.length !== 1 ? 's' : ''} connected
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>

              {selectedLocation && (
                <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-1">
                        {selectedLocation.displayName}
                      </h2>
                      {selectedLocation.source === 'timeline' && selectedLocation.startDate && (
                        <p className="text-sm text-purple-500">
                          {selectedLocation.startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -{' '}
                          {selectedLocation.endDate
                            ? selectedLocation.endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : 'Present'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="text-purple-400 hover:text-purple-600 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>

                  {selectedLocation.contacts.length === 0 ? (
                    <p className="text-purple-400 text-sm">No contacts associated with this location.</p>
                  ) : (
                    <>
                      <p className="text-sm text-purple-600 mb-4">
                        Contacts ({selectedLocation.contacts.length}):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {selectedLocation.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="border border-purple-200 rounded-lg p-3 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow"
                          >
                            <h3 className="font-semibold text-purple-700 text-sm mb-1">
                              {contact.firstName} {contact.lastName}
                            </h3>
                            {contact.emailAddress && (
                              <p className="text-xs text-purple-500 mb-1 truncate">{contact.emailAddress}</p>
                            )}
                            {contact.dateAdded && (
                              <p className="text-xs text-purple-400">Connected: {contact.dateAdded}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}