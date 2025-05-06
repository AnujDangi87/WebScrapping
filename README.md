
# 🧑‍🎓 Alumni Data Scraper App

This Node.js application uses Puppeteer and Express to scrape alumni data from the [University of Hyderabad alumni portal](https://alumni.uohyd.ac.in/members), providing a real-time dashboard for tracking the progress and downloading data.

## 🚀 Features

- 🔐 Login automation using Puppeteer
- 🧽 Scrapes alumni data organized by class and course
- 📊 Real-time progress updates using Socket.io
- 📁 Downloadable alumni data as JSON
- 🔍 Search functionality on the dashboard
- 📈 Displays stats like total alumni, unique locations, courses, and classes

---

## 🛠️ Prerequisites

- Node.js >= 16.x
- Google Chrome or Chromium installed (optional, Puppeteer provides its own)


2. Install dependencies:

```bash
npm install
```

3. Set your credentials in `server.js`:

```javascript
const config = {
  ...
  email: 'your-email@example.com',
  password: 'your-password',
  ...
};
```

---

## ▶️ Running the App

Start the application with:

```bash
node server.js
```

Then open your browser and navigate to:

```
http://localhost:3000
```

To start scraping, go to:

```
http://localhost:3000/scrape
```

---

## 📂 Output

- `alumni_data.json`: Saved alumni data
- `public/index.html`: Real-time dashboard interface
- Real-time statistics and progress available in browser

---

## ⚠️ Notes

- Login credentials must be valid or the scraper will fail.
- The scraper navigates dynamically generated elements — loading may take time.
- `debugMode` can be set to `true` in `config` to visually monitor Puppeteer.

---

## 📄 License

This project is for educational or internal use only. Not intended for large-scale data scraping without appropriate permissions.

---

## 🙋‍♂️ Contact

For questions or suggestions, feel free to reach out to:

**Anuj dangi**  
📧 [23mcce16@uohyd.ac.in](mailto:23mcce16@uohyd.ac.in)
