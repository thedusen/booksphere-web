import { promises as fs } from "fs";
import { v4 } from "uuid";
import path from "path";

import { TEMP_FOLDER_PATH } from "./constants.js";
import {
  BuildShipFileType,
  BuildShipFileAdditionalMetadata,
  BuildShipFileConverter,
} from "./types.js";
import { bucket } from "../storage.js";

import { BuildShipFileBufferFile } from "./buildship-file-buffer-file.js";
import { BuildShipBase64File } from "./buildship-base64-file.js";

export class BuildShipLocalFile {
  private _workflowExecutionId: string;
  type: "local-file" = "local-file";
  file: string;
  fileName: string;
  pathInBucket: string | undefined;
  metadata?: BuildShipFileAdditionalMetadata;

  constructor(
    workflowExecutionId: string,
    absoluteLocalPath: string,
    meta?: BuildShipFileAdditionalMetadata
  ) {
    this._workflowExecutionId = workflowExecutionId;
    this.file = absoluteLocalPath;
    this.fileName = this.file.split("/").pop()!;
    this.pathInBucket = this.file.startsWith(process.env.BUCKET_FOLDER_PATH!)
      ? this.file.split(process.env.BUCKET_FOLDER_PATH! + "/").pop()
      : undefined;

    this.metadata = meta;
  }

  async getFileBuffer() {
    return await fs.readFile(this.file);
  }

  async getSize() {
    return (await this.getFileBuffer()).byteLength;
  }

  async getPublicUrl() {
    if (this.file.startsWith("/tmp/"))
      throw new Error(`Temp file cannot be made public: ${this.file}`);

    if (!this.pathInBucket) throw new Error(`File does not lie in a bucket: ${this.file}`);

    const file = bucket.file(this.pathInBucket);
    await file.makePublic();

    return file.publicUrl();
  }

  convertTo(desiredType: BuildShipFileType): BuildShipFileConverter {
    switch (desiredType) {
      case "local-file":
        return async (destinationPath?: string) => {
          if (!destinationPath) return this;

          const localPath = await this.saveAsLocalFile(destinationPath);
          return new BuildShipLocalFile(this._workflowExecutionId, localPath, {
            ...this.metadata,
            path: localPath,
          });
        };
      case "file-buffer":
        return async () =>
          new BuildShipFileBufferFile(
            this._workflowExecutionId,
            await this.getFileBuffer(),
            this.metadata
          );
      case "base64":
        return async () => {
          const buffer = await this.getFileBuffer();
          return new BuildShipBase64File(
            this._workflowExecutionId,
            buffer.toString("base64"),
            this.metadata
          );
        };
      default:
        throw new Error(
          `Invalid desired type: Trying to convert from type "${this.type}" to type "${desiredType}"`
        );
    }
  }

  private async saveAsLocalFile(destinationPath?: string) {
    const pathToUse = destinationPath ?? TEMP_FOLDER_PATH + this._workflowExecutionId + "/" + v4();

    await fs.mkdir(path.dirname(pathToUse), { recursive: true });
    await fs.copyFile(this.file, pathToUse);
    return pathToUse;
  }
}
