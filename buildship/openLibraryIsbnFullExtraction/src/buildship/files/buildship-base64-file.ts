import { promises as fs } from "fs";
import path from "path";
import { v4 } from "uuid";

import {
  BuildShipFileType,
  BuildShipFileAdditionalMetadata,
  BuildShipFileConverter,
} from "./types.js";
import { TEMP_FOLDER_PATH } from "./constants.js";

import { BuildShipFileBufferFile } from "./buildship-file-buffer-file.js";
import { BuildShipLocalFile } from "./buildship-local-file.js";

export class BuildShipBase64File {
  private _workflowExecutionId: string;
  type: "base64" = "base64";
  file: string;
  metadata?: BuildShipFileAdditionalMetadata;

  constructor(
    workflowExecutionId: string,
    b64Encoding: string,
    meta?: BuildShipFileAdditionalMetadata
  ) {
    this._workflowExecutionId = workflowExecutionId;
    this.file = b64Encoding.startsWith("data:")
      ? b64Encoding.split(";base64,").pop()!
      : b64Encoding;

    this.metadata = meta;
  }

  convertTo(desiredType: BuildShipFileType): BuildShipFileConverter {
    switch (desiredType) {
      case "base64":
        return async () => this;
      case "local-file":
        return async (destinationPath?: string) => {
          const localPath = await this.saveAsLocalFile(destinationPath);
          return new BuildShipLocalFile(this._workflowExecutionId, localPath, this.metadata);
        };
      case "file-buffer":
        return async () =>
          new BuildShipFileBufferFile(
            this._workflowExecutionId,
            await this.generateFileBuffer(),
            this.metadata
          );
      default:
        throw new Error(
          `Invalid desired type: Trying to convert from type "${this.type}" to type "${desiredType}"`
        );
    }
  }

  private async saveAsLocalFile(destinationPath?: string) {
    const pathToUse =
      destinationPath ??
      TEMP_FOLDER_PATH +
        this._workflowExecutionId +
        "/" +
        v4() +
        (this.metadata?.mimetype ? `.${this.metadata.mimetype.split("/").pop()}` : "");

    await fs.mkdir(path.dirname(pathToUse), { recursive: true });
    const base64Data = this.file.split(";base64,").pop()!;
    await fs.writeFile(pathToUse, Buffer.from(base64Data, "base64"));
    return pathToUse;
  }

  private async generateFileBuffer() {
    const base64Data = this.file.split(";base64,").pop()!;
    return Buffer.from(base64Data, "base64");
  }
}
