
# Wongnok Reciped

เป็นโปรแกรมที่เขียนด้วย html javascript node.js เป็นเว็บที่รวบรวมสูตรอาหารสามารถบันทึกสูตรอากหารและดูสูตรอาหารของสมาชิกคนอื่นได้

## การติดตั้ง

 - ติดตั้ง Libraries express, mysql2, cors, body-parser, express-session
 - สร้างตาราง mysql
 - **วิธีการเริ่มต้น (Start) ระบบ: รันข้อมูลผ่าน (VS code Live server ด้วย http://localhost:5500/ เท่านั้น ถ้าไม่รันด้วย localhost นี้จะไม่สามารถเชื่อมต่อกับ DB ได้ และระบบจะส่งข้อมูลไม่ได้)**

  CREATE DATABASE IF NOT EXISTS wongnok;
USE wongnok;

-- ตารางผู้ใช้
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL
);

-- ตารางเมนูอาหาร
CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255),
  ingredients TEXT,
  steps TEXT,
  time VARCHAR(50),
  difficulty VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตารางให้คะแนน
CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  rating INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

##การเริ่มต้นใช้งาน

 - cd wongnok\wongnok-backend
 - node server.js
 - **วิธีการเริ่มต้น (Start) ระบบ: รันข้อมูลผ่าน (VS code Live server ด้วย http://localhost:5500/ เท่านั้น ถ้าไม่รันด้วย localhost นี้จะไม่สามารถเชื่อมต่อกับ DB ได้ และระบบจะส่งข้อมูลไม่ได้)

