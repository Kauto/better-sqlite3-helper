-- Up
INSERT INTO `Setting` (`key`, `value`, `type`) VALUES ('test', 'now', 0)

-- Down
DELETE FROM `Setting` WHERE `key` = 'test'
