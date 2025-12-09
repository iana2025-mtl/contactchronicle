'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useApp, Contact, TimelineEvent } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });


// Simple city coordinates lookup for common cities
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'new york': { lat: 40.7128, lng: -74.0060 },
  'new york, ny': { lat: 40.7128, lng: -74.0060 },
  'new york city': { lat: 40.7128, lng: -74.0060 },
  'nyc': { lat: 40.7128, lng: -74.0060 },
  'wilmington': { lat: 39.7391, lng: -75.5398 },
  'wilmington, de': { lat: 39.7391, lng: -75.5398 },
  'chisinau': { lat: 47.0104, lng: 28.8638 },
  'chisinau, moldova': { lat: 47.0104, lng: 28.8638 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'san francisco, ca': { lat: 37.7749, lng: -122.4194 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'los angeles, ca': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'chicago, il': { lat: 41.8781, lng: -87.6298 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'boston, ma': { lat: 42.3601, lng: -71.0589 },
  'newark': { lat: 40.7357, lng: -74.1724 },
  'newark, nj': { lat: 40.7357, lng: -74.1724 },
  'washington': { lat: 38.9072, lng: -77.0369 },
  'washington, dc': { lat: 38.9072, lng: -77.0369 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'miami, fl': { lat: 25.7617, lng: -80.1918 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'seattle, wa': { lat: 47.6062, lng: -122.3321 },
  'austin': { lat: 30.2672, lng: -97.7431 },
  'austin, tx': { lat: 30.2672, lng: -97.7431 },
  'atlanta': { lat: 33.749, lng: -84.388 },
  'atlanta, ga': { lat: 33.749, lng: -84.388 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 },
  'philadelphia, pa': { lat: 39.9526, lng: -75.1652 },
  'long island': { lat: 40.7891, lng: -73.1350 },
  'long island, ny': { lat: 40.7891, lng: -73.1350 },
  'montreal': { lat: 45.5017, lng: -73.5673 },
  'montreal, qc': { lat: 45.5017, lng: -73.5673 },
  'montreal, canada': { lat: 45.5017, lng: -73.5673 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'toronto, on': { lat: 43.6532, lng: -79.3832 },
  'toronto, canada': { lat: 43.6532, lng: -79.3832 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'vancouver, bc': { lat: 49.2827, lng: -123.1207 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'london, uk': { lat: 51.5074, lng: -0.1278 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'paris, france': { lat: 48.8566, lng: 2.3522 },
  'warsaw': { lat: 52.2297, lng: 21.0122 },
  'warsaw, poland': { lat: 52.2297, lng: 21.0122 },
  'warszawa': { lat: 52.2297, lng: 21.0122 },
  'virginia beach': { lat: 36.8529, lng: -75.9780 },
  'virginia beach, va': { lat: 36.8529, lng: -75.9780 },
  'new jersey': { lat: 40.2989, lng: -74.5210 },
  'new jersey, nj': { lat: 40.2989, lng: -74.5210 },
  'ottawa': { lat: 45.4215, lng: -75.6972 },
  'ottawa, ca': { lat: 45.4215, lng: -75.6972 },
  'ottawa, on': { lat: 45.4215, lng: -75.6972 },
  'ottawa, ontario': { lat: 45.4215, lng: -75.6972 },
  'ottawa, canada': { lat: 45.4215, lng: -75.6972 },
  'tampa': { lat: 27.9506, lng: -82.4572 },
  'tampa, fl': { lat: 27.9506, lng: -82.4572 },
  'tampa, florida': { lat: 27.9506, lng: -82.4572 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'rome, italy': { lat: 41.9028, lng: 12.4964 },
  'roma': { lat: 41.9028, lng: 12.4964 },
  'roma, italy': { lat: 41.9028, lng: 12.4964 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'berlin, germany': { lat: 52.5200, lng: 13.4050 },
  'zurich': { lat: 47.3769, lng: 8.5417 },
  'zurich, switzerland': { lat: 47.3769, lng: 8.5417 },
  'zürich': { lat: 47.3769, lng: 8.5417 },
  'zürich, switzerland': { lat: 47.3769, lng: 8.5417 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'houston, tx': { lat: 29.7604, lng: -95.3698 },
  'houston, texas': { lat: 29.7604, lng: -95.3698 },
  'houston texas': { lat: 29.7604, lng: -95.3698 },
};

interface LocationPeriod {
  city: string;
  startDate: Date;
  endDate: Date | null;
  coordinates: { lat: number; lng: number };
  contacts: Contact[];
  source: 'timeline' | 'notes';
}

// Track missing cities that users mention but aren't in database
const missingCitiesRef = new Set<string>();

export default function MapPage() {
  const { timelineEvents, contacts } = useApp();
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<LocationPeriod | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force map re-render when locations change
  const mapInstanceRef = useRef<any>(null); // Store map instance reference
  const previousContactsHashRef = useRef<string>(''); // Track previous hash to detect changes
  const forceUpdateRef = useRef(0); // Force update counter
  const lastStorageCheckRef = useRef<string>(''); // Track last localStorage check

  useEffect(() => {
    setIsClient(true);
    
    // CRITICAL: When page becomes visible, check localStorage for updates
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('🔔 MAP PAGE: Page became visible - checking for updates');
        const contactsKey = `contactChronicle_contacts_${user.id}`;
        const stored = localStorage.getItem(contactsKey);
        if (stored) {
          try {
            const storedContacts: Contact[] = JSON.parse(stored);
            const storedHash = storedContacts.map(c => 
              `${c.id}:${c.firstName}:${c.lastName}:${c.notes || ''}`
            ).join('|');
            
            const currentHash = contacts.map(c => 
              `${c.id}:${c.firstName}:${c.lastName}:${c.notes || ''}`
            ).join('|');
            
            if (storedHash !== currentHash) {
              console.log('🔔 MAP PAGE: Visibility change detected localStorage differs - forcing update!');
              setMapKey(prev => prev + 1);
            }
          } catch (error) {
            // Ignore parse errors
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, contacts]);

  // CRITICAL: Listen for contacts updates via custom event and localStorage
  useEffect(() => {
    if (!user) return;
    
    const contactsKey = `contactChronicle_contacts_${user.id}`;
    
    // Listen for custom event when contacts are updated
    const handleContactsUpdated = (e: CustomEvent) => {
      console.log('🔔 MAP PAGE: contactsUpdated event received!');
      console.log(`  📊 Contact ID updated: ${e.detail?.contactId}`);
      console.log(`  📊 Total contacts: ${e.detail?.contacts?.length || 0}`);
      
      // Force map recalculation
      setMapKey(prev => {
        const newKey = prev + 1;
        console.log(`  🗺️ Map key updated to ${newKey} due to contactsUpdated event`);
        return newKey;
      });
    };
    
    // Listen for storage events (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === contactsKey && e.newValue) {
        console.log('🔔 MAP PAGE: localStorage changed (storage event)');
        setMapKey(prev => prev + 1);
      }
    };
    
    // Poll localStorage to catch same-tab updates (since storage event only fires cross-tab)
    const pollInterval = setInterval(() => {
      const stored = localStorage.getItem(contactsKey);
      if (stored && stored !== lastStorageCheckRef.current) {
        try {
          const storedContacts: Contact[] = JSON.parse(stored);
          const storedHash = storedContacts.map(c => 
            `${c.id}:${c.firstName}:${c.lastName}:${c.notes || ''}`
          ).join('|');
          
          const currentHash = contacts.map(c => 
            `${c.id}:${c.firstName}:${c.lastName}:${c.notes || ''}`
          ).join('|');
          
          if (storedHash !== currentHash) {
            console.log('🔔 MAP PAGE: Poll detected contacts change in localStorage!');
            console.log(`  📊 Stored hash: ${storedHash.substring(0, 50)}...`);
            console.log(`  📊 Current hash: ${currentHash.substring(0, 50)}...`);
            lastStorageCheckRef.current = stored;
            setMapKey(prev => {
              const newKey = prev + 1;
              console.log(`  🗺️ Map key updated to ${newKey} due to localStorage poll`);
              return newKey;
            });
          }
        } catch (error) {
          // Ignore parse errors
        }
      }
    }, 500); // Poll every 500ms
    
    window.addEventListener('contactsUpdated', handleContactsUpdated as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('contactsUpdated', handleContactsUpdated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [user, contacts]);

  // CRITICAL: Log when contacts prop changes from context
  useEffect(() => {
    console.log('🔍 MAP PAGE: contacts prop received from useApp()');
    console.log(`  📊 Contacts array reference:`, contacts);
    console.log(`  📊 Contacts array length: ${contacts.length}`);
    const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
    console.log(`  📝 Contacts with notes: ${contactsWithNotes.length}`);
    
    if (contactsWithNotes.length > 0) {
      console.log(`  📝 Sample contacts with notes:`, contactsWithNotes.slice(0, 5).map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        notesLength: c.notes?.length || 0,
        notesPreview: c.notes?.substring(0, 100)
      })));
    }
  }, [contacts]);

  // Create a comprehensive hash of ALL contact data (including notes) to detect ANY changes
  const contactsHash = useMemo(() => {
    // Include ID, notes, and all fields that could affect location extraction
    const hash = contacts.map(c => 
      `${c.id}:${c.firstName}:${c.lastName}:${c.notes || ''}:${c.dateAdded || ''}`
    ).join('|');
    
    const hasChanged = hash !== previousContactsHashRef.current;
    if (hasChanged) {
      console.log('🔄 MAP PAGE: contactsHash CHANGED - contacts data updated!');
      console.log(`  📊 Total contacts: ${contacts.length}`);
      const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
      console.log(`  📝 Contacts with notes: ${contactsWithNotes.length}`);
      console.log(`  🔑 Hash changed from "${previousContactsHashRef.current.substring(0, 50)}..." to "${hash.substring(0, 50)}..."`);
      previousContactsHashRef.current = hash;
      forceUpdateRef.current += 1; // Increment force update counter
    } else {
      console.log('🔄 MAP PAGE: contactsHash unchanged - no updates detected');
    }
    
    return hash;
  }, [contacts]);

  // Create hash of timeline events
  const timelineHash = useMemo(() => {
    return JSON.stringify(timelineEvents.map(e => ({
      id: e.id,
      geographicEvent: e.geographicEvent,
      monthYear: e.monthYear
    })));
  }, [timelineEvents]);

  // CRITICAL: Force map update whenever contacts or timeline changes
  useEffect(() => {
    console.log('🔄 MAP PAGE: Data change detected - forcing map recalculation!');
    console.log(`  📊 Contacts hash: ${contactsHash.substring(0, 50)}...`);
    console.log(`  📊 Timeline hash: ${timelineHash.substring(0, 50)}...`);
    console.log(`  📊 Force update counter: ${forceUpdateRef.current}`);
    console.log(`  📊 Contacts array reference:`, contacts);
    console.log(`  📊 Contacts with notes: ${contacts.filter(c => c.notes && c.notes.trim()).length}`);
    
    // Force map re-render by updating key
    setMapKey(prev => {
      const newKey = prev + 1;
      console.log(`  🗺️ Map key updated from ${prev} to ${newKey} - map will remount and recalculate ALL markers`);
      return newKey;
    });
  }, [contactsHash, timelineHash, contacts]);

  // Set up Leaflet icons once when component mounts
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

  // Extract location from geographic event text
  const extractLocation = useCallback((text: string): string | null => {
    if (!text) return null;
    
    const trimmed = text.trim();
    
    // Common patterns: "Moved to [City]", "Lived in [City]", "[City]", etc.
    const patterns = [
      /(?:moved\s+to|lived\s+in|located\s+in|resided\s+in|stayed\s+in)\s+([^,]+?)(?:,|$)/i,
      /(?:in|at)\s+([^,]+?)(?:,|\s*$)/i,
      /^([^,]+?)(?:\s*,|\s*$)/,
    ];
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Filter out common prefixes/suffixes
        if (location.length > 2 && !location.match(/^(the|a|an)\s/i)) {
          return location;
        }
      }
    }
    
    return trimmed;
  }, []);

  // Get coordinates for a city with improved matching
  const getCityCoordinates = useCallback((cityName: string): { lat: number; lng: number } | null => {
    if (!cityName || !cityName.trim()) return null;
    
    const normalized = cityName.toLowerCase().trim();
    
    // Try exact match first
    if (cityCoordinates[normalized]) {
      return cityCoordinates[normalized];
    }
    
    // Try partial match - check if any key matches
    for (const [key, coords] of Object.entries(cityCoordinates)) {
      const keyLower = key.toLowerCase();
      // Exact match (case-insensitive)
      if (normalized === keyLower) {
        return coords;
      }
      // City name contains key or key contains city name
      if (normalized.includes(keyLower) || keyLower.includes(normalized)) {
        return coords;
      }
      // Check if significant words match
      const normalizedWords = normalized.split(/\s+/).filter(w => w.length >= 3);
      const keyWords = keyLower.split(/\s+/).filter(w => w.length >= 3);
      if (normalizedWords.length > 0 && keyWords.length > 0) {
        const matchingWords = normalizedWords.filter(w => keyWords.includes(w));
        if (matchingWords.length === normalizedWords.length || matchingWords.length === keyWords.length) {
          return coords;
        }
      }
    }
    
    // City not found - track it
    if (!missingCitiesRef.has(normalized)) {
      missingCitiesRef.add(normalized);
      console.warn(`⚠️ CITY NOT IN DATABASE: "${cityName}" (normalized: "${normalized}")`);
      console.warn(`   Please add this city to cityCoordinates in app/map/page.tsx`);
    }
    
    return null;
  }, []);

  // Parse date from MM/YYYY format
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

  // Extract locations from contact notes - COMPREHENSIVE VERSION
  const extractLocationsFromNotes = useCallback((contact: Contact): string[] => {
    if (!contact.notes || !contact.notes.trim()) return [];
    
    const locations: string[] = [];
    const noteText = contact.notes;
    const noteTextLower = noteText.toLowerCase();
    
    console.log(`  🔍 Extracting locations from "${contact.firstName} ${contact.lastName}" notes:`, noteText.substring(0, 200));
    
    // STEP 1: Try to match ALL known city names directly from database
    for (const [cityKey, coords] of Object.entries(cityCoordinates)) {
      const cityKeyLower = cityKey.toLowerCase();
      const cityParts = cityKey.split(',');
      const cityName = cityParts[0].trim();
      const cityNameLower = cityName.toLowerCase();
      
      // Skip very short city names that might match accidentally
      if (cityName.length < 2 || (cityName.length === 2 && !cityKey.includes(','))) continue;
      
      // Check if the full city key appears in notes (e.g., "New York, NY", "Houston, TX")
      if (noteTextLower.includes(cityKeyLower)) {
        if (!locations.some(loc => loc.toLowerCase() === cityKeyLower)) {
          locations.push(cityKey);
          console.log(`    ✅ Direct match: "${cityKey}" found in notes`);
          continue;
        }
      }
      
      // For multi-word city names, check if all significant words appear
      const cityWords = cityNameLower.split(/\s+/).filter(w => w.length >= 3);
      let allWordsFound = false;
      
      if (cityWords.length > 1) {
        // Multi-word city: check if all significant words appear
        const allWordsPresent = cityWords.every(word => noteTextLower.includes(word));
        if (allWordsPresent) {
          // Verify they appear close together
          const firstWordIndex = noteTextLower.indexOf(cityWords[0]);
          if (firstWordIndex !== -1) {
            const relevantSection = noteTextLower.substring(
              Math.max(0, firstWordIndex - 20), 
              firstWordIndex + cityName.length + 20
            );
            if (relevantSection.includes(cityNameLower)) {
              allWordsFound = true;
            } else {
              // Try regex pattern match in full text
              const cityPattern = new RegExp(cityNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
              if (cityPattern.test(noteText)) {
                allWordsFound = true;
              }
            }
          }
        }
      } else {
        // Single word city - use word boundary
        const escapedCityName = cityNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBoundaryPattern = new RegExp(`\\b${escapedCityName}\\b`, 'i');
        if (wordBoundaryPattern.test(noteText)) {
          allWordsFound = true;
        } else if (cityName.length >= 4) {
          // For cities 4+ chars, check with context (e.g., "Houston TX", "Ottawa CA")
          const withContextPattern = new RegExp(`${escapedCityName}\\s*[,]?\\s*([A-Z]{2}|[A-Z][a-z]+)`, 'i');
          if (withContextPattern.test(noteText)) {
            allWordsFound = true;
          }
        }
      }
      
      if (allWordsFound) {
        const alreadyFound = locations.some(loc => {
          const locLower = loc.toLowerCase();
          return locLower === cityKeyLower || locLower === cityNameLower;
        });
        
        if (!alreadyFound) {
          locations.push(cityKey);
          console.log(`    ✅ Pattern match: "${cityKey}" from notes`);
        }
      }
    }
    
    // STEP 2: Use regex patterns to find "City, State", "City State", etc.
    const patterns = [
      // "City, State/Country" or "City, State Code"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|[A-Z]{2})\b/g,
      // "City State/Country" (space separated)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      // "City State Code" (2-letter code)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\b/g,
      // "in/at/from/to/near City"
      /\b(?:in|at|from|to|near|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      // Standalone capitalized words (potential city names)
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
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(noteText)) !== null) {
        if (match[1]) {
          let cityToCheck = match[1].trim();
          
          // Skip common non-city words
          if (skipWords.has(cityToCheck)) continue;
          
          // If we have a second part (state/country), try combinations
          if (match[2]) {
            const secondPart = match[2].trim();
            
            // State code (2 letters)
            if (secondPart.length === 2 && /^[A-Z]{2}$/.test(secondPart)) {
              const variations = [
                `${cityToCheck}, ${secondPart}`,
                `${cityToCheck} ${secondPart}`,
                cityToCheck
              ];
              
              for (const variant of variations) {
                const coords = getCityCoordinates(variant);
                if (coords && !locations.some(loc => loc.toLowerCase() === variant.toLowerCase())) {
                  locations.push(variant);
                  console.log(`    ✅ Pattern matched: "${variant}"`);
                  break;
                }
              }
            } else {
              // Country or state name
              const variations = [
                `${cityToCheck}, ${secondPart}`,
                `${cityToCheck} ${secondPart}`,
                cityToCheck
              ];
              
              for (const variant of variations) {
                const coords = getCityCoordinates(variant);
                if (coords && !locations.some(loc => loc.toLowerCase() === variant.toLowerCase())) {
                  locations.push(variant);
                  console.log(`    ✅ Pattern matched: "${variant}"`);
                  break;
                }
              }
            }
          } else {
            // Single city name
            const coords = getCityCoordinates(cityToCheck);
            if (coords && !locations.some(loc => loc.toLowerCase() === cityToCheck.toLowerCase())) {
              locations.push(cityToCheck);
              console.log(`    ✅ Pattern matched: "${cityToCheck}"`);
            }
          }
        }
      }
    }
    
    // Final validation and logging
    const validLocations = locations.filter(loc => {
      const coords = getCityCoordinates(loc);
      if (!coords) {
        console.warn(`    ⚠️ Location "${loc}" was extracted but has no coordinates!`);
        return false;
      }
      return true;
    });
    
    if (validLocations.length > 0) {
      console.log(`  ✅ Extracted ${validLocations.length} valid location(s) from "${contact.firstName} ${contact.lastName}":`, validLocations);
    } else {
      console.log(`  ⚠️ No valid locations extracted from "${contact.firstName} ${contact.lastName}"`);
      console.log(`     Note text: "${noteText.substring(0, 200)}"`);
    }
    
    return validLocations;
  }, [getCityCoordinates]);

  // Build location periods from timeline events
  const locationPeriodsFromTimeline = useMemo(() => {
    console.log('🔍 RECALCULATING: locationPeriodsFromTimeline');
    console.log(`  - Timeline events: ${timelineEvents.length}`);
    
    const periods: LocationPeriod[] = [];
    const geoEvents = timelineEvents
      .filter(event => event.geographicEvent && event.geographicEvent.trim())
      .map(event => ({
        ...event,
        date: parseDate(event.monthYear),
      }))
      .filter(event => event.date)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());
    
    console.log(`  - Geographic events found: ${geoEvents.length}`);
    
    for (let i = 0; i < geoEvents.length; i++) {
      const event = geoEvents[i];
      const locationName = extractLocation(event.geographicEvent!);
      
      if (!locationName) {
        console.warn(`  ⚠️ Could not extract location from: "${event.geographicEvent}"`);
        continue;
      }
      
      const coordinates = getCityCoordinates(locationName);
      if (!coordinates) {
        console.warn(`  ⚠️ No coordinates found for: "${locationName}"`);
        continue;
      }
      
      const startDate = event.date!;
      const endDate = i < geoEvents.length - 1 ? geoEvents[i + 1].date : null;
      
      periods.push({
        city: locationName,
        startDate,
        endDate,
        coordinates,
        contacts: [],
        source: 'timeline',
      });
      
      console.log(`  ✅ Added timeline location: ${locationName} at [${coordinates.lat}, ${coordinates.lng}]`);
    }
    
    // Match contacts to periods based on dateAdded
    const periodsWithContacts = periods.map(period => {
      const matchedContacts = contacts.filter(contact => {
        if (!contact.dateAdded) return false;
        const contactDate = parseDate(contact.dateAdded);
        if (!contactDate) return false;
        const isAfterStart = contactDate >= period.startDate;
        const isBeforeEnd = period.endDate ? contactDate < period.endDate : true;
        return isAfterStart && isBeforeEnd;
      });
      
      return {
        ...period,
        contacts: matchedContacts,
      };
    });
    
    console.log(`  ✅ Created ${periodsWithContacts.length} timeline location periods`);
    return [...periodsWithContacts];
  }, [timelineEvents, contacts, extractLocation, getCityCoordinates, parseDate]);

  // Build location markers from contact notes - FULLY REACTIVE
  const locationMarkersFromNotes = useMemo(() => {
    console.log('🔍 RECALCULATING: locationMarkersFromNotes');
    console.log(`  - Total contacts: ${contacts.length}`);
    const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
    console.log(`  - Contacts with notes: ${contactsWithNotes.length}`);
    
    const locationMap = new Map<string, { coordinates: { lat: number; lng: number }; contacts: Contact[]; displayName: string }>();
    let processedCount = 0;
    let locationsFoundCount = 0;
    const missingCities = new Set<string>();
    
    // Process each contact's notes
    contacts.forEach(contact => {
      if (!contact.notes || !contact.notes.trim()) return;
      
      processedCount++;
      const locations = extractLocationsFromNotes(contact);
      
      if (locations.length > 0) {
        locationsFoundCount += locations.length;
        
        locations.forEach(locationName => {
          const coordinates = getCityCoordinates(locationName);
          if (!coordinates) {
            missingCities.add(locationName);
            console.warn(`  ⚠️ No coordinates for: "${locationName}" in ${contact.firstName} ${contact.lastName}`);
            return;
          }
          
          const coordKey = `${coordinates.lat.toFixed(4)}_${coordinates.lng.toFixed(4)}`;
          
          if (!locationMap.has(coordKey)) {
            locationMap.set(coordKey, {
              coordinates,
              contacts: [],
              displayName: locationName,
            });
            console.log(`  ✅ New location marker: ${locationName} at [${coordinates.lat}, ${coordinates.lng}]`);
          }
          
          const locationData = locationMap.get(coordKey)!;
          if (!locationData.contacts.find(c => c.id === contact.id)) {
            locationData.contacts = [...locationData.contacts, contact];
          }
        });
      }
    });
    
    console.log(`  📊 Processed ${processedCount} contacts with notes, found ${locationsFoundCount} location mentions`);
    
    if (missingCities.size > 0) {
      console.warn(`  ⚠️ ${missingCities.size} location(s) mentioned but not in database:`, Array.from(missingCities));
    }
    
    // Convert to LocationPeriod array
    const periods: LocationPeriod[] = [];
    locationMap.forEach((data, coordKey) => {
      const timelinePeriod = locationPeriodsFromTimeline.find(
        p => Math.abs(p.coordinates.lat - data.coordinates.lat) < 0.01 && 
             Math.abs(p.coordinates.lng - data.coordinates.lng) < 0.01
      );
      
      periods.push({
        city: data.displayName,
        startDate: timelinePeriod?.startDate || new Date(2000, 0, 1),
        endDate: timelinePeriod?.endDate || null,
        coordinates: { ...data.coordinates },
        contacts: [...data.contacts],
        source: 'notes',
      });
    });
    
    console.log(`  ✅ Created ${periods.length} location markers from notes`);
    if (periods.length > 0) {
      console.log(`  📍 Locations:`, periods.map(p => `${p.city} [${p.coordinates.lat}, ${p.coordinates.lng}] - ${p.contacts.length} contacts`));
    }
    
    return [...periods];
  }, [contacts, extractLocationsFromNotes, getCityCoordinates, locationPeriodsFromTimeline]);

  // Combine timeline and notes locations - deduplicate by coordinates
  const locationPeriods = useMemo(() => {
    console.log('🔍 RECALCULATING: locationPeriods (combining timeline and notes)');
    const combined: LocationPeriod[] = [];
    const coordinateMap = new Map<string, LocationPeriod>();
    
    const getCoordKey = (lat: number, lng: number) => `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Add timeline locations
    locationPeriodsFromTimeline.forEach(timelineLoc => {
      const coordKey = getCoordKey(timelineLoc.coordinates.lat, timelineLoc.coordinates.lng);
      const existing = coordinateMap.get(coordKey);
      
      if (existing) {
        const mergedContacts = [...existing.contacts];
        timelineLoc.contacts.forEach(contact => {
          if (!mergedContacts.find(c => c.id === contact.id)) {
            mergedContacts.push(contact);
          }
        });
        
        const updated: LocationPeriod = {
          ...existing,
          contacts: mergedContacts,
          source: timelineLoc.source === 'timeline' ? 'timeline' : existing.source,
          city: timelineLoc.source === 'timeline' ? timelineLoc.city : existing.city,
        };
        
        coordinateMap.set(coordKey, updated);
        const index = combined.findIndex(loc => getCoordKey(loc.coordinates.lat, loc.coordinates.lng) === coordKey);
        if (index !== -1) {
          combined[index] = updated;
        }
      } else {
        const newLoc: LocationPeriod = {
          ...timelineLoc,
          contacts: [...timelineLoc.contacts],
        };
        combined.push(newLoc);
        coordinateMap.set(coordKey, newLoc);
      }
    });
    
    // Add notes-based locations
    locationMarkersFromNotes.forEach(notesLocation => {
      const coordKey = getCoordKey(notesLocation.coordinates.lat, notesLocation.coordinates.lng);
      const existing = coordinateMap.get(coordKey);
      
      if (existing) {
        const mergedContacts = [...existing.contacts];
        notesLocation.contacts.forEach(contact => {
          if (!mergedContacts.find(c => c.id === contact.id)) {
            mergedContacts.push(contact);
          }
        });
        
        const updated: LocationPeriod = {
          ...existing,
          contacts: mergedContacts,
        };
        
        coordinateMap.set(coordKey, updated);
        const index = combined.findIndex(loc => getCoordKey(loc.coordinates.lat, loc.coordinates.lng) === coordKey);
        if (index !== -1) {
          combined[index] = updated;
        }
      } else {
        const newLoc: LocationPeriod = {
          ...notesLocation,
          contacts: [...notesLocation.contacts],
        };
        combined.push(newLoc);
        coordinateMap.set(coordKey, newLoc);
      }
    });
    
    console.log(`✅ Combined ${combined.length} unique locations (deduplicated by coordinates)`);
    console.log(`📍 All locations:`, combined.map(l => `${l.city} [${l.source}] at [${l.coordinates.lat}, ${l.coordinates.lng}] (${l.contacts.length} contacts)`));
    
    return [...combined];
  }, [locationPeriodsFromTimeline, locationMarkersFromNotes]);

  // Log when locationPeriods changes
  useEffect(() => {
    console.log(`🗺️ ===== LOCATION PERIODS UPDATED =====`);
    console.log(`  📍 Total locations: ${locationPeriods.length}`);
    console.log(`  📍 Map key: ${mapKey}`);
    
    if (locationPeriods.length > 0) {
      locationPeriods.forEach((loc, idx) => {
        console.log(`  [${idx + 1}] ${loc.city} at [${loc.coordinates.lat}, ${loc.coordinates.lng}] - ${loc.contacts.length} contacts [${loc.source}]`);
      });
    } else {
      console.log(`  ⚠️ No locations found!`);
      console.log(`  - Contacts: ${contacts.length}`);
      console.log(`  - Contacts with notes: ${contacts.filter(c => c.notes && c.notes.trim()).length}`);
      console.log(`  - Timeline events: ${timelineEvents.length}`);
    }
    console.log(`🗺️ ====================================`);
  }, [locationPeriods, mapKey, contacts, timelineEvents]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (locationPeriods.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // Center of USA
    }
    
    const avgLat = locationPeriods.reduce((sum, p) => sum + p.coordinates.lat, 0) / locationPeriods.length;
    const avgLng = locationPeriods.reduce((sum, p) => sum + p.coordinates.lng, 0) / locationPeriods.length;
    
    return { lat: avgLat, lng: avgLng };
  }, [locationPeriods]);

  // Calculate bounds for all markers
  const mapBounds = useMemo(() => {
    if (locationPeriods.length === 0) return null;
    
    const lats = locationPeriods.map(p => p.coordinates.lat);
    const lngs = locationPeriods.map(p => p.coordinates.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    
    const isWorldwide = lngSpan > 50 || latSpan > 50;
    const latPadding = Math.max(latSpan * 0.20, isWorldwide ? 5 : 2);
    const lngPadding = Math.max(lngSpan * 0.20, isWorldwide ? 10 : 2);
    
    const bounds = [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding]
    ] as [[number, number], [number, number]];
    
    console.log(`🗺️ Map bounds calculated for ${locationPeriods.length} locations:`, {
      bounds,
      isWorldwide,
      span: { lat: latSpan, lng: lngSpan }
    });
    
    return bounds;
  }, [locationPeriods]);

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

  const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
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
              {locationPeriods.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      setMapKey(prev => prev + 1);
                      console.log('🔄 Manual map refresh triggered');
                    }}
                    className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors whitespace-nowrap"
                    title="Refresh map to see updated locations"
                  >
                    🔄 Refresh Map
                  </button>
                  <div className="px-4 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg">
                    📍 {locationPeriods.length} location{locationPeriods.length !== 1 ? 's' : ''}
                  </div>
                </>
              )}
              <details className="px-4 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg cursor-pointer">
                <summary className="font-semibold">📊 Data Info</summary>
                <div className="absolute mt-2 p-3 bg-white border border-purple-200 rounded-lg shadow-lg z-50 text-left min-w-[250px]">
                  <p className="font-bold mb-2 text-purple-800">Current Data:</p>
                  <p>📍 Timeline events: {timelineEvents.length}</p>
                  <p>🌍 Geographic events: {timelineGeoEvents.length}</p>
                  <p>👥 Total contacts: {contacts.length}</p>
                  <p>📝 Contacts with notes: {contactsWithNotes.length}</p>
                  <p className="mt-2 pt-2 border-t border-purple-200">
                    <span className="font-bold">Map locations: {locationPeriods.length}</span>
                  </p>
                  <p className="text-xs text-purple-500 mt-2">
                    Timeline: {locationPeriods.filter(p => p.source === 'timeline').length}<br/>
                    Notes: {locationPeriods.filter(p => p.source === 'notes').length}
                  </p>
                  {Array.from(missingCitiesRef).length > 0 && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                      <p className="font-semibold text-orange-800 mb-1">⚠️ Missing Cities:</p>
                      <p className="text-orange-700">
                        {Array.from(missingCitiesRef).slice(0, 5).join(', ')}
                        {Array.from(missingCitiesRef).length > 5 && '...'}
                      </p>
                      <p className="text-orange-600 mt-1">
                        These cities were mentioned but not in database
                      </p>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>

          {locationPeriods.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 sm:p-8 text-center">
              <p className="text-purple-600 mb-4">
                No geographic locations found.
              </p>
              <p className="text-sm text-purple-500 mb-2">
                Add geographic events in your timeline (e.g., &quot;Moved to New York, NY&quot;) or mention locations in contact notes to see them on the map.
              </p>
              <p className="text-xs text-purple-400 mt-2">
                Supported cities: New York, Long Island, Montreal, San Francisco, Los Angeles, Chicago, Boston, Warsaw, Virginia Beach, Ottawa, Tampa, Rome, Berlin, Houston, Zurich, and more.
              </p>
              <div className="mt-4 p-3 bg-purple-50 rounded-lg text-left text-xs text-purple-600">
                <p className="font-semibold mb-2">Current Data Status:</p>
                <p>📍 Timeline events: {timelineEvents.length}</p>
                <p>🌍 Geographic events: {timelineGeoEvents.length}</p>
                <p>👥 Total contacts: {contacts.length}</p>
                <p>📝 Contacts with notes: {contactsWithNotes.length}</p>
                {contactsWithNotes.length === 0 && contacts.length > 0 && (
                  <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                    <p className="font-semibold text-orange-800 mb-1">💡 Tip:</p>
                    <p className="text-orange-700">
                      You have contacts but no notes yet. Go to &quot;View Chronicle&quot;, click on a contact, and add notes mentioning cities (e.g., &quot;Met in New York, NY&quot; or &quot;Lives in Berlin Germany&quot;) to see them on the map.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 mb-4 sm:mb-6 bg-gradient-to-br from-white to-purple-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-purple-600 mb-1">
                      Click on a city marker to see contacts associated with that location.
                    </p>
                    <p className="text-xs sm:text-sm text-purple-500">
                      Found {locationPeriods.length} location{locationPeriods.length !== 1 ? 's' : ''} ({locationPeriods.filter(p => p.source === 'timeline').length} from timeline, {locationPeriods.filter(p => p.source === 'notes').length} from notes)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden mb-4 sm:mb-6">
                <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] relative min-h-[400px]">
                  {locationPeriods.length > 0 && (
                    <MapContainer
                      key={`map-${mapKey}-${contactsHash.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '')}-${locationPeriods.length}`}
                      center={[mapCenter.lat, mapCenter.lng]}
                      zoom={locationPeriods.length === 1 ? 10 : 2}
                      minZoom={2}
                      maxZoom={18}
                      style={{ height: '100%', width: '100%', zIndex: 0 }}
                      whenReady={(e: any) => {
                        setMapReady(true);
                        console.log('🗺️ Map container ready with', locationPeriods.length, 'locations');
                        
                        setTimeout(() => {
                          try {
                            const L = require('leaflet');
                            if (!L) return;
                            
                            const map = e.target;
                            if (map && typeof map.fitBounds === 'function') {
                              mapInstanceRef.current = map;
                              
                              if (mapBounds && locationPeriods.length > 0) {
                                const leafletBounds = L.latLngBounds(mapBounds[0], mapBounds[1]);
                                const isWorldwide = Math.abs(mapBounds[1][1] - mapBounds[0][1]) > 50;
                                const padding = isWorldwide ? [150, 150] : [100, 100];
                                const maxZoomLevel = isWorldwide ? 10 : 12;
                                
                                map.fitBounds(leafletBounds, { 
                                  padding, 
                                  maxZoom: maxZoomLevel,
                                  animate: true 
                                });
                                
                                console.log(`🗺️ Map fitted to bounds for ${locationPeriods.length} markers`);
                                console.log(`   Bounds: [${mapBounds[0][0]}, ${mapBounds[0][1]}] to [${mapBounds[1][0]}, ${mapBounds[1][1]}]`);
                              }
                            }
                          } catch (error) {
                            console.error('❌ Error fitting map bounds:', error);
                          }
                        }, 300);
                      }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {locationPeriods.map((period, index) => {
                        const position: [number, number] = [period.coordinates.lat, period.coordinates.lng];
                        
                        // Validate coordinates
                        if (isNaN(position[0]) || isNaN(position[1]) || 
                            position[0] < -90 || position[0] > 90 || 
                            position[1] < -180 || position[1] > 180) {
                          console.error(`❌ Invalid coordinates for ${period.city}:`, position);
                          return null;
                        }
                        
                        const markerKey = `marker-${period.city.replace(/\s+/g, '-')}-${period.source}-${index}-${position[0]}-${position[1]}-${mapKey}`;
                        
                        console.log(`📍 [${index + 1}/${locationPeriods.length}] Rendering marker: ${period.city} at [${position[0]}, ${position[1]}]`);
                        
                        return (
                          <Marker
                            key={markerKey}
                            position={position}
                            eventHandlers={{
                              click: () => {
                                console.log('📍 Marker clicked:', period.city);
                                setSelectedLocation(period);
                              },
                              add: () => {
                                console.log(`✅ Marker ADDED to map: ${period.city} at [${position[0]}, ${position[1]}]`);
                              },
                            }}
                          >
                            <Popup>
                              <div className="p-2">
                                <h3 className="font-semibold text-purple-800 mb-1 capitalize">{period.city}</h3>
                                {period.source === 'timeline' && (
                                  <p className="text-xs text-purple-600 mb-2">
                                    {period.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                                    {period.endDate
                                      ? period.endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                      : 'Present'}
                                  </p>
                                )}
                                {period.source === 'notes' && (
                                  <p className="text-xs text-purple-600 mb-2">
                                    From contact notes
                                  </p>
                                )}
                                <p className="text-xs text-purple-500">
                                  {period.contacts.length} contact{period.contacts.length !== 1 ? 's' : ''} connected
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  )}
                </div>
              </div>

              {selectedLocation && (
                <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 sm:p-6 bg-gradient-to-br from-white to-purple-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-1 capitalize">
                        {selectedLocation.city}
                      </h2>
                      {selectedLocation.source === 'timeline' && (
                        <p className="text-sm text-purple-600">
                          {selectedLocation.startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -{' '}
                          {selectedLocation.endDate
                            ? selectedLocation.endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : 'Present'}
                        </p>
                      )}
                      {selectedLocation.source === 'notes' && (
                        <p className="text-sm text-purple-600">
                          Location mentioned in contact notes
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
                    <p className="text-purple-500 text-sm">
                      No contacts were added during this period.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-purple-700 mb-4">
                        Contacts connected during this period ({selectedLocation.contacts.length}):
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
                              <p className="text-xs text-purple-600 mb-1 truncate">
                                {contact.emailAddress}
                              </p>
                            )}
                            {contact.dateAdded && (
                              <p className="text-xs text-purple-500">
                                Connected: {contact.dateAdded}
                              </p>
                            )}
                            {contact.source && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                {contact.source}
                              </span>
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