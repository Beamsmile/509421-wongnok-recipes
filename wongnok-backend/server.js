// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5500'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('ไม่อนุญาต origin นี้'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());

app.use(session({
  secret: 'wongnok-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'wongnok'
});

db.connect(err => {
  if (err) {
    console.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
    return;
  }
  console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');
});

// ==== API ดึง session ผู้ใช้ ====
app.get('/api/me', (req, res) => {
  if (req.session.userId) {
    res.json({ userId: req.session.userId });
  } else {
    res.status(401).json({ error: 'ยังไม่ได้เข้าสู่ระบบ' });
  }
});

// ==== สมัครสมาชิก ====
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(query, [username, email, password], (err, result) => {
    if (err) return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัคร' });
    res.json({ success: true });
  });
});

// ==== เข้าสู่ระบบ ====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    if (results.length === 0) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    req.session.userId = results[0].id;
    res.json({ success: true });
  });
});

// ==== เพิ่มเมนู ====
app.post('/api/recipes', (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });

  const { name, image, ingredients, steps, time, difficulty } = req.body;
  const query = `INSERT INTO recipes (user_id, name, image, ingredients, steps, time, difficulty)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(query, [userId, name, image, ingredients, steps, time, difficulty], (err, result) => {
    if (err) return res.status(500).json({ error: 'บันทึกเมนูล้มเหลว' });
    res.json({ success: true });
  });
});

// ==== ดึงเมนูของผู้ใช้ ====
app.get('/api/recipes', (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });

  const query = 'SELECT * FROM recipes WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'ดึงข้อมูลเมนูล้มเหลว' });
    res.json(results);
  });
});

// ==== ลบเมนู ====
app.delete('/api/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });

  const query = 'DELETE FROM recipes WHERE id = ? AND user_id = ?';
  db.query(query, [recipeId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'ลบเมนูล้มเหลว' });
    res.json({ success: true });
  });
});

// ==== แก้ไขเมนู ====
app.put('/api/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });

  const { name, image, ingredients, steps, time, difficulty } = req.body;
  const query = `UPDATE recipes SET name=?, image=?, ingredients=?, steps=?, time=?, difficulty=? WHERE id=? AND user_id=?`;
  db.query(query, [name, image, ingredients, steps, time, difficulty, recipeId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'แก้ไขเมนูล้มเหลว' });
    res.json({ success: true });
  });
});

// ==== ค้นหาเมนู ====
app.get('/api/search', (req, res) => {
  const { name, time, difficulty } = req.query;
  let query = 'SELECT * FROM recipes WHERE 1=1';
  const params = [];

  if (name) {
    query += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }
  if (time) {
    query += ' AND time = ?';
    params.push(time);
  }
  if (difficulty) {
    query += ' AND difficulty = ?';
    params.push(difficulty);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'ค้นหาเมนูล้มเหลว' });
    res.json(results);
  });
});

// ==== ให้คะแนน ====
app.post('/api/rate', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });

  const { recipeId, rating } = req.body;
  try {
    const [owner] = await db.promise().query('SELECT user_id FROM recipes WHERE id = ?', [recipeId]);
    if (owner[0]?.user_id === userId) {
      return res.status(400).json({ message: 'คุณไม่สามารถให้คะแนนสูตรของตัวเองได้' });
    }

    const [existing] = await db.promise().query('SELECT * FROM ratings WHERE user_id = ? AND recipe_id = ?', [userId, recipeId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'คุณให้คะแนนสูตรนี้ไปแล้ว' });
    }

    await db.promise().query('INSERT INTO ratings (user_id, recipe_id, rating) VALUES (?, ?, ?)', [userId, recipeId, rating]);
    res.json({ message: 'ให้คะแนนสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลลาด' });
  }
});

// ==== เริ่มเซิร์ฟเวอร์ ====
app.listen(port, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${port}`);
});
