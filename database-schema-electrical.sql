-- SQL Schema untuk Electrical Inspections (Instalasi Listrik & Stop Kontak)
-- Jalankan query ini di database untuk membuat table

CREATE TABLE IF NOT EXISTS electrical_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL COMMENT 'instalasi-listrik or stop-kontak',
    tanggal DATE NOT NULL,
    area VARCHAR(255) NOT NULL,
    pic VARCHAR(255) NOT NULL,
    additional_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index untuk query performa
    INDEX idx_type_date (type, tanggal),
    INDEX idx_area_date (area, tanggal),
    INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS electrical_inspection_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    item_no INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_detail TEXT,
    hasil VARCHAR(10) NOT NULL COMMENT 'OK or NOK',
    keterangan TEXT,
    foto_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT fk_inspection_id FOREIGN KEY (inspection_id) 
        REFERENCES electrical_inspections(id) ON DELETE CASCADE,
    
    -- Index untuk query performa
    INDEX idx_inspection_id (inspection_id),
    INDEX idx_item_no (item_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
