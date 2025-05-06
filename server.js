const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Configuration options
const config = {
  port: 3000,
  url: 'https://alumni.uohyd.ac.in/members',//Mine email is being used as gmail account so i can't use my own i am using my friends email id
  email: '23mcce15@uohyd.ac.in', // Replace with your actual email
  password: 'Chandan@2004', // Using the password from your original code
  outputFile: './alumni_data.json',
  logProgress: true,
  debugMode: true // Enable debugging features
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create public directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

// Create HTML file for real-time data display
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alumni Data Scraper - Real-time Display</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .status-bar {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 15px;
    }
    .status-text {
      font-weight: bold;
    }
    #alumniTable {
      font-size: 0.9rem;
    }
    .progress {
      height: 20px;
    }
    #searchInput {
      margin-bottom: 15px;
    }
    .stats-container {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }
    .stat-card {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 5px;
      flex: 1;
      text-align: center;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .stat-label {
      font-size: 0.8rem;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="mb-4">Alumni Data Scraper</h1>
    
    <div class="status-bar">
      <div class="row">
        <div class="col-md-8">
          <span class="status-text">Status: </span>
          <span id="statusText">Initializing...</span>
        </div>
        <div class="col-md-4 text-end">
          <button id="downloadBtn" class="btn btn-sm btn-primary" disabled>Download Data</button>
        </div>
      </div>
    </div>
    
    <div class="progress mb-3">
      <div id="progressBar" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
    </div>
    
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-value" id="totalClasses">0</div>
        <div class="stat-label">Classes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalCourses">0</div>
        <div class="stat-label">Courses</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalAlumni">0</div>
        <div class="stat-label">Alumni</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="uniqueLocations">0</div>
        <div class="stat-label">Locations</div>
      </div>
    </div>
    
    <input type="text" id="searchInput" class="form-control" placeholder="Search alumni by name, location, class, or course...">
    
    <div class="table-responsive">
      <table class="table table-striped table-hover" id="alumniTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Class</th>
            <th>Course</th>
          </tr>
        </thead>
        <tbody id="alumniTableBody">
        </tbody>
      </table>
    </div>
  </div>
  
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const alumniTableBody = document.getElementById('alumniTableBody');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    const downloadBtn = document.getElementById('downloadBtn');
    const searchInput = document.getElementById('searchInput');
    const totalClassesElement = document.getElementById('totalClasses');
    const totalCoursesElement = document.getElementById('totalCourses');
    const totalAlumniElement = document.getElementById('totalAlumni');
    const uniqueLocationsElement = document.getElementById('uniqueLocations');
    
    let alumniData = [];
    
    // Listen for status updates
    socket.on('status', (data) => {
      statusText.textContent = data.message;
      if (data.percent !== undefined) {
        progressBar.style.width = data.percent + '%';
        progressBar.textContent = data.percent + '%';
        progressBar.setAttribute('aria-valuenow', data.percent);
      }
    });
    
    // Listen for new alumni data
    socket.on('newAlumni', (data) => {
      alumniData = alumniData.concat(data);
      
      // Update the table with new data
      updateTable(alumniData);
      
      // Update the stats
      updateStats(alumniData);
      
      // Enable download button if we have data
      if (alumniData.length > 0) {
        downloadBtn.disabled = false;
      }
    });
    
    // Search functionality
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      if (searchTerm === '') {
        updateTable(alumniData);
      } else {
        const filteredData = alumniData.filter(alumni => {
          return alumni.name.toLowerCase().includes(searchTerm) ||
                 alumni.location.toLowerCase().includes(searchTerm) ||
                 alumni.class.toLowerCase().includes(searchTerm) ||
                 alumni.course.toLowerCase().includes(searchTerm);
        });
        updateTable(filteredData);
      }
    });
    
    // Download data functionality
    downloadBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(alumniData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "alumni_data.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
    
    function updateTable(data) {
      // Clear the table
      alumniTableBody.innerHTML = '';
      
      // Add the data
      data.forEach(alumni => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = alumni.name;
        
        const locationCell = document.createElement('td');
        locationCell.textContent = alumni.location;
        
        const classCell = document.createElement('td');
        classCell.textContent = alumni.class;
        
        const courseCell = document.createElement('td');
        courseCell.textContent = alumni.course;
        
        row.appendChild(nameCell);
        row.appendChild(locationCell);
        row.appendChild(classCell);
        row.appendChild(courseCell);
        
        alumniTableBody.appendChild(row);
      });
      
      // Update total alumni count
      totalAlumniElement.textContent = data.length;
    }
    
    function updateStats(data) {
      // Calculate unique classes
      const uniqueClasses = new Set(data.map(a => a.class));
      totalClassesElement.textContent = uniqueClasses.size;
      
      // Calculate unique courses
      const uniqueCourses = new Set(data.map(a => a.course));
      totalCoursesElement.textContent = uniqueCourses.size;
      
      // Calculate unique locations
      const uniqueLocations = new Set(data.map(a => a.location).filter(l => l !== "Unknown"));
      uniqueLocationsElement.textContent = uniqueLocations.size;
      
      // Total alumni is already updated in updateTable
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), htmlContent);

