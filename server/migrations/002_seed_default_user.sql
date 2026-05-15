USE rgb_mosaic;

INSERT INTO users (id, username, display_name)
VALUES (1, 'local-player', 'local player')
ON DUPLICATE KEY UPDATE
  username = VALUES(username),
  display_name = VALUES(display_name);
