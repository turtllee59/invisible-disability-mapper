export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filter, categories, name } = req.query;
  
  if (!filter) {
    return res.status(400).json({ error: 'Filter parameter required' });
  }
  
  try {
    // Use the correct Geoapify Places API endpoint with proper parameter format
    let url = `https://api.geoapify.com/v2/places?`;
    
    // Parse and format the filter parameter correctly for Geoapify
    if (filter.startsWith('circle:')) {
      // Format: circle:lon,lat,radius
      const coords = filter.replace('circle:', '');
      url += `filter=circle:${coords}`;
    } else if (filter.startsWith('rect:')) {
      // Format: rect:lon1,lat1,lon2,lat2  
      const bounds = filter.replace('rect:', '');
      url += `filter=rect:${bounds}`;
    } else {
      url += `filter=${encodeURIComponent(filter)}`;
    }
    
    // If no categories specified, use a broad commercial category
    const categoriesParam = categories || 'commercial';
    url += `&categories=${categoriesParam}`;
    
    if (name) {
      url += `&name=${encodeURIComponent(name)}`;
    }
    
    url += `&limit=100&apiKey=${process.env.GEOAPIFY_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Places error:', error);
    res.status(500).json({ error: 'Places search failed' });
  }
}