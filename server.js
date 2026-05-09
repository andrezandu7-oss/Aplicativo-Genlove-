// server.js - Version optimisée pour Render
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genlove';
const SESSION_SECRET = process.env.SESSION_SECRET || 'SNS-Angola-2026';
const QR_SECRET_HEALTH = process.env.QR_SECRET_HEALTH || 'HEALTH_HMAC_SECRET_2026_a1b2c3d4';

const app = express();

// ✅ Crucial pour Render : permet de lire les cookies via le proxy HTTPS
app.set('trust proxy', 1);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Configuration de la Session
app.use(session({
  secret: SESSION_SECRET,
  resave: true, // Forcer la sauvegarde pour éviter les pertes de session
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    ttl: 30 * 24 * 60 * 60 // 30 jours
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
    // On n'active le 'secure' QUE si on est sur Render avec HTTPS
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax'
  }
}));

// ====================== MODÈLES ======================
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  gender: String,
  dob: String,
  residence: String,
  region: { type: String, default: '' },
  genotype: { type: String, enum: ['AA', 'AS', 'SS'] },
  bloodGroup: String,
  desireChild: String,
  photo: String,
  language: { type: String, default: 'fr' },
  isVerified: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rejectedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  qrVerified: { type: Boolean, default: false },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }
}));

const Request = mongoose.model('Request', mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  viewed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));

// Middleware d'authentification renforcé par log
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    console.log("⚠️ Accès refusé : pas de session trouvée.");
    return res.status(401).json({ error: 'Non authentifié' });
  }
  next();
};

// ====================== ROUTES API ======================

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

    // ✅ On stocke l'ID dans la session
    req.session.userId = user._id;
    
    // ✅ On force la sauvegarde pour être sûr que Render l'enregistre avant la redirection
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: "Erreur de session" });
      console.log(`✅ Session créée pour : ${user.firstName}`);
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Insérer ici les autres routes : /api/matching, /api/requests, etc. du code précédent)

// ====================== GESTION DES PAGES ======================

app.get('/profile', (req, res) => {
  // On laisse le client gérer la redirection si 401 via fetch /api/me
  res.sendFile(path.join(__dirname, 'public', 'profil.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback : Rediriger vers l'accueil pour toute route inconnue
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Genlove actif sur le port ${PORT}`);
});
