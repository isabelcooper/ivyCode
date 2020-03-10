import {expect} from "chai";
import {Dates} from "./Dates";
import {Random} from "./Random";

describe('Dates', () => {
  it('should add minutes', () => {
    const date = new Date(2019, 6, 18);
    const currentMinute = date.getMinutes();
    expect(Dates.addMinutes(date, 1).getDate()).to.eql(date.getDate());
    expect(Dates.addMinutes(date, 1).getMinutes()).to.eql(currentMinute + 1);
    expect(Dates.addMinutes(date, 2).getMinutes()).to.eql(currentMinute + 2);
  });

  it('should strip milliseconds from date', () => {
    const date = new Date(2019, 6, 18, 10, 10, 10, 999);
    expect(Dates.stripMillis(date)).to.eql(new Date(2019, 6, 18, 10, 10, 10, 0));
  });

  it.skip('should parse a string into a date, given a known format', () => {
    const date = Random.date();
    const formattedDate = Dates.format(date, Dates.YYYY_DASH_MM_DASH_DD);
    // const parsedDate = Dates.parse(formattedDate, Dates.YYYY_DASH_MM_DASH_DD);

    // expect(Dates.startOfDay(date).getTime()).to.eql(parsedDate.getTime());
  });

  it('should format a date into a string', () => {
    const date = new Date(2019, 6, 18);
    const formattedDate = Dates.format(date, Dates.YYYY_DASH_MM_DASH_DD);

    expect(formattedDate).to.eql('2019-07-18');
  });
});
