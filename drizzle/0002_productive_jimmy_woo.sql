ALTER TABLE `funnel_data` ADD `initiate_checkout_cpa` decimal(12,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `funnel_data` DROP COLUMN `initiate_checkout`;--> statement-breakpoint
ALTER TABLE `funnel_data` DROP COLUMN `cpa`;