// @ts-nocheck
import "dotenv/config";
import pMap from "p-map";
import { scripExecutor, parseExpression, setResult, duplicateState } from "../buildship/utils.js";
import { httpExecutor } from "../buildship/http.js";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const executeScript = scripExecutor(__dirname);
const executeHttp = httpExecutor(__dirname);
var NODES;
(function (NODES) {
    NODES["branchOnInputValidation"] = "7abd7825-465b-4dbe-b6e5-7fa92d4bb75d";
    NODES["apiBooks"] = "f9679497-fc56-48f8-93df-55fd7f877cc4";
    NODES["logMessageToConsole"] = "55bcdbf0-dfd9-4847-a818-76962b4a9bac";
    NODES["branch"] = "b56b2ec6-91db-45dd-8e17-68c712ace040";
    NODES["apiWorks"] = "de9e2852-0b6f-42cd-b757-c12cc592c540";
    NODES["branch1"] = "6072d0c9-6672-4c03-b36c-81a7a69f316f";
    NODES["loop"] = "55120dbe-08e9-47f0-ac7e-a82875bd9077";
    NODES["logMessageToConsole1"] = "c5dbe9b1-c4a4-4192-87b6-fa7b83bda766";
    NODES["apiAuthor"] = "3fb2b37a-ce1c-4df7-98a5-62931002e386";
    NODES["branch2"] = "42240245-fd63-4015-845c-e2f45ea780eb";
    NODES["setVariable"] = "c1a96e2f-ef0d-45b2-99df-7a85eb19b50a";
    NODES["output"] = "34bf8cbb-56dd-4757-ab0b-268e832bebc8";
    NODES["output1"] = "5562f10f-183d-4910-8874-b81fef0e766d";
    NODES["output2"] = "7850a5e2-ff83-4859-afb4-8eff0592865e";
    NODES["output3"] = "b4f202cc-b063-4662-ad7f-dfc93be8ea20";
    NODES["outputValidationError"] = "5d41f515-d132-40a2-941c-b6f4ced76cde";
})(NODES || (NODES = {}));
async function branch2_then(root) {
    const result = {};
    setResult(root, await parseExpression(root, "[\n  ...(ctx.state.authors || []),\n  ctx?.[\"root\"]?.[\"7abd7825-465b-4dbe-b6e5-7fa92d4bb75d\"]?.[\"then\"]?.[\"b56b2ec6-91db-45dd-8e17-68c712ace040\"]?.[\"then\"]?.[\"6072d0c9-6672-4c03-b36c-81a7a69f316f\"]?.[\"then\"]?.[\"55120dbe-08e9-47f0-ac7e-a82875bd9077\"]?.[\"3fb2b37a-ce1c-4df7-98a5-62931002e386\"]?.[\"data\"]\n]"), ["state", "authors"]);
    return result;
}
async function branch2_else(root) {
    const result = {};
    setResult(root, {
        "works": "null",
        "success": false,
        "books": "null",
        "authors": []
    }, ["output"]);
    throw "STOP";
    return result;
}
async function branch1_then(root) {
    const result = {};
    let items = (await parseExpression(root, "(\n        ctx?.[\"root\"]?.[\"7abd7825-465b-4dbe-b6e5-7fa92d4bb75d\"]?.[\"then\"]?.[\"f9679497-fc56-48f8-93df-55fd7f877cc4\"]?.[\"data\"]\n    )?.[ // Use the ISBN input value as a key here\n        ctx?.[\"root\"]?.[\"inputs\"]?.[\"isbn\"]\n    ]?.details?.authors\n")).map(item => ([item, duplicateState(root)]));
    setResult(root, await pMap(items, async ([item, root], index) => {
        setResult(root, item, [NODES.branchOnInputValidation, "then", NODES.branch, "then", NODES.branch1, "then", NODES.loop, "item"]);
        setResult(root, index, [NODES.branchOnInputValidation, "then", NODES.branch, "then", NODES.branch1, "then", NODES.loop, "index"]);
        setResult(root, await executeScript(NODES.logMessageToConsole1, { "oAuthIntegrations": {}, "message": root[NODES.branchOnInputValidation]["then"][NODES.branch]["then"][NODES.branch1]["then"][NODES.loop]["item"] }, root, {}), [NODES.branchOnInputValidation, "then", NODES.branch, "then", NODES.branch1, "then", NODES.loop, NODES.logMessageToConsole1]);
        setResult(root, await executeScript(NODES.apiAuthor, { "contentType": "application/json", "shouldAwait": true, "oAuthIntegrations": {}, "method": "GET", "url": await parseExpression(root, "'https://openlibrary.org' + (ctx?.[\"root\"]?.[\"7abd7825-465b-4dbe-b6e5-7fa92d4bb75d\"]?.[\"then\"]?.[\"b56b2ec6-91db-45dd-8e17-68c712ace040\"]?.[\"then\"]?.[\"6072d0c9-6672-4c03-b36c-81a7a69f316f\"]?.[\"then\"]?.[\"55120dbe-08e9-47f0-ac7e-a82875bd9077\"]?.[\"item\"].key) + '.json'") }, root, {}), [NODES.branchOnInputValidation, "then", NODES.branch, "then", NODES.branch1, "then", NODES.loop, NODES.apiAuthor]);
        if (root[NODES.branchOnInputValidation]["then"][NODES.branch]["then"][NODES.branch1]["then"][NODES.loop][NODES.apiAuthor]["status"] !== 404) {
            await branch2_then(root);
        }
        else {
            await branch2_else(root);
        }
        return root[NODES.branchOnInputValidation]["then"][NODES.branch]["then"][NODES.branch1]["then"][NODES.loop];
    }, { concurrency: 3 }), [NODES.branchOnInputValidation, "then", NODES.branch, "then", NODES.branch1, "then", NODES.loop]);
    return result;
}
async function branch1_else(root) {
    const result = {};
    setResult(root, {
        "authors": [],
        "works": "null",
        "books": "null",
        "success": false
    }, ["output"]);
    throw "STOP";
    return result;
}
async function branch_then(root) {
    const result = {};
    setResult(root, await executeScript(NODES.apiWorks, { "contentType": "application/json", "url": await parseExpression(root, "'https://openlibrary.org' + \n( // Grouping for clarity, optional chaining handles nulls\n  (\n    ctx?.[\"root\"]?.[\"7abd7825-465b-4dbe-b6e5-7fa92d4bb75d\"]?.[\"then\"]?.[\"f9679497-fc56-48f8-93df-55fd7f877cc4\"]?.[\"data\"]\n  )?.[ // Use the ISBN input value as a key here\n    ctx?.[\"root\"]?.[\"inputs\"]?.[\"isbn\"] \n  ]?.details?.works?.[0]?.key\n) + '.json'"), "shouldAwait": true, "oAuthIntegrations": {}, "method": "GET" }, root, {}), [NODES.branchOnInputValidation, "then", NODES.branch, "then", NODES.apiWorks]);
    if (root[NODES.branchOnInputValidation]["then"][NODES.branch]["then"][NODES.apiWorks]["status"] !== 404) {
        await branch1_then(root);
    }
    else {
        await branch1_else(root);
    }
    return result;
}
async function branch_else(root) {
    const result = {};
    setResult(root, {
        "authors": [],
        "books": "null",
        "success": false,
        "works": "null"
    }, ["output"]);
    throw "STOP";
    return result;
}
async function branchOnInputValidation_then(root) {
    const result = {};
    setResult(root, await executeScript(NODES.apiBooks, { "contentType": "application/json", "queryParams": await parseExpression(root, "{\n  \"bibkeys\":ctx?.[\"root\"]?.[\"inputs\"]?.[\"isbn\"],\n  \"format\":\"json\",\n  \"jscmd\":\"details\"\n}"), "oAuthIntegrations": {}, "shouldAwait": true, "method": "GET", "url": "https://openlibrary.org/api/books" }, root, {}), [NODES.branchOnInputValidation, "then", NODES.apiBooks]);
    setResult(root, await executeScript(NODES.logMessageToConsole, { "oAuthIntegrations": {}, "message": await parseExpression(root, "const dataObject = ctx?.[\"root\"]?.[\"7abd7825-465b-4dbe-b6e5-7fa92d4bb75d\"]?.[\"then\"]?.[\"f9679497-fc56-48f8-93df-55fd7f877cc4\"]?.[\"data\"] || {};\n\nreturn Object.keys(dataObject).length > 0;") }, root, {}), [NODES.branchOnInputValidation, "then", NODES.logMessageToConsole]);
    if (await parseExpression(root, "const dataObject = ctx?.[\"root\"]?.[\"7abd7825-465b-4dbe-b6e5-7fa92d4bb75d\"]?.[\"then\"]?.[\"f9679497-fc56-48f8-93df-55fd7f877cc4\"]?.[\"data\"] || {};\n\nreturn Object.keys(dataObject).length > 0;")) {
        await branch_then(root);
    }
    else {
        await branch_else(root);
    }
    setResult(root, {
        "success": true,
        "books": root[NODES.branchOnInputValidation]["then"][NODES.apiBooks]["data"],
        "authors": root["state"]["authors"],
        "works": root[NODES.branchOnInputValidation]["then"][NODES.branch]["then"][NODES.apiWorks]["data"]
    }, ["output"]);
    throw "STOP";
    return result;
}
async function branchOnInputValidation_else(root) {
    const result = {};
    setResult(root, await executeScript(NODES.outputValidationError, { "validation_error": await parseExpression(root, "null") }, root, {}), [NODES.branchOnInputValidation, "else", NODES.outputValidationError]);
    return result;
}
export default async function execute(inputs, root) {
    root["inputs"] = {};
    Object.entries(inputs).forEach(([key, value]) => {
        root["inputs"][key] = value;
    });
    if (root["inputs"]["isbn"] != null) {
        await branchOnInputValidation_then(root);
    }
    else {
        await branchOnInputValidation_else(root);
    }
    return result;
}
