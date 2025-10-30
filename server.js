// server.js
// Express server for Invisible Disability Mapper

const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('GEOAPIFY_KEY present:', !!process.env.GEOAPIFY_KEY);

// File where reviews are saved
const DATA_FILE = path.join(__dirname, 'reviews.json');

// Load existing reviews or start with an empty array
let reviews = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    reviews = JSON.parse(data);
  } catch (err) {
    console.error('Error reading reviews.json:', err);
  }
}

// Middleware
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'public')));

// API proxy endpoints
console.log('Setting up API routes...');

app.get('/api/geocode', async (req, res) => {
  console.log('Geocode endpoint hit with query:', req.query);
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }
  
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&apiKey=${process.env.GEOAPIFY_KEY}`;
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

app.get('/api/places', async (req, res) => {
  console.log('Places endpoint hit with query:', req.query);
  console.log('Available parameters:', Object.keys(req.query));
  const { filter, categories, name } = req.query;
  
  if (!filter) {
    console.log('ERROR: No filter parameter found!');
    console.log('All query params:', JSON.stringify(req.query, null, 2));
    return res.status(400).json({ error: 'Filter parameter required' });
  }
  
  try {
    // Parse the filter parameter to rebuild the URL correctly
    let url = `https://api.geoapify.com/v2/places?`;
    
    // Add filter parameter
    url += `filter=${encodeURIComponent(filter)}`;
    
    // If no categories specified, use a broad commercial category
    const categoriesParam = categories || 'commercial';
    url += `&categories=${categoriesParam}`;
    
    if (name) {
      url += `&name=${encodeURIComponent(name)}`;
    }
    
    url += `&limit=100&apiKey=${process.env.GEOAPIFY_KEY}`;
    
    console.log('Making Geoapify request to:', url.replace(process.env.GEOAPIFY_KEY, 'API_KEY_HIDDEN'));
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Geoapify response status:', response.status);
    console.log('Features found:', data.features ? data.features.length : 0);
    
    res.json(data);
  } catch (error) {
    console.error('Places error:', error);
    res.status(500).json({ error: 'Places search failed' });
  }
});

// Reviews endpoints
app.get('/api/reviews', (req, res) => {
  res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
  const review = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...req.body
  };
  
  reviews.push(review);
  
  // Save to file
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2));
    res.status(201).json(review);
  } catch (error) {
    console.error('Error saving review:', error);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET /api/geocode');
  console.log('- GET /api/places');
  console.log('- GET /api/reviews');
  console.log('- POST /api/reviews');
});