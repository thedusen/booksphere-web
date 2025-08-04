import { BuildShipBase64File as BuildShipBase64FileClass } from "./buildship-base64-file.js";
import { BuildShipExternalUrlFile as BuildShipExternalUrlFileClass } from "./buildship-external-url-file.js";
import { BuildShipFileBufferFile as BuildShipFileBufferFileClass } from "./buildship-file-buffer-file.js";
import { BuildShipLocalFile as BuildShipLocalFileClass } from "./buildship-local-file.js";

export type BuildShipFileType = "local-file" | "file-buffer" | "base64" | "external-url";

export type BuildShipFileInstantiator =
  | {
      file: string;
      type?: Exclude<BuildShipFileType, "file-buffer">;
    }
  | {
      file: Buffer;
      type?: Extract<BuildShipFileType, "file-buffer">;
    };

export type BuildShipFileAdditionalMetadata = Record<string, any>;

export type BuildShipFile =
  | BuildShipLocalFileClass
  | BuildShipFileBufferFileClass
  | BuildShipBase64FileClass
  | BuildShipExternalUrlFileClass;

export type BuildShipLocalFile = BuildShipLocalFileClass;
export type BuildShipFileBufferFile = BuildShipFileBufferFileClass;
export type BuildShipBase64File = BuildShipBase64FileClass;
export type BuildShipExternalUrlFile = BuildShipExternalUrlFileClass;

export type BuildShipFileConverter =
  | (() => Promise<BuildShipBase64File>)
  | ((destinationPath?: string) => Promise<BuildShipLocalFile>)
  | (() => Promise<BuildShipFileBufferFile>);
