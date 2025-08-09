import { promises as fs } from "fs";
import { v4 } from "uuid";
import path from "path";

import {
  BuildShipFileType,
  BuildShipFileAdditionalMetadata,
  BuildShipFileConverter,
} from "./types.js";
import { TEMP_FOLDER_PATH } from "./constants.js";

import { BuildShipLocalFile } from "./buildship-local-file.js";
import { BuildShipBase64File } from "./buildship-base64-file.js";

export class BuildShipFileBufferFile {
  private _workflowExecutionId: string;
  type: "file-buffer" = "file-buffer";
  file: Buffer;
  size: number;
  metadata?: BuildShipFileAdditionalMetadata;

  constructor(workflowExecutionId: string, buffer: Buffer, meta?: BuildShipFileAdditionalMetadata) {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error(
        "Invalid buffer value while trying to construct a `BuildShipFileBufferFile` instance."
      );
    }

    this._workflowExecutionId = workflowExecutionId;
    this.file = buffer;
    this.size = this.file.byteLength;
    this.metadata = meta;
  }

  convertTo(desiredType: BuildShipFileType): BuildShipFileConverter {
    switch (desiredType) {
      case "file-buffer":
        return async () => this;
      case "local-file": {
        return async (destinationPath?: string) => {
          const localPath = await this.saveAsLocalFile(destinationPath);
          return new BuildShipLocalFile(this._workflowExecutionId, localPath, this.metadata);
        };
      }
      case "base64":
        return async () =>
          new BuildShipBase64File(
            this._workflowExecutionId,
            this.file.toString("base64"),
            this.metadata
          );

      default:
        throw new Error(
          `Invalid desired type: Trying to convert from type "${this.type}" to type "${desiredType}"`
        );
    }
  }

  private async saveAsLocalFile(destinationPath?: string) {
    const pathToUse = destinationPath ?? TEMP_FOLDER_PATH + this._workflowExecutionId + "/" + v4();

    await fs.mkdir(path.dirname(pathToUse), { recursive: true });
    await fs.writeFile(pathToUse, this.file);
    return pathToUse;
  }
}
