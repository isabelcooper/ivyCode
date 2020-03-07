import {expect} from "chai";
import {StaticFileReader} from "./StaticFileReader";

describe('StaticFileReader', () => {
  it('serves static html files', () => {
    const fileReader = new StaticFileReader();
    expect(fileReader.read('./index/home', 'html')).to.contain('<html>')
  });

  it('serves static js files', () => {
    const fileReader = new StaticFileReader();
    expect(fileReader.read('./index/home', 'js')).to.contain('document.')
  });
});
