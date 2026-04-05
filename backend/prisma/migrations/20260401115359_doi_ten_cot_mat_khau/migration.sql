/*
  Warnings:

  - You are about to drop the column `mat_khau_ma_hoa` on the `khach_hang` table. All the data in the column will be lost.
  - You are about to drop the column `mat_khau_ma_hoa` on the `nguoi_dung` table. All the data in the column will be lost.
  - Added the required column `mat_khau` to the `khach_hang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mat_khau` to the `nguoi_dung` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `khach_hang` DROP COLUMN `mat_khau_ma_hoa`,
    ADD COLUMN `mat_khau` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `nguoi_dung` DROP COLUMN `mat_khau_ma_hoa`,
    ADD COLUMN `mat_khau` VARCHAR(191) NOT NULL;
