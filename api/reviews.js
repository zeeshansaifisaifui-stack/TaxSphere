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

  if (rating === undefined || rating === null) {
    errors.push('Rating is required');
  } else {
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
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
      console.log('[GET /api/reviews] START');
      const { data, error } = await supabase
        .from('reviews')
        .select('id, name, rating, message, created_at, approved')

        .order('created_at', { ascending: false });

      if (error) {
        console.error('[GET /api/reviews] ERR code=' + error.code + ' msg=' + error.message);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
      }

      console.log('[GET /api/reviews] OK count=' + (data ? data.length : 0));
      const reviews = (data || []).map(r => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        review_text: r.message,
        message: r.message,
        created_at: r.created_at,
        approved: r.approved
      }));
      return res.status(200).json({ reviews: reviews });
    } catch (err) {
      console.error('[GET /api/reviews] EXC=' + err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('[POST /api/reviews] START');
      const body = req.body || {};
      const name = body.name;
      const rating = body.rating;
      const reviewContent = body.reviewText || body.message || body.review || body.text;

      const errors = validateReview(name, rating, reviewContent);
      if (errors.length > 0) {
        console.error('[POST /api/reviews] VAL_ERR=' + errors.join(';'));
        return res.status(400).json({ error: errors.join(', ') });
      }

      const trimmedName = String(name).trim();
      const trimmedText = String(reviewContent).trim();
      const numRating = Number(rating);

      const insertData = {
        name: trimmedName,
        rating: numRating,
        message: trimmedText,
        approved: true
      };

      console.log('[POST /api/reviews] INSERT name=' + trimmedName.substring(0, 20) + ' rating=' + numRating);

      const { data, error } = await supabase
        .from('reviews')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('[POST /api/reviews] DB_ERR code=' + error.code + ' msg=' + error.message);
        return res.status(500).json({ error: 'Failed to submit review' });
      }

      console.log('[POST /api/reviews] OK id=' + data.id);
      return res.status(201).json({
        message: 'Review submitted successfully. It will be visible after admin approval.',
        review: data
      });
    } catch (err) {
      console.error('[POST /api/reviews] EXC=' + err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
