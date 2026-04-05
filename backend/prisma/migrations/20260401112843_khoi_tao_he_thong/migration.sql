-- CreateTable
CREATE TABLE `nguoi_dung` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ho_ten` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mat_khau_ma_hoa` VARCHAR(191) NOT NULL,
    `vai_tro` ENUM('QUAN_LY', 'NHAN_VIEN', 'HE_THONG_AI') NOT NULL,
    `trang_thai` ENUM('HOAT_DONG', 'KHOA') NOT NULL DEFAULT 'HOAT_DONG',
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cap_nhat_luc` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nguoi_dung_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `danh_muc_thuoc` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_danh_muc` VARCHAR(191) NOT NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cap_nhat_luc` DATETIME(3) NOT NULL,

    UNIQUE INDEX `danh_muc_thuoc_ten_danh_muc_key`(`ten_danh_muc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thuoc` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_thuoc` VARCHAR(191) NOT NULL,
    `ten_thuoc` VARCHAR(191) NOT NULL,
    `don_vi_tinh` VARCHAR(191) NOT NULL,
    `gia_ban` DECIMAL(12, 2) NOT NULL,
    `can_don_thuoc` BOOLEAN NOT NULL DEFAULT false,
    `con_kinh_doanh` BOOLEAN NOT NULL DEFAULT true,
    `danh_muc_thuoc_id` INTEGER NOT NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cap_nhat_luc` DATETIME(3) NOT NULL,

    UNIQUE INDEX `thuoc_ma_thuoc_key`(`ma_thuoc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lo_ton_kho` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `thuoc_id` INTEGER NOT NULL,
    `so_lo` VARCHAR(191) NOT NULL,
    `han_su_dung` DATETIME(3) NOT NULL,
    `so_luong_ton` INTEGER NOT NULL DEFAULT 0,
    `gia_nhap` DECIMAL(12, 2) NOT NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cap_nhat_luc` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `don_thuoc` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_benh_nhan` VARCHAR(191) NOT NULL,
    `ten_bac_si` VARCHAR(191) NOT NULL,
    `trang_thai` ENUM('MOI_TAO', 'DA_DUYET', 'TU_CHOI') NOT NULL DEFAULT 'MOI_TAO',
    `nguoi_tao_id` INTEGER NOT NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cap_nhat_luc` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chi_tiet_don_thuoc` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `don_thuoc_id` INTEGER NOT NULL,
    `thuoc_id` INTEGER NOT NULL,
    `so_luong` INTEGER NOT NULL,
    `lieu_dung` VARCHAR(191) NOT NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hoa_don` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nguoi_tao_id` INTEGER NOT NULL,
    `tong_tien` DECIMAL(12, 2) NOT NULL,
    `phuong_thuc_thanh_toan` VARCHAR(191) NOT NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chi_tiet_hoa_don` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hoa_don_id` INTEGER NOT NULL,
    `thuoc_id` INTEGER NOT NULL,
    `so_luong` INTEGER NOT NULL,
    `don_gia` DECIMAL(12, 2) NOT NULL,
    `thanh_tien` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goi_y_ai` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loai` VARCHAR(191) NOT NULL,
    `du_lieu_dau_vao` JSON NOT NULL,
    `du_lieu_dau_ra` JSON NOT NULL,
    `do_tin_cay` DOUBLE NOT NULL,
    `trang_thai` ENUM('CHO_DUYET', 'DA_DUYET', 'TU_CHOI') NOT NULL DEFAULT 'CHO_DUYET',
    `duyet_boi_id` INTEGER NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nhat_ky_he_thong` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nguoi_thuc_hien_id` INTEGER NOT NULL,
    `hanh_dong` VARCHAR(191) NOT NULL,
    `doi_tuong` VARCHAR(191) NOT NULL,
    `doi_tuong_id` INTEGER NULL,
    `truoc_thay_doi` JSON NULL,
    `sau_thay_doi` JSON NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `thuoc` ADD CONSTRAINT `thuoc_danh_muc_thuoc_id_fkey` FOREIGN KEY (`danh_muc_thuoc_id`) REFERENCES `danh_muc_thuoc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lo_ton_kho` ADD CONSTRAINT `lo_ton_kho_thuoc_id_fkey` FOREIGN KEY (`thuoc_id`) REFERENCES `thuoc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `don_thuoc` ADD CONSTRAINT `don_thuoc_nguoi_tao_id_fkey` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_don_thuoc` ADD CONSTRAINT `chi_tiet_don_thuoc_don_thuoc_id_fkey` FOREIGN KEY (`don_thuoc_id`) REFERENCES `don_thuoc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_don_thuoc` ADD CONSTRAINT `chi_tiet_don_thuoc_thuoc_id_fkey` FOREIGN KEY (`thuoc_id`) REFERENCES `thuoc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_nguoi_tao_id_fkey` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_hoa_don` ADD CONSTRAINT `chi_tiet_hoa_don_hoa_don_id_fkey` FOREIGN KEY (`hoa_don_id`) REFERENCES `hoa_don`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_hoa_don` ADD CONSTRAINT `chi_tiet_hoa_don_thuoc_id_fkey` FOREIGN KEY (`thuoc_id`) REFERENCES `thuoc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goi_y_ai` ADD CONSTRAINT `goi_y_ai_duyet_boi_id_fkey` FOREIGN KEY (`duyet_boi_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhat_ky_he_thong` ADD CONSTRAINT `nhat_ky_he_thong_nguoi_thuc_hien_id_fkey` FOREIGN KEY (`nguoi_thuc_hien_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
