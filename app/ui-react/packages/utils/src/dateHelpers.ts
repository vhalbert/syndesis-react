import moment from 'moment';

export function toDurationDifferenceString(
  timestamp: number,
  defaultValue = 'n/a'
): string {
  if (!timestamp) {
    return defaultValue;
  }
  const startDate = moment(timestamp);
  const uptimeDuration = moment.duration(moment().diff(startDate));
  const duration = {
    days: uptimeDuration.days(),
    hours: uptimeDuration.hours(),
    minutes: uptimeDuration.minutes(),
  };
  const durationString = Object.keys(duration).reduce(
    (timeSpan: string, key: string) => {
      return duration[key] > 0
        ? timeSpan + `${duration[key]} ${key} `
        : timeSpan;
    },
    ''
  );
  return durationString && durationString.length > 0
    ? durationString
    : defaultValue;
}

export function toDurationString(
  timeDuration: number,
  unit: 'ms' | 'ns'
): string {
  if (!timeDuration) {
    return 'NaN';
  }
  if (unit === 'ns') {
    timeDuration = timeDuration / 1000000;
  }
  const durationMoment = moment.duration(timeDuration);
  const days = Math.floor(durationMoment.days());
  const hours = Math.floor(durationMoment.hours());
  const minutes = Math.floor(durationMoment.minutes());
  const seconds = Math.floor(durationMoment.seconds());
  const milliseconds = Math.floor(durationMoment.milliseconds());
  const durationStrings: string[] = [];
  if (days > 0) {
    durationStrings.push(`${days} days`);
  }
  if (hours > 0) {
    durationStrings.push(`${hours} hours`);
  }
  if (minutes > 0) {
    durationStrings.push(`${minutes} minutes`);
  }
  if (seconds > 0) {
    durationStrings.push(`${seconds} seconds`);
  }
  if (durationStrings.length === 0) {
    if (milliseconds > 0) {
      durationStrings.push(`${milliseconds} ms`);
    } else if (timeDuration !== 0) {
      durationStrings.push(`${timeDuration.toFixed(2)} ms`);
    }
  }
  return durationStrings.join(', ').trim();
}
