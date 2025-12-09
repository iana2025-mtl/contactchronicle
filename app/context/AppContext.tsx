'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface TimelineEvent {
  id: string;
  monthYear: string;
  professionalEvent?: string;
  personalEvent?: string;
  geographicEvent?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress?: string;
  phoneNumber?: string;
  linkedInProfile?: string;
  dateAdded?: string;
  dateEdited?: string;
  source?: string;
  notes?: string;
}

interface AppContextType {
  timelineEvents: TimelineEvent[];
  contacts: Contact[];
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateTimelineEvent: (id: string, event: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  addContacts: (newContacts: Contact[]) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  updateMultipleContacts: (updates: Array<{ id: string; contact: Partial<Contact> }>) => void;
  deleteContact: (id: string) => void;
  initializeTimeline: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const initializeTimelineData = () => {
    const timestamp = Date.now();
    
    // Iana Ribnicova's actual resume timeline
    const initialEvents: TimelineEvent[] = [
      {
        id: `init-${timestamp}-0`,
        monthYear: '12/2018',
        professionalEvent: '**Financial Analyst** at WEILL CORNELL MEDICINE\n• Prepared $1M monthly supplemental compensation schedules based on physician performance\n• Reconciled $1.2M monthly operational expenses\n• Assisted in $14M annual operating budget preparation\n• Managed payroll for 200 employees on bi-weekly basis\n• Partnered with billing, compliance, finance, and accounting teams',
      },
      {
        id: `init-${timestamp}-1`,
        monthYear: '02/2020',
        professionalEvent: '**Senior Financial Analyst** at WEILL CORNELL MEDICINE\n• Optimized budgets across multiple departments, saving 3.2% in costs (malpractice, audit fees, practice expenses)\n• Oversaw $4M in journal entries with thorough GAAP knowledge\n• Conducted P&L analysis and created financial modeling to optimize resource allocation\n• Streamlined reports in SAP and Cognos: reduced monthly report time from 8 hours to 2 hours\n• Analyzed key financial metrics (gross margin, net profit margin, operating expenses)',
      },
      {
        id: `init-${timestamp}-2`,
        monthYear: '04/2022',
        professionalEvent: '**Financial Manager** at WEILL CORNELL MEDICINE\n• Manage $45M budget with financial planning initiatives resulting in 4.5% margin growth\n• Achieved 8.2% reduction in divisional operating costs through cost-saving measures\n• Increased hospital support usage by 7.7% by reallocating funds to finance physician salaries\n• Generated 3.3% increase in work RVU performance through comprehensive financial reporting\n• Present financial performance updates to senior management using SAP and Cognos',
      },
      {
        id: `init-${timestamp}-3`,
        monthYear: '08/2016',
        professionalEvent: '**Master of Business Administration** - Goldey Beacom College, Wilmington, DE',
      },
      {
        id: `init-${timestamp}-4`,
        monthYear: '06/2014',
        professionalEvent: '**Bachelor\'s Degree in International Relations** - University of Political Science and International Relations, Moldova',
      },
      {
        id: `init-${timestamp}-5`,
        monthYear: '08/2018',
        geographicEvent: 'Moved to New York, NY',
      },
    ];

    // Sort events by date
    const sortedEvents = initialEvents.sort((a, b) => {
      const [monthA, yearA] = a.monthYear.split('/');
      const [monthB, yearB] = b.monthYear.split('/');
      const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1);
      const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1);
      return dateA.getTime() - dateB.getTime();
    });

