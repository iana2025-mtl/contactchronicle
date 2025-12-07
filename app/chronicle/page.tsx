'use client';

import { useState, useMemo, useEffect } from 'react';
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
  const { contacts, updateContact } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-purple-800">View Chronicle</h1>

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
              <div className="w-full h-[300px] sm:h-[400px] lg:h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
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

