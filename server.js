const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const app = express();
const port = process.env.PORT || 3000;

// ====================== CONEXÃO MONGODB ======================
const mongouRI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genlove';

mongoose.connect(mongouRI)
  .then(() => console.log("✅ Conectado ao MongoDB para Genlove!"))
  .catch(err => console.error("❌ Erro de conexão MongoDB:", err));

// ====================== ASSINATURA SECRETA ======================
const SECRET_SIGNATURE = "SNS-Angola-2026";

// ====================== CONFIGURAÇÃO DE SESSÃO ======================
app.set('trust proxy', 1);

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'genlove-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  store: new MongoDBStore({
    uri: mongouRI,
    collection: 'sessions'
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

// ====================== MODELOS DE DADOS ======================
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

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }
});

const requestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  viewed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Request = mongoose.model('Request', requestSchema);

// ====================== MIDDLEWARE ======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/');
  next();
};

// ====================== TRADUÇÕES ======================
const translations = {
  fr: {
    appName: 'Genlove',
    slogan: 'Unissez cœur et santé pour bâtir des couples sains',
    security: 'Vos données de santé sont cryptées',
    welcome: 'Bienvenue sur Genlove',
    haveAccount: 'Avez-vous déjà un compte ?',
    login: 'Se connecter',
    createAccount: 'Créer un compte',
    loginTitle: 'Connexion',
    enterName: 'Entrez votre prénom pour vous connecter',
    yourName: 'Votre prénom',
    backHome: 'Retour à l\'accueil',
    nameNotFound: 'Prénom non trouvé. Veuillez créer un compte.',
    charterTitle: 'La Charte d\'Honneur',
    charterSubtitle: 'Lisez attentivement ces 5 engagements',
    scrollDown: 'Faites défiler jusqu\'en bas',
    accept: 'J\'accepte et je continue',
    oath1: '1. Le Serment de Sincérité',
    oath1Sub: 'Vérité Médicale',
    oath1Text: 'Je m\'engage sur l\'honneur à fournir des informations exactes concernant mon génotype et mes données de santé.',
    oath2: '2. Le Pacte de Confidentialité',
    oath2Sub: 'Secret Partagé',
    oath2Text: 'Je m\'engage à garder confidentielles toutes les informations personnelles et médicales.',
    oath3: '3. Le Principe de Non-Discrimination',
    oath3Sub: 'Égalité de Respect',
    oath3Text: 'Je traite chaque membre avec dignité, quel que soit son génotype.',
    oath4: '4. La Responsabilité Préventive',
    oath4Sub: 'Orientation Santé',
    oath4Text: 'J\'accepte les mesures de protection comme le filtrage des compatibilités à risque.',
    oath5: '5. La Bienveillance Éthique',
    oath5Sub: 'Courtoisie',
    oath5Text: 'J\'adopte une conduite exemplaire et respectueuse dans mes messages.',
    signupTitle: 'Créer mon profil',
    signupSub: 'Toutes les informations sont confidentielles',
    firstName: 'Prénom',
    lastName: 'Nom',
    gender: 'Genre',
    male: 'Homme',
    female: 'Femme',
    dob: 'Date de naissance',
    city: 'Ville de résidence',
    region: 'Région',
    allRegions: 'Toutes les régions',
    myRegion: 'Ma région uniquement',
    genotype: 'Génotype',
    bloodGroup: 'Groupe sanguin',
    desireChild: 'Désir d\'enfant ?',
    yes: 'Oui',
    no: 'Non',
    createProfile: 'Créer mon profil',
    backCharter: '← Retour à la charte',
    required: 'obligatoire',
    honorTitle: 'Serment d\'Honneur',
    honorText: 'Je confirme sur mon honneur que mes informations sont sincères et conformes à la réalité.',
    swear: 'Je le jure',
    accessProfile: 'Accéder à mon profil',
    myProfile: 'Mon Profil',
    home: 'Accueil',
    messages: 'Messages',
    settings: 'Paramètres',
    genotype_label: 'Génotype',
    blood_label: 'Groupe',
    age_label: 'Âge',
    residence_label: 'Résidence',
    region_label: 'Région',
    project_label: 'Projet',
    findPartner: 'Trouver un partenaire',
    editProfile: 'Modifier mon profil',
    compatiblePartners: 'Partenaires compatibles',
    noPartners: 'Aucun partenaire trouvé pour le moment',
    searchOngoing: 'Recherche en cours...',
    expandCommunity: 'Nous élargissons notre communauté. Revenez bientôt !',
    details: 'Détails',
    contact: 'Contacter',
    backProfile: '← Mon profil',
    toMessages: 'Messages →',
    healthCommitment: 'Votre engagement santé',
    popupMessageAS: 'En tant que profil AS, nous ne vous présentons que des partenaires AA. Ce choix responsable garantit la sérénité de votre futur foyer et protège votre descendance contre la drépanocytose.',
    popupMessageSS: 'En tant que profil SS, nous ne vous présentons que des partenaires AA. Ce choix responsable garantit la sérénité de votre futur foyer et protège votre descendance contre la drépanocytose.',
    understood: 'J\'ai compris',
    inboxTitle: 'Boîte de réception',
    emptyInbox: 'Boîte vide',
    startConversation: 'Commencez une conversation !',
    findPartners: 'Trouver des partenaires',
    block: 'Bloquer',
    unblock: 'Débloquer',
    yourMessage: 'Votre message...',
    send: 'Envoyer',
    blockedByUser: 'Conversation impossible',
    blockedMessage: 'Cet utilisateur vous a bloqué. Vous ne pouvez pas lui envoyer de messages.',
    settingsTitle: 'Paramètres',
    visibility: 'Visibilité du profil',
    notifications: 'Notifications push',
    language: 'Langue',
    blockedUsers: 'Utilisateurs bloqués',
    dangerZone: 'ZONE DE DANGER',
    deleteAccount: 'Supprimer mon compte',
    delete: 'Supprimer',
    logout: 'Déconnexion',
    confirmDelete: 'Supprimer définitivement ?',
    noBlocked: 'Aucun utilisateur bloqué',
    thankYou: 'Merci pour cet échange',
    thanksMessage: 'Genlove vous remercie',
    newSearch: 'Nouvelle recherche',
    logoutSuccess: 'Déconnexion réussie',
    seeYouSoon: 'À bientôt !',
    french: 'Français',
    english: 'English',
    portuguese: 'Português',
    spanish: 'Español',
    arabic: 'العربية',
    chinese: '中文',
    pageNotFound: 'Page non trouvée',
    pageNotFoundMessage: 'La page que vous cherchez n\'existe pas.',
    project_life: 'Projet de vie',
    interestPopup: '{name} est très attiré par votre profil car vous partagez une bonne compatibilité. Pouvez-vous prendre quelques minutes pour échanger ?',
    acceptRequest: 'Accepter',
    rejectRequest: 'Refuser',
    rejectionPopup: 'Désolé, {name} n\'a pas donné une suite favorable à votre demande. Lancez d\'autres recherches.',
    gotIt: 'J\'ai compris',
    returnProfile: 'Mon profil',
    newMatch: 'Nouvelle recherche',
    sendingRequest: 'Votre demande est en cours d\'envoi...',
    requestSent: 'Demande envoyée !',
    january: 'Janvier',
    february: 'Février',
    march: 'Mars',
    april: 'Avril',
    may: 'Mai',
    june: 'Juin',
    july: 'Juillet',
    august: 'Août',
    september: 'Septembre',
    october: 'Octobre',
    november: 'Novembre',
    december: 'Décembre',
    day: 'Jour',
    month: 'Mois',
    year: 'Année',
    withCertificate: 'Avec certificat médical',
    manualEntry: 'Manuellement',
    scanAutomatic: 'Scan automatique de vos données',
    freeEntry: 'Saisie libre de vos informations',
    dataFromCertificate: 'Données issues de votre certificat',
    locationHelp: 'Aider les personnes les plus proches de chez vous à vous contacter facilement',
    yourLocation: 'Votre localisation',
    lifeProject: 'Projet de vie',
    medicalData: 'DONNÉES CERTIFICAT MÉDICAL',
    nonModifiable: 'NON MODIFIABLES',
    protectedSource: 'Protégé (source: certificat)',
    personalData: 'DONNÉES PERSONNELLES',
    modifiable: 'MODIFIABLES',
    errorOccurred: 'Erreur lors de la modification',
    automaticData: 'DONNÉES AUTOMATIQUES',
    certificate: 'CERTIFICAT',
    labCertified: 'Certifié par laboratoire',
    selfDeclared: 'Auto-déclaré',
    confidentiality: 'CONFIDENTIALITÉ',
    currentStatus: 'Statut actuel',
    public: 'Public',
    private: 'Privé',
    modify: 'Modifier',
    sectionTitle: 'Aidez vos partenaires à en savoir un peu plus sur vous',
    subText: 'Veuillez remplir les cases ci-dessous :',
    photoPlaceholder: 'Ajouter photo',
    birthDate: 'Date de naissance'
  },
  en: {
    appName: 'Genlove',
    slogan: 'Unite heart and health to build healthy couples',
    security: 'Your health data is encrypted',
    welcome: 'Welcome to Genlove',
    haveAccount: 'Already have an account?',
    login: 'Login',
    createAccount: 'Create account',
    loginTitle: 'Login',
    enterName: 'Enter your first name to login',
    yourName: 'Your first name',
    backHome: 'Back to home',
    nameNotFound: 'Name not found. Please create an account.',
    charterTitle: 'The Honor Charter',
    charterSubtitle: 'Read these 5 commitments carefully',
    scrollDown: 'Scroll to the bottom',
    accept: 'I accept and continue',
    oath1: '1. The Oath of Sincerity',
    oath1Sub: 'Medical Truth',
    oath1Text: 'I pledge on my honor to provide accurate information about my genotype and health data.',
    oath2: '2. The Pact of Confidentiality',
    oath2Sub: 'Shared Secret',
    oath2Text: 'I commit to keeping all personal and medical information confidential.',
    oath3: '3. The Principle of Non-Discrimination',
    oath3Sub: 'Equality of Respect',
    oath3Text: 'I treat every member with dignity, regardless of their genotype.',
    oath4: '4. Preventive Responsibility',
    oath4Sub: 'Health Orientation',
    oath4Text: 'I accept protective measures such as filtering risky compatibilities.',
    oath5: '5. Ethical Benevolence',
    oath5Sub: 'Courtesy',
    oath5Text: 'I adopt exemplary and respectful conduct in my messages.',
    signupTitle: 'Create my profile',
    signupSub: 'All information is confidential',
    firstName: 'First name',
    lastName: 'Last name',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    dob: 'Date of birth',
    city: 'City of residence',
    region: 'Region',
    allRegions: 'All regions',
    myRegion: 'My region only',
    genotype: 'Genotype',
    bloodGroup: 'Blood group',
    desireChild: 'Desire for children?',
    yes: 'Yes',
    no: 'No',
    createProfile: 'Create my profile',
    backCharter: '← Back to charter',
    required: 'required',
    honorTitle: 'Oath of Honor',
    honorText: 'I confirm on my honor that my information is sincere and conforms to reality.',
    swear: 'I swear',
    accessProfile: 'Access my profile',
    myProfile: 'My Profile',
    home: 'Home',
    messages: 'Messages',
    settings: 'Settings',
    genotype_label: 'Genotype',
    blood_label: 'Blood',
    age_label: 'Age',
    residence_label: 'Residence',
    region_label: 'Region',
    project_label: 'Project',
    findPartner: 'Find a partner',
    editProfile: 'Edit my profile',
    compatiblePartners: 'Compatible partners',
    noPartners: 'No partners found at the moment',
    searchOngoing: 'Search in progress...',
    expandCommunity: 'We are expanding our community. Come back soon!',
    details: 'Details',
    contact: 'Contact',
    backProfile: '← My profile',
    toMessages: 'Messages →',
    healthCommitment: 'Your health commitment',
    popupMessageAS: 'As an AS profile, we only show you AA partners. This responsible choice guarantees the serenity of your future family and protects your offspring against sickle cell disease.',
    popupMessageSS: 'As an SS profile, we only show you AA partners. This responsible choice guarantees the serenity of your future family and protects your offspring against sickle cell disease.',
    understood: 'I understand',
    inboxTitle: 'Inbox',
    emptyInbox: 'Empty inbox',
    startConversation: 'Start a conversation!',
    findPartners: 'Find partners',
    block: 'Block',
    unblock: 'Unblock',
    yourMessage: 'Your message...',
    send: 'Send',
    blockedByUser: 'Conversation impossible',
    blockedMessage: 'This user has blocked you. You cannot send them messages.',
    settingsTitle: 'Settings',
    visibility: 'Profile visibility',
    notifications: 'Push notifications',
    language: 'Language',
    blockedUsers: 'Blocked users',
    dangerZone: 'DANGER ZONE',
    deleteAccount: 'Delete my account',
    delete: 'Delete',
    logout: 'Logout',
    confirmDelete: 'Delete permanently?',
    noBlocked: 'No blocked users',
    thankYou: 'Thank you for this exchange',
    thanksMessage: 'Genlove thanks you',
    newSearch: 'New search',
    logoutSuccess: 'Logout successful',
    seeYouSoon: 'See you soon!',
    french: 'French',
    english: 'English',
    portuguese: 'Portuguese',
    spanish: 'Spanish',
    arabic: 'Arabic',
    chinese: 'Chinese',
    pageNotFound: 'Page not found',
    pageNotFoundMessage: 'The page you are looking for does not exist.',
    project_life: 'Life project',
    interestPopup: '{name} is very attracted to your profile because you share good compatibility. Can you take a few minutes to chat?',
    acceptRequest: 'Accept',
    rejectRequest: 'Reject',
    rejectionPopup: 'Sorry, {name} did not give a favorable response to your request. Start other searches.',
    gotIt: 'Got it',
    returnProfile: 'My profile',
    newMatch: 'New search',
    sendingRequest: 'Your request is being sent...',
    requestSent: 'Request sent!',
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
    day: 'Day',
    month: 'Month',
    year: 'Year',
    withCertificate: 'With medical certificate',
    manualEntry: 'Manually',
    scanAutomatic: 'Automatic scan of your data',
    freeEntry: 'Free entry of your information',
    dataFromCertificate: 'Data from your certificate',
    locationHelp: 'Help people near you to contact you easily',
    yourLocation: 'Your location',
    lifeProject: 'Life project',
    medicalData: 'MEDICAL CERTIFICATE DATA',
    nonModifiable: 'NON-MODIFIABLE',
    protectedSource: 'Protected (source: certificate)',
    personalData: 'PERSONAL DATA',
    modifiable: 'MODIFIABLE',
    errorOccurred: 'Error during modification',
    automaticData: 'AUTOMATIC DATA',
    certificate: 'CERTIFICATE',
    labCertified: 'Certified by laboratory',
    selfDeclared: 'Self-declared',
    confidentiality: 'CONFIDENTIALITY',
    currentStatus: 'Current status',
    public: 'Public',
    private: 'Private',
    modify: 'Edit',
    sectionTitle: 'Help your partners know more about you',
    subText: 'Please fill in the fields below.',
    photoPlaceholder: 'Add photo',
    birthDate: 'Date of birth'
  }
};

