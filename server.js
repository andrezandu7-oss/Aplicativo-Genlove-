// ============================================
// API - MODIFIER EMAIL
// ============================================
app.put('/api/user/update-email', requireAuth, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.session.userId;

    if (!newEmail || !password) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }

    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: "Format d'email invalide" });
    }

    user.email = newEmail;
    await user.save();

    res.json({ success: true, message: "Email modifié avec succès" });

  } catch(error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la modification" });
  }
});

// ============================================
// API - MODIFIER MOT DE PASSE
// ============================================
app.put('/api/user/update-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Les mots de passe ne correspondent pas" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Mot de passe modifié avec succès" });

  } catch(error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la modification" });
  }
});