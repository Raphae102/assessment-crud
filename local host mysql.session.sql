 CREATE TABLE IF NOT EXISTS images (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       raw_image LONGBLOB NOT NULL,
                       processed_image LONGBLOB NOT NULL
                   )