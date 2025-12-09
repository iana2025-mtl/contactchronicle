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
  const { contacts, updateContact, addContacts, updateMultipleContacts } = useApp();
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

  // DIRECT IMPORT - BYPASSES ALL UPDATE LOGIC AND WRITES DIRECTLY TO LOCALSTORAGE
  // VERSION: 3.0 - DIRECT WRITE
  const handleImportContacts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // CRITICAL ALERT - confirm function is called - VERSION 3.0
    const userConfirmed = confirm('🚨🚨🚨 NEW IMPORT FUNCTION V3.0 CALLED 🚨🚨🚨\n\nDIRECT WRITE METHOD\n\nIf you see this, the new code is loaded!\n\nClick OK to continue...');
    if (!userConfirmed) return;
    
    const file = event.target.files?.[0];
    if (!file) {
      alert('❌ No file selected!');
      return;
    }

    try {
      // Read file as text
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Parse JSON
      const importedContacts: Contact[] = JSON.parse(fileContent);
      
      if (!Array.isArray(importedContacts)) {
        alert('❌ Invalid file format. Expected an array of contacts.');
        return;
      }

      // Count contacts with notes in imported file
      const importedWithNotes = importedContacts.filter(c => 
        c.notes && typeof c.notes === 'string' && c.notes.trim().length > 0
      );

      alert(
        `📤 FILE PARSED\n` +
        `Total contacts: ${importedContacts.length}\n` +
        `Contacts with notes: ${importedWithNotes.length}\n\n` +
        `First contact with notes: ${importedWithNotes[0] ? `${importedWithNotes[0].firstName} ${importedWithNotes[0].lastName}: "${importedWithNotes[0].notes}"` : 'None'}\n\n` +
        `Click OK to continue import...`
      );
      
      // GET CURRENT CONTACTS FROM LOCALSTORAGE DIRECTLY
      const user = JSON.parse(localStorage.getItem('contactChronicle_user') || '{}');
      if (!user || !user.id) {
        alert('❌ Error: User not logged in!');
        return;
      }
      
      const contactsKey = `contactChronicle_contacts_${user.id}`;
      const currentContactsJson = localStorage.getItem(contactsKey);
      const currentContacts: Contact[] = currentContactsJson ? JSON.parse(currentContactsJson) : [];
      
      alert(
        `📋 CURRENT STATE\n` +
        `Existing contacts: ${currentContacts.length}\n` +
        `Existing with notes: ${currentContacts.filter(c => c.notes && c.notes.trim()).length}\n\n` +
        `Click OK to merge...`
      );

      // DIRECT MERGE: Build final contacts array directly, matching by ID/email/name
      const mergedContacts: Contact[] = [];
      const processedIds = new Set<string>();
      
      let matchedCount = 0;
      let notesTransferred = 0;

      // First, process all imported contacts
      for (const imported of importedContacts) {
        // Skip placeholder contacts
        if (imported.firstName === 'First Name' && imported.lastName === 'Last Name') {
          continue;
        }

        // Find existing contact by ID, email, or name
        let existing: Contact | undefined;
        
        // Try ID first
        if (imported.id) {
          existing = currentContacts.find(c => c.id === imported.id);
        }
        
        // Try email if ID didn't match
        if (!existing && imported.emailAddress && imported.emailAddress.trim()) {
          existing = currentContacts.find(c => 
            c.emailAddress && 
            c.emailAddress.toLowerCase().trim() === imported.emailAddress.toLowerCase().trim()
          );
        }
        
        // Try name if email didn't match
        if (!existing) {
          const importedNameKey = `${imported.firstName?.toLowerCase().trim()}_${imported.lastName?.toLowerCase().trim()}`;
          existing = currentContacts.find(c => {
            const existingNameKey = `${c.firstName?.toLowerCase().trim()}_${c.lastName?.toLowerCase().trim()}`;
            return existingNameKey === importedNameKey && existingNameKey !== 'first name_last name' && existingNameKey !== '_';
          });
        }

        if (existing) {
          // Merge: Use imported notes if present, otherwise keep existing
          const merged: Contact = {
            ...existing,
            ...imported,
            id: existing.id, // Always keep existing ID
            notes: ('notes' in imported && imported.notes !== undefined) 
              ? imported.notes 
              : (existing.notes || ''), // Use imported notes, or keep existing, or empty
            firstName: imported.firstName || existing.firstName || '',
            lastName: imported.lastName || existing.lastName || '',
          };
          
          mergedContacts.push(merged);
          processedIds.add(existing.id);
          matchedCount++;
          
          if (imported.notes && imported.notes.trim()) {
            notesTransferred++;
            console.error(`✅ MERGED: "${existing.firstName} ${existing.lastName}" - Notes: "${imported.notes.substring(0, 50)}..."`);
          }
        } else {
          // New contact - add as-is with all fields including notes
          const newContact: Contact = {
            ...imported,
            id: imported.id || `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            notes: imported.notes || '',
          };
          mergedContacts.push(newContact);
        }
      }
      
      // Add any existing contacts that weren't matched
      for (const existing of currentContacts) {
        if (!processedIds.has(existing.id)) {
          mergedContacts.push(existing);
        }
      }

      // Count updates with notes
      const updatesWithNotes = updates.filter(u => 
        u.contact.notes && typeof u.contact.notes === 'string' && u.contact.notes.trim().length > 0
      );

      // CRITICAL: Show detailed breakdown
      const sampleUpdatesWithNotes = updates.filter(u => u.contact.notes && u.contact.notes.trim()).slice(0, 3);
      const sampleText = sampleUpdatesWithNotes.map(u => 
        `${u.contact.firstName} ${u.contact.lastName}: "${u.contact.notes?.substring(0, 30)}..."`
      ).join('\n');
      
      alert(
        `🔄 IMPORT READY\n` +
        `- Updates: ${updates.length} (${updatesWithNotes.length} with notes)\n` +
        `- New contacts: ${newContacts.length}\n\n` +
        `${updatesWithNotes.length > 0 ? `Sample updates with notes:\n${sampleText}\n\n` : '⚠️ WARNING: NO UPDATES HAVE NOTES!\n\n'}` +
        `Click OK to apply changes...`
      );
      
      // CRITICAL: Verify notes are actually in update objects
      if (updatesWithNotes.length === 0 && importedWithNotes.length > 0) {
        console.error(`❌❌❌ CRITICAL: ${importedWithNotes.length} contacts in file have notes, but ${updatesWithNotes.length} updates have notes!`);
        console.error(`This means notes were lost during the matching/update object creation.`);
        console.error(`Sample imported contacts with notes:`, importedWithNotes.slice(0, 3).map(c => ({
          name: `${c.firstName} ${c.lastName}`,
          notes: c.notes,
          id: c.id
        })));
        
        alert(
          `⚠️ CRITICAL ISSUE DETECTED!\n\n` +
          `File has ${importedWithNotes.length} contacts with notes\n` +
          `But only ${updatesWithNotes.length} updates have notes\n\n` +
          `This means notes were lost during processing!\n` +
          `Check console for details.\n\n` +
          `Continuing anyway...`
        );
      }

      // Apply updates using batch update
      if (updates.length > 0) {
        // VERIFY notes are in the update objects before calling batch update
        const verifiedUpdates = updates.map(({ id, contact }) => {
          // Find the original imported contact that matches this update
          const existing = contacts.find(c => c.id === id);
          if (!existing) return { id, contact };
          
          // Find imported contact by matching the existing contact to the imported
          const importedMatch = importedContacts.find(ic => {
            // Match by ID if possible
            if (ic.id === id) return true;
            // Match by email
            if (ic.emailAddress && existing.emailAddress && 
                ic.emailAddress.toLowerCase() === existing.emailAddress.toLowerCase()) return true;
            // Match by name
            if (ic.firstName === existing.firstName && ic.lastName === existing.lastName) return true;
            return false;
          });
          
          // If imported had notes but update doesn't, force add it
          if (importedMatch?.notes && importedMatch.notes.trim() && (!contact.notes || !contact.notes.trim())) {
            contact = { ...contact, notes: importedMatch.notes };
            console.error(`🔧 FIXED: Added notes to ${existing.firstName} ${existing.lastName}: "${importedMatch.notes}"`);
          }
          
          return { id, contact };
        });

        const updatesWithNotes = verifiedUpdates.filter(u => u.contact.notes && u.contact.notes.trim());
        
        alert(
          `🔄 READY TO UPDATE\n` +
          `Total updates: ${verifiedUpdates.length}\n` +
          `Updates with notes: ${updatesWithNotes.length}\n\n` +
          `${updatesWithNotes.length > 0 ? `First update with notes:\n${updatesWithNotes[0].contact.firstName} ${updatesWithNotes[0].contact.lastName}: "${updatesWithNotes[0].contact.notes?.substring(0, 50)}..."` : '⚠️ WARNING: No updates have notes!'}\n\n` +
          `Click OK to call updateMultipleContacts...`
        );

        console.error(`🚨🚨🚨 CALLING BATCH UPDATE WITH ${verifiedUpdates.length} UPDATES 🚨🚨🚨`);
        console.error(`Updates with notes BEFORE verification: ${updatesWithNotes.length}`);
        
        const verifiedWithNotes = verifiedUpdates.filter(u => u.contact.notes && u.contact.notes.trim());
        console.error(`Updates with notes AFTER verification: ${verifiedWithNotes.length}`);
        
        // ALERT before calling batch update
        alert(
          `🚨 ABOUT TO CALL updateMultipleContacts\n\n` +
          `Total updates: ${verifiedUpdates.length}\n` +
          `Updates with notes: ${verifiedWithNotes.length}\n\n` +
          `${verifiedWithNotes.length > 0 ? `First update with notes:\n${verifiedWithNotes[0].contact.firstName} ${verifiedWithNotes[0].contact.lastName}: "${verifiedWithNotes[0].contact.notes?.substring(0, 40)}..."` : '❌ NO UPDATES HAVE NOTES!'}\n\n` +
          `Click OK to execute batch update...`
        );
        
        updateMultipleContacts(verifiedUpdates);
        
        alert(`✅ updateMultipleContacts EXECUTED!\n\nFunction was called.\nNow wait 2 seconds, then click "🔍 Check Data" to verify notes were saved.`);
      }

      // Add new contacts
      if (newContacts.length > 0) {
        addContacts(newContacts);
      }

      // Final verification after a delay
      setTimeout(() => {
        const contactsKey = `contactChronicle_contacts_${JSON.parse(localStorage.getItem('contactChronicle_user') || '{}').id}`;
        if (contactsKey.includes('contactChronicle_contacts_')) {
          const saved = JSON.parse(localStorage.getItem(contactsKey) || '[]');
          const savedWithNotes = saved.filter((c: Contact) => c.notes && c.notes.trim());
          
          alert(
            `✅ IMPORT COMPLETE\n\n` +
            `Total contacts: ${saved.length}\n` +
            `Contacts with notes: ${savedWithNotes.length}\n\n` +
            `${savedWithNotes.length === 0 ? '❌ WARNING: No notes were saved!' : '✅ Notes were saved successfully!'}`
          );
        }
      }, 1000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
      alert(`❌ Error importing contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = !searchTerm || 
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSource = selectedSource === 'all' || contact.source === selectedSource;
      
      return matchesSearch && matchesSource;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.dateAdded || '');
      const dateB = new Date(b.dateAdded || '');
      return dateB.getTime() - dateA.getTime();
    });
  }, [contacts, searchTerm, selectedSource]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    
    if (totalContacts === 0) {
      return {
        total: 0,
        avgPerMonth: 0,
        peakMonth: null as { month: string; count: number } | null,
        highActivityMonths: [] as Array<{ month: string; count: number }>
      };
    }

    // Group by month/year
    const byMonth = new Map<string, number>();
    contacts.forEach(contact => {
      if (contact.dateAdded) {
        try {
          const date = new Date(contact.dateAdded);
          if (!isNaN(date.getTime())) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1);
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    });

    const entries = Array.from(byMonth.entries()).map(([month, count]) => ({
      month,
      count
    }));

    const avgPerMonth = entries.length > 0 
      ? entries.reduce((sum, e) => sum + e.count, 0) / entries.length 
      : 0;

    const peakMonth = entries.length > 0
      ? entries.reduce((peak, curr) => curr.count > peak.count ? curr : peak, entries[0])
      : null;

    // High activity months (above average)
    const highActivityMonths = entries
      .filter(e => e.count > avgPerMonth)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: totalContacts,
      avgPerMonth: Math.round(avgPerMonth * 10) / 10,
      peakMonth,
      highActivityMonths
    };
  }, [contacts]);

  // Quarterly chart data
  const quarterlyData = useMemo(() => {
    const now = new Date();
    const quarters: { [key: string]: number } = {};
    
    // Initialize last 5 years (20 quarters)
    for (let year = now.getFullYear() - 4; year <= now.getFullYear(); year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        quarters[`${year}-Q${quarter}`] = 0;
      }
    }

    contacts.forEach(contact => {
      if (contact.dateAdded) {
        try {
          const date = new Date(contact.dateAdded);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const quarter = Math.ceil(month / 3);
            const quarterKey = `${year}-Q${quarter}`;
            
            if (quarters.hasOwnProperty(quarterKey)) {
              quarters[quarterKey]++;
            }
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    });

    return Object.entries(quarters)
      .map(([quarter, count]) => ({
        quarter: quarter.replace('-', ' '),
        contacts: count
      }))
      .filter(d => d.contacts > 0 || parseInt(d.quarter.split(' ')[0]) >= now.getFullYear() - 2);
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

  const handleCancelEdit = () => {
    setEditingContact(null);
    setNotes('');
  };

  // Diagnostic function to check localStorage
  const handleCheckData = () => {
    try {
      const user = JSON.parse(localStorage.getItem('contactChronicle_user') || '{}');
      const contactsKey = `contactChronicle_contacts_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(contactsKey) || '[]');
      const savedWithNotes = saved.filter((c: Contact) => c.notes && typeof c.notes === 'string' && c.notes.trim().length > 0);
      
      const sampleWithNotes = savedWithNotes.slice(0, 5).map((c: Contact) => 
        `${c.firstName} ${c.lastName}: "${c.notes?.substring(0, 50)}..."`
      ).join('\n');
      
      alert(
        `🔍 DATA DIAGNOSTIC\n\n` +
        `Total contacts: ${saved.length}\n` +
        `Contacts with notes: ${savedWithNotes.length}\n\n` +
        `${savedWithNotes.length > 0 ? 'Sample contacts with notes:\n' + sampleWithNotes : '❌ No contacts have notes!'}`
      );
      
      console.log('🔍 LOCALSTORAGE DIAGNOSTIC:');
      console.log(`  Total contacts: ${saved.length}`);
      console.log(`  Contacts with notes: ${savedWithNotes.length}`);
      console.log(`  Contacts with notes:`, savedWithNotes.map((c: Contact) => ({
        name: `${c.firstName} ${c.lastName}`,
        notes: c.notes
      })));
    } catch (error) {
      console.error('Error checking data:', error);
      alert('❌ Error checking data. See console for details.');
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Header with Export/Import buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Contact Chronicle
            </h1>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={handleExportContacts}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                📥 Export Contacts
              </button>
              <label className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg cursor-pointer text-sm sm:text-base text-center">
                📤 Import Contacts
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportContacts}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleCheckData}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                🔍 Check Data
              </button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 bg-gradient-to-br from-white to-purple-50">
              <div className="text-xs sm:text-sm text-purple-600 mb-1">Total Contacts</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-800">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 bg-gradient-to-br from-white to-blue-50">
              <div className="text-xs sm:text-sm text-blue-600 mb-1">Avg per Month</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-800">{stats.avgPerMonth}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 bg-gradient-to-br from-white to-pink-50">
              <div className="text-xs sm:text-sm text-pink-600 mb-1">Peak Month</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-800">
                {stats.peakMonth ? `${stats.peakMonth.month}: ${stats.peakMonth.count}` : 'N/A'}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 bg-gradient-to-br from-white to-teal-50">
              <div className="text-xs sm:text-sm text-teal-600 mb-1">High Activity</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-800">{stats.highActivityMonths.length}</div>
            </div>
          </div>

          {/* Chart */}
          {quarterlyData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 mb-4 sm:mb-6 bg-gradient-to-br from-white to-purple-50">
              <h3 className="text-base sm:text-lg font-medium mb-3 text-purple-800">Contacts Added by Quarter (5 Years)</h3>
              <div className="min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height={350} minHeight={300}>
                  <BarChart data={quarterlyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="quarter" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <YAxis 
                      label={{ value: 'Number of Contacts', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                      domain={[0, 'dataMax']}
                      width={60}
                    />
                    <Tooltip formatter={(value: number | string) => [value, 'Contacts']} />
                    <Bar dataKey="contacts" fill="url(#colorGradient)" radius={[8, 8, 0, 0]}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs sm:text-sm text-purple-600 mt-2">Bars show quarterly additions; cycles indicate bursts vs. lulls.</p>
            </div>
          )}

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 mb-4 sm:mb-6 bg-gradient-to-br from-white to-purple-50">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              >
                <option value="all">All Sources</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Google">Google</option>
                <option value="Uploaded">Uploaded</option>
              </select>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden mb-4 sm:mb-6">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Phone</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">LinkedIn</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Date Added</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Source</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Notes</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {contact.firstName} {contact.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{contact.emailAddress || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{contact.phoneNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {contact.linkedInProfile ? (
                          <a href={contact.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{contact.dateAdded || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{contact.source || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {contact.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleEditContact(contact)}
                          className="text-purple-600 hover:text-purple-800 hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-purple-100">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="p-4 hover:bg-purple-50 transition-colors">
                  <div className="font-semibold text-gray-800 mb-2">
                    {contact.firstName} {contact.lastName}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {contact.emailAddress && <div>Email: {contact.emailAddress}</div>}
                    {contact.phoneNumber && <div>Phone: {contact.phoneNumber}</div>}
                    {contact.linkedInProfile && (
                      <div>
                        LinkedIn:{' '}
                        <a href={contact.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Profile
                        </a>
                      </div>
                    )}
                    <div>Date Added: {contact.dateAdded || '-'}</div>
                    <div>Source: {contact.source || '-'}</div>
                    {contact.notes && <div className="pt-1 border-t border-purple-200">Notes: {contact.notes}</div>}
                  </div>
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="mt-3 text-purple-600 hover:text-purple-800 hover:underline text-sm"
                  >
                    Edit Notes
                  </button>
                </div>
              ))}
            </div>

            {filteredContacts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No contacts found matching your search criteria.
              </div>
            )}
          </div>

          {/* Edit Notes Modal */}
          {editingContact && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-purple-800">
                  Edit Notes for {editingContact.firstName} {editingContact.lastName}
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 min-h-[100px]"
                  placeholder="Add notes about this contact..."
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Save
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
