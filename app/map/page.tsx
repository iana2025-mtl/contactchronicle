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
  // Other
  'chisinau': { lat: 47.0104, lng: 28.8638, displayName: 'Chisinau, Moldova' },
  'chisinau, moldova': { lat: 47.0104, lng: 28.8638, displayName: 'Chisinau, Moldova' },
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
  const mapInstanceRef = useRef<any>(null);
  const lastContactsHashRef = useRef<string>('');
  const lastStorageCheckRef = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Poll localStorage every 100ms for very fast updates
    const pollInterval = setInterval(syncContacts, 100);

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

  // Use synced contacts or fallback to context
  const activeContacts = useMemo(() => {
    return localContacts.length > 0 ? localContacts : contacts;
  }, [localContacts, contacts]);

  // ============================================================================
  // UTILITY FUNCTIONS: Coordinate lookup and validation
  // ============================================================================
  const getCityCoordinates = useCallback((cityName: string): { lat: number; lng: number; displayName: string } | null => {
    if (!cityName?.trim()) return null;

    const normalized = cityName.toLowerCase().trim();

    // Exact match
    if (cityCoordinates[normalized]) {
      const coords = cityCoordinates[normalized];
      // Validate coordinates
      if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
        console.error(`❌ Invalid coordinates for "${cityName}": [${coords.lat}, ${coords.lng}]`);
        return null;
      }
      return coords;
    }

    // Partial match
    for (const [key, coords] of Object.entries(cityCoordinates)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        if (coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180) {
          return coords;
        }
      }
    }

    // Track missing city
    setMissingCities(prev => {
      if (!prev.has(normalized)) {
        console.warn(`⚠️ CITY NOT IN DATABASE: "${cityName}"`);
        return new Set(prev).add(normalized);
      }
      return prev;
    });

    return null;
  }, []);

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

    // STEP 1: Direct city name matching - check ALL city keys
    for (const [cityKey, coords] of Object.entries(cityCoordinates)) {
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

    const skipWords = new Set([
      'The', 'This', 'That', 'These', 'Those', 'There', 'Here', 'When', 'Where', 'What',
      'Who', 'How', 'Why', 'First', 'Last', 'Next', 'Previous', 'Met', 'Meet', 'Worked',
      'Work', 'Lived', 'Live', 'Moved', 'Move', 'Born', 'Grew', 'Studied', 'Study',
      'Graduated', 'Attended', 'Joined', 'Left', 'Started', 'Ended', 'During', 'After',
      'Before', 'Since', 'Until', 'With', 'Without', 'From', 'To', 'In', 'At', 'On',
      'By', 'For', 'And', 'Or', 'But', 'Not', 'All', 'Some', 'Many', 'Most', 'Each',
      'Every', 'Both', 'Either', 'Neither', 'Year', 'Years', 'Month', 'Months', 'Week',
      'Weeks', 'Day', 'Days', 'Today', 'Yesterday', 'Tomorrow', 'January', 'February',
      'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
      'November', 'December'
    ]);

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(noteText)) !== null) {
        if (match[1]) {
          let cityToCheck = match[1].trim();
          
          // Skip common non-city words
          if (skipWords.has(cityToCheck)) continue;
          
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
                // Find the best matching key from database
                const bestKey = Object.keys(cityCoordinates).find(key => {
                  const keyCoords = cityCoordinates[key];
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
  }, [getCityCoordinates]);

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
    console.log(`  📊 Timeline events: ${timelineEvents.length}`);

    const markersMap = new Map<string, LocationMarker>();
    const contactsWithNotes = activeContacts.filter(c => c.notes && c.notes.trim());
    console.log(`  📝 Contacts with notes: ${contactsWithNotes.length}`);

    // Process timeline events
    const geoEvents = timelineEvents
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
  }, [activeContacts, timelineEvents, extractLocationFromTimeline, extractLocationsFromNotes, getCityCoordinates, validateCoordinates, parseDate]);

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
    if (locationMarkers.length === 0) return null;

    const lats = locationMarkers.map(m => m.coordinates.lat);
    const lngs = locationMarkers.map(m => m.coordinates.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const isWorldwide = lngSpan > 50 || latSpan > 50;

    const padding = isWorldwide ? 5 : 2;
    return [
      [minLat - padding, minLng - padding],
      [maxLat + padding, maxLng + padding]
    ] as [[number, number], [number, number]];
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
  useEffect(() => {
    if (!mapReady || !locationMarkers.length || !mapBounds) return;

    const fitBoundsTimeout = setTimeout(() => {
      try {
        const L = require('leaflet');
        const maps = (L.Map as any)?._instances;
        if (!maps || maps.size === 0) return;

        const map = Array.from(maps.values())[maps.size - 1] as any;
        if (!map || typeof map.fitBounds !== 'function') return;
        if (!map._container?._leaflet_id) return;

        mapInstanceRef.current = map;
        const leafletBounds = L.latLngBounds(mapBounds[0], mapBounds[1]);
        const isWorldwide = Math.abs(mapBounds[1][1] - mapBounds[0][1]) > 50;

        map.fitBounds(leafletBounds, {
          padding: [50, 50],
          maxZoom: isWorldwide ? 10 : 15,
          animate: true
        });

        console.log(`🗺️ Map fitted to bounds for ${locationMarkers.length} markers`);
      } catch (error) {
        console.error('❌ Error fitting map bounds:', error);
      }
    }, 800);

    return () => clearTimeout(fitBoundsTimeout);
  }, [mapReady, locationMarkers.length, mapBounds]);

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
  const timelineGeoEvents = timelineEvents.filter(e => e.geographicEvent && e.geographicEvent.trim());

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-800">
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
                    className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors whitespace-nowrap"
                  >
                    🔄 Refresh Map
                  </button>
                  <div className="px-4 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg">
                    📍 {locationMarkers.length} location{locationMarkers.length !== 1 ? 's' : ''}
                  </div>
                </>
              )}
              <details className="px-4 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg cursor-pointer">
                <summary className="font-semibold">📊 Data Info</summary>
                <div className="absolute mt-2 p-3 bg-white border border-purple-200 rounded-lg shadow-lg z-50 text-left min-w-[250px]">
                  <p className="font-bold mb-2 text-purple-800">Current Data:</p>
                  <p>📍 Timeline events: {timelineEvents.length}</p>
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
              <p className="text-purple-600 mb-4">No geographic locations found.</p>
              <p className="text-sm text-purple-500 mb-2">
                Add geographic events in your timeline or mention locations in contact notes to see them on the map.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-purple-600 mb-1">
                  Click on a city marker to see contacts associated with that location.
                </p>
                <p className="text-xs sm:text-sm text-purple-500">
                  Found {locationMarkers.length} location{locationMarkers.length !== 1 ? 's' : ''} ({locationMarkers.filter(p => p.source === 'timeline').length} from timeline, {locationMarkers.filter(p => p.source === 'notes').length} from notes)
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden mb-4 sm:mb-6">
                <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] relative min-h-[400px] z-10">
                  <MapContainer
                    key={`map-${mapKey}-${locationMarkers.length}`}
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={locationMarkers.length === 1 ? 10 : 2}
                    minZoom={2}
                    maxZoom={18}
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                    dragging={true}
                    touchZoom={true}
                    zoomControl={true}
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                    className="z-10"
                    whenReady={(mapEvent) => {
                      setMapReady(true);
                      console.log('🗺️ Map container ready');
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
                      
                      console.log(`📍 Rendering marker [${index + 1}/${locationMarkers.length}]: ${marker.displayName} at [${position[0]}, ${position[1]}]`);

                      return (
                        <Marker
                          key={`${marker.id}-${marker.source}-${position[0]}-${position[1]}-${mapKey}`}
                          position={position}
                          eventHandlers={{
                            click: () => {
                              console.log(`📍 Marker clicked: ${marker.displayName}`);
                              setSelectedLocation(marker);
                            },
                            add: () => {
                              console.log(`✅ Marker rendered: ${marker.displayName}`);
                            },
                          }}
                        >
                          <Popup>
                            <div className="p-2">
                              <h3 className="font-semibold text-purple-800 mb-1">{marker.displayName}</h3>
                              {marker.source === 'timeline' && marker.startDate && (
                                <p className="text-xs text-purple-600 mb-2">
                                  {marker.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                                  {marker.endDate
                                    ? marker.endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : 'Present'}
                                </p>
                              )}
                              <p className="text-xs text-purple-500">
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
                      <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-1">
                        {selectedLocation.displayName}
                      </h2>
                      {selectedLocation.source === 'timeline' && selectedLocation.startDate && (
                        <p className="text-sm text-purple-600">
                          {selectedLocation.startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -{' '}
                          {selectedLocation.endDate
                            ? selectedLocation.endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : 'Present'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="text-purple-500 hover:text-purple-700 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>

                  {selectedLocation.contacts.length === 0 ? (
                    <p className="text-purple-500 text-sm">No contacts associated with this location.</p>
                  ) : (
                    <>
                      <p className="text-sm text-purple-700 mb-4">
                        Contacts ({selectedLocation.contacts.length}):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {selectedLocation.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="border border-purple-200 rounded-lg p-3 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow"
                          >
                            <h3 className="font-semibold text-purple-800 text-sm mb-1">
                              {contact.firstName} {contact.lastName}
                            </h3>
                            {contact.emailAddress && (
                              <p className="text-xs text-purple-600 mb-1 truncate">{contact.emailAddress}</p>
                            )}
                            {contact.dateAdded && (
                              <p className="text-xs text-purple-500">Connected: {contact.dateAdded}</p>
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