// Store data
let alumniData = [];
let stats = {
  totalClasses: 0,
  currentClass: '',
  totalClassesProcessed: 0,
  totalCourses: 0,
  currentCourse: '',
  totalCoursesProcessed: 0,
  totalAlumni: 0
};

/**
 * Main scraper function
 */
async function scrapeAlumniData() {
  console.log('Starting the alumni data scraper...');
  emitStatus('Starting the alumni data scraper...');
  
  const browser = await puppeteer.launch({ 
    headless: config.debugMode ? false : true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-features=site-per-process',
      '--disable-web-security'
    ],
    defaultViewport: null,
    slowMo: config.debugMode ? 50 : 0
  });
  
  try {
    const page = await browser.newPage();
    
    // Set timeout for navigation
    page.setDefaultNavigationTimeout(60000);
    
    // Enable console logging from the browser
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    
    // Navigate to the website
    console.log(`Navigating to ${config.url}`);
    emitStatus(`Navigating to ${config.url}`);
    await page.goto(config.url);
    
    // Login process
    await loginToWebsite(page);
    
    // Wait for the main content to load
    console.log('Waiting for main content to load...');
    emitStatus('Waiting for main content to load...');
    const classSelector = '[ng-click*="select_in_level"]';
    await page.waitForSelector(classSelector);
    
    // Get total number of class cards
    const totalClassCards = (await page.$$(classSelector)).length;
    console.log(`Found ${totalClassCards} class cards`);
    emitStatus(`Found ${totalClassCards} class cards`);
    stats.totalClasses = totalClassCards;
    
    // Iterate through each class
    for (let classIndex = 0; classIndex < totalClassCards; classIndex++) {
      // Need to re-select cards on each iteration as the DOM may have changed
      await page.waitForSelector(classSelector);
      const classCards = await page.$$(classSelector);
      const currentClassCard = classCards[classIndex];
      
      // Get class title
      const classTitle = await currentClassCard.$eval('span', el => el.textContent.trim());
      console.log(`Processing class: ${classTitle} (${classIndex + 1}/${totalClassCards})`);
      emitStatus(`Processing class: ${classTitle} (${classIndex + 1}/${totalClassCards})`, 
                 Math.round((classIndex / totalClassCards) * 100));
      
      stats.currentClass = classTitle;
      
      // Click on the class card
      await currentClassCard.click();
      
      // Process courses within this class
      await processCourses(page, classTitle);
      
      // Go back to the main page
      await page.goBack();
      console.log(`Completed class: ${classTitle}`);
      emitStatus(`Completed class: ${classTitle}`, 
                 Math.round(((classIndex + 1) / totalClassCards) * 100));
      
      stats.totalClassesProcessed++;
    }
    
    // Save the collected data
    saveDataToFile(alumniData);
    
    console.log('Scraping completed successfully!');
    emitStatus('Scraping completed successfully!', 100);
    
    return alumniData;
  } catch (error) {
    console.error('Error during scraping:', error);
    emitStatus(`Error during scraping: ${error.message}`);
  } finally {
    await browser.close();
    console.log('Browser closed');
    emitStatus('Browser closed');
  }
}

