const { supabase } = require('./supabase-client');

function validateReview(name, rating, reviewText) {
  const errors = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
  } else {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (trimmedName.length > 80) {
      errors.push('Name must be 80 characters or less');
    }
  }
  
  if (!rating || typeof rating !== 'number') {
    errors.push('Rating is required');
  } else {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      errors.push('Rating must be between 1 and 5');
    }
  }
  
  if (!reviewText || typeof reviewText !== 'string') {
    errors.push('Review text is required');
  } else {
    const trimmedText = reviewText.trim();
    if (trimmedText.length < 30) {
      errors.push('Review must be at least 30 characters');
    } else if (trimmedText.length > 600) {
      errors.push('Review must be 600 characters or less');
    }
  }
  
  return errors;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Only return approved reviews for public access
      const { data, error } = await supabase
        .from('reviews')
        .select('id, name, rating, review_text, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
      }

      return res.status(200).json({ reviews: data || [] });
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, rating, reviewText } = req.body;

      // Validate input
      const errors = validateReview(name, rating, reviewText);
      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', ') });
      }

      const trimmedName = name.trim();
      const trimmedText = reviewText.trim();

      // Basic spam protection - check for very recent submissions from same IP
      const clientIP = getClientIP(req);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Only check if ip_address column exists
      try {
        const { data: recentSubmissions } = await supabase
          .from('reviews')
          .select('id')
          .eq('ip_address', clientIP)
          .gte('created_at', fiveMinutesAgo);

        if (recentSubmissions && recentSubmissions.length > 0) {
          return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
        }
      } catch (e) {
        // If ip_address column doesn't exist yet, skip spam check
      }

      // Insert review as pending (not approved) - compatible with existing schema
      const insertData = {
        name: trimmedName,
        rating: parseInt(rating),
        review_text: trimmedText,
        approved: false
      };
      
      // Add optional fields if they exist
      try {
        insertData.ip_address = clientIP;
        insertData.user_agent = req.headers['user-agent'] || 'unknown';
      } catch (e) {
        // Skip if columns don't exist
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error inserting review:', error);
        return res.status(500).json({ error: 'Failed to submit review' });
      }

      return res.status(201).json({ 
        message: 'Review submitted successfully. It will be visible after admin approval.',
        review: data 
      });
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
