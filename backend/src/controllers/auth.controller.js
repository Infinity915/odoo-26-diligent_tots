const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecret_hackathon_key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    // Decode without verifying signature for hackathon purpose
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) {
      return res.status(401).json({ error: 'User not authorized in TransOps' });
    }

    const nativeToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecret_hackathon_key',
      { expiresIn: '24h' }
    );

    res.json({ success: true, data: { token: nativeToken, userData: { id: user.id, email: user.email, role: user.role } } });
  } catch (err) {
    res.status(500).json({ error: 'SSO Login failed', details: err.message });
  }
};

module.exports = { login, googleLogin };