/**
 * Login to the alumni website
 */
async function loginToWebsite(page) {
  console.log('Attempting to log in...');
  emitStatus('Attempting to log in...');
  
  try {
    // Wait for email input and enter email
    await page.waitForSelector('#email', { timeout: 30000 });
    await page.type('#email', config.email, { delay: 100 });
    
    // Click the email button and wait longer for network activity
    console.log('Submitting email...');
    emitStatus('Submitting email...');
    await Promise.all([
      page.click('#emailBtn'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => console.log('Navigation timeout after email submit, continuing anyway...'))
    ]);
    
    // Wait for password input with a longer timeout
    console.log('Waiting for password field...');
    emitStatus('Waiting for password field...');
    
    // Try multiple possible selectors for the password field
    const passwordSelectors = ['#passwordLogin', 'input[type="password"]', 'input[placeholder*="password" i]', '.mdl-textfield__input[type="password"]'];
    
    let passwordFieldFound = false;
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.type(selector, config.password);
        console.log(`Found password field with selector: ${selector}`);
        passwordFieldFound = true;
        break;
      } catch (err) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }
    
    if (!passwordFieldFound) {
      // If we can't find the password field by selector, let's try to find it by analyzing the page
      console.log('Trying to find password field by page analysis...');
      emitStatus('Trying to find password field by page analysis...');
      
      // Take a screenshot to help with debugging
      await page.screenshot({ path: 'login-page.png' });
      
      // Get all input fields
      const inputs = await page.$$eval('input', inputs => {
        return inputs.map(input => ({
          id: input.id,
          type: input.type,
          placeholder: input.placeholder,
          name: input.name,
          class: input.className
        }));
      });
      
      console.log('Available input fields:', JSON.stringify(inputs, null, 2));
      
      // Try to find a password field by analyzing attributes
      for (const input of inputs) {
        if (input.type === 'password' || 
            input.id.toLowerCase().includes('password') || 
            input.name.toLowerCase().includes('password') ||
            input.placeholder.toLowerCase().includes('password')) {
          
          const selector = input.id ? `#${input.id}` : 
                           input.name ? `input[name="${input.name}"]` : 
                           `input.${input.class.split(' ').join('.')}`;
                           
          console.log(`Attempting to use password field with selector: ${selector}`);
          
          try {
            await page.type(selector, config.password);
            passwordFieldFound = true;
            break;
          } catch (err) {
            console.log(`Failed to type in ${selector}: ${err.message}`);
          }
        }
      }
    }
    
    if (!passwordFieldFound) {
      throw new Error('Could not find password field');
    }
    
    // Look for submit buttons with different possible selectors
    console.log('Looking for login button...');
    emitStatus('Looking for login button...');
    const submitButtonSelectors = [
      'button.ladda-button-primary[type="submit"]',
      'button[type="submit"]',
      'button.mdl-button--colored',
      'button.mdl-button',
      'input[type="submit"]',
      'button:contains("Login")',
      'button:contains("Submit")',
      'button:contains("Sign In")'
    ];
    
    let buttonClicked = false;
    for (const selector of submitButtonSelectors) {
      try {
        // First check if the selector exists
        const buttonExists = await page.$(selector);
        if (buttonExists) {
          console.log(`Found login button with selector: ${selector}`);
          await Promise.all([
            page.click(selector),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
              console.log(`Navigation timeout after button click: ${e.message}`);
            })
          ]);
          buttonClicked = true;
          break;
        }
      } catch (err) {
        console.log(`Selector ${selector} not clickable, trying next...`);
      }
    }
    
    if (!buttonClicked) {
      // If we can't find the button by selector, try to analyze the page
      console.log('Trying to find login button by page analysis...');
      emitStatus('Trying to find login button by page analysis...');
      
      // Get all buttons
      const buttons = await page.$$eval('button, input[type="submit"]', btns => {
        return btns.map(btn => ({
          id: btn.id,
          type: btn.type,
          text: btn.textContent,
          name: btn.name,
          class: btn.className
        }));
      });
      
      console.log('Available buttons:', JSON.stringify(buttons, null, 2));
      
      // Try each button that looks like a login button
      for (const btn of buttons) {
        if (btn.text.toLowerCase().includes('login') || 
            btn.text.toLowerCase().includes('submit') || 
            btn.text.toLowerCase().includes('sign in') ||
            btn.type === 'submit') {
            
          const selector = btn.id ? `#${btn.id}` : 
                          btn.name ? `button[name="${btn.name}"]` : 
                          `button.${btn.class.split(' ').join('.')}`;
                          
          console.log(`Attempting to click button with selector: ${selector}`);
          
          try {
            await Promise.all([
              page.click(selector),
              page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
                console.log(`Navigation timeout after button click: ${e.message}`);
              })
            ]);
            buttonClicked = true;
            break;
          } catch (err) {
            console.log(`Failed to click ${selector}: ${err.message}`);
          }
        }
      }
    }
    
    if (!buttonClicked) {
      throw new Error('Could not find login button');
    }
    
    // Check if we are logged in
    try {
      // Wait for an element that indicates successful login
      await page.waitForSelector('[ng-click*="select_in_level"]', { timeout: 30000 });
      console.log('Successfully logged in');
      emitStatus('Successfully logged in');
    } catch (error) {
      // Take a screenshot to see what happened
      await page.screenshot({ path: 'login-failure.png' });
      throw new Error('Login verification failed: ' + error.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    emitStatus(`Login failed: ${error.message}`);
    throw new Error('Failed to log in to the website: ' + error.message);
  }
}

