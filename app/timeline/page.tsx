'use client';

import { useState, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useApp, TimelineEvent } from '../context/AppContext';

type SortField = 'monthYear' | 'professionalEvent' | 'personalEvent' | 'geographicEvent';
type SortDirection = 'asc' | 'desc';

export default function TimelinePage() {
  const { timelineEvents, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent, initializeTimeline } = useApp();
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showResumeImport, setShowResumeImport] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [sortField, setSortField] = useState<SortField>('monthYear');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'professional' | 'personal' | 'geographic'>('all');
  const [formData, setFormData] = useState({
    monthYear: '',
    professionalEvent: '',
    personalEvent: '',
    geographicEvent: '',
  });

  const handleAddOrEdit = () => {
    if (editingEvent) {
      updateTimelineEvent(editingEvent.id, formData);
      setEditingEvent(null);
    } else {
      addTimelineEvent(formData);
    }
    setFormData({
      monthYear: '',
      professionalEvent: '',
      personalEvent: '',
      geographicEvent: '',
    });
    setShowEditPanel(false);
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormData({
      monthYear: event.monthYear,
      professionalEvent: event.professionalEvent || '',
      personalEvent: event.personalEvent || '',
      geographicEvent: event.geographicEvent || '',
    });
    setShowEditPanel(true);
    // Scroll to edit panel
    setTimeout(() => {
      const panel = document.getElementById('edit-panel');
      panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteTimelineEvent(id);
      if (editingEvent?.id === id) {
        setEditingEvent(null);
        setShowEditPanel(false);
        setFormData({
          monthYear: '',
          professionalEvent: '',
          personalEvent: '',
          geographicEvent: '',
        });
      }
    }
  };

  const handleCancel = () => {
    setShowEditPanel(false);
    setEditingEvent(null);
    setFormData({
      monthYear: '',
      professionalEvent: '',
      personalEvent: '',
      geographicEvent: '',
    });
  };

  const handleConfirmTimeline = () => {
    alert('Timeline confirmed! You can now view your chronicle.');
  };

  // Dynamic table features: filtering, sorting, searching
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...timelineEvents];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(event => {
        if (filterType === 'professional') return event.professionalEvent;
        if (filterType === 'personal') return event.personalEvent;
        if (filterType === 'geographic') return event.geographicEvent;
        return true;
      });
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(event => {
        return (
          event.monthYear.toLowerCase().includes(searchLower) ||
          event.professionalEvent?.toLowerCase().includes(searchLower) ||
          event.personalEvent?.toLowerCase().includes(searchLower) ||
          event.geographicEvent?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string = '';
      let bValue: string = '';

      if (sortField === 'monthYear') {
        aValue = a.monthYear;
        bValue = b.monthYear;
        // Parse dates for proper sorting
        const [monthA, yearA] = aValue.split('/');
        const [monthB, yearB] = bValue.split('/');
        const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1).getTime();
        const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        aValue = (a[sortField] || '').toString().toLowerCase();
        bValue = (b[sortField] || '').toString().toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [timelineEvents, filterType, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-purple-300">↕</span>;
    }
    return sortDirection === 'asc' ? <span className="text-purple-600">↑</span> : <span className="text-purple-600">↓</span>;
  };

  const parseResume = (text: string) => {
    const events: Omit<TimelineEvent, 'id'>[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Common patterns to look for:
    // - Job titles followed by dates (e.g., "Senior Analyst | March 2020 - Present")
    // - Company names
    // - Date patterns: MM/YYYY, MM/YY, Month YYYY, etc.
    // - Bullet points with responsibilities
    
    let currentJob: { title?: string; company?: string; startDate?: string; responsibilities?: string[] } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Try to detect job title patterns
      // Pattern: "Job Title | Company | Date - Date" or "Job Title at Company (Date - Date)"
      const jobPattern1 = /(.+?)\s*(?:at|@|\|)\s*(.+?)\s*(?:\(|\[|\|)?\s*(\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{4})\s*(?:-|to|–|—)\s*(\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{4}|Present|Current|Now)/i;
      const jobPattern2 = /(.+?)\s*(?:\(|\[)\s*(\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{4})\s*(?:-|to|–|—)\s*(\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{4}|Present|Current|Now)/i;
      const jobPattern3 = /(.+?)\s*-\s*(.+?)\s*(\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{4})\s*(?:-|to|–|—)\s*(\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{4}|Present|Current|Now)/i;
      
      let match = line.match(jobPattern1) || line.match(jobPattern2) || line.match(jobPattern3);
      
      if (match) {
        // Save previous job if exists
        if (currentJob && currentJob.title && currentJob.startDate) {
          events.push({
            monthYear: convertDateToMMYYYY(currentJob.startDate),
            professionalEvent: formatJobEvent(currentJob.title, currentJob.company, currentJob.responsibilities),
          });
        }
        
        // Start new job
        currentJob = {
          title: match[1]?.trim(),
          company: match[2]?.trim(),
          startDate: match[3]?.trim(),
          responsibilities: [],
        };
      } else if (currentJob && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./))) {
        // This is likely a responsibility/bullet point
        const responsibility = line.replace(/^[•\-\*\d+\.]\s*/, '').trim();
        if (responsibility && !currentJob.responsibilities) {
          currentJob.responsibilities = [];
        }
        if (responsibility && currentJob.responsibilities) {
          currentJob.responsibilities.push(responsibility);
        }
      } else if (currentJob && !currentJob.company && line.length > 0 && !line.match(/\d{4}/)) {
        // Might be company name if we haven't set it yet
        if (!currentJob.company) {
          currentJob.company = line;
        }
      }
    }
    
    // Save last job
    if (currentJob && currentJob.title && currentJob.startDate) {
      events.push({
        monthYear: convertDateToMMYYYY(currentJob.startDate),
        professionalEvent: formatJobEvent(currentJob.title, currentJob.company, currentJob.responsibilities),
      });
    }
    
    return events;
  };

  const convertDateToMMYYYY = (dateStr: string): string => {
    // Try various date formats
    // MM/YYYY
    if (dateStr.match(/^\d{1,2}\/\d{4}$/)) {
      const [month, year] = dateStr.split('/');
      return `${month.padStart(2, '0')}/${year}`;
    }
    // MM/YY
    if (dateStr.match(/^\d{1,2}\/\d{2}$/)) {
      const [month, year] = dateStr.split('/');
      return `${month.padStart(2, '0')}/20${year}`;
    }
    // Month YYYY
    const monthMap: { [key: string]: string } = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12',
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    const monthYearMatch = dateStr.match(/^(\w+)\s+(\d{4})$/i);
    if (monthYearMatch) {
      const month = monthMap[monthYearMatch[1].toLowerCase()];
      if (month) {
        return `${month}/${monthYearMatch[2]}`;
      }
    }
    // YYYY
    if (dateStr.match(/^\d{4}$/)) {
      return `01/${dateStr}`;
    }
    // Default: return as-is or first month of year
    return dateStr;
  };

  const formatJobEvent = (title: string, company?: string, responsibilities?: string[]): string => {
    let result = title;
    if (company) {
      result += ` at ${company}`;
    }
    if (responsibilities && responsibilities.length > 0) {
      result += ` - Responsibilities: ${responsibilities.slice(0, 5).join(', ')}`;
      if (responsibilities.length > 5) {
        result += `, and ${responsibilities.length - 5} more`;
      }
    }
    return result;
  };

  const handleImportResume = () => {
    if (!resumeText.trim()) {
      alert('Please paste your resume text first.');
      return;
    }
    
    const events = parseResume(resumeText);
    
    if (events.length === 0) {
      alert('Could not parse any job positions from your resume. Please ensure your resume includes job titles and dates. You can also add them manually.');
      return;
    }
    
    if (confirm(`Found ${events.length} job position(s). This will add them to your timeline. Continue?`)) {
      events.forEach(event => {
        addTimelineEvent(event);
      });
      setResumeText('');
      setShowResumeImport(false);
      alert(`Successfully imported ${events.length} job position(s)!`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-purple-800">Build Your Personal Timeline</h1>
        
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 border border-purple-300 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-purple-900">📝 How to Enter Your Job History:</h2>
            <button
              onClick={() => setShowResumeImport(!showResumeImport)}
              className="text-sm bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-sm"
            >
              {showResumeImport ? 'Hide' : 'Import from Resume'}
            </button>
          </div>
          <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
            <li><strong>Month/Year:</strong> Enter the start date of each position (e.g., 03/2020 for March 2020)</li>
            <li><strong>Professional Event:</strong> Include: <strong>Job Title</strong> at <strong>Company Name</strong> - <strong>Key Responsibilities</strong> (e.g., Financial statements, account reconciliation, Excel, Power BI)</li>
            <li>Click any row to edit your entries</li>
          </ul>
        </div>

        {showResumeImport && (
          <div className="bg-gradient-to-r from-green-100 to-mint-100 border border-green-300 rounded-lg p-4 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-green-800 mb-2">📄 Import from Resume:</h3>
            <p className="text-xs text-green-700 mb-3">
              Paste your resume text below. The system will try to extract job titles, companies, dates, and responsibilities.
              Supported formats: &quot;Job Title at Company (Month YYYY - Present)&quot; or &quot;Job Title | Company | MM/YYYY - MM/YYYY&quot;
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume here...&#10;&#10;Example format:&#10;Senior Financial Analyst at ABC Company (March 2020 - Present)&#10;• Prepared financial statements&#10;• Account reconciliation&#10;• Data analysis with Excel and Power BI&#10;&#10;Financial Analyst at XYZ Corp (January 2018 - February 2020)&#10;• Budget analysis&#10;• Financial reporting"
              rows={10}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm mb-3 bg-white"
            />
            <div className="flex gap-3">
              <button
                onClick={handleImportResume}
                className="px-4 py-2 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-lg hover:from-green-500 hover:to-teal-500 transition-all text-sm font-medium shadow-sm"
              >
                Import Jobs from Resume
              </button>
              <button
                onClick={() => {
                  setResumeText('');
                  setShowResumeImport(false);
                }}
                className="px-4 py-2 bg-pink-200 text-pink-700 rounded-lg hover:bg-pink-300 transition-colors text-sm shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 mb-6 bg-gradient-to-r from-white to-purple-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-purple-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search timeline events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-purple-700 mb-1">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                <option value="all">All Events</option>
                <option value="professional">Professional</option>
                <option value="personal">Personal</option>
                <option value="geographic">Geographic</option>
              </select>
            </div>
          </div>
          {searchTerm || filterType !== 'all' ? (
            <div className="mt-2 text-sm text-purple-600">
              Showing {filteredAndSortedEvents.length} of {timelineEvents.length} events
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider cursor-pointer hover:bg-purple-200 select-none transition-colors"
                    onClick={() => handleSort('monthYear')}
                  >
                    <div className="flex items-center gap-2">
                      Month / Year
                      <SortIcon field="monthYear" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider cursor-pointer hover:bg-purple-200 select-none transition-colors"
                    onClick={() => handleSort('professionalEvent')}
                  >
                    <div className="flex items-center gap-2">
                      Key Professional Event
                      <SortIcon field="professionalEvent" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider cursor-pointer hover:bg-purple-200 select-none transition-colors"
                    onClick={() => handleSort('personalEvent')}
                  >
                    <div className="flex items-center gap-2">
                      Key Personal Event
                      <SortIcon field="personalEvent" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider cursor-pointer hover:bg-purple-200 select-none transition-colors"
                    onClick={() => handleSort('geographicEvent')}
                  >
                    <div className="flex items-center gap-2">
                      Key Geographic Event
                      <SortIcon field="geographicEvent" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-purple-500">
                    No timeline events yet. Click &quot;Add, Edit, Delete Panel&quot; to add your job history with titles and responsibilities.
                  </td>
                </tr>
              ) : (
                filteredAndSortedEvents.map((event) => (
                  <tr 
                    key={event.id} 
                    className="hover:bg-purple-50 cursor-pointer transition-colors"
                    onClick={() => handleEdit(event)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-900">{event.monthYear}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                      {event.professionalEvent ? (
                        <div className="whitespace-pre-wrap">
                          {event.professionalEvent.split('\n').map((line, idx) => {
                            // Render bold text (**text**)
                            const parts = line.split(/(\*\*.*?\*\*)/g);
                            return (
                              <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
                                {parts.map((part, partIdx) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={partIdx} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
                                  }
                                  return <span key={partIdx}>{part}</span>;
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-purple-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-purple-700">{event.personalEvent || <span className="text-purple-300">-</span>}</td>
                    <td className="px-6 py-4 text-sm text-purple-700">{event.geographicEvent || <span className="text-purple-300">-</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {showEditPanel && (
          <div id="edit-panel" className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 mb-6 bg-gradient-to-br from-white to-purple-50">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">
              {editingEvent ? 'Edit Timeline Event' : 'Add Timeline Event'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Month / Year (MM/YYYY)
                </label>
                <input
                  type="text"
                  placeholder="09/2025"
                  value={formData.monthYear}
                  onChange={(e) => setFormData({ ...formData, monthYear: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Key Professional Event (Job Title, Company, Responsibilities)
                </label>
                <textarea
                  placeholder="e.g. Senior Financial Analyst at ABC Company - Responsibilities: Financial reporting, budget analysis, data modeling with Excel and Power BI"
                  value={formData.professionalEvent}
                  onChange={(e) => setFormData({ ...formData, professionalEvent: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                />
                <p className="text-xs text-purple-500 mt-1">
                  Include: Job Title, Company Name, and Key Responsibilities
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Key Personal Event
                </label>
                <input
                  type="text"
                  placeholder="e.g. Had a baby!"
                  value={formData.personalEvent}
                  onChange={(e) => setFormData({ ...formData, personalEvent: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Key Geographic Event
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moved to Newark"
                  value={formData.geographicEvent}
                  onChange={(e) => setFormData({ ...formData, geographicEvent: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddOrEdit}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
                >
                  {editingEvent ? 'Update' : 'Add'}
                </button>
                {editingEvent && (
                  <button
                    onClick={() => handleDelete(editingEvent.id)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-lg hover:from-pink-500 hover:to-red-500 transition-all shadow-sm"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-pink-200 text-pink-700 rounded-lg hover:bg-pink-300 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setShowEditPanel(!showEditPanel)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium shadow-md"
          >
            Add, Edit, Delete Panel
          </button>
          <button
            onClick={handleConfirmTimeline}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all font-medium shadow-md"
          >
            Confirm Timeline
          </button>
          <button
            onClick={() => {
              if (confirm('This will reset your timeline and populate it with your resume data (Financial Manager, Senior Financial Analyst, Financial Analyst at Weill Cornell Medicine). Continue?')) {
                localStorage.removeItem('contactChronicle_timeline');
                localStorage.removeItem('contactChronicle_initialized');
                window.location.reload();
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-lg hover:from-green-500 hover:to-teal-500 transition-all font-medium shadow-md"
          >
            Load Resume Data
          </button>
        </div>
      </main>
      <Footer />
      </div>
    </ProtectedRoute>
  );
}

