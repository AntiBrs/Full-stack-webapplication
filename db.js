import mysql from 'mysql2/promise.js';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'webprog',
  password: 'root',
  database: 'webprog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const insertTantargy = async (tantargy) => {
  try {
    const sql = 'INSERT INTO tantargy (nev, leiras, felhasznalo_id) VALUES (?,?,?)';
    const [result] = await pool.query(sql, [tantargy.tantargyNev, tantargy.leiras, tantargy.felhasznaloId]);
    console.log('Sikeres beillesztés');
    return result;
  } catch (error) {
    console.error(`Sikertelen beillesztés: ${error.message}`);
    throw error;
  }
};

export const findAllJegyek = async () => {
  try {
    const sql = 'SELECT * FROM jegyek';
    const [rows] = await pool.query(sql);
    // console.log('Tantárgyak:', rows);
    return rows;
  } catch (error) {
    console.error(`Hiba a jegyek lekérdezésekor: ${error.message}`);
    throw error;
  }
};

export const findAllTantargyak = async () => {
  try {
    const sql = 'SELECT * FROM tantargy';
    const [rows] = await pool.query(sql);
    // console.log('Tantárgyak:', rows);
    return rows;
  } catch (error) {
    console.error(`Hiba a tantárgyak lekérdezésekor: ${error.message}`);
    throw error;
  }
};

export const deleteTantargy = async (tantargyId) => {
  try {
    const deleteFeladatQuery = 'DELETE FROM feladat WHERE tantargy_id = ?';
    const deleteTantargyQuery = 'DELETE FROM tantargy WHERE id = ?';

    await Promise.all([pool.query(deleteFeladatQuery, [tantargyId]), pool.query(deleteTantargyQuery, [tantargyId])]);

    console.log('Tantárgy törölve');
  } catch (error) {
    console.error(`Sikertelen törlés: ${error.message}`);
    throw error;
  }
};

export const findFeladatokByTantargyId = async (tantargyId) => {
  try {
    const sql = 'SELECT * FROM feladat WHERE tantargy_id = ?';
    const [rows] = await pool.query(sql, [tantargyId]);
    console.log('Feladatok:', rows);
    return rows;
  } catch (error) {
    console.error(`Hiba a feladatok lekérdezésekor: ${error.message}`);
    throw error;
  }
};

export const findTantargyById = async (tantargyId) => {
  try {
    const sql = 'SELECT * FROM tantargy WHERE id = ?';
    const [rows] = await pool.query(sql, [tantargyId]);
    console.log('Tantárgyak:', rows);
    return rows[0];
  } catch (error) {
    console.error(`Hiba a feladatok lekérdezésekor: ${error.message}`);
    throw error;
  }
};

export const insertFeladat = async (feladat) => {
  try {
    const sql = 'INSERT INTO feladat (leiras, tantargy_id, pdf, deadline) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(sql, [feladat.leiras, feladat.tantargyId, feladat.pdf, feladat.deadline]);
    console.log('Sikeres beillesztés');
    return result;
  } catch (error) {
    console.error(`Sikertelen beillesztés: ${error.message}`);
    throw error;
  }
};

export const findAllFelhasznalok = async () => {
  try {
    const sql = 'SELECT * FROM felhasznalo';
    const [rows] = await pool.query(sql);
    console.log('Felhasználók:', rows);
    return rows;
  } catch (error) {
    console.error(`Hiba a felhasználók lekérdezésekor: ${error.message}`);
    throw error;
  }
};

export const findFelhasznaloByEmail = async (email) => {
  try {
    const [rows] = await pool.query('SELECT * FROM felhasznalo WHERE email = ?', [email]);
    if (rows.length > 0) {
      return rows[0];
    }
    return null;
  } catch (err) {
    console.error('Error fetching user by email:', err);
    throw err;
  }
};

export const insertFelhasznalo = async ({ email, name, hashedPassword, rang }) => {
  // const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query('INSERT INTO felhasznalo (nev, rang, password, email) VALUES(?, ?, ?, ?);', [
      name,
      rang,
      hashedPassword,
      email,
    ]);
    return result.insertId;
  } catch (err) {
    console.error('Error inserting user:', err);
    throw err;
  }
};

export async function findJegyekWithAverage() {
  try {
    const [rows] = await pool.query(`
 SELECT 
      felhasznalo.id AS diak_id,
      felhasznalo.nev AS diak_nev,
      tantargy.nev AS tantargy_nev,
      GROUP_CONCAT(jegyek.jegy SEPARATOR ', ') AS jegyek,
      AVG(jegyek.jegy) AS atlag
    FROM 
      jegyek
    JOIN 
      felhasznalo ON jegyek.felhasznaloId = felhasznalo.id
    JOIN 
      tantargy ON jegyek.tantargyId = tantargy.id
    GROUP BY 
      felhasznalo.id, tantargy.id
    ORDER BY 
      felhasznalo.id, tantargy.nev
  `);
    return rows;
  } catch (err) {
    console.error('Error getting the average:', err);
    throw err;
  }
}

export const updateFelhasznaloRang = async (felhasznaloId, rang) => {
  try {
    const query = 'UPDATE felhasznalo SET rang = ? WHERE id = ?';
    const [result] = await pool.query(query, [rang, felhasznaloId]);
    return result;
  } catch (err) {
    console.error('Error updating user rang:', err);
    throw err;
  }
};

export const addGrade = async ({ tantargyId, diakId, jegy }) => {
  try {
    const [result] = await pool.query('INSERT INTO jegyek (tantargyId, felhasznaloId,jegy) VALUES(?, ?, ?);', [
      tantargyId,
      diakId,
      jegy,
    ]);
    return result.insertId;
  } catch (err) {
    console.error('Error inserting grade:', err);
    throw err;
  }
};
