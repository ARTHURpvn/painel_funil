CREATE TABLE `funnel_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign` text NOT NULL,
	`gestor` varchar(50),
	`rede` varchar(10),
	`nicho` varchar(100),
	`adv` varchar(50),
	`vsl` varchar(50),
	`produto` varchar(100),
	`data_registro` date NOT NULL,
	`cost` decimal(12,2) DEFAULT '0',
	`profit` decimal(12,2) DEFAULT '0',
	`roi` decimal(8,4) DEFAULT '0',
	`purchases` int DEFAULT 0,
	`initiate_checkout` int DEFAULT 0,
	`cpa` decimal(12,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` varchar(20) NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `idx_data_registro` ON `funnel_data` (`data_registro`);--> statement-breakpoint
CREATE INDEX `idx_gestor` ON `funnel_data` (`gestor`);--> statement-breakpoint
CREATE INDEX `idx_rede` ON `funnel_data` (`rede`);--> statement-breakpoint
CREATE INDEX `idx_nicho` ON `funnel_data` (`nicho`);--> statement-breakpoint
CREATE INDEX `idx_adv` ON `funnel_data` (`adv`);--> statement-breakpoint
CREATE INDEX `idx_vsl` ON `funnel_data` (`vsl`);