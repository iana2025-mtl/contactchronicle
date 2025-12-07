'use client';

import { useState, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useApp, Contact } from '../context/AppContext';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function UploadPage() {
  const router = useRouter();
  const { addContacts } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<Contact[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedColumns = [
    'First Name',
    'Last Name',
    'Email Address',
    'Phone Number',
    'LinkedIn Profile',
    'Date Added',
    'Date Edited',
    'Source (E.G. LinkedIn, Google, Etc.)',
  ];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleFile(file);
    } else {
      alert('Please upload a CSV or Excel (.xlsx) file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    
    if (isExcel) {
      // Handle Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet (LinkedIn Connections exports typically use the first sheet)
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          const dataArray = jsonData as any[];
          
          if (dataArray.length > 0) {
            setCsvData(dataArray);
            
            // Auto-map columns for LinkedIn format
            const headers = Object.keys(dataArray[0]);
            const mapping: Record<string, string> = {};
            
            // LinkedIn Connections.xlsx typical column names
            const linkedInColumnMap: Record<string, string> = {
              'First Name': 'First Name',
              'Last Name': 'Last Name',
              'Email Address': 'Email Address',
              'Phone Numbers': 'Phone Number',
              'Phone Number': 'Phone Number',
              'Profile URL': 'LinkedIn Profile',
              'LinkedIn': 'LinkedIn Profile',
              'Connected On': 'Date Added',
              'Date Added': 'Date Added',
              'Company': 'Source',
            };
            
            expectedColumns.forEach((expected) => {
              // First try exact match (case insensitive)
              let found = headers.find((h) => 
                h.toLowerCase() === expected.toLowerCase()
              );
              
              // Then try LinkedIn column names
              if (!found) {
                const linkedInCol = Object.entries(linkedInColumnMap).find(([_, val]) => val === expected)?.[0];
                if (linkedInCol) {
                  found = headers.find((h) => h.toLowerCase() === linkedInCol.toLowerCase());
                }
              }
              
              // Finally try partial match
              if (!found) {
                found = headers.find((h) => 
                  h.toLowerCase().includes(expected.toLowerCase().split(' ')[0]) ||
                  expected.toLowerCase().includes(h.toLowerCase().split(' ')[0])
                );
              }
              
              if (found) {
                mapping[expected] = found;
              }
            });
            
            setColumnMapping(mapping);
            generatePreview(dataArray, mapping);
          }
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          alert('Error parsing Excel file. Please check the file format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Handle CSV file
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const data = results.data as any[];
          setCsvData(data);
          
          // Auto-map columns
          if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const mapping: Record<string, string> = {};
            
            expectedColumns.forEach((expected) => {
              const found = headers.find((h) => 
                h.toLowerCase().includes(expected.toLowerCase().split(' ')[0])
              );
              if (found) {
                mapping[expected] = found;
              }
            });
            
            setColumnMapping(mapping);
            generatePreview(data, mapping);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error parsing CSV file. Please check the file format.');
        },
      });
    }
  };

  const generatePreview = (data: any[], mapping: Record<string, string>) => {
    const now = new Date();
    const defaultDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    const preview = data.slice(0, 10).map((row, idx) => {
      const contact: Contact = {
        id: `preview-${idx}`,
        firstName: row[mapping['First Name']] || '',
        lastName: row[mapping['Last Name']] || '',
        emailAddress: row[mapping['Email Address']] || '',
        phoneNumber: row[mapping['Phone Number']] || '',
        linkedInProfile: row[mapping['LinkedIn Profile']] || '',
        dateAdded: row[mapping['Date Added']] || defaultDate,
        dateEdited: row[mapping['Date Edited']] || '',
        source: row[mapping['Source (E.G. LinkedIn, Google, Etc.)']] || 'Uploaded',
      };
      return contact;
    });
    setPreviewData(preview);
  };

  const handleColumnMappingChange = (expected: string, csvColumn: string) => {
    const newMapping = { ...columnMapping, [expected]: csvColumn };
    setColumnMapping(newMapping);
    if (csvData.length > 0) {
      generatePreview(csvData, newMapping);
    }
  };

  const handleConfirm = () => {
    if (csvData.length === 0) {
      alert('Please upload a CSV or Excel file first');
      return;
    }

    // Get current date in MM/YYYY format as default
    const now = new Date();
    const defaultDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const contacts: Contact[] = csvData.map((row, idx) => {
      // Try to parse dateAdded, use current date if missing or invalid
      let dateAdded = row[columnMapping['Date Added']] || '';
      
      // If dateAdded is empty or invalid, use current date
      if (!dateAdded || dateAdded.trim() === '') {
        dateAdded = defaultDate;
      } else {
        // Try to normalize date formats
        // LinkedIn format: "Oct 15, 2023" or "10/15/2023"
        if (dateAdded.includes(',')) {
          // Format like "Oct 15, 2023"
          try {
            const date = new Date(dateAdded);
            if (!isNaN(date.getTime())) {
              dateAdded = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            } else {
              dateAdded = defaultDate;
            }
          } catch {
            dateAdded = defaultDate;
          }
        } else if (dateAdded.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          // Format like "10/15/2023"
          try {
            const parts = dateAdded.split('/');
            dateAdded = `${parts[0].padStart(2, '0')}/${parts[2]}`;
          } catch {
            dateAdded = defaultDate;
          }
        } else if (dateAdded.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Format like "2023-10-15"
          try {
            const date = new Date(dateAdded);
            if (!isNaN(date.getTime())) {
              dateAdded = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            } else {
              dateAdded = defaultDate;
            }
          } catch {
            dateAdded = defaultDate;
          }
        }
      }

      return {
        id: `contact-${Date.now()}-${idx}`,
        firstName: row[columnMapping['First Name']] || '',
        lastName: row[columnMapping['Last Name']] || '',
        emailAddress: row[columnMapping['Email Address']] || '',
        phoneNumber: row[columnMapping['Phone Number']] || '',
        linkedInProfile: row[columnMapping['LinkedIn Profile']] || '',
        dateAdded: dateAdded,
        dateEdited: row[columnMapping['Date Edited']] || '',
        source: row[columnMapping['Source (E.G. LinkedIn, Google, Etc.)']] || 'Uploaded',
      };
    });

    addContacts(contacts);
    
    // Show success message and redirect
    const shouldViewChronicle = confirm(
      `Successfully imported ${contacts.length} contacts! Would you like to view them in your Chronicle now?`
    );
    
    // Reset
    setCsvData([]);
    setPreviewData([]);
    setColumnMapping({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Redirect to chronicle if user wants
    if (shouldViewChronicle) {
      router.push('/chronicle');
    }
  };

  const handleCancel = () => {
    setCsvData([]);
    setPreviewData([]);
    setColumnMapping({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const csvHeaders = csvData.length > 0 ? Object.keys(csvData[0]) : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
      <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-purple-800">Upload Contacts</h1>
        
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 border border-purple-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <h2 className="text-xs sm:text-sm font-semibold text-purple-900 mb-2">📋 Supported File Formats:</h2>
          <ul className="text-xs sm:text-sm text-purple-700 space-y-1 list-disc list-inside">
            <li><strong>Excel files (.xlsx, .xls):</strong> LinkedIn Connections.xlsx, Google Contacts export, or custom Excel files</li>
            <li><strong>CSV files:</strong> Standard CSV format with headers</li>
            <li className="hidden sm:list-item">For LinkedIn: Export your connections as &quot;Connections.xlsx&quot; from LinkedIn Settings → Data Privacy → Get a copy of your data</li>
          </ul>
        </div>

        {/* Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 sm:p-8 lg:p-12 text-center mb-4 sm:mb-6 transition-colors ${
            isDragging
              ? 'border-purple-400 bg-purple-100 shadow-lg'
              : 'border-purple-300 bg-white'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />
          <p className="text-base sm:text-lg text-purple-700 mb-2">
            Drag and Drop Into File System
          </p>
          <p className="text-sm text-purple-600 mb-1">
            or click to browse
          </p>
          <p className="text-xs text-purple-400">
            Supports CSV and Excel files (.xlsx, .xls)
          </p>
        </div>

        {/* Column Mapping */}
        {csvData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-br from-white to-blue-50">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-800">Prompt to Confirm Key Columns:</h2>
            <div className="space-y-3 sm:space-y-4">
              {expectedColumns.map((expected) => (
                <div key={expected} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-full sm:w-48 lg:w-64 text-sm font-medium text-purple-700">
                    {expected}:
                  </label>
                  <select
                    value={columnMapping[expected] || ''}
                    onChange={(e) => handleColumnMappingChange(expected, e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 mb-6 bg-gradient-to-br from-white to-purple-50">
            <h2 className="text-xl font-semibold mb-2 text-purple-800">Preview Records</h2>
            <p className="text-sm text-purple-600 mb-4">Table View of the Data Uploaded</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-purple-800">First Name</th>
                    <th className="px-4 py-2 text-left font-medium text-purple-800">Last Name</th>
                    <th className="px-4 py-2 text-left font-medium text-purple-800">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-purple-800">Phone</th>
                    <th className="px-4 py-2 text-left font-medium text-purple-800">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-200">
                  {previewData.map((contact, idx) => (
                    <tr key={idx} className="hover:bg-purple-50 transition-colors">
                      <td className="px-4 py-2">{contact.firstName}</td>
                      <td className="px-4 py-2">{contact.lastName}</td>
                      <td className="px-4 py-2">{contact.emailAddress || '-'}</td>
                      <td className="px-4 py-2">{contact.phoneNumber || '-'}</td>
                      <td className="px-4 py-2">{contact.source || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handleConfirm}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-md text-sm sm:text-base"
          >
            Confirm
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 bg-pink-200 text-pink-700 rounded-lg hover:bg-pink-300 transition-colors font-medium shadow-sm text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </main>
      <Footer />
      </div>
    </ProtectedRoute>
  );
}

