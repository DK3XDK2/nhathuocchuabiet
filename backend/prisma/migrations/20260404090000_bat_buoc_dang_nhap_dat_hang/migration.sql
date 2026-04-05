-- Xoa don hang vang lai cu de dam bao tat ca don hang gan voi khach hang
DELETE FROM `don_hang` WHERE `khach_hang_id` IS NULL;

-- Bat buoc don hang phai co khach hang
ALTER TABLE `don_hang` DROP FOREIGN KEY `don_hang_khach_hang_id_fkey`;
ALTER TABLE `don_hang` MODIFY `khach_hang_id` INTEGER NOT NULL;
ALTER TABLE `don_hang`
  ADD CONSTRAINT `don_hang_khach_hang_id_fkey`
  FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