// ====================== MIDDLEWARE DE TRADUCTION ======================
app.use(async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      req.lang = (user && user.language) ? user.language : 'fr';
    } catch {
      req.lang = 'fr';
    }
  } else {
    const acceptLanguage = req.headers['accept-language'] || '';
    if (acceptLanguage.includes('pt')) req.lang = 'pt';
    else if (acceptLanguage.includes('es')) req.lang = 'es';
    else if (acceptLanguage.includes('ar')) req.lang = 'ar';
    else if (acceptLanguage.includes('zh')) req.lang = 'zh';
    else if (acceptLanguage.includes('en')) req.lang = 'en';
    else req.lang = 'fr';
  }
  req.t = (key, params = {}) => {
    let text = translations[req.lang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
    return text;
  };
  next();
});

// ====================== STYLES CSS ======================
const styles = `
<style>
  /* Votre CSS ici */
</style>
`;

// ====================== NOTIFICATION SCRIPT ======================
const notifyScript = `
<script>
  function showNotify(msg, type) {
    const n = document.getElementById('genlove-notify');
    const m = document.getElementById('notify-msg');
    if(m) m.innerText = msg;
    if(n) {
      n.style.backgroundColor = type === 'success' ? '#4CAF50' : '#1a2a44';
      n.classList.add('show');
    }
    setTimeout(() => n.classList.remove('show'), 3000);
  }
  function vibrate(pattern) {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  }
</script>
`;

