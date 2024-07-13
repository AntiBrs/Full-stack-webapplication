import { Router } from 'express';
import fs from 'fs';
import bcrypt from 'bcrypt';
import session from 'express-session';
import {
  insertTantargy,
  findAllTantargyak,
  deleteTantargy,
  findFeladatokByTantargyId,
  insertFeladat,
  findAllFelhasznalok,
  insertFelhasznalo,
  addGrade,
  updateFelhasznaloRang,
  findJegyekWithAverage,
  findTantargyById,
} from './db.js';
import {
  upload,
  authenticateFelhasznalo,
  logoutFelhasznalo,
  ensureAuthenticated,
  saveActiveUser,
  removeActiveUser,
  getActiveUsers,
  cleanupInactiveUsers,
  updateUserActivity,
} from './middleware.js';

const router = Router();

router.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

router.use((req, res, next) => {
  cleanupInactiveUsers();
  if (req.session && req.session.felhasznalo) {
    saveActiveUser(req.session.felhasznalo.id);
    updateUserActivity(req.session.felhasznalo.id);
  } else {
    removeActiveUser(req.session.felhasznalo?.id);
  }
  next();
});

router.get('/', async (req, res) => {
  req.app.set('view engine', 'ejs');
  const tantargyak = await findAllTantargyak();
  res.render('index', { tantargyak, user: req.session.felhasznalo });
});

router.get('/subjects', ensureAuthenticated, async (req, res) => {
  req.app.set('view engine', 'ejs');
  const tantargyak = await findAllTantargyak();
  const felhasznalok = await findAllFelhasznalok();
  res.render('subject', { tantargyak, felhasznalok, user: req.session.felhasznalo });
});

router.post('/addSubject', ensureAuthenticated, async (req, res) => {
  try {
    const userRang = req.session.felhasznalo.rang;

    if (userRang !== 1 && userRang !== 2) {
      return res.status(403).send('Hozzáférés megtagadva: Csak tanárok vagy adminok adhatnak hozzá tantárgyat.');
    }

    const felhasznaloId = userRang === 1 ? req.body.felhasznaloId : req.session.felhasznalo.id;

    const it = await insertTantargy({
      tantargyNev: req.body.tantargyNev,
      leiras: req.body.leiras,
      felhasznaloId,
    });
    console.log(it);
    return res.status(200).send('Sikeres beillesztés');
  } catch (err) {
    return res.status(500).send(`Sikertelen beillesztés: ${err.message}`);
  }
});

router.post('/addTask', upload.single('pdf'), ensureAuthenticated, async (req, res) => {
  try {
    req.app.set('view engine', 'ejs');
    if (!req.file) {
      throw new Error('Nincs feltöltött fájl!');
    }

    const tantargy = await findTantargyById(req.body.tantargyId);

    if (!tantargy) {
      throw new Error('A tantárgy nem található!');
    }

    if (req.session.felhasznalo.id !== tantargy.felhasznalo_id && req.session.felhasznalo.rang !== 1) {
      throw new Error('Nincs jogosultsága a művelet végrehajtásához!');
    }

    await insertFeladat({
      leiras: req.body.leiras,
      tantargyId: req.body.tantargyId,
      pdf: req.file.path,
      deadline: req.body.deadline,
    });

    res.status(200).send('Sikeres beillesztés');
  } catch (err) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).send(`Sikertelen beillesztés: ${err.message}`);
  }
});

router.post('/deleteSubject', ensureAuthenticated, async (req, res) => {
  try {
    await deleteTantargy(req.body.tantargyId);
    res.status(200).send('Tantárgy sikeresen törölve!');
  } catch (err) {
    res.status(500).send(`Sikertelen törlés: ${err.message}`);
  }
});

router.get('/subjects/:id/feladatok', ensureAuthenticated, async (req, res) => {
  try {
    req.app.set('view engine', 'ejs');
    const tantargyId = req.params.id;
    const feladatok = await findFeladatokByTantargyId(req.params.id);
    console.log(tantargyId);
    res.render('feladatok', { feladatok, tantargyId, user: req.session.felhasznalo });
  } catch (err) {
    res.status(500).render('error', { message: `Error fetching tasks: ${err.message}` });
  }
});

