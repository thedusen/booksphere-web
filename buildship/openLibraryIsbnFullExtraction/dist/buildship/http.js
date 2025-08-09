import path from "path";
function renderTemplate(template, context) {
    return template.replace(/\(\$([a-zA-Z0-9_.]+)\)/g, (_, key) => {
        const keyParts = key.split(".");
        let value = context;
        for (let keyPart of keyParts) {
            value = value[keyPart];
            if (value === undefined)
                break;
        }
        return value;
    });
}
function renderRequestBody(spec, context) {
    // There should only be one request body. We are getting the first one.
    const requestBody = Object.values(spec?.content ?? {}).slice(0, 1)[0];
    if (!requestBody)
        return undefined;
    const body = renderBodyValue(requestBody.value, context, requestBody.schema);
    if (typeof body === "object") {
        return JSON.stringify(body);
    }
    else if (typeof body === "string") {
        return body;
    }
    else if (typeof body === "bigint" || typeof body === "boolean" || typeof body === "number") {
        return String(body);
    }
    return undefined;
}
function renderBodyValue(value, context, schema) {
    let body;
    if (typeof value === "object") {
        body = {};
        for (let [key, property] of Object.entries(value)) {
            body[key] = renderBodyValue(property, context, schema?.properties?.[key]);
        }
    }
    else if (typeof value === "string") {
        body = renderTemplate(value, context);
    }
    else if (typeof value === "bigint" || typeof value === "boolean" || typeof value === "number") {
        body = value;
    }
    // Fix typeof body based on schema type if possible
    try {
        body = schema?.type !== "string" && typeof value === "string" ? JSON.parse(body) : body;
    }
    catch { }
    return body;
}
function renderPath(path, context) {
    return path.replace(/\{([a-zA-Z0-9_.]+)\}/g, (_, key) => {
        const keyParts = key.split(".");
        let value = context;
        for (let keyPart of keyParts) {
            value = value[keyPart];
            if (value === undefined)
                throw new Error(`Undefined value in template for key: ${key}`);
        }
        return value;
    });
}
export async function fetchRequest(node, context) {
    const isAccessTokenRequired = Array.isArray(node.integrations) && node.integrations.length > 0;
    const isIntegrationKeyRequired = node._groupInfo?.acceptsKey &&
        !isAccessTokenRequired &&
        node.spec.parameters.some((p) => p.value?.includes("($auth.integrationKey)"));
    const runtimeEnv = process.env.BS_ENV;
    // const getAccessToken = getTokenFn(node, nodeValues, runtimeEnv);
    const getAccessToken = () => {
        throw new Error("getAccessToken is not implemented");
    };
    const { spec } = node;
    let headers = {};
    let pathParams = {};
    let queryParams = {};
    let integrationId, accountId;
    if (isAccessTokenRequired) {
        const getAccessTokenResp = await getAccessToken(false);
        context = {
            ...context,
            auth: {
                ...context.auth,
                token: getAccessTokenResp.access_token,
            },
        };
    }
    if (isIntegrationKeyRequired) {
        const selectedIntegrationKey = getKey(context.inputs.kbIntegrationKey, {
            ignoreMissingKey: false,
        });
        context = {
            ...context,
            auth: {
                ...context.auth,
                integrationKey: selectedIntegrationKey,
            },
        };
    }
    spec.parameters.forEach((param) => {
        switch (param.in) {
            case "header":
                headers[param.name] = param.value ? renderTemplate(param.value, context) : undefined;
                break;
            case "path":
                pathParams[param.name] = param.value ? renderTemplate(param.value, context) : undefined;
                break;
            case "query":
                queryParams[param.name] = param.value ? renderTemplate(param.value, context) : undefined;
                break;
            default:
                throw new Error(`Unsupported parameter location: ${param.in}`);
        }
    });
    const body = spec.method !== "GET" ? renderRequestBody(spec.requestBody, context) : undefined;
    const contentType = Object.keys(spec.requestBody?.content ?? {}).slice(0, 1)[0];
    if (contentType) {
        headers["Content-Type"] = contentType;
    }
    const renderedUrl = renderPath(spec.servers[0].url, pathParams);
    const url = new URL(renderedUrl);
    Object.keys(queryParams).forEach((key) => url.searchParams.append(key, queryParams[key]));
    let response = await fetch(url, {
        method: spec.method,
        headers,
        body: body,
    });
    // Retry with new access token
    if (response.status === 401 && integrationId && accountId) {
        const getAccessTokenResp = await getAccessToken(true);
        context = {
            ...context,
            auth: {
                ...context.auth,
                token: getAccessTokenResp.access_token,
            },
        };
        response = await fetch(url, {
            method: spec.method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    const responseText = await response.text();
    // Using try-catch block to check if valid JSON because
    // content-type header can't be trusted.
    try {
        return {
            status: response.status,
            response: JSON.parse(responseText),
        };
    }
    catch {
        return {
            status: response.status,
            response: responseText,
        };
    }
}
export const httpExecutor = (workflowDirectory) => async (nodeId, args) => {
    const { nodes } = await import(path.join(workflowDirectory, "nodes.js"));
    const node = nodes.find((n) => n.id === nodeId);
    if (!node)
        throw new Error(`Node with id ${nodeId} not found`);
    return fetchRequest(node, { inputs: args });
};
function getKey(kbIntegrationKey, options) {
    const runtimeEnv = process.env.BS_ENV;
    const selectedKey = kbIntegrationKey;
    if (selectedKey === undefined) {
        if (options?.ignoreMissingKey)
            return undefined;
        throw new Error(`No key was selected for this trigger. Please select one in the trigger's setup/config tab.`);
    }
    const [groupUid, keyId] = selectedKey.split(";;");
    return JSON.parse(process.env[runtimeEnv ? `${runtimeEnv}ProjectEnv` : "projectEnv"] || "{}")[selectedKey];
}
