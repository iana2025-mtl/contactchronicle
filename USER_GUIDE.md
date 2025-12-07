# ContactChronicle - User Guide

## Step-by-Step Guide to Using ContactChronicle

### 🚀 Getting Started

#### Step 1: Start the Application
1. Open your terminal
2. Navigate to the project directory:
   ```bash
   cd contactchronicle
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to: **http://localhost:3000**

---

### 📝 Step 2: Create Your Account

1. **Register a New Account**
   - The app will redirect you to the login page
   - Click **"Sign Up"** button in the header (or go to `/register`)
   - Fill in the registration form:
     - **Full Name**: Enter your name (e.g., "Iana Ribnicova")
     - **Email Address**: Enter your email
     - **Password**: Create a password (minimum 6 characters)
     - **Confirm Password**: Re-enter your password
   - Click **"Sign Up"**
   - You'll be automatically logged in and redirected to your Timeline

2. **Login (if you already have an account)**
   - Go to `/login` or click **"Login"** in the header
   - Enter your email and password
   - Click **"Sign In"**
   - You'll be redirected to your Timeline

---

### 📅 Step 3: Build Your Personal Timeline

#### Option A: Import from Resume
1. On the Timeline page, click **"Import from Resume"** button
2. Paste your resume text in the text area
3. Format example:
   ```
   Financial Manager at ABC Company (April 2022 - Present)
   • Manage $45M budget
   • Lead financial planning initiatives
   
   Senior Analyst at XYZ Corp (February 2020 - March 2022)
   • Optimized budgets
   • Conducted P&L analysis
   ```
4. Click **"Import Jobs from Resume"**
5. Review and edit the imported events by clicking on any row

#### Option B: Add Events Manually
1. Click **"Add, Edit, Delete Panel"** button
2. Fill in the form:
   - **Month/Year**: Enter date in MM/YYYY format (e.g., "04/2022")
   - **Professional Event**: Enter job title, company, and responsibilities
     - Example: `**Financial Manager** at WEILL CORNELL MEDICINE
     • Manage $45M budget with financial planning
     • Achieved 8.2% cost reduction`
   - **Personal Event** (optional): e.g., "Had a baby!", "Got married"
   - **Geographic Event** (optional): e.g., "Moved to New York, NY"
3. Click **"Add"**
4. Repeat for each event in your timeline

#### Editing Timeline Events
- Click on any row in the timeline table to edit it
- Make your changes
- Click **"Update"** to save or **"Delete"** to remove

#### Using Timeline Features
- **Search**: Type in the search box to filter events
- **Filter**: Use the dropdown to show only Professional, Personal, or Geographic events
- **Sort**: Click any column header to sort (click again to reverse)

---

### 📤 Step 4: Upload Your Contacts

#### From LinkedIn
1. **Export your LinkedIn connections:**
   - Go to LinkedIn Settings
   - Click "Data Privacy" → "Get a copy of your data"
   - Select "Connections" and download as Excel (.xlsx)

2. **Upload to ContactChronicle:**
   - Navigate to **"Upload Contacts"** page
   - Drag and drop your `Connections.xlsx` file, or click to browse
   - The system will auto-map columns:
     - First Name, Last Name
     - Email Address
     - Phone Numbers
     - Profile URL → LinkedIn Profile
     - Connected On → Date Added
   - Review the column mapping and adjust if needed
   - Preview the first 10 contacts in the table
   - Click **"Confirm"** to import all contacts

#### From Google Contacts or CSV
1. Export your contacts as CSV from Google Contacts
2. Go to **"Upload Contacts"** page
3. Upload your CSV file
4. Map the columns manually if needed
5. Click **"Confirm"** to import

#### After Upload
- You'll see a confirmation message
- Choose to view your Chronicle immediately
- Contacts will appear in the Chronicle dashboard

---

### 📊 Step 5: View Your Chronicle

1. Navigate to **"View Chronicle"** page
2. **View Dashboard Statistics:**
   - Total Contacts: See your total contact count
   - Avg/Month: Average contacts added per month
   - Peak Month: Month with most contacts added
   - High-Activity Months: Percentage of months above median

3. **Explore the Chart:**
   - See a visual representation of contacts added over the last 5 years
   - Hover over bars to see exact numbers
   - Y-axis shows number of contacts (visible on the left)

4. **Search and Filter Contacts:**
   - Use the search box to find contacts by name, email, or phone
   - Filter by source (LinkedIn, Google, etc.)
   - Results update in real-time

5. **Manage Contact Notes:**
   - Click **"Add Notes"** or **"Edit"** in the Notes column
   - Add personal notes about each contact
   - Click **"Save"** to store your notes

---

### 🔧 Features Overview

#### Timeline Features
- ✅ Add professional, personal, and geographic events
- ✅ Sort by any column (click headers)
- ✅ Search across all fields
- ✅ Filter by event type
- ✅ Import from resume text
- ✅ Edit or delete any event

#### Contact Management
- ✅ Upload CSV or Excel files
- ✅ Auto-map columns from LinkedIn exports
- ✅ Preview before importing
- ✅ Search contacts
- ✅ Filter by source
- ✅ Add notes to contacts

#### Dashboard & Analytics
- ✅ View contact statistics
- ✅ Interactive 5-year chart
- ✅ Monthly breakdown visualization
- ✅ Peak activity identification

---

### 🔐 User Account Management

- Each user has their own private timeline and contacts
- Data is stored locally in your browser (localStorage)
- Switch accounts by logging out and logging in with a different email
- Your data persists between sessions

---

### 💡 Tips & Best Practices

1. **Timeline Events:**
   - Use bold formatting for job titles: `**Job Title**`
   - Add bullet points for responsibilities
   - Use consistent date format: MM/YYYY

2. **Contact Dates:**
   - If your CSV doesn't have dates, contacts will use the current date
   - LinkedIn exports include "Connected On" dates automatically

3. **Search:**
   - Works across all fields (names, emails, phone numbers)
   - Case-insensitive

4. **Data Backup:**
   - Currently data is stored in browser localStorage
   - Consider exporting important data regularly
   - For production, consider cloud backup solutions

---

### 🐛 Troubleshooting

**Contacts not showing in chart:**
- Ensure contacts have a valid dateAdded field
- Check that dates are in MM/YYYY format

**Chart not displaying:**
- Refresh the page
- Check browser console for errors
- Ensure you have contacts imported

**Can't login:**
- Verify email and password are correct
- Try registering again if account doesn't exist
- Clear browser cache if issues persist

**File upload not working:**
- Ensure file is CSV or Excel format (.csv, .xlsx, .xls)
- Check that file is not corrupted
- Try a smaller file first

---

### 🎨 Customization

The app uses a beautiful pastel color palette:
- Purple and pink gradients
- Soft, modern design
- Responsive layout for all devices

Your personal branding (name) appears in the header with the TimeWarp Tangles logo.

---

### 📞 Support

For issues or questions, check:
- The application README.md
- Browser console for error messages
- Ensure all dependencies are installed: `npm install`

---

**Enjoy using ContactChronicle to organize your professional network and personal timeline!**