/**
 * Process all courses within a class
 */
async function processCourses(page, classTitle) {
  const courseSelector = '[ng-click*="count_obj2.key"]';
  
  try {
    await page.waitForSelector(courseSelector);
    const totalCourseCards = (await page.$$(courseSelector)).length;
    console.log(`Found ${totalCourseCards} courses in class "${classTitle}"`);
    emitStatus(`Found ${totalCourseCards} courses in class "${classTitle}"`);
    
    stats.totalCourses += totalCourseCards;
    
    for (let courseIndex = 0; courseIndex < totalCourseCards; courseIndex++) {
      await page.waitForSelector(courseSelector);
      const courseCards = await page.$$(courseSelector);
      const currentCourseCard = courseCards[courseIndex];
      
      // Get course title
      const courseTitle = await currentCourseCard.$eval('span', el => el.textContent.trim());
      console.log(`Processing course: ${courseTitle} (${courseIndex + 1}/${totalCourseCards})`);
      emitStatus(`Processing course: ${courseTitle} (${courseIndex + 1}/${totalCourseCards})`);
      
      stats.currentCourse = courseTitle;
      
      // Click on the course card
      await currentCourseCard.click();
      
      // Process members within this course
      await processMembers(page, classTitle, courseTitle);
      
      // Go back to the course listing
      await page.goBack();
      console.log(`Completed course: ${courseTitle}`);
      emitStatus(`Completed course: ${courseTitle}`);
      
      stats.totalCoursesProcessed++;
    }
  } catch (error) {
    console.error(`Error processing courses for class "${classTitle}":`, error);
    emitStatus(`Error processing courses for class "${classTitle}": ${error.message}`);
  }
}

/**
 * Process members within a course
 */