// ====================== FONCTIONS UTILITAIRES ======================
function calculerAge(dateNaissance) {
  if (!dateNaissance) return "?";
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function formatTimeAgo(timestamp, lang = 'fr') {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (lang === 'fr') {
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  } else if (lang === 'en') {
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US');
  } else if (lang === 'pt') {
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} horas atrás`;
    if (diffDays === 1) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  }
  return date.toLocaleDateString();
}

function generateDateOptions(req, selectedDate = null) {
  const t = req.t;
  const lang = req.lang;
  const months = {
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  };
  const monthList = months[lang] || months.fr;
  const currentYear = new Date().getFullYear();
  const selected = selectedDate ? new Date(selectedDate) : null;
  
  let html = '<div class="custom-date-picker">';
  
  html += '<select name="day" class="date-part" required><option value="">' + t('day') + '</option>';
  for (let d = 1; d <= 31; d++) {
    const sel = (selected && selected.getDate() === d) ? 'selected' : '';
    html += `<option value="${d}" ${sel}>${d}</option>`;
  }
  html += '</select>';
  
  html += '<select name="month" class="date-part" required><option value="">' + t('month') + '</option>';
  for (let m = 0; m < 12; m++) {
    const monthVal = m + 1;
    const sel = (selected && selected.getMonth() === m) ? 'selected' : '';
    html += `<option value="${monthVal}" ${sel}>${monthList[m]}</option>`;
  }
  html += '</select>';
  
  html += '<select name="year" class="date-part" required><option value="">' + t('year') + '</option>';
  for (let y = currentYear - 100; y <= currentYear - 18; y++) {
    const sel = (selected && selected.getFullYear() === y) ? 'selected' : '';
    html += `<option value="${y}" ${sel}>${y}</option>`;
  }
  html += '</select></div>';
  
  return html;
}

// ====================== ROUTES ======================
app.get('/lang/:lang', async (req, res) => {
  const lang = req.params.lang;
  if (['fr', 'en', 'pt', 'es', 'ar', 'zh'].includes(lang)) {
    if (req.session.userId) {
      await User.findByIdAndUpdate(req.session.userId, { language: lang });
    }
    req.session.lang = lang;
  }
  res.redirect(req.get('referer') || '/');
});

// ... (le reste de vos routes, y compris /signup-qr, etc.)

// ====================== VALIDAÇÃO DO QR ======================
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
      return res.status(401).json({ error: 'Assinatura inválida - Certificado não autenticado' });
    }
    const userData = {
      firstName: parts[0],
      lastName: parts[1],
      gender: parts[2] === 'M' ? 'Homme' : 'Femme',
      genotype: parts[3],
      bloodGroup: parts[4],
      qrVerified: true,
      verificationBadge: 'lab'
    };
    res.json({ success: true, userData });
  } catch (error) {
    console.error('Erro na validação do QR:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ====================== DÉMARRAGE ======================
app.listen(port, () => {
  console.log(`🚀 Genlove rodando na porta ${port}`);
});