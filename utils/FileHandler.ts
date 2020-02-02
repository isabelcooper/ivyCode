import {Handler, ResOf} from "http4js";
import {Req} from "http4js/core/Req";
import {Res} from "http4js/core/Res";
import * as fs from "fs";

export class FileHandler implements Handler {

  public async handle(req: Req): Promise<Res> {
    const fileName = req.pathParams.fileName;
    const fileType = req.uri.path().split('.')[1] === 'css' ? 'css' : 'html';
    return ResOf(200, (fs.readFileSync(`./docs/privacy/${fileName}.${fileType}`)).toString())
  }
}
