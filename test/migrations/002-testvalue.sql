-- Up
INSERT INTO `Setting` (`key`, `value`, `type`) VALUES ('test', 'now', 0);
INSERT INTO `Setting` (`key`, `value`, `type`) VALUES ('testtest', 'nownow', 6);

-- Down
DELETE FROM `Setting` WHERE `key` = 'test';
DELETE FROM `Setting` WHERE `key` = 'testtest';
