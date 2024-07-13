import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupMiddlewares } from './middleware.js';
import router from './router.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('views', path.join(currentDir, '/views'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

setupMiddlewares(app);

app.use('/', router);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.listen(3000, () => console.log('A szerver fut a 3000-es porton'));
