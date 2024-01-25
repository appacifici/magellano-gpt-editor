:arrow_left: [Index](index.md)

# Log

Symfony backend use the [LoggerInterface](https://github.com/php-fig/log/blob/fe5ea303b0887d5caefd3d431c3e61ad47037001/src/LoggerInterface.php#L20) interface which is very clear on which level to use based on the situation:
* EMERGENCY: System is unusable
* ALERT: Action must be taken immediately
* CRITICAL: Critical conditions
* ERROR: Runtime errors that do not require immediate action but should typically be logged and monitored
* WARNING: Exceptional occurrences that are not errors
* NOTICE: Normal but significant events
* INFO: Interesting events
* DEBUG: Detailed debug information

All the magick is in the Monolog configuration and in which method we use in our code.
