-- Drop users table as it's no longer needed
DROP TABLE IF EXISTS `users`;

-- Drop old funnel_data table
DROP TABLE IF EXISTS `funnel_data`;

-- Create new funnel_data table with updated schema
CREATE TABLE `funnel_data` (
  `id` int AUTO_INCREMENT NOT NULL,
  `campaign` text NOT NULL,
  `gestor` varchar(50),
  `site` varchar(100),
  `nicho` varchar(100),
  `product` varchar(100),
  `date` date NOT NULL,
  `cost` decimal(12,2) DEFAULT '0',
  `profit` decimal(12,2) DEFAULT '0',
  `roi` decimal(8,4) DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `funnel_data_id` PRIMARY KEY(`id`)
);

-- Create indexes for better query performance
CREATE INDEX `idx_date` ON `funnel_data` (`date`);
CREATE INDEX `idx_gestor` ON `funnel_data` (`gestor`);
CREATE INDEX `idx_site` ON `funnel_data` (`site`);
CREATE INDEX `idx_nicho` ON `funnel_data` (`nicho`);
CREATE INDEX `idx_product` ON `funnel_data` (`product`);