    setTimelineEvents(sortedEvents);
  };

  // Load from localStorage on mount or when user changes
  useEffect(() => {
    if (!user) {
      setTimelineEvents([]);
      setContacts([]);
      setIsDataLoaded(false);
      return;
    }

    setIsDataLoaded(false);
    const timelineKey = `contactChronicle_timeline_${user.id}`;
    const contactsKey = `contactChronicle_contacts_${user.id}`;
    const initializedKey = `contactChronicle_initialized_${user.id}`;
    
    const savedTimeline = localStorage.getItem(timelineKey);
    const savedContacts = localStorage.getItem(contactsKey);
    const hasInitialized = localStorage.getItem(initializedKey);
    
    if (savedTimeline) {
      try {
        const parsedTimeline = JSON.parse(savedTimeline);
        setTimelineEvents(parsedTimeline);
      } catch (error) {
        console.error('Error parsing timeline data:', error);
        if (!hasInitialized) {
          initializeTimelineData();
          localStorage.setItem(initializedKey, 'true');
        }
      }
    } else if (!hasInitialized) {
      // Initialize with actual resume data for new users
      initializeTimelineData();
      localStorage.setItem(initializedKey, 'true');
    }
    
    if (savedContacts) {
      try {
        const parsedContacts = JSON.parse(savedContacts);
        setContacts(parsedContacts);
      } catch (error) {
        console.error('Error parsing contacts data:', error);
        setContacts([]);
      }
    } else {
      setContacts([]);
    }
    
    // Mark data as loaded to allow saves
    setIsDataLoaded(true);
  }, [user]);

  // Save to localStorage whenever state changes (only after initial load)
  useEffect(() => {
    if (user && isDataLoaded) {
      const timelineKey = `contactChronicle_timeline_${user.id}`;
      try {
        localStorage.setItem(timelineKey, JSON.stringify(timelineEvents));
      } catch (error) {
        console.error('Error saving timeline data:', error);
      }
    }
  }, [timelineEvents, user, isDataLoaded]);

  useEffect(() => {
    if (user && isDataLoaded) {
      const contactsKey = `contactChronicle_contacts_${user.id}`;
      try {
        // Log before saving to verify notes are in the contacts array
        const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
        if (contactsWithNotes.length > 0) {
          console.log(`💾 AUTO-SAVE: Saving ${contacts.length} contacts, ${contactsWithNotes.length} with notes`);
        }
        localStorage.setItem(contactsKey, JSON.stringify(contacts));
        
        // Verify what was saved
        const savedJson = localStorage.getItem(contactsKey);
        if (savedJson) {
          const savedContacts: Contact[] = JSON.parse(savedJson);
          const savedWithNotes = savedContacts.filter(c => c.notes && c.notes.trim());
          if (savedWithNotes.length !== contactsWithNotes.length) {
            console.error(`⚠️ WARNING: Notes count mismatch! Before save: ${contactsWithNotes.length}, After save: ${savedWithNotes.length}`);
          }
        }
      } catch (error) {
        console.error('Error saving contacts data:', error);
      }
    }
  }, [contacts, user, isDataLoaded]);

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: Date.now().toString(),
    };
    setTimelineEvents([...timelineEvents, newEvent].sort((a, b) => {
      const [monthA, yearA] = a.monthYear.split('/');
      const [monthB, yearB] = b.monthYear.split('/');
      const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1);
      const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1);
      return dateA.getTime() - dateB.getTime();
    }));
  };

  const updateTimelineEvent = (id: string, event: Partial<TimelineEvent>) => {
    setTimelineEvents(timelineEvents.map(e => e.id === id ? { ...e, ...event } : e));
  };

  const deleteTimelineEvent = (id: string) => {
    setTimelineEvents(timelineEvents.filter(e => e.id !== id));
  };

  const addContacts = (newContacts: Contact[]) => {
    const contactsWithIds = newContacts.map(contact => ({
      ...contact,
      id: contact.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }));
    const updatedContacts = [...contacts, ...contactsWithIds];
    setContacts(updatedContacts);
    
    // Immediately save to localStorage if user is logged in and data is loaded
    if (user && isDataLoaded) {
      const contactsKey = `contactChronicle_contacts_${user.id}`;
      try {
        localStorage.setItem(contactsKey, JSON.stringify(updatedContacts));
      } catch (error) {
        console.error('Error saving contacts immediately:', error);
      }
    }
  };

  const updateContact = (id: string, contact: Partial<Contact>) => {
    // Log stack trace to see WHERE this is being called from
    console.log('📝 CONTEXT: updateContact called');
    console.log(`  - Contact ID: ${id}`);
    console.log(`  - Updated fields:`, Object.keys(contact));
    console.log(`  - Full update object:`, contact);
    console.trace('📝 CALL STACK for updateContact:');
    if (contact.notes) {
      console.log(`  - New notes value: "${contact.notes}"`);
      console.log(`  - Notes length: ${contact.notes.length}`);
    } else {
      console.log(`  - ⚠️ WARNING: contact.notes is undefined/null/empty!`);
      console.log(`  - contact object:`, JSON.stringify(contact, null, 2));
    }
    
    // Find the existing contact
    const existingContact = contacts.find(c => c.id === id);
    if (existingContact) {
      console.log(`  - Existing contact notes: "${existingContact.notes || 'none'}"`);
    }
    
    console.log(`  - Current contacts array length: ${contacts.length}`);
    
    // Create a COMPLETELY NEW array (not just mapped, but spread to ensure new reference)
    const updatedContacts = [...contacts.map(c => {
      if (c.id === id) {
        // CRITICAL: Preserve notes field explicitly - don't let undefined overwrite existing notes
        const updated = { 
          ...c, 
          ...contact,
          // Explicitly preserve notes if it's in the contact update, otherwise keep existing
          notes: contact.notes !== undefined ? contact.notes : c.notes
        };
        console.log(`  - Merged contact object:`, updated);
        console.log(`  - Contact update had notes:`, contact.notes ? `"${contact.notes.substring(0, 50)}..."` : 'NO');
        console.log(`  - Original contact had notes:`, c.notes ? `"${c.notes.substring(0, 50)}..."` : 'NO');
        if (updated.notes) {
          console.log(`  - ✅ Merged contact HAS notes: "${updated.notes.substring(0, 100)}..."`);
        } else {
          console.log(`  - ❌ Merged contact MISSING notes!`);
          console.log(`  - Contact update object keys:`, Object.keys(contact));
          console.log(`  - 'notes' in contact:`, 'notes' in contact);
        }
        return updated;
      }
      return c;
    })];
    
    console.log(`  - Contacts before update: ${contacts.length}`);
    console.log(`  - Contacts after update: ${updatedContacts.length}`);
    console.log(`  - Reference changed: ${contacts !== updatedContacts}`);
    
    // Verify the update actually happened
    const updatedContact = updatedContacts.find(c => c.id === id);
    if (updatedContact) {
      console.log(`  - Updated contact in array:`, {
        id: updatedContact.id,
        name: `${updatedContact.firstName} ${updatedContact.lastName}`,
        hasNotes: !!updatedContact.notes,
        notesValue: updatedContact.notes || 'undefined/null',
        notesLength: updatedContact.notes?.length || 0
      });
      if (updatedContact.notes) {
        console.log(`  ✅ Verified updated contact has notes: "${updatedContact.notes.substring(0, 50)}..."`);
      } else {
        console.log(`  ❌ ERROR: Updated contact missing notes field!`);
      }
    } else {
      console.log(`  ❌ ERROR: Could not find updated contact in array!`);
    }
    
    // CRITICAL: Set state with new array reference
    setContacts(updatedContacts);
    
    console.log(`  ✅ setContacts called with new array`);
    
    // Immediately save to localStorage if user is logged in and data is loaded
    if (user && isDataLoaded) {
      const contactsKey = `contactChronicle_contacts_${user.id}`;
      try {
        localStorage.setItem(contactsKey, JSON.stringify(updatedContacts));
        console.log(`  ✅ Saved to localStorage`);
        
        // Verify what was actually saved
        const savedJson = localStorage.getItem(contactsKey);
        if (savedJson) {
          const savedContacts = JSON.parse(savedJson);
          const savedContact = savedContacts.find((c: Contact) => c.id === id);
          if (savedContact) {
            console.log(`  - Saved contact notes in localStorage:`, savedContact.notes ? `"${savedContact.notes.substring(0, 50)}..."` : 'MISSING!');
          }
        }
      } catch (error) {
        console.error('Error saving contacts immediately:', error);
      }
    }
  };

  const updateMultipleContacts = (updates: Array<{ id: string; contact: Partial<Contact> }>) => {
    console.log(`\n🚨🚨🚨 BATCH UPDATE CALLED 🚨🚨🚨`);
    console.log(`📦 BATCH UPDATE: Updating ${updates.length} contacts`);
    console.log(`🚨🚨🚨 THIS IS THE BATCH UPDATE FUNCTION 🚨🚨🚨\n`);
    
    // Create update map for faster lookup
    const updateMap = new Map<string, Partial<Contact>>();
    updates.forEach(({ id, contact }) => {
      console.log(`  - Will update ${id}:`, {
        hasNotes: !!contact.notes,
        notesPreview: contact.notes ? contact.notes.substring(0, 50) : 'none',
        allFields: Object.keys(contact)
      });
      updateMap.set(id, contact);
    });
    
    // Apply all updates in a single state change
    const updatedContacts = contacts.map(c => {
      const update = updateMap.get(c.id);
      if (update) {
        // Merge update, explicitly preserving notes
        // CRITICAL: Check if 'notes' key exists in update object and has a value
        let notesValue: string | undefined = undefined;
        if ('notes' in update && update.notes !== undefined && update.notes !== null) {
          // Update object has notes field with a value - use it
          notesValue = update.notes;
        } else if (c.notes !== undefined) {
          // Update doesn't have notes or notes is undefined/null, but existing contact does - keep existing
          notesValue = c.notes;
        }
        // If neither has notes, notesValue stays undefined
        
        const merged: Contact = {
          ...c,
          ...update,
          // CRITICAL: Explicitly set notes field - only if we have a value, otherwise preserve existing
          notes: notesValue !== undefined ? notesValue : c.notes,
          id: c.id // Always preserve original ID
        };
        
        if (merged.notes && merged.notes.trim()) {
          console.log(`  ✅ Merged contact ${c.id} HAS notes: "${merged.notes.substring(0, 50)}..."`);
        } else {
          console.log(`  ⚠️ Merged contact ${c.id} has no notes`);
        }
        
        return merged;
      }
      return c;
    });
    
    // Add any new contacts from updates (shouldn't happen, but handle it)
    const newContacts: Contact[] = [];
    updates.forEach(({ id, contact }) => {
      if (!contacts.find(c => c.id === id)) {
        newContacts.push({
          ...contact,
          id,
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
        } as Contact);
      }
    });
    
    const finalContacts = [...updatedContacts, ...newContacts];
    
    console.log(`📦 BATCH UPDATE complete: ${finalContacts.length} total contacts`);
    const contactsWithNotes = finalContacts.filter(c => c.notes && c.notes.trim());
    console.log(`📦 Contacts with notes after batch: ${contactsWithNotes.length}`);
    
    setContacts(finalContacts);
    
    // Immediately save to localStorage
    if (user && isDataLoaded) {
      const contactsKey = `contactChronicle_contacts_${user.id}`;
      try {
        localStorage.setItem(contactsKey, JSON.stringify(finalContacts));
        console.log(`📦 Saved batch update to localStorage`);
        const savedWithNotes = finalContacts.filter(c => c.notes && c.notes.trim());
        console.log(`📦 Verified: ${savedWithNotes.length} contacts with notes saved`);
      } catch (error) {
        console.error('Error saving batch update:', error);
      }
    }
  };

  const deleteContact = (id: string) => {
    const updatedContacts = contacts.filter(c => c.id !== id);
    setContacts(updatedContacts);
    
    // Immediately save to localStorage if user is logged in and data is loaded
    if (user && isDataLoaded) {
      const contactsKey = `contactChronicle_contacts_${user.id}`;
      try {
        localStorage.setItem(contactsKey, JSON.stringify(updatedContacts));
      } catch (error) {
        console.error('Error saving contacts immediately:', error);
      }
    }
  };

  const initializeTimeline = () => {
    initializeTimelineData();
  };

  return (
    <AppContext.Provider
      value={{
        timelineEvents,
        contacts,
        addTimelineEvent,
        updateTimelineEvent,
        deleteTimelineEvent,
        addContacts,
        updateContact,
        updateMultipleContacts,
        deleteContact,
        initializeTimeline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