router.get('/getDescription/:id', ensureAuthenticated, async (req, res) => {
  console.log('getDescription kérés érkezett:', req.params.id);
  try {
    const tantargy = await findTantargyById(req.params.id);
    if (tantargy) {
      res.json({ description: tantargy.leiras });
    } else {
      res.status(404).json({ error: 'Tantárgy nem található' });
    }
  } catch (err) {
    res.status(500).json({ error: `Hiba történt a tantárgy lekérése során: ${err.message}` });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { user: req.session.felhasznalo });
});

router.get('/register', (req, res) => {
  res.render('register', { user: req.session.felhasznalo });
});

router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const rang = 3;
    await insertFelhasznalo({ email, name, hashedPassword, rang });
    res.redirect('/login');
  } catch (err) {
    res.status(500).send(`Error creating user: ${err.message}`);
  }
});

router.post('/login', (req, res) => {
  authenticateFelhasznalo(req, res, () => {
    console.log(req.session.felhasznalo.id);
    if (req.session && req.session.felhasznalo) {
      saveActiveUser(req.session.felhasznalo.id);
      console.log('------------------------------------------------------------------------------------');
    }
    res.redirect('/');
  });
});

router.get('/logout', (req, res) => {
  logoutFelhasznalo(req, res, () => {
    if (req.session && req.session.felhasznalo) {
      removeActiveUser(req.session.felhasznalo.id);
    }
    res.redirect('/');
  });
});

router.get('/felhasznalok', ensureAuthenticated, async (req, res) => {
  try {
    const felhasznalok = await findAllFelhasznalok();
    const activeUserIds = getActiveUsers();
    console.log(activeUserIds);
    res.render('felhasznalok', { felhasznalok, activeUserIds, user: req.session.felhasznalo });
  } catch (error) {
    console.error('Hiba a felhasználók lekérdezése során:', error);
    res.status(500).send('Hiba a felhasználók lekérdezése során');
  }
});

router.post('/updateRang', ensureAuthenticated, async (req, res) => {
  try {
    if (req.session.felhasznalo.rang !== 1) {
      return res.status(403).send('Hozzáférés megtagadva: Csak adminok módosíthatják a felhasználók rangját.');
    }

    const { felhasznaloId, rang } = req.body;
    await updateFelhasznaloRang(felhasznaloId, rang);
    return res.redirect('/felhasznalok');
  } catch (error) {
    console.error('Hiba a rang módosítása során:', error);
    return res.status(500).send('Hiba a rang módosítása során');
  }
});

router.get('/jegyek', ensureAuthenticated, async (req, res) => {
  try {
    const felhasznalok = await findAllFelhasznalok();
    const tantargyak = await findAllTantargyak();
    const jegyek = await findJegyekWithAverage();

    res.render('jegyek', { felhasznalok, tantargyak, jegyek, user: req.session.felhasznalo });
  } catch (err) {
    console.error('Hiba történt az adatok lekérése során:', err);
    res.status(500).send('Hiba történt az adatok lekérése során');
  }
});

router.post('/jegyBeir', async (req, res) => {
  if (req.session.felhasznalo && req.session.felhasznalo.rang === 2) {
    const { diakId, tantargyId, jegy } = req.body;

    if (!diakId || !tantargyId || !jegy) {
      console.error('Missing required fields:', { diakId, tantargyId, jegy });
      return res.status(400).send('Hiányzó mezők');
    }

    try {
      const ered = await addGrade({ tantargyId, diakId, jegy });
      console.log(ered);
      return res.redirect('/jegyek');
    } catch (err) {
      console.error('Error adding grade:', err);
      return res.status(500).send('Hiba történt a jegy hozzáadása során.');
    }
  } else {
    return res.status(403).send('Nincs jogosultsága jegyet hozzáadni.');
  }
});

export default router;
