-- CreateTable
CREATE TABLE `khach_hang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ho_ten` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `so_dien_thoai` VARCHAR(191) NOT NULL,
    `dia_chi` VARCHAR(191) NULL,
    `mat_khau_ma_hoa` VARCHAR(191) NOT NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cap_nhat_luc` DATETIME(3) NOT NULL,

    UNIQUE INDEX `khach_hang_email_key`(`email`),
    INDEX `khach_hang_so_dien_thoai_idx`(`so_dien_thoai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `don_hang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_don_hang` VARCHAR(191) NOT NULL,
    `khach_hang_id` INTEGER NULL,
    `ten_nguoi_nhan` VARCHAR(191) NOT NULL,
    `so_dien_thoai_nhan` VARCHAR(191) NOT NULL,
    `dia_chi_giao` VARCHAR(191) NOT NULL,
    `ghi_chu` VARCHAR(191) NULL,
    `tong_tien_hang` DECIMAL(12, 2) NOT NULL,
    `phi_giao_hang` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `tong_thanh_toan` DECIMAL(12, 2) NOT NULL,
    `trang_thai` ENUM('MOI_TAO', 'DA_XAC_NHAN', 'DANG_GIAO', 'HOAN_TAT', 'HUY') NOT NULL DEFAULT 'MOI_TAO',
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cap_nhat_luc` DATETIME(3) NOT NULL,

    UNIQUE INDEX `don_hang_ma_don_hang_key`(`ma_don_hang`),
    INDEX `don_hang_khach_hang_id_idx`(`khach_hang_id`),
    INDEX `don_hang_so_dien_thoai_nhan_idx`(`so_dien_thoai_nhan`),
    INDEX `don_hang_tao_luc_idx`(`tao_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chi_tiet_don_hang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `don_hang_id` INTEGER NOT NULL,
    `thuoc_id` INTEGER NOT NULL,
    `so_luong` INTEGER NOT NULL,
    `don_gia` DECIMAL(12, 2) NOT NULL,
    `thanh_tien` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `thuoc_ten_thuoc_idx` ON `thuoc`(`ten_thuoc`);

-- AddForeignKey
ALTER TABLE `don_hang` ADD CONSTRAINT `don_hang_khach_hang_id_fkey` FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_don_hang` ADD CONSTRAINT `chi_tiet_don_hang_don_hang_id_fkey` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_don_hang` ADD CONSTRAINT `chi_tiet_don_hang_thuoc_id_fkey` FOREIGN KEY (`thuoc_id`) REFERENCES `thuoc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
