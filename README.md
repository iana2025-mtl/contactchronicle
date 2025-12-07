# ContactChronicle

A web application that allows you to upload your historic contact information from LinkedIn, Google, or other sources and build a historic view that allows you to quickly find contacts based on a timeline of key historic moments in your personal and professional life.

## Features

- **Build Your Personal Timeline**: Create a timeline of key professional, personal, and geographic events organized by month/year
- **Upload Contacts**: Import contact data from CSV files exported from LinkedIn, Google Contacts, or other sources
- **View Chronicle**: Visualize your contact growth with interactive charts and statistics, and search/filter through your contacts

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

### 1. Build Your Timeline
- Navigate to "My Timeline"
- Click "Add, Edit, Delete Panel" to add timeline events
- Enter key events in your professional, personal, and geographic life
- Click on any row in the table to edit it
- Confirm your timeline when ready

### 2. Upload Contacts
- Navigate to "Upload Contacts"
- Export your contacts from LinkedIn or Google Contacts as a CSV file
- Drag and drop the CSV file or click to browse
- Map the CSV columns to the expected fields (First Name, Last Name, Email, etc.)
- Preview your data and confirm to import

### 3. View Chronicle
- Navigate to "View Chronicle"
- View statistics about your contacts (total, average per month, peak month, etc.)
- Explore the interactive chart showing contacts added by month over the last 5 years
- Filter and search your contacts
- Add notes to individual contacts for future reference

## Data Storage

All data is stored locally in your browser's localStorage. Your timeline events and contacts persist between sessions.

## Technology Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **PapaParse** - CSV parsing

## LinkedIn and Google Integration

To import contacts from LinkedIn or Google:
1. Export your contacts as a CSV file from the respective platform
2. Use the Upload Contacts page to import the CSV file
3. Map the columns appropriately during import

Future versions may include direct API integration for seamless import.
