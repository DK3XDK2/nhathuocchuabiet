/*
  Warnings:

  - Added the required column `don_vi_tinh` to the `chi_tiet_hoa_don` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `chi_tiet_hoa_don` ADD COLUMN `don_vi_tinh` VARCHAR(191) NOT NULL;
