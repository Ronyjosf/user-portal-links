import express from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import Sequelize from 'sequelize';
import { Sequelize as SequelizeClass, DataTypes } from 'sequelize';
import connectSessionSequelize from 'connect-session-sequelize';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup
const sequelize = new SequelizeClass(process.env.DATABASE_URL || {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'user_portal',
  logging: false,
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
});

const Link = sequelize.define('Link', {
  url: DataTypes.STRING,
  title: DataTypes.STRING,
});

User.hasMany(Link);
Link.belongsTo(User);

// Session store
const SequelizeStore = connectSessionSequelize(session.Store);
const sessionStore = new SequelizeStore({ db: sequelize });

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
}));

// Passport setup
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });
    req.login(user, err => {
      if (err) return res.status(500).json({ error: 'Login error' });
      res.json({ id: user.id, username: user.username });
    });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

app.post('/api/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out' });
  });
});

app.get('/api/user', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ id: req.user.id, username: req.user.username });
});

// Links CRUD
function ensureAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

app.get('/api/links', ensureAuth, async (req, res) => {
  const links = await Link.findAll({ where: { UserId: req.user.id } });
  res.json(links);
});

app.post('/api/links', ensureAuth, async (req, res) => {
  const { url, title } = req.body;
  const link = await Link.create({ url, title, UserId: req.user.id });
  res.json(link);
});

app.put('/api/links/:id', ensureAuth, async (req, res) => {
  const { url, title } = req.body;
  const link = await Link.findOne({ where: { id: req.params.id, UserId: req.user.id } });
  if (!link) return res.status(404).json({ error: 'Not found' });
  link.url = url;
  link.title = title;
  await link.save();
  res.json(link);
});

app.delete('/api/links/:id', ensureAuth, async (req, res) => {
  const link = await Link.findOne({ where: { id: req.params.id, UserId: req.user.id } });
  if (!link) return res.status(404).json({ error: 'Not found' });
  await link.destroy();
  res.json({ success: true });
});

// Sync DB and start server
(async () => {
  await sequelize.sync();
  sessionStore.sync();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
