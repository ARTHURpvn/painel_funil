-- Create tables for painel_funis

USE painel_funis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Funnel data table
CREATE TABLE IF NOT EXISTS funnel_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign TEXT NOT NULL,
  gestor VARCHAR(50),
  rede VARCHAR(10),
  nicho VARCHAR(100),
  adv VARCHAR(50),
  vsl VARCHAR(50),
  produto VARCHAR(100),
  data_registro DATE NOT NULL,
  cost DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2) DEFAULT 0,
  roi DECIMAL(8, 4) DEFAULT 0,
  purchases INT DEFAULT 0,
  initiate_checkout_cpa DECIMAL(12, 2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_data_registro (data_registro),
  INDEX idx_gestor (gestor),
  INDEX idx_rede (rede),
  INDEX idx_nicho (nicho),
  INDEX idx_adv (adv),
  INDEX idx_vsl (vsl)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Show created tables
SHOW TABLES;

