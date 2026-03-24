const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();

console.log("🚀 Serveur en cours de démarrage...");
const port = process.env.PORT || 3000;

const mongouRI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genlove';

mongoose.connect(mongouRI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro MongoDB:', err));

const SECRET_SIGNATURE = "SNS-Angola-2026";

app.set('trust proxy', 1);

const sessionConfig = {
  secret: SECRET_SIGNATURE,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongouRI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  },
  proxy: true
};

app.use(session(sessionConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====================== MODÈLES ======================
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: String,
  dob: String,
  residence: String,
  region: { type: String, default: "" },
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
  verifiedBy: String,
  verifiedAt: Date,
  verificationBadge: { type: String, enum: ['none', 'self', 'lab'], default: 'none' }
});

const User = mongoose.model('User', userSchema);

// ====================== ROUTE DE VALIDATION QR ======================
app.post('/api/validate-genotype-qr', async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ error: 'Dados do QR não fornecidos' });
    }
    const parts = qrData.split('|').map(s => s.trim());
    if (parts.length !== 6) {
      return res.status(400).json({ error: 'Formato de QR inválido' });
    }
    const signature = parts[5];
    if (signature !== SECRET_SIGNATURE) {
      return res.status(401).json({ error: 'Assinatura inválida' });
    }
    res.json({
      success: true,
      userData: {
        firstName: parts[0],
        lastName: parts[1],
        gender: parts[2] === 'M' ? 'Homem' : 'Mulher',
        genotype: parts[3],
        bloodGroup: parts[4],
        qrVerified: true,
        verificationBadge: 'lab'
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// ====================== ROUTE D'INSCRIPTION ======================
app.post('/api/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    req.session.userId = user._id;
    await new Promise(resolve => req.session.save(resolve));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================== DÉMARRAGE ======================
app.listen(port, () => {
  console.log(`🚀 Genlove rodando na porta ${port}`);
});