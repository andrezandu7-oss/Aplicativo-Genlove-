app.post('/api/validate-genotype-qr', async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ error: 'Dados do QR não fornecidos' });
    }

    const parts = qrData.split('|').map(s => s.trim());
    if (parts.length !== 7) {
      return res.status(400).json({ error: 'Formato de QR inválido (7 champs requis)' });
    }

    const hmacRecu = parts.pop();
    const dataString = parts.join('|');
    const hmacCalcule = crypto.createHmac('sha256', QR_SECRET_HEALTH).update(dataString).digest('hex');

    if (hmacCalcule !== hmacRecu) {
      return res.status(401).json({ error: 'Assinatura inválida - Certificado não autenticado' });
    }

    const [numCert, firstName, lastName, genderCode, genotype, bloodGroup] = parts;
    const gender = genderCode === 'M' ? 'Homme' : 'Femme';

    const userData = {
      firstName,
      lastName,
      gender,
      genotype,
      bloodGroup,
      qrVerified: true,
      verificationBadge: 'lab'
    };

    res.json({ success: true, userData });
  } catch (error) {
    console.error('Erreur validation QR:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});