const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const TRIP_FIELDS = 'id, user_id, title, description, cover_url, status, visibility, start_date, end_date, regions, tags, stops, legs, blocks, days, route, photos, participants, strava, created_at, updated_at';

// Всі подорожі поточного користувача
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${TRIP_FIELDS} FROM trips WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Публічні подорожі (для сторінки Explore)
router.get('/public', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${TRIP_FIELDS.split(', ').map(f => 't.' + f).join(', ')}, u.name as author_name, u.username as author_username, u.avatar as author_avatar
       FROM trips t JOIN users u ON t.user_id = u.id
       WHERE t.visibility = 'public' ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Одна подорож
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${TRIP_FIELDS.split(', ').map(f => 't.' + f).join(', ')},
              u.name as author_name, u.username as author_username, u.avatar as author_avatar
       FROM trips t JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не знайдено' });
    const trip = rows[0];
    if (trip.visibility === 'private' && trip.user_id !== req.user.id)
      return res.status(403).json({ error: 'Доступ заборонено' });
    res.json(trip);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Створити подорож
router.post('/', auth, async (req, res) => {
  const { title, description, cover_url, status, visibility, start_date, end_date, regions, tags, stops, legs, blocks, days, route, photos, participants, strava } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO trips (user_id, title, description, cover_url, status, visibility, start_date, end_date, regions, tags, stops, legs, blocks, days, route, photos, participants, strava)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING ${TRIP_FIELDS}`,
      [
        req.user.id, title, description, cover_url,
        status || 'planned', visibility || 'private',
        start_date || null, end_date || null,
        regions || [], tags || [],
        JSON.stringify(stops || []), JSON.stringify(legs || []),
        JSON.stringify(blocks || []), JSON.stringify(days || []),
        JSON.stringify(route || []), JSON.stringify(photos || []),
        JSON.stringify(participants || []),
        JSON.stringify(strava || {}),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Оновити подорож
router.put('/:id', auth, async (req, res) => {
  const { title, description, cover_url, status, visibility, start_date, end_date, regions, tags, stops, legs, blocks, days, route, photos, participants, strava } = req.body;
  try {
    const check = await pool.query('SELECT user_id FROM trips WHERE id = $1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Не знайдено' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Доступ заборонено' });

    const { rows } = await pool.query(
      `UPDATE trips SET
        title=$1, description=$2, cover_url=$3, status=$4, visibility=$5,
        start_date=$6, end_date=$7, regions=$8, tags=$9,
        stops=$10, legs=$11, blocks=$12, days=$13, route=$14, photos=$15,
        participants=$16, strava=$17, updated_at=NOW()
       WHERE id=$18 RETURNING ${TRIP_FIELDS}`,
      [
        title, description, cover_url, status, visibility,
        start_date || null, end_date || null, regions || [], tags || [],
        JSON.stringify(stops || []), JSON.stringify(legs || []),
        JSON.stringify(blocks || []), JSON.stringify(days || []),
        JSON.stringify(route || []), JSON.stringify(photos || []),
        JSON.stringify(participants || []),
        JSON.stringify(strava || {}),
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Видалити подорож
router.delete('/:id', auth, async (req, res) => {
  try {
    const check = await pool.query('SELECT user_id FROM trips WHERE id = $1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Не знайдено' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Доступ заборонено' });

    await pool.query('DELETE FROM trips WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
