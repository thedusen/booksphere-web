import { promises as fs } from "fs";
import { BuildShipBase64File } from "./buildship-base64-file.js";
import { BuildShipExternalUrlFile } from "./buildship-external-url-file.js";
import { BuildShipFileBufferFile } from "./buildship-file-buffer-file.js";
import { BuildShipLocalFile } from "./buildship-local-file.js";
export const getBuildShipFile = (workflowExecutionId) => async ({ file, type, ...meta }) => {
    // If a `metadata` property is present, simply use it.
    // Otherwise, pack all the additional properties together and treat them as `metadata`.
    const metadata = "metadata" in meta ? meta.metadata : meta;
    if (type) {
        switch (type) {
            case "local-file":
                return new BuildShipLocalFile(workflowExecutionId, file, metadata);
            case "file-buffer":
                return new BuildShipFileBufferFile(workflowExecutionId, file, metadata);
            case "base64":
                return new BuildShipBase64File(workflowExecutionId, file, metadata);
            case "external-url":
                return new BuildShipExternalUrlFile(workflowExecutionId, file, metadata);
            default:
                throw new Error(`Invalid file type: ${type}`);
        }
    }
    throw new Error(`Invalid file instantiator value. Pass in a 'type' property when calling this function.`);
    // // Attempt to automatically determine the right class to use, in case the type is not provided.
    // // If buffer
    // if (Buffer.isBuffer(file)) {
    //   return new BuildShipFileBufferFile(workflowExecutionId, file, meta);
    // } else if (typeof file === "string") {
    //   // If URL (two possible cases)...
    //   if (file.startsWith("https://")) {
    //     // ... 1. It points to an object in the user's bucket --> get the local path...
    //     if (urlPointsToLocalFile(file)) {
    //       const pathInBucket = file
    //         .split(`https://storage.googleapis.com/${process.env.BUCKET_NAME!}/`)
    //         .pop()!;
    //       const absoluteLocalPath = `${process.env.BUCKET_FOLDER_PATH!}/${pathInBucket}`;
    //       return new BuildShipLocalFile(workflowExecutionId, absoluteLocalPath, meta);
    //     }
    //     // ... 2. otherwise, treat it as an external URL.
    //     return new BuildShipExternalUrlFile(workflowExecutionId, file, meta);
    //   }
    //   // If local file
    //   if (await isLocalFile(file)) {
    //     return new BuildShipLocalFile(workflowExecutionId, file, meta);
    //   }
    //   // If base64 string
    //   const base64Regex = new RegExp("data:(.*?);base64,(.*)");
    //   const match = file.match(base64Regex);
    //   if (match) {
    //     return new BuildShipBase64File(workflowExecutionId, file, meta);
    //   }
    //   throw new Error(
    //     `Invalid file instantiator value. Try passing in a 'type' property when calling this function. In case that's not possible: If you're trying to use a local file, make sure the file exists in storage. If you're trying to use a base64 string, make sure it's valid.`,
    //   );
    // }
    // throw new Error(`Invalid file instantiator value: ${file}`);
};
const isLocalFile = async (path) => {
    try {
        await fs.access(path);
        return true;
    }
    catch (error) {
        return false;
    }
};
const urlPointsToLocalFile = (url) => url.startsWith(`https://storage.googleapis.com/${process.env.BUCKET_NAME}/`);
