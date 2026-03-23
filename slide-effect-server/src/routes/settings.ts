import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import nodemailer from 'nodemailer';

const router = Router();

// GET /api/admin/settings - Paramètres globaux
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM app_settings WHERE id = ?').get('global');
  
  if (!settings) {
    // Créer les paramètres par défaut
    db.prepare(`
      INSERT INTO app_settings (id, smtp_port, smtp_secure)
      VALUES ('global', 587, 0)
    `).run();
    const defaultSettings = db.prepare('SELECT * FROM app_settings WHERE id = ?').get('global') as any;
    res.json({ ...defaultSettings, smtp_pass: undefined }); // Ne pas exposer le mot de passe
    return;
  }

  // Masquer le mot de passe SMTP
  const settingsAny = settings as any;
  res.json({ ...settingsAny, smtp_pass: settingsAny.smtp_pass ? '********' : undefined });
});

// PUT /api/admin/settings/smtp - Config SMTP
router.put('/smtp', (req: Request, res: Response) => {
  const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure } = req.body;

  const db = getDb();
  
  // Récupérer les paramètres existants pour conserver le mot de passe si non fourni
  const existing = db.prepare('SELECT smtp_pass FROM app_settings WHERE id = ?').get('global') as any;
  
  db.prepare(`
    INSERT INTO app_settings (id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure, updated_at)
    VALUES ('global', ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT (id) DO UPDATE SET
      smtp_host = COALESCE(?, smtp_host),
      smtp_port = COALESCE(?, smtp_port),
      smtp_user = COALESCE(?, smtp_user),
      smtp_pass = COALESCE(?, smtp_pass),
      smtp_from = COALESCE(?, smtp_from),
      smtp_secure = COALESCE(?, smtp_secure),
      updated_at = datetime('now')
  `).run(
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_pass || (existing?.smtp_pass),
    smtp_from,
    smtp_secure,
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_pass,
    smtp_from,
    smtp_secure
  );

  res.json({ success: true, message: 'Configuration SMTP mise à jour' });
});

// POST /api/admin/settings/smtp/test - Test d'envoi email
router.post('/smtp/test', async (req: Request, res: Response) => {
  const { testEmail } = req.body;

  if (!testEmail) {
    res.status(400).json({ error: 'Adresse email de test requise' });
    return;
  }

  const db = getDb();
  const settings = db.prepare('SELECT * FROM app_settings WHERE id = ?').get('global') as any;

  if (!settings?.smtp_host || !settings?.smtp_user || !settings?.smtp_pass) {
    res.status(400).json({ error: 'Configuration SMTP incomplète' });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: settings.smtp_secure === 1,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: settings.smtp_from || settings.smtp_user,
      to: testEmail,
      subject: 'Test Slide Effect - Configuration SMTP',
      html: `
        <h2>Test de configuration SMTP</h2>
        <p>Cet email confirme que votre configuration SMTP fonctionne correctement.</p>
        <p>Date : ${new Date().toLocaleString('fr-FR')}</p>
        <hr>
        <p><small>Slide Effect - Digital Signage Platform</small></p>
      `,
    });

    res.json({ success: true, message: 'Email de test envoyé avec succès' });
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    res.status(500).json({ 
      error: 'Échec de l\'envoi', 
      details: error.message 
    });
  }
});

// PUT /api/admin/settings/branding - Branding
router.put('/branding', (req: Request, res: Response) => {
  const { branding_logo_url, branding_primary_color, platform_name, platform_tagline } = req.body;

  const db = getDb();
  db.prepare(`
    INSERT INTO app_settings (id, branding_logo_url, branding_primary_color, platform_name, platform_tagline, updated_at)
    VALUES ('global', ?, ?, ?, ?, datetime('now'))
    ON CONFLICT (id) DO UPDATE SET
      branding_logo_url = COALESCE(?, branding_logo_url),
      branding_primary_color = COALESCE(?, branding_primary_color),
      platform_name = COALESCE(?, platform_name),
      platform_tagline = COALESCE(?, platform_tagline),
      updated_at = datetime('now')
  `).run(
    branding_logo_url,
    branding_primary_color,
    platform_name,
    platform_tagline,
    branding_logo_url,
    branding_primary_color,
    platform_name,
    platform_tagline
  );

  res.json({ success: true, message: 'Branding mis à jour' });
});

// GET /api/admin/settings/widgets - Récupérer la config des widgets
router.get('/widgets', (req: Request, res: Response) => {
  const db = getDb();
  const settings = db.prepare('SELECT widgets_config FROM app_settings WHERE id = ?').get('global') as any;
  
  if (!settings?.widgets_config) {
    res.json([]);
    return;
  }
  
  try {
    const widgets = JSON.parse(settings.widgets_config);
    res.json(widgets);
  } catch {
    res.json([]);
  }
});

// PUT /api/admin/settings/widgets - Sauvegarder la config des widgets
router.put('/widgets', (req: Request, res: Response) => {
  const { widgets } = req.body;

  const db = getDb();
  db.prepare(`
    INSERT INTO app_settings (id, widgets_config, updated_at)
    VALUES ('global', ?, datetime('now'))
    ON CONFLICT (id) DO UPDATE SET
      widgets_config = ?,
      updated_at = datetime('now')
  `).run(
    JSON.stringify(widgets),
    JSON.stringify(widgets)
  );

  res.json({ success: true, message: 'Configuration des widgets mise à jour' });
});

export default router;
