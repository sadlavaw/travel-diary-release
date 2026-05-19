const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get current user's friends
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.username, u.avatar, u.bio
       FROM user_friends uf
       JOIN users u ON uf.friend_id = u.id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add friend
router.post('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO user_friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id]
    );
    const { rows } = await pool.query(
      `SELECT id, name, username, avatar, bio FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Користувача не знайдено' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Remove friend
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM user_friends WHERE user_id = $1 AND friend_id = $2`,
      [req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
