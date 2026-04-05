CREATE TABLE `nha_cung_cap` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `ma_nha_cung_cap` VARCHAR(191) NOT NULL,
  `ten_nha_cung_cap` VARCHAR(191) NOT NULL,
  `nguoi_lien_he` VARCHAR(191) NULL,
  `so_dien_thoai` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `dia_chi` VARCHAR(191) NULL,
  `ghi_chu` TEXT NULL,
  `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `cap_nhat_luc` DATETIME(3) NOT NULL,

  UNIQUE INDEX `nha_cung_cap_ma_nha_cung_cap_key`(`ma_nha_cung_cap`),
  INDEX `nha_cung_cap_ten_nha_cung_cap_idx`(`ten_nha_cung_cap`),
  INDEX `nha_cung_cap_so_dien_thoai_idx`(`so_dien_thoai`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
