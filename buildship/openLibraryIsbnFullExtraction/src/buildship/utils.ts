/** @ts-ignore */
import * as acorn from "acorn";
import path from "path";
import { fileURLToPath } from "url";
import { getBuildShipFile } from "./files/index.js";
import { httpExecutor } from "./http.js";
import { camelCase } from "lodash-es";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runtimeEnv = process.env.BS_ENV;

export function getSecret(name: string, runtimeEnv: string) {
  return process.env[name];
}

function isMultiline(codeString: string) {
  try {
    let parsedCode = acorn.parse(codeString, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowReturnOutsideFunction: true,
      locations: true,
    });
    const statement = parsedCode.body[parsedCode.body.length - 1];
    if (!parsedCode || !statement) return false;
    return (
      parsedCode.body.length > 1 ||
      statement.type === "ReturnStatement" ||
      statement.type === "VariableDeclaration"
    );
  } catch (error) {
    return false;
  }
}

function formatExpression(inputString: string) {
  const isJSON =
    /^\s*(?:\(\s*)?(?:\{[\s\S]*\}|\[[\s\S]*\]|`[^`]*`|'[^']*'|"[^"]*"|true|false|null|-?\d+(\.\d+)?([eE][+\-]?\d+)?)?(?:\s*\))?\s*$/.test(
      inputString.trim()
    );
  if (isJSON || !isMultiline(inputString))
    return `async (ctx,getSecret,projectEnv,stringify) => (${inputString})`;
  return `async (ctx,getSecret,projectEnv,stringify) => {${inputString}}`;
}

export async function parseExpression(ctx: any, val: string) {
  ctx = { root: ctx };
  const runtimeEnv = process.env.runtimeEnv ?? "test-env";

  return eval(formatExpression(val))(
    { ...ctx, env: {} },
    (name: string) => getSecret(name, runtimeEnv),
    JSON.parse(
      (runtimeEnv ? process.env[`${runtimeEnv}ProjectEnv`] : process.env.projectEnv) ?? "{}"
    ),
    (value: any) => (typeof value === "string" ? value : JSON.stringify(value))
  );
}

export const scripExecutor =
  (workflowDirectory: string) =>
  async (
    nodeId: string,
    args: Record<string, any>,
    root: Record<string, any>,
    subNodes: Record<string, Function> = {}
  ) => {
    const {
      default: { default: script },
    } = await import(`../../scripts/${nodeId}.cjs`);
    const { nodes } = await import(path.join(workflowDirectory, "nodes.js"));
    const node = nodes.find((node: any) => node.id === nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found.`);
    }

    const subNodesCamelcased =
      node.nodes?.map((subNode: any) => ({
        ...subNode,
        label: camelCase(subNode.label ?? subNode.meta?.name),
      })) ?? [];

    return script(args, {
      env: {},
      logging: console,
      auth: {
        getKey: (options: { ignoreMissingKey?: boolean } | undefined) => {
          const selectedKey = args.kbIntegrationKey;
          if (selectedKey === undefined) {
            if (options?.ignoreMissingKey) return undefined;

            throw new Error(
              `No key was selected for this trigger. Please select one in the trigger's setup/config tab.`
            );
          }

          const [groupUid, keyId] = selectedKey.split(";;");

          // This case should never happen, but just in case it does, the error should help with debugging.
          if (groupUid !== node._groupInfo.uid) {
            throw new Error(
              `Selected key (${selectedKey}) does not belong to this trigger's group (${node._groupInfo.uid}).`
            );
          }

          return JSON.parse(
            process.env[runtimeEnv ? `${runtimeEnv}ProjectEnv` : "projectEnv"] || "{}"
          )[selectedKey];
        },
        getToken: () => {
          throw new Error("OAuth nodes are not yet supported with local executor");
        },
      },
      getBuildShipFile,
      secret: {
        get: getSecret,
        set: (name: string, value: any) => {
          throw new Error("Setting secrets is not yet supported with local executor");
        },
      },
      execute: async (name: string, args: any) => {
        const nodeToExecuteId = subNodesCamelcased.find(
          (subNode: any) => subNode.label === name
        )?.id;
        if (!nodeToExecuteId) {
          throw new Error(`Node with name ${name} not found.`);
        }

        const executeSubNode = subNodes[nodeToExecuteId];
        if (!executeSubNode) {
          throw new Error(`Internal Error: OpenAI function not found.`);
        }

        return await executeSubNode(args);
      },
      pause: () => {
        throw new Error("Pause is not yet supported with local executor");
      },
      nodes: subNodesCamelcased,
      // TODO: This root should be coming from the workflow execution context.
      root,
    });
  };

export function setResult(obj: Record<string, any>, value: any, keyPath: string[]) {
  let lastKeyIndex = keyPath.length - 1;
  for (var i = 0; i < lastKeyIndex; ++i) {
    let key = keyPath[i];
    if (!(key in obj)) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  obj[keyPath[lastKeyIndex]] = value;
}

export function duplicateState(state: Record<string, any>) {
  const newState = {
    ...JSON.parse(JSON.stringify(state)),
    // The state object is used by Set Variable nodes to store data. The workflow variables are
    // like global variables and are shared between all nodes/sub-nodes.
    state: state.state,
  };

  return newState;
}

export async function executeWorkflow(workflowName: string, args: any) {
  const { default: workflow } = await import(path.join(__dirname, "../", workflowName, "index.js"));
  const ctx: any = {};
  const root: any = (ctx.root = {});

  try {
    const ret = await workflow(args, root);
    return ret;
  } catch (error) {
    if (error === "STOP") {
      return root["output"];
    }

    throw error;
  }
}
