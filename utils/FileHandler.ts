import {Handler, ResOf} from "http4js";
import {Req} from "http4js/core/Req";
import {Res} from "http4js/core/Res";
import * as fs from "fs";
import {StaticFileReader} from "../src/fileReader/StaticFileReader";

export class FileHandler implements Handler {

  constructor(private staticFileReader: StaticFileReader){}
  public async handle(req: Req): Promise<Res> {
    let fileName = req.pathParams.fileName || 'home';
    const requestedFileType = req.uri.path().split('.')[1] === 'css' ? 'css' : 'html';
    //TODO remove (or test) home as defualt?
    console.log(`in fileHandler looking for ${fileName}`);
    const file = await this.staticFileReader.read(fileName, requestedFileType);
    return ResOf(200, file)
  }
}
