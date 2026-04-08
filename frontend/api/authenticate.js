export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  if (password === adminPassword) {
    const token = Buffer.from(password).toString('base64');
    return res.status(200).json({
      success: true,
      token: token,
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid password',
  });
}
