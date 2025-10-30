export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filter, categories, name } = req.query;
  
  if (!filter) {
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
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Places error:', error);
    res.status(500).json({ error: 'Places search failed' });
  }
}