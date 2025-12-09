'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useApp, Contact, TimelineEvent } from '../context/AppContext';

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

export default function MapPage() {
  const { timelineEvents, contacts } = useApp();
  const [selectedLocation, setSelectedLocation] = useState<LocationPeriod | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force map re-render when locations change
  const mapInstanceRef = useRef<any>(null); // Store map instance reference

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Track changes to contacts and timelineEvents to trigger map updates
  // Create a hash based on all contact notes to detect ANY note changes
  const contactsNotesHash = useMemo(() => {
    // Create hash from all contacts' notes - ANY change will trigger recalculation
    const notesHash = contacts.map(c => `${c.id}:${c.notes || ''}`).join('|');
    console.log('🔍 MAP PAGE: contactsNotesHash recalculated');
    console.log(`  📊 Contacts: ${contacts.length}`);
    console.log(`  📝 Contacts with notes: ${contacts.filter(c => c.notes && c.notes.trim()).length}`);
    return notesHash;
  }, [contacts]);

  // Track timeline events changes
  const timelineSerialized = useMemo(() => {
    const serialized = JSON.stringify(timelineEvents.map(e => ({
      id: e.id,
      geographicEvent: e.geographicEvent,
      monthYear: e.monthYear
    })));
    console.log('🔍 MAP PAGE: timelineSerialized recalculated');
    return serialized;
  }, [timelineEvents]);

  // Debug: Log when contacts prop changes
  useEffect(() => {
    console.log('🔍 MAP PAGE: contacts prop changed');
    console.log(`  📊 Contacts array reference:`, contacts);
    console.log(`  📊 Contacts array length: ${contacts.length}`);
    const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
    console.log(`  📝 Contacts with notes: ${contactsWithNotes.length}`);
    
    // Show sample notes to verify they're present
    if (contactsWithNotes.length > 0) {
      console.log(`  📝 Sample contact notes:`, contactsWithNotes.slice(0, 5).map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        notes: c.notes?.substring(0, 100)
      })));
    }
    
    // Search for common locations in notes
    const locationKeywords = ['new york', 'berlin', 'montreal', 'warsaw', 'rome', 'tampa', 'ottawa', 'virginia beach', 'houston'];
    locationKeywords.forEach(keyword => {
      const mentions = contacts.filter(c => 
        c.notes && c.notes.toLowerCase().includes(keyword)
      );
      if (mentions.length > 0) {
        console.log(`  🔍 Found ${mentions.length} contact(s) mentioning ${keyword}:`, mentions.map(c => ({
          name: `${c.firstName} ${c.lastName}`,
          notes: c.notes?.substring(0, 150)
        })));
      }
    });
  }, [contacts]);

  // Force map re-render when contacts or timeline changes
  // CRITICAL: This effect MUST run whenever contacts or their notes change
  useEffect(() => {
    console.log('🔄 MAP PAGE: Data change detected - forcing map update!');
    console.log(`  📊 Contacts array length: ${contacts.length}`);
    console.log(`  📊 Contacts array reference changed:`, contacts);
    const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
    console.log(`  📝 Contacts with notes: ${contactsWithNotes.length}`);
    console.log(`  📍 Timeline events with geographic: ${timelineEvents.filter(e => e.geographicEvent && e.geographicEvent.trim()).length}`);
    console.log(`  🔑 Contacts notes hash: ${contactsNotesHash.substring(0, 100)}...`);
    
    // Log sample of contacts with notes to verify they're present
    if (contactsWithNotes.length > 0) {
      console.log(`  📝 Sample contacts with notes:`, contactsWithNotes.slice(0, 3).map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        notesPreview: c.notes?.substring(0, 100)
      })));
    }
    
    // Check for Zurich specifically
    const zurichMentions = contacts.filter(c => 
      c.notes && c.notes.toLowerCase().includes('zurich')
    );
    if (zurichMentions.length > 0) {
      console.log(`  🇨🇭 Found ${zurichMentions.length} contact(s) mentioning Zurich:`, zurichMentions.map(c => ({
        name: `${c.firstName} ${c.lastName}`,
        notes: c.notes?.substring(0, 150)
      })));
    }
    
    // Check for Houston specifically
    const houstonMentions = contacts.filter(c => 
      c.notes && c.notes.toLowerCase().includes('houston')
    );
    if (houstonMentions.length > 0) {
      console.log(`  🌆 Found ${houstonMentions.length} contact(s) mentioning Houston:`, houstonMentions.map(c => ({
        name: `${c.firstName} ${c.lastName}`,
        notes: c.notes?.substring(0, 150)
      })));
    }
    
    // Force map re-render by updating key - this ensures map remounts and recalculates all locations
    setMapKey(prev => {
      const newKey = prev + 1;
      console.log(`  🗺️ Map key updated from ${prev} to ${newKey} - map will remount and recalculate all markers`);
      return newKey;
    });
  }, [contactsNotesHash, timelineSerialized, contacts]); // CRITICAL: Include full contacts array to detect ANY changes

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
  const extractLocation = (text: string): string | null => {
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
  };

  // Get coordinates for a city
  const getCityCoordinates = (cityName: string): { lat: number; lng: number } | null => {
    if (!cityName || !cityName.trim()) return null;
    
    const normalized = cityName.toLowerCase().trim();
    
    // Try exact match first
    if (cityCoordinates[normalized]) {
      return cityCoordinates[normalized];
    }
    
    // Try partial match (check if normalized contains any key or vice versa)
    for (const [key, coords] of Object.entries(cityCoordinates)) {
      const keyLower = key.toLowerCase();
      // Check if city name contains the key or key contains city name
      if (normalized === keyLower || 
          normalized.includes(keyLower) || 
          keyLower.includes(normalized) ||
          normalized.split(/\s+/).some(word => word.length >= 3 && keyLower.includes(word)) ||
          keyLower.split(/\s+/).some(word => word.length >= 3 && normalized.includes(word))) {
        return coords;
      }
    }
    
    return null;
  };

  // Parse date from MM/YYYY format
  const parseDate = (dateStr: string): Date | null => {
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
  };

  // Extract locations from contact notes - improved version
  const extractLocationsFromNotes = (contact: Contact): string[] => {
    if (!contact.notes || !contact.notes.trim()) return [];
    
    const locations: string[] = [];
    const noteText = contact.notes;
    const noteTextLower = noteText.toLowerCase();
    
    // Log for debugging - show what we're searching for
    console.log(`  🔍 Extracting locations from "${contact.firstName} ${contact.lastName}" notes:`, noteText.substring(0, 150));
    
    // Try to match ALL known city names in the notes
    for (const [cityKey, coords] of Object.entries(cityCoordinates)) {
      const cityKeyLower = cityKey.toLowerCase();
      const cityParts = cityKey.split(',');
      const cityName = cityParts[0].trim();
      const cityNameLower = cityName.toLowerCase();
      
      // Skip very short city names that might match accidentally
      if (cityName.length < 2 || (cityName.length === 2 && !cityKey.includes(','))) continue;
      
      // Check if the full city key appears in notes (e.g., "New York, NY", "Long Island, NY")
      if (noteTextLower.includes(cityKeyLower)) {
        if (!locations.some(loc => loc.toLowerCase() === cityKeyLower)) {
          locations.push(cityKey);
          continue; // Found full match, don't check city name separately
        }
      }
      
      // For multi-word city names, check more flexibly
      const cityWords = cityNameLower.split(/\s+/).filter(w => w.length >= 3);
      let allWordsFound = false;
      
      if (cityWords.length > 1) {
        // Multi-word city: check if all significant words appear
        const allWordsPresent = cityWords.every(word => noteTextLower.includes(word));
        if (allWordsPresent) {
          // Verify they appear close together (within 80 chars)
          const firstWordIndex = noteTextLower.indexOf(cityWords[0]);
          if (firstWordIndex !== -1) {
            const relevantSection = noteTextLower.substring(Math.max(0, firstWordIndex - 15), firstWordIndex + 80);
            if (relevantSection.includes(cityNameLower)) {
              allWordsFound = true;
            } else {
              // Try regex pattern match in full text (case-insensitive)
              const cityPattern = new RegExp(cityNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
              if (cityPattern.test(noteText)) {
                allWordsFound = true;
              }
            }
          }
        }
      } else {
        // Single word city (like "Ottawa") - use word boundary or check with context
        const escapedCityName = cityNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Try word boundary first
        const wordBoundaryPattern = new RegExp(`\\b${escapedCityName}\\b`, 'i');
        if (wordBoundaryPattern.test(noteText)) {
          allWordsFound = true;
        } else if (cityName.length >= 4) {
          // For cities 4+ chars (like Ottawa), also check if it appears with context
          // Look for "Ottawa CA" or "Ottawa, CA" or "Ottawa, Canada" patterns
          const withContextPattern = new RegExp(`${escapedCityName}\\s*[,]?\\s*([A-Z]{2}|[A-Z][a-z]+)`, 'i');
          if (withContextPattern.test(noteText)) {
            allWordsFound = true;
          }
          // Also check if city name appears standalone (word boundary)
          if (!allWordsFound && noteTextLower.includes(cityNameLower)) {
            // Check if it's not part of another word (like "Ottawa" in "Ottawaish")
            const beforeChar = noteTextLower.charAt(noteTextLower.indexOf(cityNameLower) - 1);
            const afterChar = noteTextLower.charAt(noteTextLower.indexOf(cityNameLower) + cityNameLower.length);
            if ((!beforeChar || !/[a-z]/.test(beforeChar)) && (!afterChar || !/[a-z]/.test(afterChar))) {
              allWordsFound = true;
            }
          }
        }
      }
      
      if (allWordsFound) {
        // Check if we already have this city
        const alreadyFound = locations.some(loc => {
          const locLower = loc.toLowerCase();
          return locLower === cityKeyLower || locLower === cityNameLower;
        });
        
        if (!alreadyFound) {
          locations.push(cityKey);
          console.log(`    ✅ Matched location: "${cityKey}" from notes`);
        }
      }
    }
    
    // Also try pattern matching for "City, State", "City State", "City, Country", "City Country", etc.
    // Pattern order matters - more specific patterns first
    // ENHANCED: More flexible patterns to catch more variations
    const patterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // "Berlin, Germany" or "New York, NY" or "Houston, Texas"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // "Berlin Germany" or "New York NY" or "Houston Texas" or "Virginia Beach VA" (space separated)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\b/g, // "New York, NY" or "New York NY" or "Houston TX" or "Ottawa CA" (2-letter code)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+City\b/gi, // "New York City"
      // Add pattern for "in City" or "at City" or "from City"
      /\b(?:in|at|from|to|near|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // "in Houston" or "at New York" or "from Berlin"
      // Add pattern for standalone capitalized city names (at least 3 chars)
      /\b([A-Z][a-z]{2,})\b/g, // Any capitalized word (potential city name)
    ];
    
    for (const pattern of patterns) {
      let match;
      // Reset regex lastIndex to avoid issues with global regex
      pattern.lastIndex = 0;
      while ((match = pattern.exec(noteText)) !== null) {
        if (match[1]) {
          let cityToCheck = match[1].trim();
          
          // Skip common non-city words that might be capitalized
          const skipWords = ['The', 'This', 'That', 'These', 'Those', 'There', 'Here', 'When', 'Where', 'What', 'Who', 'How', 'Why', 'First', 'Last', 'Next', 'Previous', 'Met', 'Meet', 'Worked', 'Work', 'Lived', 'Live', 'Moved', 'Move', 'Born', 'Grew', 'Studied', 'Study', 'Graduated', 'Attended', 'Joined', 'Left', 'Started', 'Ended', 'During', 'After', 'Before', 'Since', 'Until', 'With', 'Without', 'From', 'To', 'In', 'At', 'On', 'By', 'For', 'And', 'Or', 'But', 'Not', 'All', 'Some', 'Many', 'Most', 'Each', 'Every', 'Both', 'Either', 'Neither', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Year', 'Years', 'Month', 'Months', 'Week', 'Weeks', 'Day', 'Days', 'Today', 'Yesterday', 'Tomorrow'];
          if (skipWords.includes(cityToCheck)) continue;
          
          if (match[2]) {
            const secondPart = match[2].trim();
            
            // Check if match[2] is a state code (2 letters)
            if (secondPart.length === 2 && /^[A-Z]{2}$/.test(secondPart)) {
              const cityWithState = `${cityToCheck}, ${secondPart}`;
              const coords = getCityCoordinates(cityWithState);
              if (coords) {
                if (!locations.some(loc => loc.toLowerCase() === cityWithState.toLowerCase())) {
                  locations.push(cityWithState);
                  console.log(`  ✅ Pattern matched "${cityWithState}" from notes`);
                }
                continue;
              }
              // Also try without comma
              const cityWithStateNoComma = `${cityToCheck} ${secondPart}`;
              const coordsNoComma = getCityCoordinates(cityWithStateNoComma);
              if (coordsNoComma) {
                if (!locations.some(loc => loc.toLowerCase() === cityWithStateNoComma.toLowerCase())) {
                  locations.push(cityWithStateNoComma);
                  console.log(`  ✅ Pattern matched "${cityWithStateNoComma}" from notes`);
                }
                continue;
              }
            } else {
              // It's a country or state name (e.g., "Germany", "Poland", "Texas", "Florida")
              // Try both with and without comma
              const withComma = `${cityToCheck}, ${secondPart}`;
              const withoutComma = `${cityToCheck} ${secondPart}`;
              
              // Check with comma first
              const coordsWithComma = getCityCoordinates(withComma);
              if (coordsWithComma) {
                if (!locations.some(loc => loc.toLowerCase() === withComma.toLowerCase())) {
                  locations.push(withComma);
                  console.log(`  ✅ Pattern matched "${withComma}" from notes`);
                }
                continue;
              }
              
              // Check without comma
              const coordsWithoutComma = getCityCoordinates(withoutComma);
              if (coordsWithoutComma) {
                if (!locations.some(loc => loc.toLowerCase() === withoutComma.toLowerCase())) {
                  locations.push(withoutComma);
                  console.log(`  ✅ Pattern matched "${withoutComma}" from notes`);
                }
                continue;
              }
            }
            
            // Also try just the city name if combo didn't work
            const coordsCity = getCityCoordinates(cityToCheck);
            if (coordsCity) {
              if (!locations.some(loc => loc.toLowerCase() === cityToCheck.toLowerCase())) {
                locations.push(cityToCheck);
                console.log(`  ✅ Pattern matched "${cityToCheck}" from notes`);
              }
              continue;
            }
          } else {
            // Single city name (from "in City" pattern or standalone)
            // Try the city name
            const coords = getCityCoordinates(cityToCheck);
            if (coords) {
              if (!locations.some(loc => loc.toLowerCase() === cityToCheck.toLowerCase())) {
                locations.push(cityToCheck);
                console.log(`  ✅ Pattern matched "${cityToCheck}" from notes`);
              }
            } else {
              // Try lowercase version
              const coordsLower = getCityCoordinates(cityToCheck.toLowerCase());
              if (coordsLower) {
                if (!locations.some(loc => loc.toLowerCase() === cityToCheck.toLowerCase())) {
                  locations.push(cityToCheck.toLowerCase());
                  console.log(`  ✅ Pattern matched "${cityToCheck.toLowerCase()}" (lowercase) from notes`);
                }
              }
            }
          }
        }
      }
    }
    
    // Final logging - show what locations were found
    if (locations.length > 0) {
      console.log(`  📍 Extracted ${locations.length} location(s) from "${contact.firstName} ${contact.lastName}":`, locations);
    } else {
      console.log(`  ⚠️ No locations extracted from "${contact.firstName} ${contact.lastName}" notes. Note text: "${noteText.substring(0, 200)}"`);
      // Log all known city names for debugging
      const knownCities = Object.keys(cityCoordinates).slice(0, 20); // Show first 20
      console.log(`  💡 Known cities include:`, knownCities.join(', '));
    }
    
    return locations;
  };

  // Build location periods from timeline events
  const locationPeriodsFromTimeline = useMemo(() => {
    console.log('🔍 RECALCULATING: locationPeriodsFromTimeline');
    console.log(`  - Timeline events: ${timelineEvents.length}`);
    
    const periods: LocationPeriod[] = [];
    
    // Extract geographic events with dates
    const geoEvents = timelineEvents
      .filter(event => event.geographicEvent && event.geographicEvent.trim())
      .map(event => ({
        ...event,
        date: parseDate(event.monthYear),
      }))
      .filter(event => event.date)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());
    
    console.log(`  - Geographic events found: ${geoEvents.length}`);
    
    // Build periods (from one move to the next)
    for (let i = 0; i < geoEvents.length; i++) {
      const event = geoEvents[i];
      const locationName = extractLocation(event.geographicEvent!);
      
      if (!locationName) {
        console.log(`  ⚠️ Could not extract location from: "${event.geographicEvent}"`);
        continue;
      }
      
      const coordinates = getCityCoordinates(locationName);
      if (!coordinates) {
        console.log(`  ⚠️ No coordinates found for: "${locationName}"`);
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
    
    // Match contacts to location periods based on dateAdded
    // CRITICAL: Create new period objects with new contacts arrays (don't mutate!)
    const periodsWithContacts = periods.map(period => {
      const matchedContacts = contacts.filter(contact => {
        if (!contact.dateAdded) return false;
        
        const contactDate = parseDate(contact.dateAdded);
        if (!contactDate) return false;
        
        const isAfterStart = contactDate >= period.startDate;
        const isBeforeEnd = period.endDate ? contactDate < period.endDate : true;
        
        return isAfterStart && isBeforeEnd;
      });
      
      // Return NEW object with new contacts array
      return {
        ...period,
        contacts: matchedContacts, // New array reference
      };
    });
    
    console.log(`  ✅ Created ${periodsWithContacts.length} timeline location periods`);
    // Return NEW array to ensure React detects changes
    return [...periodsWithContacts];
  }, [timelineEvents, contacts]);

  // Build location markers from contact notes
  // CRITICAL: Always create new arrays/objects to ensure React detects changes
  // CRITICAL: Directly depend on contacts array - if contacts reference changes, recalculate!
  const locationMarkersFromNotes = useMemo(() => {
    console.log('🔍 RECALCULATING: locationMarkersFromNotes');
    console.log(`  - Contacts array reference:`, contacts);
    console.log(`  - Total contacts: ${contacts.length}`);
    const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
    console.log(`  - Contacts with notes: ${contactsWithNotes.length}`);
    console.log(`  - Contacts with notes IDs:`, contactsWithNotes.map(c => c.id));
    
    const locationMap = new Map<string, { coordinates: { lat: number; lng: number }; contacts: Contact[]; displayName: string }>();
    
    let processedCount = 0;
    let locationsFoundCount = 0;
    
    // Process each contact's notes
    contacts.forEach(contact => {
      if (!contact.notes || !contact.notes.trim()) return;
      
      processedCount++;
      
      // Check specifically for Zurich in notes for debugging
      if (contact.notes.toLowerCase().includes('zurich') || contact.notes.toLowerCase().includes('zürich')) {
        console.log(`  🇨🇭 FOUND ZURICH in ${contact.firstName} ${contact.lastName}'s notes:`, contact.notes);
      }
      
      // Extract locations from notes
      const locations = extractLocationsFromNotes(contact);
      
      if (locations.length > 0) {
        locationsFoundCount += locations.length;
        console.log(`  📍 Contact ${contact.firstName} ${contact.lastName}: Found ${locations.length} location(s):`, locations);
        
        // Check if Zurich was found in locations
        if (locations.some(loc => loc.toLowerCase().includes('zurich'))) {
          console.log(`  ✅✅✅ ZURICH DETECTED in locations for ${contact.firstName} ${contact.lastName}!!!`);
        }
        
        // Check if Houston was found in locations
        if (locations.some(loc => loc.toLowerCase().includes('houston'))) {
          console.log(`  ✅✅✅ HOUSTON DETECTED in locations for ${contact.firstName} ${contact.lastName}!!!`);
        }
        
        locations.forEach(locationName => {
          const coordinates = getCityCoordinates(locationName);
          if (!coordinates) {
            console.warn(`⚠️ No coordinates found for location: "${locationName}" in contact ${contact.firstName} ${contact.lastName}`);
            console.warn(`   Note snippet: "${contact.notes?.substring(0, 100)}..."`);
            return;
          }
          
          // Use coordinates as key for deduplication
          const coordKey = `${coordinates.lat.toFixed(4)}_${coordinates.lng.toFixed(4)}`;
          const normalizedCity = locationName.toLowerCase().trim();
          
          if (!locationMap.has(coordKey)) {
            // Create new array for contacts
            locationMap.set(coordKey, {
              coordinates,
              contacts: [], // New array
              displayName: locationName, // Preserve original casing
            });
            console.log(`  ✅ Found new location: ${locationName} at [${coordinates.lat}, ${coordinates.lng}]`);
          }
          
          const locationData = locationMap.get(coordKey)!;
          // Only add contact if not already added - but create new array instead of mutating
          if (!locationData.contacts.find(c => c.id === contact.id)) {
            locationData.contacts = [...locationData.contacts, contact]; // Create new array
          }
        });
      }
    });
    
    console.log(`  📊 Processed ${processedCount} contacts with notes, found ${locationsFoundCount} location mentions`);
    
    // Convert map to array of LocationPeriods - CREATE NEW OBJECTS
    const periods: LocationPeriod[] = [];
    locationMap.forEach((data, coordKey) => {
      // Find if there's a timeline period for this city to get dates
      const timelinePeriod = locationPeriodsFromTimeline.find(
        p => Math.abs(p.coordinates.lat - data.coordinates.lat) < 0.01 && 
             Math.abs(p.coordinates.lng - data.coordinates.lng) < 0.01
      );
      
      // Create NEW LocationPeriod object with new contacts array
      periods.push({
        city: data.displayName,
        startDate: timelinePeriod?.startDate || new Date(2000, 0, 1),
        endDate: timelinePeriod?.endDate || null,
        coordinates: { ...data.coordinates }, // New object
        contacts: [...data.contacts], // New array reference
        source: 'notes',
      });
    });
    
    console.log(`  🎯 Created ${periods.length} location markers from notes`);
    
    // Log all locations found for debugging
    if (periods.length > 0) {
      console.log(`  📍 All locations found:`, periods.map(p => `${p.city} [${p.coordinates.lat}, ${p.coordinates.lng}] - ${p.contacts.length} contacts`));
    } else {
      console.log(`  ⚠️ No locations found from notes!`);
    }
    
    // Return NEW array to ensure React detects changes
    const result = [...periods];
    console.log(`  ✅ Returning ${result.length} location markers`);
    return result;
  }, [contacts, contactsNotesHash, locationPeriodsFromTimeline]); // CRITICAL: contacts, contactsNotesHash as dependencies - will recalculate when ANY contact note changes

  // Combine both timeline and notes locations - deduplicate by coordinates
  // CRITICAL: Always create new objects/arrays to ensure React detects changes
  const locationPeriods = useMemo(() => {
    console.log('🔍 RECALCULATING: locationPeriods (combining timeline and notes)');
    const combined: LocationPeriod[] = [];
    const coordinateMap = new Map<string, LocationPeriod>();
    
    // Helper to create coordinate key
    const getCoordKey = (lat: number, lng: number) => `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // First, add all timeline locations
    locationPeriodsFromTimeline.forEach(timelineLoc => {
      const coordKey = getCoordKey(timelineLoc.coordinates.lat, timelineLoc.coordinates.lng);
      const existing = coordinateMap.get(coordKey);
      
      if (existing) {
        // Merge contacts if same coordinates - CREATE NEW ARRAY, don't mutate!
        const mergedContacts = [...existing.contacts];
        timelineLoc.contacts.forEach(contact => {
          if (!mergedContacts.find(c => c.id === contact.id)) {
            mergedContacts.push(contact);
          }
        });
        
        // Create NEW object instead of mutating existing
        const updated: LocationPeriod = {
          ...existing,
          contacts: mergedContacts, // New array reference
          source: timelineLoc.source === 'timeline' ? 'timeline' : existing.source,
          city: timelineLoc.source === 'timeline' ? timelineLoc.city : existing.city,
        };
        
        // Replace in map and find in combined array to update
        coordinateMap.set(coordKey, updated);
        const index = combined.findIndex(loc => 
          getCoordKey(loc.coordinates.lat, loc.coordinates.lng) === coordKey
        );
        if (index !== -1) {
          combined[index] = updated; // Replace with new object
        }
      } else {
        // Create a NEW object copy (don't use reference directly)
        const newLoc: LocationPeriod = {
          ...timelineLoc,
          contacts: [...timelineLoc.contacts], // New array
        };
        combined.push(newLoc);
        coordinateMap.set(coordKey, newLoc);
      }
    });
    
    // Then, add notes-based locations (merge if same coordinates exist)
    locationMarkersFromNotes.forEach(notesLocation => {
      const coordKey = getCoordKey(notesLocation.coordinates.lat, notesLocation.coordinates.lng);
      const existing = coordinateMap.get(coordKey);
      
      if (existing) {
        // Merge contacts from notes into existing location - CREATE NEW ARRAY
        const mergedContacts = [...existing.contacts];
        notesLocation.contacts.forEach(contact => {
          if (!mergedContacts.find(c => c.id === contact.id)) {
            mergedContacts.push(contact);
          }
        });
        
        // Create NEW object instead of mutating
        const updated: LocationPeriod = {
          ...existing,
          contacts: mergedContacts, // New array reference
        };
        
        // Replace in map and find in combined array to update
        coordinateMap.set(coordKey, updated);
        const index = combined.findIndex(loc => 
          getCoordKey(loc.coordinates.lat, loc.coordinates.lng) === coordKey
        );
        if (index !== -1) {
          combined[index] = updated; // Replace with new object
        }
      } else {
        // Create a NEW object copy
        const newLoc: LocationPeriod = {
          ...notesLocation,
          contacts: [...notesLocation.contacts], // New array
        };
        combined.push(newLoc);
        coordinateMap.set(coordKey, newLoc);
      }
    });
    
    const locationsSummary = combined.map(l => `${l.city} [${l.coordinates.lat}, ${l.coordinates.lng}] - ${l.contacts.length} contacts`);
    console.log(`✅ Combined ${combined.length} unique locations (deduplicated by coordinates):`, locationsSummary);
    console.log(`📍 Full location details:`, combined);
    
    // Return a NEW array reference to ensure React detects the change
    return [...combined];
  }, [locationPeriodsFromTimeline, locationMarkersFromNotes]);

  
  // Effect to log when locationPeriods changes (for debugging)
  useEffect(() => {
    console.log(`🗺️ ===== LOCATION PERIODS UPDATED =====`);
    console.log(`  📍 locationPeriods array reference:`, locationPeriods);
    console.log(`  📍 Total locations: ${locationPeriods.length}`);
    console.log(`  📍 Map key: ${mapKey}`);
    if (locationPeriods.length > 0) {
      const locationsList = locationPeriods.map(l => `${l.city} [${l.source}] at [${l.coordinates.lat}, ${l.coordinates.lng}] (${l.contacts.length} contacts)`);
      console.log(`  📍 Current locations:`, locationsList);
      console.log(`  📍 All coordinates:`, locationPeriods.map(l => [l.coordinates.lat, l.coordinates.lng]));
      
      // Show which contacts are associated with each location
      locationPeriods.forEach(loc => {
        if (loc.contacts.length > 0) {
          console.log(`  📍 Location "${loc.city}" has ${loc.contacts.length} contacts:`, loc.contacts.map(c => `${c.firstName} ${c.lastName}`));
        }
      });
    } else {
      console.log(`  ⚠️ No locations found!`);
      console.log(`  - Contacts total: ${contacts.length}`);
      const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
      console.log(`  - Contacts with notes: ${contactsWithNotes.length}`);
      if (contactsWithNotes.length > 0) {
        console.log(`  - Sample notes:`, contactsWithNotes.slice(0, 3).map(c => ({
          name: `${c.firstName} ${c.lastName}`,
          notes: c.notes?.substring(0, 100)
        })));
      }
      console.log(`  - Timeline events: ${timelineEvents.length}`);
      console.log(`  - Timeline with geographic: ${timelineEvents.filter(e => e.geographicEvent && e.geographicEvent.trim()).length}`);
    }
    console.log(`🗺️ ====================================`);
  }, [locationPeriods, contacts, timelineEvents, mapKey]); // Include mapKey to see when it changes

  // Calculate center of all locations for initial map view
  const mapCenter = useMemo(() => {
    if (locationPeriods.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // Center of USA
    }
    
    const avgLat = locationPeriods.reduce((sum, p) => sum + p.coordinates.lat, 0) / locationPeriods.length;
    const avgLng = locationPeriods.reduce((sum, p) => sum + p.coordinates.lng, 0) / locationPeriods.length;
    
    return { lat: avgLat, lng: avgLng };
  }, [locationPeriods]);

  // Calculate bounds to include all markers with proper padding
  const mapBounds = useMemo(() => {
    if (locationPeriods.length === 0) return null;
    
    const lats = locationPeriods.map(p => p.coordinates.lat);
    const lngs = locationPeriods.map(p => p.coordinates.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Calculate actual span
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    
    // Add padding to bounds (20% on each side, minimum 3 degrees for worldwide, 2 degrees for regional)
    // For worldwide spread (like Warsaw + North America), use larger padding
    const isWorldwide = lngSpan > 50 || latSpan > 50;
    const latPadding = Math.max(latSpan * 0.20, isWorldwide ? 5 : 2);
    const lngPadding = Math.max(lngSpan * 0.20, isWorldwide ? 10 : 2);
    
    const bounds = [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding]
    ] as [[number, number], [number, number]];
    
    console.log(`🗺️ Map bounds calculated:`, {
      minLat: bounds[0][0],
      maxLat: bounds[1][0],
      minLng: bounds[0][1],
      maxLng: bounds[1][1],
      latSpan: latSpan + (latPadding * 2),
      lngSpan: lngSpan + (lngPadding * 2),
      isWorldwide,
      locations: locationPeriods.length
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
              {/* Debug info button - always show to help diagnose production issues */}
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
                  {contactsWithNotes.length > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ You have {contactsWithNotes.length} contact{contactsWithNotes.length !== 1 ? 's' : ''} with notes
                    </p>
                  )}
                  {contactsWithNotes.length === 0 && contacts.length > 0 && (
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ No contacts have notes. Add notes mentioning cities to see more locations on the map.
                    </p>
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
                Supported cities: New York, Long Island, Montreal, San Francisco, Los Angeles, Chicago, Boston, Warsaw, Virginia Beach, Ottawa, Tampa, Rome, Berlin, and more.
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
                      You have contacts but no notes yet. Go to "View Chronicle", click on a contact, and add notes mentioning cities (e.g., "Met in New York, NY" or "Lives in Berlin Germany") to see them on the map.
                    </p>
                  </div>
                )}
                {contacts.length === 0 && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="font-semibold text-blue-800 mb-1">💡 Tip:</p>
                    <p className="text-blue-700">
                      You don't have any contacts yet. Go to "Upload Contacts" to import your contacts from LinkedIn or Google.
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
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-purple-400 mt-1">
                        Debug: {contacts.length} contacts, {contacts.filter(c => c.notes && c.notes.trim()).length} with notes
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden mb-4 sm:mb-6">
                <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] relative min-h-[400px]">
                  {locationPeriods.length > 0 && (
                    <MapContainer
                      key={`map-${mapKey}-${contactsNotesHash.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '')}-${locationPeriods.length}-${contacts.filter(c => c.notes && c.notes.trim()).length}-${Date.now()}`}
                      center={[mapCenter.lat, mapCenter.lng]}
                      zoom={locationPeriods.length === 1 ? 10 : 2}
                      minZoom={2}
                      maxZoom={18}
                      style={{ height: '100%', width: '100%', zIndex: 0 }}
                      whenReady={() => {
                        setMapReady(true);
                        console.log('🗺️ Map container ready with', locationPeriods.length, 'locations');
                        
                        // Access map instance via DOM element
                        setTimeout(() => {
                          try {
                            const L = require('leaflet');
                            if (!L) return;
                            
                            // Find the map container element
                            const mapElement = document.querySelector('.leaflet-container') as any;
                            if (!mapElement) return;
                            
                            // Get map instance from Leaflet's internal registry
                            const maps = (L.Map as any)?._instances;
                            if (maps && maps.size > 0) {
                              const map = Array.from(maps.values())[maps.size - 1] as any;
                              if (map && typeof map.fitBounds === 'function') {
                                mapInstanceRef.current = map;
                                
                                // Fit bounds to show all markers
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
                                  console.log(`   Current zoom: ${map.getZoom()}`);
                                }
                              }
                            }
                          } catch (error) {
                            console.error('❌ Error accessing map in whenReady:', error);
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
                        
                        // Validate coordinates - only reject if truly invalid (NaN or out of valid range)
                        if (isNaN(position[0]) || isNaN(position[1]) || 
                            position[0] < -90 || position[0] > 90 || 
                            position[1] < -180 || position[1] > 180) {
                          console.error(`❌ Invalid coordinates for ${period.city}:`, position);
                          return null;
                        }
                        
                        const markerKey = `marker-${period.city.replace(/\s+/g, '-')}-${period.source}-${index}-${position[0]}-${position[1]}`;
                        
                        // Log each marker being rendered
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
                                console.log(`✅ Marker ADDED: ${period.city} at [${position[0]}, ${position[1]}]`);
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
