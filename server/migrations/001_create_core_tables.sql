CREATE DATABASE IF NOT EXISTS rgb_mosaic
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE rgb_mosaic;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS color_inventory (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  red_value TINYINT UNSIGNED NOT NULL,
  green_value TINYINT UNSIGNED NOT NULL,
  blue_value TINYINT UNSIGNED NOT NULL,
  rarity VARCHAR(32) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_color_inventory_user_rgb (user_id, red_value, green_value, blue_value),
  KEY idx_color_inventory_user_id (user_id),
  CONSTRAINT fk_color_inventory_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artworks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  width SMALLINT UNSIGNED NOT NULL DEFAULT 16,
  height SMALLINT UNSIGNED NOT NULL DEFAULT 16,
  pixel_hash CHAR(64) NULL,
  built_in_key VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  certified_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_artworks_user_status (user_id, status),
  KEY idx_artworks_pixel_hash (pixel_hash),
  CONSTRAINT fk_artworks_user_id FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT chk_artworks_size CHECK (width = 16 AND height = 16),
  CONSTRAINT chk_artworks_status CHECK (status IN ('draft', 'certified', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artwork_pixels (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  artwork_id BIGINT UNSIGNED NOT NULL,
  x_position SMALLINT UNSIGNED NOT NULL,
  y_position SMALLINT UNSIGNED NOT NULL,
  red_value TINYINT UNSIGNED NOT NULL,
  green_value TINYINT UNSIGNED NOT NULL,
  blue_value TINYINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_artwork_pixels_position (artwork_id, x_position, y_position),
  KEY idx_artwork_pixels_artwork_id (artwork_id),
  CONSTRAINT fk_artwork_pixels_artwork_id FOREIGN KEY (artwork_id) REFERENCES artworks (id) ON DELETE CASCADE,
  CONSTRAINT chk_artwork_pixels_x CHECK (x_position < 16),
  CONSTRAINT chk_artwork_pixels_y CHECK (y_position < 16)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  artwork_id BIGINT UNSIGNED NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  creator_id BIGINT UNSIGNED NOT NULL,
  asset_code VARCHAR(64) NOT NULL,
  title VARCHAR(120) NOT NULL,
  pixel_hash CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_assets_asset_code (asset_code),
  UNIQUE KEY uk_assets_artwork_id (artwork_id),
  UNIQUE KEY uk_assets_pixel_hash (pixel_hash),
  KEY idx_assets_owner_id (owner_id),
  KEY idx_assets_creator_id (creator_id),
  CONSTRAINT fk_assets_artwork_id FOREIGN KEY (artwork_id) REFERENCES artworks (id),
  CONSTRAINT fk_assets_owner_id FOREIGN KEY (owner_id) REFERENCES users (id),
  CONSTRAINT fk_assets_creator_id FOREIGN KEY (creator_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mining_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  red_value TINYINT UNSIGNED NOT NULL,
  green_value TINYINT UNSIGNED NOT NULL,
  blue_value TINYINT UNSIGNED NOT NULL,
  rarity VARCHAR(32) NOT NULL,
  mined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_mining_records_user_mined_at (user_id, mined_at),
  CONSTRAINT fk_mining_records_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
