'use client';

import { useState, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useApp, Contact } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChroniclePage() {
  const { contacts, updateContact } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState('');

  // Process contacts by month
  const contactsByMonth = useMemo(() => {
    const monthMap = new Map<string, number>();
    
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
          const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        }
      }
    });
    
    // Generate last 60 months (5 years)
    const months: { month: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 59; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;
      months.push({
        month: monthKey,
        count: monthMap.get(monthKey) || 0,
      });
    }
    
    return months;
  }, [contacts]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    const avgPerMonth = contactsByMonth.reduce((sum, m) => sum + m.count, 0) / Math.max(contactsByMonth.length, 1);
    
    let peakMonth = { month: 'N/A', count: 0 };
    contactsByMonth.forEach((m) => {
      if (m.count > peakMonth.count) {
        peakMonth = { month: m.month, count: m.count };
      }
    });
    
    const counts = contactsByMonth.map((m) => m.count).sort((a, b) => a - b);
    const median = counts.length > 0 
      ? counts[Math.floor(counts.length / 2)] 
      : 0;
    const highActivityMonths = contactsByMonth.filter((m) => m.count >= median).length;
    const highActivityPercentage = contactsByMonth.length > 0
      ? Math.round((highActivityMonths / contactsByMonth.length) * 100)
      : 0;

    return {
      totalContacts,
      avgPerMonth: avgPerMonth.toFixed(1),
      peakMonth: peakMonth.month,
      peakCount: peakMonth.count,
      highActivityPercentage,
    };
  }, [contacts, contactsByMonth]);

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
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-purple-800">View Chronicle</h1>

        {/* Connections Dashboard */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 mb-6 bg-gradient-to-br from-white to-purple-50">
          <h2 className="text-lg font-semibold mb-3 text-purple-800">Connections Dashboard</h2>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-lg shadow-sm border border-blue-300">
              <div className="text-xs text-blue-700 mb-0.5">Total Contacts</div>
              <div className="text-xl font-bold text-blue-800">{stats.totalContacts}</div>
              <div className="text-xs text-blue-600 mt-0.5">Sum across all months</div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-teal-100 p-3 rounded-lg shadow-sm border border-green-300">
              <div className="text-xs text-green-700 mb-0.5">Avg / Month</div>
              <div className="text-xl font-bold text-green-800">{stats.avgPerMonth}</div>
              <div className="text-xs text-green-600 mt-0.5">Mean contacts per month</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-3 rounded-lg shadow-sm border border-yellow-300">
              <div className="text-xs text-yellow-700 mb-0.5">Peak Month</div>
              <div className="text-xl font-bold text-yellow-800">{stats.peakMonth}</div>
              <div className="text-xs text-yellow-600 mt-0.5">({stats.peakCount} contacts)</div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-lg shadow-sm border border-purple-300">
              <div className="text-xs text-purple-700 mb-0.5">High-Activity Months</div>
              <div className="text-xl font-bold text-purple-800">{stats.highActivityPercentage}%</div>
              <div className="text-xs text-purple-600 mt-0.5">Above median volume</div>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-3">
            <h3 className="text-lg font-medium mb-3 text-purple-800">Contacts Added by Month (5 Years)</h3>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart 
                data={contactsByMonth}
                margin={{ top: 20, right: 30, left: 25, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={2}
                  tick={{ fill: '#9333ea', fontSize: 13 }}
                  label={{ value: 'Month (MM-YY)', position: 'insideBottom', offset: -5, fill: '#9333ea', fontSize: 14 }}
                />
                <YAxis 
                  width={70}
                  tick={{ fill: '#9333ea', fontSize: 14 }}
                  label={{ 
                    value: 'Number of Contacts Added', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#9333ea', fontSize: 14 },
                    offset: -15
                  }}
                  domain={[0, 'dataMax + 10']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f3e8ff', 
                    border: '1px solid #d8b4fe',
                    borderRadius: '8px',
                    color: '#9333ea',
                    fontSize: '14px'
                  }}
                />
                <Bar dataKey="count" fill="#d8b4fe" radius={[6, 6, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-purple-600 mt-2">
              Bars show monthly additions; cycles indicate bursts vs. lulls.
            </p>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 mb-6 bg-gradient-to-br from-white to-purple-50">
          <h2 className="text-lg font-semibold mb-4 text-purple-800">Filter Panel</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-purple-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
            <div className="md:w-64">
              <label className="block text-sm font-medium text-purple-700 mb-1">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
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
          <div className="mt-2 text-sm text-purple-600">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 bg-gradient-to-br from-white to-purple-50">
          <h2 className="text-xl font-semibold mb-5 text-purple-800">
            Exportable Table of Contacts With Ability to Search or Append Notes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold text-purple-800 text-sm">First Name</th>
                  <th className="px-5 py-4 text-left font-semibold text-purple-800 text-sm">Last Name</th>
                  <th className="px-5 py-4 text-left font-semibold text-purple-800 text-sm">Email</th>
                  <th className="px-5 py-4 text-left font-semibold text-purple-800 text-sm">Phone</th>
                  <th className="px-5 py-4 text-left font-semibold text-purple-800 text-sm">LinkedIn</th>
                  <th className="px-5 py-4 text-left font-semibold text-purple-800 text-sm">Date Added</th>
                  <th className="px-5 py-4 text-left font-semibold text-purple-800 text-sm">Source</th>
                  <th className="px-5 py-4 text-left font-semibold text-purple-800 text-sm">Notes</th>
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
                      <td className="px-5 py-4">{contact.firstName}</td>
                      <td className="px-5 py-4">{contact.lastName}</td>
                      <td className="px-5 py-4">{contact.emailAddress || '-'}</td>
                      <td className="px-5 py-4">{contact.phoneNumber || '-'}</td>
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">{contact.dateAdded || '-'}</td>
                      <td className="px-5 py-4">{contact.source || '-'}</td>
                      <td className="px-5 py-4 max-w-xs">
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
          <div className="fixed inset-0 bg-purple-900 bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
              <h3 className="text-lg font-semibold mb-4 text-purple-800">
                Notes for {editingContact.firstName} {editingContact.lastName}
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 h-32 mb-4 bg-white"
                placeholder="Add notes about this contact..."
              />
              {editingContact.notes && (
                <p className="text-xs text-purple-600 mb-2">
                  Previous notes: {editingContact.notes}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setNotes('');
                  }}
                  className="px-4 py-2 bg-pink-200 text-pink-700 rounded-lg hover:bg-pink-300 transition-colors shadow-sm"
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

