CREATE DATABASE IF NOT EXISTS webprog;

USE webprog;

CREATE TABLE IF NOT EXISTS felhasznalo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nev VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS tantargy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nev VARCHAR(100) NOT NULL,
    felhasznalo_id INT,
    FOREIGN KEY (felhasznalo_id) REFERENCES felhasznalo(id)
);

CREATE TABLE IF NOT EXISTS feladat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leiras VARCHAR(255) NOT NULL,
    tantargy_id INT,
    FOREIGN KEY (tantargy_id) REFERENCES tantargy(id)
);

INSERT INTO felhasznalo (nev) VALUES ('Vasile');
INSERT INTO felhasznalo (nev) VALUES ('JANOS');
INSERT INTO felhasznalo (nev) VALUES ('SunyiSanyiSandor');

INSERT INTO tantargy (nev, felhasznalo_id) VALUES('Torna', 1);
INSERT INTO tantargy (nev, felhasznalo_id) VALUES('Matek', 2);
INSERT INTO tantargy (nev, felhasznalo_id) VALUES('Informatika', 3);

ALTER TABLE feladatok
ADD pdf VARCHAR(255);

ALTER TABLE feladatok
ADD datum DATE;