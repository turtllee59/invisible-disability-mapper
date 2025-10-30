import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'reviews.json');

// Helper function to read reviews
function readReviews() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('Error reading reviews.json:', err);
    return [];
  }
}

// Helper function to write reviews
function writeReviews(reviews) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing reviews.json:', err);
    return false;
  }
}

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return all reviews
    const reviews = readReviews();
    res.json(reviews);
  } else if (req.method === 'POST') {
    // Add a new review
    const reviews = readReviews();
    const newReview = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...req.body
    };
    
    reviews.push(newReview);
    
    if (writeReviews(reviews)) {
      res.status(201).json(newReview);
    } else {
      res.status(500).json({ error: 'Failed to save review' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}