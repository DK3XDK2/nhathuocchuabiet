-- CreateTable
CREATE TABLE `lich_su_xuat_kho` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lo_ton_kho_id` INTEGER NOT NULL,
    `so_luong_xuat` INTEGER NOT NULL,
    `nguoi_xuat_id` INTEGER NOT NULL,
    `li_do_xuat` ENUM('BAN_HANG', 'HU_HANG', 'KIEM_KE', 'HET_HAN') NOT NULL,
    `tham_chieu_id` INTEGER NULL,
    `loai_tham_chieu` ENUM('HOA_DON', 'DON_HANG') NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lich_su_xuat_kho` ADD CONSTRAINT `lich_su_xuat_kho_lo_ton_kho_id_fkey` FOREIGN KEY (`lo_ton_kho_id`) REFERENCES `lo_ton_kho`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_su_xuat_kho` ADD CONSTRAINT `lich_su_xuat_kho_nguoi_xuat_id_fkey` FOREIGN KEY (`nguoi_xuat_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
