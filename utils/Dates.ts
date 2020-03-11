import moment = require('moment');

export const ONE_MINUTE_IN_SECONDS = 60;
export const ONE_MINUTE_IN_MILLIS = 1000*ONE_MINUTE_IN_SECONDS;
export const ONE_DAY_IN_MILLIS = 24 * 60 * ONE_MINUTE_IN_MILLIS;

export class Dates {
  public static YYYY_DASH_MM_DASH_DD = 'YYYY-MM-DD';
  public static YYYY_DASH_MM_DASH_DD_HH_MM_SS = 'YYYY-MM-DD HH:mm:ss.sss';

  public static addMinutes(date: Date, numberOfMinutes: number) {
    return new Date(date.getTime() + numberOfMinutes * ONE_MINUTE_IN_MILLIS);
  }

  public static stripMillis(date: Date) {
    const dateWithoutMillis = new Date(date);
    dateWithoutMillis.setMilliseconds(0);
    return dateWithoutMillis;
  }

  public static format(date: Date, format: string = Dates.YYYY_DASH_MM_DASH_DD): string {
    return moment(date).format(format);
  }

  public static parse(dateString: string, format: string = this.YYYY_DASH_MM_DASH_DD): Date {
    return moment(dateString, format).toDate();
  }

  public static oneDayBefore(date: Date): Date {
    return new Date(date.getTime() - ONE_DAY_IN_MILLIS);
  }

  public static endOfDay(dateWithTime: Date): Date {
    const date = new Date(dateWithTime.getTime());
    date.setHours(23,59,59,999);
    return date;
  }

  public static startOfDay(dateWithTime: Date): Date {
    const date = new Date(dateWithTime);
    date.setHours(0,0,0,0);
    return date;
  }

  public static startOfHour(dateWithTime: Date): Date {
    const date = new Date(dateWithTime);
    date.setMinutes(0,0,0);
    return date;
  }

}
