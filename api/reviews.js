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
  
  if (rating === undefined || rating === null || typeof rating !== 'number') {
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
    if (trimmedText.length === 0) {
      errors.push('Review cannot be empty');
    }
  }
  
  return errors;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

module.exports = async (req, res) => {
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
      console.log('[GET /api/reviews] Fetching approved reviews');
      const { data, error } = await supabase
        .from('reviews')
        .select('id, name, rating, message, created_at, approved')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[GET /api/reviews] Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return res.status(500).json({ error: 'Failed to fetch reviews' });
      }

      console.log('[GET /api/reviews] Success, count:', data?.length || 0);
      const reviews = (data || []).map(r => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        review_text: r.message,
        message: r.message,
        created_at: r.created_at,
        approved: r.approved
      }));
      return res.status(200).json({ reviews });
    } catch (err) {
      console.error('[GET /api/reviews] Exception:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('[POST /api/reviews] Body:', JSON.stringify(req.body));
      const { name, rating, reviewText, message } = req.body;
      const reviewContent = reviewText || message;

      const errors = validateReview(name, rating, reviewContent);
      if (errors.length > 0) {
        console.error('[POST /api/reviews] Validation errors:', errors);
        return res.status(400).json({ error: errors.join(', ') });
      }

      const trimmedName = name.trim();
      const trimmedText = reviewContent.trim();

      const clientIP = getClientIP(req);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      try {
        const { data: recentSubmissions } = await supabase
          .from('reviews')
          .select('id')
          .gte('created_at', fiveMinutesAgo);

        if (recentSubmissions && recentSubmissions.length > 10) {
          return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
        }
      } catch (e) {
        console.error('[POST /api/reviews] Spam check error (non-fatal):', e.message);
      }

      const insertData = {
        name: trimmedName,
        rating: parseInt(rating),
        message: trimmedText,
        approved: false
      };

      console.log('[POST /api/reviews] Inserting:', { name: insertData.name, rating: insertData.rating, messageLength: insertData.message.length });

      const { data, error } = await supabase
        .from('reviews')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('[POST /api/reviews] Supabase insert error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return res.status(500).json({ error: 'Failed to submit review' });
      }

      console.log('[POST /api/reviews] Success, inserted id:', data.id);
      return res.status(201).json({ 
        message: 'Review submitted successfully. It will be visible after admin approval.',
        review: data 
      });
    } catch (err) {
      console.error('[POST /api/reviews] Exception:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
