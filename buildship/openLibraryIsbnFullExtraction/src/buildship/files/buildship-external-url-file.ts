import fs_, { promises as fsPromises } from "fs";
import { Readable, promises as streamPromises } from "stream";
import { ReadableStream } from "stream/web";
import { v4 } from "uuid";
import path from "path";

import {
  BuildShipFileType,
  BuildShipFileAdditionalMetadata,
  BuildShipFileConverter,
} from "./types.js";
import { TEMP_FOLDER_PATH } from "./constants.js";

import { BuildShipLocalFile } from "./buildship-local-file.js";
import { BuildShipFileBufferFile } from "./buildship-file-buffer-file.js";
import { BuildShipBase64File } from "./buildship-base64-file.js";

export class BuildShipExternalUrlFile {
  private _workflowExecutionId: string;
  type: "external-url" = "external-url";
  file: string;
  metadata?: BuildShipFileAdditionalMetadata;

  constructor(
    workflowExecutionId: string,
    externalUrl: string,
    meta?: BuildShipFileAdditionalMetadata
  ) {
    this._workflowExecutionId = workflowExecutionId;
    this.file = externalUrl;
    this.metadata = meta;
  }

  convertTo(
    desiredType: BuildShipFileType
  ): BuildShipFileConverter | (() => Promise<BuildShipExternalUrlFile>) {
    switch (desiredType) {
      case "external-url":
        return async () => this;
      case "file-buffer":
        return async () => {
          const fileBuffer = await this.generateFileBuffer();
          const metadata = {
            ...this.metadata,
            mimetype: this.metadata?.mimetype ?? (await this.getMimeType()),
          };

          return new BuildShipFileBufferFile(this._workflowExecutionId, fileBuffer, metadata);
        };
      case "local-file": {
        return async (destinationPath?: string) => {
          const localPath = await this.saveAsLocalFile(destinationPath);
          const metadata = {
            ...this.metadata,
            mimetype: this.metadata?.mimetype ?? (await this.getMimeType()),
          };

          return new BuildShipLocalFile(this._workflowExecutionId, localPath, metadata);
        };
      }
      case "base64":
        return async () => {
          const fileBuffer = await this.generateFileBuffer();
          const metadata = {
            ...this.metadata,
            mimetype: this.metadata?.mimetype ?? (await this.getMimeType()),
          };

          return new BuildShipBase64File(
            this._workflowExecutionId,
            fileBuffer.toString("base64"),
            metadata
          );
        };
      default:
        throw new Error(
          `Invalid desired type: Trying to convert from type "${this.type}" to type "${desiredType}"`
        );
    }
  }

  private async getMimeType() {
    try {
      const resp = await fetch(this.file, { method: "HEAD" });
      return resp.headers.get("content-type");
    } catch (error) {
      try {
        const resp2 = await fetch(this.file);
        return resp2.headers.get("content-type");
      } catch (error2) {
        return null;
      }
    }
  }

  private async saveAsLocalFile(destinationPath?: string) {
    const pathToUse = destinationPath ?? TEMP_FOLDER_PATH + this._workflowExecutionId + "/" + v4();

    await fsPromises.mkdir(path.dirname(pathToUse), { recursive: true });
    const wStream = fs_.createWriteStream(pathToUse);
    const body = (await fetch(this.file)).body;
    if (!body) {
      throw new Error(
        "Error while converting External URL file to Local File: Failed to fetch file from external URL."
      );
    }
    await streamPromises.finished(Readable.fromWeb(body as ReadableStream).pipe(wStream));

    return pathToUse;
  }

  private async generateFileBuffer() {
    const body = (await fetch(this.file)).body;
    if (!body) {
      throw new Error(
        "Error while converting External URL file to File Buffer: Failed to fetch file from external URL."
      );
    }

    const rStream = Readable.fromWeb(body as ReadableStream);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      rStream.on("data", (chunk) => chunks.push(chunk));
      rStream.on("end", () => resolve(Buffer.concat(chunks)));
      rStream.on("error", reject);
    });
  }
}
