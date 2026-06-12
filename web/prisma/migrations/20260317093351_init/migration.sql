-- CreateTable
CREATE TABLE `shorturl-user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shorturl-user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shorturl-url` (
    `id` VARCHAR(191) NOT NULL,
    `short_code` VARCHAR(191) NOT NULL,
    `original_url` VARCHAR(2048) NOT NULL,
    `title` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `shorturl-url_short_code_key`(`short_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shorturl-click` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `url_id` VARCHAR(191) NOT NULL,
    `clicked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(512) NULL,
    `referer` VARCHAR(2048) NULL,
    `country` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shorturl-url` ADD CONSTRAINT `shorturl-url_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `shorturl-user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shorturl-click` ADD CONSTRAINT `shorturl-click_url_id_fkey` FOREIGN KEY (`url_id`) REFERENCES `shorturl-url`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
