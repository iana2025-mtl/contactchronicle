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

  const formatProfessionalEvent = (text: string): string => {
    if (!text || text.trim() === '') return text;
    
    const trimmed = text.trim();
    
    // If already has bold formatting for the first title, return as-is
    if (trimmed.match(/^\*\*[^*]+\*\*/)) return text;
    
    // Try to detect job title pattern
    // Pattern 1: "Job Title at Company" (with optional separator and responsibilities)
    let match = trimmed.match(/^([^–—-]+?)\s+at\s+([^–—-]+?)(\s*[-–—\n•]|\s*$)/i);
    if (match) {
      const title = match[1].trim();
      const company = match[2].trim();
      const separator = match[3]?.trim() || '';
      const rest = trimmed.substring(match[0].length - separator.length);
      
      // Only format if title looks reasonable (not too long, doesn't contain special chars at start)
      if (title.length > 0 && title.length < 100 && !title.match(/^[•\-\*\d]/)) {
        return `**${title}** at ${company}${separator}${rest}`;
      }
    }
    
    // Pattern 2: "Job Title - Company" or "Job Title Company"
    match = trimmed.match(/^([^–—-]+?)(\s+[-–—]\s+)([^–—\n•]+?)(\s*[-–—\n•]|\s*$)/);
    if (match) {
      const title = match[1].trim();
      const company = match[3].trim();
      const separator = match[4]?.trim() || '';
      const rest = trimmed.substring(match[0].length - separator.length);
      
      if (title.length > 0 && title.length < 100 && !title.match(/^[•\-\*\d]/)) {
        return `**${title}** at ${company}${separator}${rest}`;
      }
    }
    
    // Pattern 3: First line (before first newline, bullet, or dash) - treat as job title
    const lines = trimmed.split('\n');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Check if first line ends with dash/separator or is followed by bullet points
      const firstLineMatch = firstLine.match(/^([^–—•\n]+?)(\s*[-–—]|\s*$)/);
      
      if (firstLineMatch) {
        const title = firstLineMatch[1].trim();
        if (title.length > 0 && title.length < 100 && !title.match(/^[•\-\*\d]/) && !title.toLowerCase().includes('responsibilities')) {
          const formattedFirstLine = `**${title}**${firstLineMatch[2] || ''}`;
          if (lines.length > 1) {
            return `${formattedFirstLine}\n${lines.slice(1).join('\n')}`;
          }
          return formattedFirstLine + (firstLineMatch[2] ? '' : '');
        }
      }
      
      // If first line doesn't have separator but is reasonable length, format it
      if (firstLine.length > 0 && firstLine.length < 80 && !firstLine.match(/^[•\-\*\d]/) && !firstLine.toLowerCase().includes('responsibilities')) {
        const formattedFirstLine = `**${firstLine}**`;
        if (lines.length > 1) {
          return `${formattedFirstLine}\n${lines.slice(1).join('\n')}`;
        }
        return formattedFirstLine;
      }
    }
    
    // If no pattern matches, return as-is
    return text;
  };

  const handleAddOrEdit = () => {
    const processedData = { ...formData };
    
    // Automatically format job title in bold for professional events
    if (processedData.professionalEvent && processedData.professionalEvent.trim()) {
      processedData.professionalEvent = formatProfessionalEvent(processedData.professionalEvent);
    }
    
    if (editingEvent) {
      updateTimelineEvent(editingEvent.id, processedData);
      setEditingEvent(null);
    } else {
      addTimelineEvent(processedData);
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
    return sortDirection === 'asc' ? <span className="text-purple-500">↑</span> : <span className="text-purple-500">↓</span>;
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
    // Ensure title is bold
    let formattedTitle = title.trim();
    if (!formattedTitle.startsWith('**') || !formattedTitle.endsWith('**')) {
      formattedTitle = `**${formattedTitle}**`;
    }
    
    let result = formattedTitle;
    if (company) {
      result += ` at ${company}`;
    }
    if (responsibilities && responsibilities.length > 0) {
      result += `\n• ${responsibilities.slice(0, 5).join('\n• ')}`;
      if (responsibilities.length > 5) {
        result += `\n• and ${responsibilities.length - 5} more`;
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
      <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-purple-700">Build Your Personal Timeline</h1>
        
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 border border-purple-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h2 className="text-xs sm:text-sm font-semibold text-purple-700">📝 How to Enter Your Job History:</h2>
            <button
              onClick={() => setShowResumeImport(!showResumeImport)}
              className="text-xs sm:text-sm bg-gradient-to-r from-purple-300 to-pink-300 text-purple-800 px-3 py-2 sm:py-1 rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all shadow-sm self-start sm:self-auto"
            >
              {showResumeImport ? 'Hide' : 'Import from Resume'}
            </button>
          </div>
          <ul className="text-xs sm:text-sm text-purple-600 space-y-1 list-disc list-inside">
            <li><strong>Month/Year:</strong> Enter the start date of each position (e.g., 03/2020 for March 2020)</li>
            <li><strong>Professional Event:</strong> Include: <strong>Job Title</strong> at <strong>Company Name</strong> followed by responsibilities (job titles are automatically formatted in bold)</li>
            <li className="hidden sm:list-item">Example: &quot;Senior Financial Analyst at ABC Company&quot; followed by bullet points (•) for responsibilities</li>
            <li>Click any row to edit your entries</li>
          </ul>
        </div>

        {showResumeImport && (
          <div className="bg-gradient-to-r from-green-100 to-teal-100 border border-green-200 rounded-lg p-4 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-green-700 mb-2">📄 Import from Resume:</h3>
            <p className="text-xs text-green-600 mb-3">
              Paste your resume text below. The system will try to extract job titles, companies, dates, and responsibilities.
              Supported formats: &quot;Job Title at Company (Month YYYY - Present)&quot; or &quot;Job Title | Company | MM/YYYY - MM/YYYY&quot;
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume here...&#10;&#10;Example format:&#10;Senior Financial Analyst at ABC Company (March 2020 - Present)&#10;• Prepared financial statements&#10;• Account reconciliation&#10;• Data analysis with Excel and Power BI&#10;&#10;Financial Analyst at XYZ Corp (January 2018 - February 2020)&#10;• Budget analysis&#10;• Financial reporting"
              rows={10}
              className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 text-sm mb-3 bg-white"
            />
            <div className="flex gap-3">
              <button
                onClick={handleImportResume}
                className="px-4 py-2 bg-gradient-to-r from-green-300 to-teal-300 text-green-800 rounded-lg hover:from-green-400 hover:to-teal-400 transition-all text-sm font-medium shadow-sm"
              >
                Import Jobs from Resume
              </button>
              <button
                onClick={() => {
                  setResumeText('');
                  setShowResumeImport(false);
                }}
                className="px-4 py-2 bg-pink-200 text-pink-600 rounded-lg hover:bg-pink-300 transition-colors text-sm shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 sm:p-4 mb-4 sm:mb-6 bg-gradient-to-r from-white to-purple-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-purple-600 mb-1.5">Search</label>
              <input
                type="text"
                placeholder="Search timeline events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-purple-600 mb-1.5">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              >
                <option value="all">All Events</option>
                <option value="professional">Professional</option>
                <option value="personal">Personal</option>
                <option value="geographic">Geographic</option>
              </select>
            </div>
          </div>
          {searchTerm || filterType !== 'all' ? (
            <div className="mt-3 text-xs sm:text-sm text-purple-600">
              Showing {filteredAndSortedEvents.length} of {timelineEvents.length} events
            </div>
          ) : null}
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3 mb-4 sm:mb-6">
          {filteredAndSortedEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 text-center text-purple-500">
              No timeline events yet. Click &quot;Add, Edit, Delete Panel&quot; to add your job history with titles and responsibilities.
            </div>
          ) : (
            filteredAndSortedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEdit(event)}
                className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-purple-700">{event.monthYear}</span>
                </div>
                {event.professionalEvent && (
                  <div className="mb-2 text-sm text-gray-700">
                    <div className="whitespace-pre-wrap">
                      {event.professionalEvent.split('\n').map((line, idx) => {
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
                  </div>
                )}
                {event.personalEvent && (
                  <div className="mb-2 text-sm text-purple-600">
                    <span className="font-medium">Personal: </span>{event.personalEvent}
                  </div>
                )}
                {event.geographicEvent && (
                  <div className="text-sm text-purple-700">
                    <span className="font-medium">Location: </span>{event.geographicEvent}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                <tr>
                  <th 
                    className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider cursor-pointer hover:bg-purple-200 select-none transition-colors"
                    onClick={() => handleSort('monthYear')}
                  >
                    <div className="flex items-center gap-2">
                      Month / Year
                      <SortIcon field="monthYear" />
                    </div>
                  </th>
                  <th 
                    className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider cursor-pointer hover:bg-purple-200 select-none transition-colors"
                    onClick={() => handleSort('professionalEvent')}
                  >
                    <div className="flex items-center gap-2">
                      Key Professional Event
                      <SortIcon field="professionalEvent" />
                    </div>
                  </th>
                  <th 
                    className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider cursor-pointer hover:bg-purple-200 select-none transition-colors"
                    onClick={() => handleSort('personalEvent')}
                  >
                    <div className="flex items-center gap-2">
                      Key Personal Event
                      <SortIcon field="personalEvent" />
                    </div>
                  </th>
                  <th 
                    className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider cursor-pointer hover:bg-purple-200 select-none transition-colors"
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
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-700">{event.monthYear}</td>
                    <td className="px-4 xl:px-6 py-4 text-sm text-gray-700 max-w-md">
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
                    <td className="px-4 xl:px-6 py-4 text-sm text-purple-600">{event.personalEvent || <span className="text-purple-300">-</span>}</td>
                    <td className="px-4 xl:px-6 py-4 text-sm text-purple-600">{event.geographicEvent || <span className="text-purple-300">-</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {showEditPanel && (
          <div id="edit-panel" className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-br from-white to-purple-50">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-700">
              {editingEvent ? 'Edit Timeline Event' : 'Add Timeline Event'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-600 mb-1.5">
                  Month / Year (MM/YYYY)
                </label>
                <input
                  type="text"
                  placeholder="09/2025"
                  value={formData.monthYear}
                  onChange={(e) => setFormData({ ...formData, monthYear: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-600 mb-1.5">
                  Key Professional Event (Job Title, Company, Responsibilities)
                </label>
                <textarea
                  placeholder="e.g. Senior Financial Analyst at ABC Company&#10;• Financial reporting&#10;• Budget analysis&#10;• Data modeling with Excel and Power BI"
                  value={formData.professionalEvent}
                  onChange={(e) => setFormData({ ...formData, professionalEvent: e.target.value })}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white resize-none"
                />
                <p className="text-xs text-purple-400 mt-1.5">
                  💡 Tip: Job titles will be automatically formatted in <strong>bold</strong>. Format: &quot;Job Title at Company&quot; followed by bullet points (•) for responsibilities.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-600 mb-1.5">
                  Key Personal Event
                </label>
                <input
                  type="text"
                  placeholder="e.g. Had a baby!"
                  value={formData.personalEvent}
                  onChange={(e) => setFormData({ ...formData, personalEvent: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-600 mb-1.5">
                  Key Geographic Event
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moved to Newark"
                  value={formData.geographicEvent}
                  onChange={(e) => setFormData({ ...formData, geographicEvent: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddOrEdit}
                  className="flex-1 px-4 py-3 sm:py-2 bg-gradient-to-r from-purple-300 to-pink-300 text-purple-800 rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all shadow-sm font-medium text-base sm:text-sm"
                >
                  {editingEvent ? 'Update' : 'Add'}
                </button>
                {editingEvent && (
                  <button
                    onClick={() => handleDelete(editingEvent.id)}
                    className="flex-1 px-4 py-3 sm:py-2 bg-gradient-to-r from-pink-300 to-red-300 text-pink-800 rounded-lg hover:from-pink-400 hover:to-red-400 transition-all shadow-sm font-medium text-base sm:text-sm"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 sm:py-2 bg-pink-200 text-pink-600 rounded-lg hover:bg-pink-300 transition-colors shadow-sm font-medium text-base sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
          <button
            onClick={() => setShowEditPanel(!showEditPanel)}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-300 to-blue-300 text-purple-800 rounded-lg hover:from-purple-400 hover:to-blue-400 transition-all font-medium shadow-sm text-sm sm:text-base"
          >
            Add, Edit, Delete Panel
          </button>
          <button
            onClick={handleConfirmTimeline}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 bg-gradient-to-r from-pink-300 to-purple-300 text-purple-800 rounded-lg hover:from-pink-400 hover:to-purple-400 transition-all font-medium shadow-sm text-sm sm:text-base"
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
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-lg hover:from-green-500 hover:to-teal-500 transition-all font-medium shadow-md text-sm sm:text-base"
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

