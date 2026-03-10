-- Add alarm columns to plan_days for workout alarm scheduling
ALTER TABLE plan_days ADD COLUMN alarm_time TEXT DEFAULT NULL;
ALTER TABLE plan_days ADD COLUMN alarm_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN plan_days.alarm_time IS 'Alarm time in HH:MM 24-hour format';
COMMENT ON COLUMN plan_days.alarm_enabled IS 'Whether the alarm is enabled for this day';
