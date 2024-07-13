import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { findFelhasznaloByEmail } from './db.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Csak PDF-eket engedünk feltölteni'));
    }
  },
});

const setupMiddlewares = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(currentDir, 'uploads')));
  app.use(express.static('public'));
};

export const authenticateFelhasznalo = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send('Email and password are required');
    return;
  }

  try {
    const felhasznalo = await findFelhasznaloByEmail(email);
    if (!felhasznalo || !felhasznalo.password) {
      res.status(401).send('Invalid email or password');
      return;
    }

    const isMatch = await bcrypt.compare(password, felhasznalo.password);
    if (!isMatch) {
      res.status(401).send('Invalid email or password');
      return;
    }

    req.session.felhasznalo = {
      id: felhasznalo.id,
      nev: felhasznalo.nev,
      email: felhasznalo.email,
      rang: felhasznalo.rang,
    };
    next();
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).send('Internal server error');
  }
};

export const logoutFelhasznalo = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    return res.redirect('/');
  });
};

export const ensureAuthenticated = (req, res, next) => {
  if (req.session.felhasznalo) {
    return next();
  }

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return res.redirect('/login');
};

const activeUsers = new Map();

export function saveActiveUser(userId) {
  activeUsers.set(userId, Date.now());
}

export function removeActiveUser(userId) {
  activeUsers.delete(userId);
}

export function getActiveUsers() {
  return Array.from(activeUsers.keys());
}

export function cleanupInactiveUsers() {
  const now = Date.now();
  const timeout = 15 * 60 * 1000; // 15 perc
  Array.from(activeUsers.entries()).forEach(([userId, timestamp]) => {
    if (now - timestamp > timeout) {
      activeUsers.delete(userId);
    }
  });
}

export function updateUserActivity(userId) {
  if (activeUsers.has(userId)) {
    activeUsers.set(userId, Date.now());
  }
}

export { upload, setupMiddlewares };
