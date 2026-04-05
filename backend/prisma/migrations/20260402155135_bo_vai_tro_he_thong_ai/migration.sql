/*
  Warnings:

  - The values [HE_THONG_AI] on the enum `nguoi_dung_vai_tro` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `nguoi_dung` MODIFY `vai_tro` ENUM('QUAN_LY', 'NHAN_VIEN') NOT NULL;