async function processMembers(page, classTitle, courseTitle) {
  try {
    // Wait for member cards to load
    await page.waitForSelector('.maximize-width.border-box.padding-12');
    const memberCards = await page.$$('.maximize-width.border-box.padding-12');
    
    // Get the clean course name
    await page.waitForSelector('.font-16.font-xs-14.mdl-typography--font-medium');
    const fullCourseText = await page.$eval(
      '.font-16.font-xs-14.mdl-typography--font-medium', 
      el => el.textContent.trim()
    );
    
    // Extract just the course name from the text
    const courseNameMatch = fullCourseText.split(',');
    const courseName = courseNameMatch.length > 1 ? courseNameMatch[1].trim() : courseTitle;
    
    console.log(`Found ${memberCards.length} alumni in course "${courseName}"`);
    emitStatus(`Found ${memberCards.length} alumni in course "${courseName}"`);
    
    // Batch alumni data to emit
    let batchSize = 20;
    let currentBatch = [];
    
    // Process each member card
    for (let i = 0; i < memberCards.length; i++) {
      const card = memberCards[i];
      
      try {
        const name = await card.$eval('a.link-detail', el => el.textContent.trim());
        
        let location = "Unknown";
        try {
          location = await card.$eval('div.overflow-ellipsis', el => el.textContent.trim());
        } catch (err) {
          // Location element not found, keep default "Unknown"
        }
        
        // Create alumni record
        const alumniRecord = {
          name: name,
          location: location,
          class: classTitle,
          course: courseName
        };
        
        // Add to overall data
        alumniData.push(alumniRecord);
        
        // Add to current batch
        currentBatch.push(alumniRecord);
        
        // Emit batch if we've reached batch size or this is the last item
        if (currentBatch.length >= batchSize || i === memberCards.length - 1) {
          io.emit('newAlumni', currentBatch);
          currentBatch = [];
        }
        
        stats.totalAlumni++;
        
        if (config.logProgress && (i % 10 === 0 || i === memberCards.length - 1)) {
          console.log(`Processed ${i + 1}/${memberCards.length} alumni in "${courseName}"`);
          emitStatus(`Processed ${i + 1}/${memberCards.length} alumni in "${courseName}"`);
        }
      } catch (error) {
        console.error(`Error processing alumni #${i + 1} in course "${courseName}":`, error);
        emitStatus(`Error processing alumni #${i + 1} in course "${courseName}": ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error processing members in course "${courseTitle}":`, error);
    emitStatus(`Error processing members in course "${courseTitle}": ${error.message}`);
  }
}

/**
 * Save the collected data to a JSON file
 */
function saveDataToFile(data) {
  if (!data || data.length === 0) {
    console.warn('No data to save!');
    emitStatus('No data to save!');
    return;
  }
  
  try {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(config.outputFile, jsonString);
    console.log(`Successfully saved ${data.length} alumni records to ${config.outputFile}`);
    emitStatus(`Successfully saved ${data.length} alumni records to ${config.outputFile}`);
  } catch (error) {
    console.error('Error saving data to file:', error);
    emitStatus(`Error saving data to file: ${error.message}`);
  }
}

/**
 * Emit status updates to connected clients
 */
function emitStatus(message, percent = null) {
  const statusData = { message };
  if (percent !== null) {
    statusData.percent = percent;
  }
  io.emit('status', statusData);
}

// Set up Express routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/scrape', async (req, res) => {
  try {
    // Reset data if we're starting a new scrape
    alumniData = [];
    stats = {
      totalClasses: 0,
      currentClass: '',
      totalClassesProcessed: 0,
      totalCourses: 0,
      currentCourse: '',
      totalCoursesProcessed: 0,
      totalAlumni: 0
    };
    
    // Start the scraping in the background
    emitStatus('Starting scraping process...', 0);
    res.send('Scraping process has been initiated. Please return to the main page to view progress.');
    
    scrapeAlumniData()
      .then(data => {
        console.log(`Scraping completed with ${data ? data.length : 0} records.`);
      })
      .catch(err => {
        console.error('Scraping process failed:', err);
        emitStatus(`Scraping process failed: ${err.message}`);
      });
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.get('/data', (req, res) => {
  res.json(alumniData);
});

app.get('/stats', (req, res) => {
  res.json(stats);
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Send current data to the newly connected client
  if (alumniData.length > 0) {
    socket.emit('newAlumni', alumniData);
  }
  
  // Send current status
  socket.emit('status', { 
    message: `Connected. ${alumniData.length} alumni records collected so far.`
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
server.listen(config.port, () => {
  console.log(`Alumni Scraper server started on port ${config.port}`);
  console.log(`- Visit http://localhost:${config.port} to view real-time scraping data`);
  console.log(`- Visit http://localhost:${config.port}/scrape to start scraping`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Auto-start scraping if this file is run directly
if (require.main === module) {
  console.log('Auto-starting scraper...');
  scrapeAlumniData();
}