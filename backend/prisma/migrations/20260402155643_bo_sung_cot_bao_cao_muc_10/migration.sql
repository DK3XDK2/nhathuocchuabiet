-- DropForeignKey
ALTER TABLE `nhat_ky_he_thong` DROP FOREIGN KEY `nhat_ky_he_thong_nguoi_thuc_hien_id_fkey`;

-- DropIndex
DROP INDEX `nhat_ky_he_thong_nguoi_thuc_hien_id_fkey` ON `nhat_ky_he_thong`;

-- AlterTable
ALTER TABLE `don_hang` ADD COLUMN `email_nguoi_nhan` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `hoa_don` ADD COLUMN `don_thuoc_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `nhat_ky_he_thong` ADD COLUMN `loai_tac_nhan` ENUM('USER', 'HE_THONG') NOT NULL DEFAULT 'USER',
    MODIFY `nguoi_thuc_hien_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `thuoc` ADD COLUMN `ham_luong` VARCHAR(191) NULL,
    ADD COLUMN `hoat_chat` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `hoa_don_don_thuoc_id_idx` ON `hoa_don`(`don_thuoc_id`);

-- AddForeignKey
ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_don_thuoc_id_fkey` FOREIGN KEY (`don_thuoc_id`) REFERENCES `don_thuoc`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhat_ky_he_thong` ADD CONSTRAINT `nhat_ky_he_thong_nguoi_thuc_hien_id_fkey` FOREIGN KEY (`nguoi_thuc_hien_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
