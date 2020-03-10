import moment = require('moment');

export const ONE_MINUTE_IN_SECONDS = 60;

export const ONE_MINUTE_IN_MILLIS = 1000*ONE_MINUTE_IN_SECONDS;

export class Dates {
  public static YYYY_DASH_MM_DASH_DD = 'YYYY-MM-DD';
  public static YYYY_DASH_MM_DASH_DD_HH_MM_SS = 'YYYY-MM-DD HH:mm:ss.sss';

  static addMinutes(date: Date, numberOfMinutes: number) {
    return new Date(date.getTime() + numberOfMinutes * ONE_MINUTE_IN_MILLIS);
  }

  static stripMillis(date: Date) {
    const dateWithoutMillis = new Date(date);
    dateWithoutMillis.setMilliseconds(0);
    return dateWithoutMillis;
  }

  public static format(date: Date, format: string = Dates.YYYY_DASH_MM_DASH_DD): string {
    return moment(date).format(format);
  }
}
