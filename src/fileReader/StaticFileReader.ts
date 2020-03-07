import * as fs from "fs";

export class StaticFileReader {
  public read(filePath: string, fileName: string): string {
    return fs.readFileSync(`${filePath}.${fileName}`).toString();
  }
}
