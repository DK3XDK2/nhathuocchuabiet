/*
  Warnings:

  - You are about to alter the column `loai` on the `goi_y_ai` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `goi_y_ai` ADD COLUMN `ghi_chu_duyet` VARCHAR(191) NULL,
    MODIFY `loai` ENUM('TON_KHO_THAP', 'SAP_HET_HAN', 'XU_HUONG_MUA') NOT NULL;
