'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useApp, Contact } from '../context/AppContext';

// Dynamically import Recharts to avoid SSR issues
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });

export default function ChroniclePage() {
  const { contacts, updateContact, addContacts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState('');
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Export contacts to JSON file
  const handleExportContacts = () => {
    // Filter to only include contacts with notes for debugging
    const contactsWithNotes = contacts.filter(c => c.notes && c.notes.trim());
    console.log(`📥 Exporting ${contacts.length} contacts (${contactsWithNotes.length} with notes)`);
    
    // Log sample of notes being exported
    if (contactsWithNotes.length > 0) {
      console.log('Sample notes being exported:', contactsWithNotes.slice(0, 3).map(c => ({
        name: `${c.firstName} ${c.lastName}`,
        notesLength: c.notes?.length || 0,
        notesPreview: c.notes?.substring(0, 100)
      })));
    }
    
    const dataStr = JSON.stringify(contacts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contactchronicle-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    const notesCount = contactsWithNotes.length;
    alert(`Exported ${contacts.length} contacts to JSON file!\n${notesCount} contact${notesCount !== 1 ? 's have' : ' has'} notes included.`);
  };

  // Import contacts from JSON file
  const handleImportContacts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedContacts: Contact[] = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(importedContacts)) {
          alert('Invalid file format. Expected an array of contacts.');
          return;
        }

        // Count contacts with notes in imported file
        const importedWithNotes = importedContacts.filter(c => c.notes && c.notes.trim());
        console.log(`📤 ===== IMPORT STARTING =====`);
        console.log(`📤 Importing ${importedContacts.length} total contacts`);
        console.log(`📤 Contacts with notes in file: ${importedWithNotes.length}`);
        
        // Log all contacts with notes for debugging
        if (importedWithNotes.length > 0) {
          console.log('📤 All contacts with notes in imported file:');
          importedWithNotes.forEach((c, idx) => {
            console.log(`  [${idx + 1}] ${c.firstName} ${c.lastName}: "${c.notes?.substring(0, 100)}${c.notes && c.notes.length > 100 ? '...' : ''}"`);
            console.log(`      Full notes:`, c.notes);
          });
        } else {
          console.warn('⚠️ WARNING: No contacts with notes found in imported file!');
          // Check if any contacts have a notes field at all (even if empty)
          const contactsWithNotesField = importedContacts.filter(c => 'notes' in c);
          console.log(`  Found ${contactsWithNotesField.length} contacts with 'notes' field (may be empty/null)`);
          
          // Sample first few contacts to see their structure
          console.log('  Sample contacts from imported file (first 3):');
          importedContacts.slice(0, 3).forEach((c, idx) => {
            console.log(`    [${idx + 1}] ${c.firstName} ${c.lastName}:`, {
              hasNotesField: 'notes' in c,
              notesValue: c.notes,
              notesType: typeof c.notes,
              fullContact: c
            });
          });
        }

        // Merge strategy: Match by email or (firstName + lastName)
        // If match found, update notes and other fields
        // If no match, add as new contact
        const contactsToUpdate: { id: string; contact: Partial<Contact> }[] = [];
        const contactsToAdd: Contact[] = [];
        let notesUpdatedCount = 0;
        let notesAddedCount = 0;

        importedContacts.forEach((imported: Contact) => {
          const emailLower = imported.emailAddress?.toLowerCase();
          const nameKey = `${imported.firstName?.toLowerCase()}_${imported.lastName?.toLowerCase()}`;
          
          // Try to find existing contact by email first (must have email)
          let existing = contacts.find(c => {
            const cEmailLower = c.emailAddress?.toLowerCase();
            return cEmailLower && emailLower && cEmailLower === emailLower;
          });
          
          // If not found by email, try by exact name match
          if (!existing) {
            existing = contacts.find(c => {
              const cNameKey = `${c.firstName?.toLowerCase()}_${c.lastName?.toLowerCase()}`;
              return cNameKey === nameKey && cNameKey !== 'first name_last name'; // Exclude placeholder contacts
            });
          }
          
          // Also try matching by ID if present
          if (!existing && imported.id) {
            existing = contacts.find(c => c.id === imported.id);
          }
          
          console.log(`  Checking "${imported.firstName} ${imported.lastName}":`, {
            hasNotes: !!imported.notes,
            notesPreview: imported.notes?.substring(0, 50),
            foundExisting: !!existing,
            existingId: existing?.id
          });

          if (existing) {
            // Update existing contact - prioritize imported notes if they exist
            const importedHasNotes = imported.notes && imported.notes.trim();
            const existingHasNotes = existing.notes && existing.notes.trim();
            
            // Determine final notes value - always prefer imported if it has content
            let finalNotes: string | undefined = undefined;
            if (importedHasNotes) {
              // Imported has notes - use it (even if existing also has notes, prefer imported)
              finalNotes = imported.notes!;
            } else if (existingHasNotes) {
              // Only existing has notes - keep existing
              finalNotes = existing.notes;
            }
            // If neither has notes, finalNotes stays undefined
            
            // Build update object - copy fields from imported but explicitly handle notes
            const updateData: Partial<Contact> = {
              firstName: imported.firstName || existing.firstName,
              lastName: imported.lastName || existing.lastName,
              emailAddress: imported.emailAddress || existing.emailAddress,
              phoneNumber: imported.phoneNumber || existing.phoneNumber,
              linkedInProfile: imported.linkedInProfile || existing.linkedInProfile,
              dateAdded: imported.dateAdded || existing.dateAdded,
              dateEdited: imported.dateEdited || existing.dateEdited,
              source: imported.source || existing.source,
              id: existing.id,    // Always preserve existing ID
            };
            
            // CRITICAL: ALWAYS set notes field if finalNotes is defined (even if empty string)
            // This ensures notes are preserved when they exist in imported file
            if (finalNotes !== undefined) {
              updateData.notes = finalNotes;
              console.log(`  ✅ Setting notes in updateData: "${finalNotes.substring(0, 80)}${finalNotes.length > 80 ? '...' : ''}"`);
            } else {
              // Don't set notes if neither has notes - preserve existing behavior
              console.log(`  ⚠️ No notes to set (imported: ${imported.notes ? `"${imported.notes.substring(0, 30)}..."` : 'none'}, existing: ${existing.notes ? `"${existing.notes.substring(0, 30)}..."` : 'none'})`);
            }
            
            // Verify notes is in updateData before adding to array
            if (updateData.notes) {
              console.log(`  ✅ VERIFIED: updateData.notes = "${updateData.notes.substring(0, 50)}..."`);
            } else {
              console.log(`  ❌ ERROR: updateData.notes is missing!`);
              console.log(`    updateData object:`, updateData);
            }
            
            contactsToUpdate.push({
              id: existing.id,
              contact: updateData,
            });
            
            if (finalNotes && finalNotes.trim()) {
              notesUpdatedCount++;
              console.log(`  ✓ Updating "${existing.firstName} ${existing.lastName}" with notes (${finalNotes.length} chars)`);
              console.log(`    Notes: "${finalNotes}"`);
              console.log(`    UpdateData.notes:`, updateData.notes);
            } else {
              console.log(`  ✓ Updating "${existing.firstName} ${existing.lastName}" (no notes)`);
              console.log(`    Imported notes:`, imported.notes);
              console.log(`    Existing notes:`, existing.notes);
            }
          } else {
            // Add as new contact - preserve all fields including notes
            const newContact: Contact = {
              id: imported.id || `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              firstName: imported.firstName || '',
              lastName: imported.lastName || '',
              emailAddress: imported.emailAddress,
              phoneNumber: imported.phoneNumber,
              linkedInProfile: imported.linkedInProfile,
              dateAdded: imported.dateAdded,
              dateEdited: imported.dateEdited,
              source: imported.source,
              notes: imported.notes, // Explicitly preserve notes field
            };
            
            contactsToAdd.push(newContact);
            
            if (newContact.notes && newContact.notes.trim()) {
              notesAddedCount++;
              console.log(`  + Adding "${newContact.firstName} ${newContact.lastName}" with notes (${newContact.notes.length} chars)`);
              console.log(`    Notes preview: "${newContact.notes.substring(0, 80)}..."`);
            } else {
              console.log(`  + Adding "${newContact.firstName} ${newContact.lastName}" (no notes)`);
            }
          }
        });

        console.log(`  Summary: ${contactsToUpdate.length} to update (${notesUpdatedCount} with notes), ${contactsToAdd.length} to add (${notesAddedCount} with notes)`);

        // Log all updates with notes before applying
        console.log(`\n🔄 PRE-UPDATE VERIFICATION:`);
        contactsToUpdate.forEach(({ id, contact }) => {
          console.log(`  Contact ${id}:`, {
            hasNotes: !!contact.notes,
            notesValue: contact.notes || 'MISSING',
            notesLength: contact.notes?.length || 0,
            allFields: Object.keys(contact)
          });
          if (contact.notes) {
            console.log(`    ✅ Has notes: "${contact.notes.substring(0, 60)}..."`);
          } else {
            console.log(`    ❌ MISSING NOTES!`);
          }
        });
        console.log(`\n`);

        // Apply updates - batch them, but ensure notes are preserved
        console.log(`\n🔄 APPLYING UPDATES TO CONTACTS:`);
        contactsToUpdate.forEach(({ id, contact }, idx) => {
          console.log(`  [${idx + 1}/${contactsToUpdate.length}] Updating contact ${id}:`, {
            hasNotes: !!contact.notes,
            notesValue: contact.notes ? `"${contact.notes.substring(0, 50)}..."` : 'MISSING',
            allFields: Object.keys(contact)
          });
          updateContact(id, contact);
        });
        
        console.log(`\n🔄 ADDING NEW CONTACTS:`);
        if (contactsToAdd.length > 0) {
          console.log(`  Adding ${contactsToAdd.length} new contacts`);
          contactsToAdd.forEach((contact, idx) => {
            console.log(`  [${idx + 1}/${contactsToAdd.length}] Adding "${contact.firstName} ${contact.lastName}":`, {
              hasNotes: !!contact.notes,
              notesValue: contact.notes ? `"${contact.notes.substring(0, 50)}..."` : 'none'
            });
          });
        }
        
        // Verify notes after import - read from localStorage directly
        setTimeout(() => {
          try {
            // Get user from localStorage since we can't use hooks in setTimeout
            const userJson = localStorage.getItem('contactChronicle_user');
            if (userJson) {
              const user = JSON.parse(userJson);
              const contactsKey = `contactChronicle_contacts_${user.id}`;
              const savedContactsJson = localStorage.getItem(contactsKey);
              if (savedContactsJson) {
                const savedContacts: Contact[] = JSON.parse(savedContactsJson);
                console.log('🔍 ===== POST-IMPORT VERIFICATION =====');
                console.log(`  Total contacts in localStorage: ${savedContacts.length}`);
                const contactsWithNotesAfter = savedContacts.filter(c => c.notes && c.notes.trim());
                console.log(`  Contacts with notes in localStorage: ${contactsWithNotesAfter.length}`);
                
                if (contactsWithNotesAfter.length > 0) {
                  console.log('  ✅ Contacts with notes after import:');
                  contactsWithNotesAfter.slice(0, 10).forEach((c, idx) => {
                    console.log(`    [${idx + 1}] ${c.firstName} ${c.lastName}: "${c.notes?.substring(0, 100)}${c.notes && c.notes.length > 100 ? '...' : ''}"`);
                  });
                } else {
                  console.error('  ❌ ERROR: No contacts with notes found in localStorage after import!');
                  // Sample a few contacts to see if notes field exists
                  console.log('  Sample contacts (first 5) to debug:');
                  savedContacts.slice(0, 5).forEach(c => {
                    const hasNotesField = 'notes' in c;
                    const notesValue = c.notes;
                    console.log(`    - ${c.firstName} ${c.lastName}:`, {
                      id: c.id,
                      hasNotesField,
                      notesValue: notesValue || 'undefined/null/empty',
                      notesLength: notesValue?.length || 0,
                      fullContact: c // Show full contact object
                    });
                  });
                  
                  // Also check if any contact has notes field at all (even empty)
                  const contactsWithNotesField = savedContacts.filter(c => 'notes' in c);
                  console.log(`  Contacts with 'notes' field (even if empty): ${contactsWithNotesField.length}`);
                  
                  // Check raw JSON to see if notes are there
                  console.log('  Raw JSON sample (first contact):', JSON.stringify(savedContacts[0], null, 2));
                }
                console.log('🔍 =====================================');
              }
            }
          } catch (error) {
            console.error('Error reading from localStorage for verification:', error);
          }
        }, 2000);

        // Add new contacts in one batch
        if (contactsToAdd.length > 0) {
          addContacts(contactsToAdd);
        }

        const totalUpdated = contactsToUpdate.length;
        const totalAdded = contactsToAdd.length;
        const totalWithNotes = notesUpdatedCount + notesAddedCount;

        alert(
          `Import complete!\n` +
          `- Updated: ${totalUpdated} existing contact(s) (${notesUpdatedCount} with notes)\n` +
          `- Added: ${totalAdded} new contact(s) (${notesAddedCount} with notes)\n` +
          `- Total in file: ${importedContacts.length}\n` +
          `- Contacts with notes: ${totalWithNotes}`
        );

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error importing contacts:', error);
        alert('Error importing contacts. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Process contacts by quarter
  const contactsByQuarter = useMemo(() => {
    const quarterMap = new Map<string, number>();
    
    contacts.forEach((contact) => {
      // If no dateAdded, use current date
      let dateAdded = contact.dateAdded;
      if (!dateAdded || dateAdded.trim() === '') {
        const now = new Date();
        dateAdded = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      }
      
      if (dateAdded) {
        // Try to parse date in various formats
        let date: Date | null = null;
        
        // Try MM/YYYY format (most common)
        if (dateAdded.includes('/')) {
          const parts = dateAdded.split('/');
          if (parts.length === 2) {
            const month = parseInt(parts[0]);
            const year = parseInt(parts[1]);
            if (month >= 1 && month <= 12 && year > 2000) {
              date = new Date(year, month - 1);
            }
          }
        }
        
        // Try YYYY-MM-DD format
        if (!date && dateAdded.includes('-')) {
          date = new Date(dateAdded);
        }
        
        // Try full date string
        if (!date || isNaN(date.getTime())) {
          date = new Date(dateAdded);
        }
        
        if (date && !isNaN(date.getTime()) && date.getFullYear() > 2000) {
          const year = date.getFullYear();
          const month = date.getMonth() + 1; // 1-12
          const quarter = Math.ceil(month / 3); // 1-4
          const quarterKey = `Q${quarter} ${year}`;
          quarterMap.set(quarterKey, (quarterMap.get(quarterKey) || 0) + 1);
        }
      }
    });
    
    // Generate last 20 quarters (5 years)
    const quarters: { quarter: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 19; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      const quarterKey = `Q${quarter} ${year}`;
      
      // Only add if not already added (avoid duplicates when generating quarters)
      if (!quarters.find(q => q.quarter === quarterKey)) {
        quarters.push({
          quarter: quarterKey,
          count: quarterMap.get(quarterKey) || 0,
        });
      }
    }
    
    // Fill in any missing quarters in the sequence
    const filledQuarters: { quarter: string; count: number }[] = [];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    for (let year = currentYear - 4; year <= currentYear; year++) {
      const startQ = year === currentYear - 4 ? 1 : 1;
      const endQ = year === currentYear ? currentQuarter : 4;
      
      for (let q = startQ; q <= endQ; q++) {
        const quarterKey = `Q${q} ${year}`;
        const existing = quarters.find(item => item.quarter === quarterKey);
        filledQuarters.push({
          quarter: quarterKey,
          count: existing ? existing.count : 0,
        });
      }
    }
    
    return filledQuarters;
  }, [contacts]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    const avgPerQuarter = contactsByQuarter.reduce((sum, q) => sum + q.count, 0) / Math.max(contactsByQuarter.length, 1);
    
    let peakQuarter = { quarter: 'N/A', count: 0 };
    contactsByQuarter.forEach((q) => {
      if (q.count > peakQuarter.count) {
        peakQuarter = { quarter: q.quarter, count: q.count };
      }
    });
    
    const counts = contactsByQuarter.map((q) => q.count).sort((a, b) => a - b);
    const median = counts.length > 0 
      ? counts[Math.floor(counts.length / 2)] 
      : 0;
    const highActivityQuarters = contactsByQuarter.filter((q) => q.count >= median).length;
    const highActivityPercentage = contactsByQuarter.length > 0
      ? Math.round((highActivityQuarters / contactsByQuarter.length) * 100)
      : 0;

    return {
      totalContacts,
      avgPerMonth: (avgPerQuarter / 3).toFixed(1), // Convert quarterly avg to monthly for display
      peakMonth: peakQuarter.quarter,
      peakCount: peakQuarter.count,
      highActivityPercentage,
    };
  }, [contacts, contactsByQuarter]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch = 
        searchTerm === '' ||
        contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phoneNumber?.includes(searchTerm);
      
      const matchesSource = selectedSource === 'all' || contact.source === selectedSource;
      
      return matchesSearch && matchesSource;
    });
  }, [contacts, searchTerm, selectedSource]);

  const sources = useMemo(() => {
    const sourceSet = new Set(contacts.map((c) => c.source).filter(Boolean));
    return Array.from(sourceSet);
  }, [contacts]);

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setNotes(contact.notes || '');
  };

  const handleSaveNotes = () => {
    if (editingContact) {
      updateContact(editingContact.id, { notes });
      setEditingContact(null);
      setNotes('');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
      <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-800">View Chronicle</h1>
          
          {/* Export/Import Controls */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleExportContacts}
              className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap font-medium"
              title="Export all contacts (with notes) to JSON file"
            >
              📥 Export Contacts
            </button>
            <label className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap font-medium cursor-pointer">
              📤 Import Contacts
              <input
                type="file"
                accept=".json"
                onChange={handleImportContacts}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
            <button
              onClick={() => {
                try {
                  const userJson = localStorage.getItem('contactChronicle_user');
                  if (userJson) {
                    const user = JSON.parse(userJson);
                    const contactsKey = `contactChronicle_contacts_${user.id}`;
                    const savedContactsJson = localStorage.getItem(contactsKey);
                    if (savedContactsJson) {
                      const savedContacts: Contact[] = JSON.parse(savedContactsJson);
                      const contactsWithNotes = savedContacts.filter(c => c.notes && c.notes.trim());
                      console.log('🔍 LOCALSTORAGE DIAGNOSTIC:');
                      console.log(`  Total contacts: ${savedContacts.length}`);
                      console.log(`  Contacts with notes: ${contactsWithNotes.length}`);
                      if (contactsWithNotes.length > 0) {
                        console.log('  Contacts with notes:');
                        contactsWithNotes.slice(0, 10).forEach((c, idx) => {
                          console.log(`    [${idx + 1}] ${c.firstName} ${c.lastName}: "${c.notes}"`);
                        });
                      } else {
                        console.log('  ❌ No contacts with notes found');
                        console.log('  Sample contact (first):', savedContacts[0]);
                        console.log('  Full JSON (first contact):', JSON.stringify(savedContacts[0], null, 2));
                      }
                      alert(`Diagnostic complete! Check console.\nTotal: ${savedContacts.length}\nWith notes: ${contactsWithNotes.length}`);
                    }
                  }
                } catch (error) {
                  console.error('Diagnostic error:', error);
                  alert('Error running diagnostic. Check console.');
                }
              }}
              className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors whitespace-nowrap font-medium"
              title="Check what's actually saved in localStorage"
            >
              🔍 Check Data
            </button>
          </div>
        </div>

        {/* Info box for export/import */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-blue-700">
            <strong>💡 Transfer your data:</strong> Use <strong>Export Contacts</strong> to download all your contacts with notes from localhost, then <strong>Import Contacts</strong> on production to upload them. Existing contacts will be updated (notes merged), new ones will be added.
          </p>
        </div>

        {/* Connections Dashboard */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 bg-gradient-to-br from-white to-purple-50">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-purple-800">Connections Dashboard</h2>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 sm:p-4 rounded-lg shadow-sm border border-blue-300">
              <div className="text-xs sm:text-sm text-blue-700 mb-1">Total Contacts</div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-800">{stats.totalContacts}</div>
              <div className="text-xs text-blue-600 mt-1 hidden sm:block">Sum across all months</div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-teal-100 p-3 sm:p-4 rounded-lg shadow-sm border border-green-300">
              <div className="text-xs sm:text-sm text-green-700 mb-1">Avg / Month</div>
              <div className="text-2xl sm:text-3xl font-bold text-green-800">{stats.avgPerMonth}</div>
              <div className="text-xs text-green-600 mt-1 hidden sm:block">Mean contacts per month</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-3 sm:p-4 rounded-lg shadow-sm border border-yellow-300">
              <div className="text-xs sm:text-sm text-yellow-700 mb-1">Peak Quarter</div>
              <div className="text-lg sm:text-2xl font-bold text-yellow-800 break-words">{stats.peakMonth}</div>
              <div className="text-xs text-yellow-600 mt-1">({stats.peakCount} contacts)</div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 sm:p-4 rounded-lg shadow-sm border border-purple-300">
              <div className="text-xs sm:text-sm text-purple-700 mb-1">High-Activity Months</div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-800">{stats.highActivityPercentage}%</div>
              <div className="text-xs text-purple-600 mt-1 hidden sm:block">Above median volume</div>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-3">
            <h3 className="text-base sm:text-lg font-medium mb-3 text-purple-800">Contacts Added by Quarter (5 Years)</h3>
            {isClient ? (
              <div className="w-full h-[300px] sm:h-[400px] lg:h-[450px] min-h-[300px]" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={300}>
                  <BarChart 
                    data={contactsByQuarter}
                    margin={{ top: 20, right: 20, left: 60, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                    <XAxis 
                      dataKey="quarter" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fill: '#9333ea', fontSize: 11 }}
                      label={{ value: 'Quarter', position: 'insideBottom', offset: -5, fill: '#9333ea', fontSize: 13 }}
                    />
                    <YAxis 
                      width={55}
                      tick={{ fill: '#9333ea', fontSize: 12 }}
                      label={{ 
                        value: 'Number of Contacts Added', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#9333ea', fontSize: 13 },
                        offset: -10
                      }}
                      domain={[0, (dataMax: number) => Math.max(dataMax + 5, 10)]}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#f3e8ff', 
                        border: '1px solid #d8b4fe',
                        borderRadius: '8px',
                        color: '#9333ea',
                        fontSize: '13px'
                      }}
                      formatter={(value: any) => [value, 'Contacts']}
                      labelFormatter={(label: string) => `Quarter: ${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#d8b4fe" 
                      radius={[6, 6, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-[300px] sm:h-[400px] lg:h-[450px] flex items-center justify-center bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-purple-600">Loading chart...</p>
              </div>
            )}
            <p className="text-xs sm:text-sm text-purple-600 mt-2">
              Bars show quarterly additions; data grouped by quarters (Q1, Q2, Q3, Q4).
            </p>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-br from-white to-purple-50">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-purple-800">Filter Panel</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-purple-700 mb-1.5">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
            <div className="sm:w-48 lg:w-64">
              <label className="block text-sm font-medium text-purple-700 mb-1.5">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                <option value="all">All Sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 text-xs sm:text-sm text-purple-600">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 sm:p-6 bg-gradient-to-br from-white to-purple-50">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-purple-800">
            <span className="hidden sm:inline">Exportable Table of Contacts With Ability to Search or Append Notes</span>
            <span className="sm:hidden">Contacts</span>
          </h2>
          
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-purple-500">
                No contacts found. Upload contacts to get started.
              </div>
            ) : (
              filteredContacts.slice(0, 100).map((contact) => (
                <div
                  key={contact.id}
                  className="border border-purple-200 rounded-lg p-4 bg-gradient-to-br from-white to-purple-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-purple-800 text-base">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <p className="text-sm text-purple-600">{contact.source || 'Uploaded'}</p>
                    </div>
                    <span className="text-xs text-purple-500">{contact.dateAdded || '-'}</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {contact.emailAddress && (
                      <div className="flex items-center gap-2">
                        <span className="text-purple-500">Email:</span>
                        <a href={`mailto:${contact.emailAddress}`} className="text-purple-600 hover:underline break-all">
                          {contact.emailAddress}
                        </a>
                      </div>
                    )}
                    {contact.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <span className="text-purple-500">Phone:</span>
                        <a href={`tel:${contact.phoneNumber}`} className="text-purple-600 hover:underline">
                          {contact.phoneNumber}
                        </a>
                      </div>
                    )}
                    {contact.linkedInProfile && (
                      <div className="flex items-center gap-2">
                        <span className="text-purple-500">LinkedIn:</span>
                        <a
                          href={contact.linkedInProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-pink-600 hover:underline"
                        >
                          View Profile
                        </a>
                      </div>
                    )}
                    {contact.notes && (
                      <div className="pt-1 border-t border-purple-200">
                        <p className="text-purple-600 text-xs line-clamp-2">{contact.notes}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="mt-3 w-full py-2 px-3 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                  >
                    {contact.notes ? 'Edit' : 'Add'} Notes
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm lg:text-base">
              <thead className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                <tr>
                  <th className="px-4 lg:px-5 py-3 lg:py-4 text-left font-semibold text-purple-800 text-xs lg:text-sm">First Name</th>
                  <th className="px-4 lg:px-5 py-3 lg:py-4 text-left font-semibold text-purple-800 text-xs lg:text-sm">Last Name</th>
                  <th className="px-4 lg:px-5 py-3 lg:py-4 text-left font-semibold text-purple-800 text-xs lg:text-sm">Email</th>
                  <th className="px-4 lg:px-5 py-3 lg:py-4 text-left font-semibold text-purple-800 text-xs lg:text-sm">Phone</th>
                  <th className="px-4 lg:px-5 py-3 lg:py-4 text-left font-semibold text-purple-800 text-xs lg:text-sm">LinkedIn</th>
                  <th className="px-4 lg:px-5 py-3 lg:py-4 text-left font-semibold text-purple-800 text-xs lg:text-sm">Date Added</th>
                  <th className="px-4 lg:px-5 py-3 lg:py-4 text-left font-semibold text-purple-800 text-xs lg:text-sm">Source</th>
                  <th className="px-4 lg:px-5 py-3 lg:py-4 text-left font-semibold text-purple-800 text-xs lg:text-sm">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-200">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-purple-500">
                      No contacts found. Upload contacts to get started.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.slice(0, 100).map((contact) => (
                    <tr key={contact.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-4 lg:px-5 py-3 lg:py-4">{contact.firstName}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">{contact.lastName}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">{contact.emailAddress || '-'}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">{contact.phoneNumber || '-'}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">
                        {contact.linkedInProfile ? (
                          <a
                            href={contact.linkedInProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-pink-600 hover:underline font-medium"
                          >
                            Profile
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">{contact.dateAdded || '-'}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">{contact.source || '-'}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 max-w-xs">
                        {contact.notes ? (
                          <div className="text-sm text-purple-600 truncate" title={contact.notes}>
                            {contact.notes.substring(0, 30)}...
                          </div>
                        ) : (
                          <span className="text-purple-300 text-sm">-</span>
                        )}
                        <button
                          onClick={() => handleEditContact(contact)}
                          className="text-purple-600 hover:text-pink-600 hover:underline text-sm ml-2 font-medium"
                        >
                          {contact.notes ? 'Edit' : 'Add'} Notes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes Modal */}
        {editingContact && (
          <div className="fixed inset-0 bg-purple-900 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-purple-800">
                Notes for {editingContact.firstName} {editingContact.lastName}
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 text-base border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 h-32 mb-4 bg-white resize-none"
                placeholder="Add notes about this contact..."
              />
              {editingContact.notes && (
                <p className="text-xs text-purple-600 mb-3">
                  Previous notes: {editingContact.notes}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveNotes}
                  className="flex-1 px-4 py-3 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm font-medium text-base sm:text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setNotes('');
                  }}
                  className="flex-1 px-4 py-3 sm:py-2 bg-pink-200 text-pink-700 rounded-lg hover:bg-pink-300 transition-colors shadow-sm font-medium text-base sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      </div>
    </ProtectedRoute>
  );
}

