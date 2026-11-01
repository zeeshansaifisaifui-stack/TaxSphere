const { supabase } = require('./supabase-client');
const crypto = require('crypto');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function authenticateAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === ADMIN_TOKEN;
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!authenticateAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get all reviews for admin (pending and approved)
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
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

  if (req.method === 'PATCH') {
    try {
      const { id } = req.query;
      const { approved } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Review ID is required' });
      }

      if (typeof approved !== 'boolean') {
        return res.status(400).json({ error: 'Approved must be boolean' });
      }

      const { data, error } = await supabase
        .from('reviews')
        .update({ approved: approved })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating review:', error);
        return res.status(500).json({ error: 'Failed to update review' });
      }

      return res.status(200).json({ 
        message: approved ? 'Review approved' : 'Review rejected',
        review: data 
      });
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Review ID is required' });
      }

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({ error: 'Failed to delete review' });
      }

      return res.status(200).json({ message: 'Review deleted' });
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
