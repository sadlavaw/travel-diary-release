const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const TRIP_FIELDS = 'id, user_id, title, description, cover_url, status, visibility, start_date, end_date, regions, tags, stops, legs, blocks, days, route, photos, participants, strava, created_at, updated_at';

// Search users by name or username (empty q = all users)
router.get('/search', auth, async (req, res) => {
  const { q } = req.query;
  try {
    if (!q) {
      const { rows } = await pool.query(
        `SELECT id, name, username, avatar, bio FROM users WHERE id != $1 ORDER BY name LIMIT 50`,
        [req.user.id]
      );
      return res.json(rows);
    }
    const { rows } = await pool.query(
      `SELECT id, name, username, avatar, bio
       FROM users
       WHERE id != $1 AND (name ILIKE $2 OR username ILIKE $2)
       LIMIT 10`,
      [req.user.id, `%${q}%`]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get user by id OR username (slug)
router.get('/by-slug/:slug', auth, async (req, res) => {
  const { slug } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, email, avatar, bio, created_at
       FROM users
       WHERE id::text = $1 OR username = $1`,
      [slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Користувача не знайдено' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get user by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, email, avatar, bio, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Користувача не знайдено' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get trips where user is a participant
router.get('/:id/participant-trips', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${TRIP_FIELDS.split(', ').map(f => 't.' + f).join(', ')},
              u.name as author_name, u.username as author_username, u.avatar as author_avatar
       FROM trips t JOIN users u ON t.user_id = u.id
       WHERE EXISTS (
           SELECT 1 FROM jsonb_array_elements(t.participants) p
           WHERE p->>'id' = $1
         )
       ORDER BY t.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get public trips for a user
router.get('/:id/trips', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${TRIP_FIELDS} FROM trips WHERE user_id = $1 AND visibility = 'public' ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
