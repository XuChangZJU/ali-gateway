/**
 * Created by Administrator on 2016/9/23.
 */
'use strict';
const crypto = require("crypto");
const assert = require("assert");
const Url = require("url");

const constants = require("./constants");

let FormDataClass, DestructFormDataFunction;
function setGlobals(formDataClass, destructFormDataFunction) {
    assert(formDataClass);
    FormDataClass = formDataClass;
    assert(destructFormDataFunction);
    DestructFormDataFunction = destructFormDataFunction;
}

function buildResources(url, body) {
    assert(url);
    const urlObject = Url.parse(url, true);
    const query = urlObject.query;
    assert(typeof query === "object");
    let resourceArray = [];
    const queryStringIndex = url.indexOf("?");
    let path = urlObject.pathname;

    for(let key in query) {
        resourceArray.push({
            key,
            value: query[key]
        });
    }

    if(body instanceof FormDataClass) {
        resourceArray = resourceArray.concat(DestructFormDataFunction(body));
    }

    function tryAppendValue(value) {
        if(value === null || value === undefined) {
            return;
        }
        if(typeof value === "string") {
            if(value.length > 0) {
                path += "=";
                path += (value);
                return;
            }
        }
        else if(value instanceof Array) {
            return tryAppendValue(value[0]);
        }
        else if(value instanceof String) {
            if(value.length > 0) {
                path += "=";
                path += (value);
                return;
            }
        }
    }

    if(resourceArray.length > 0) {
        resourceArray.sort(
            (ele1, ele2) => {
                return ele1.key.localeCompare(ele2.key);
            }
        );

        path += "?";

        resourceArray.forEach(
            (ele, idx) => {
                if(idx > 0) {
                    path += "&";
                }
                path += ele.key;
                tryAppendValue(ele.value);
            }
        );
    }

    return path;
}

function buildHeaders(headers, signHeaderPrefixArray) {
    let result = "";
    let signatureHeaders = [];
    for(let key in headers) {
        if(key.startsWith(constants.caHeaderToSignPrefix)) {
            signatureHeaders.push(key);
        }
        else if(signHeaderPrefixArray) {
            assert(signHeaderPrefixArray instanceof Array);
            signatureHeaders.forEach(
                (ele) => {
                    if(key.startsWith(ele)) {
                        signatureHeaders.push(key);
                    }
                }
            )
        }
    };

    signatureHeaders.sort(
        (ele1, ele2) => {
            return ele1.localeCompare(ele2);
        }
    );

    signatureHeaders.forEach(
        (ele) => {
            result += ele;
            result += ":";
            result += headers[ele];
            result += "\n";
        }
    );

    headers[constants.xHeaders.xCaSignatureHeaders] = signatureHeaders.toString();
    return result;
}

function buildStringToSign(url, method, headers, body, signHeaderPrefixArray) {
    let sign = new String(method);
    sign += "\n";
    let headerAccept = headers[constants.httpHeaders.accept];
    if(headerAccept) {
        sign += headerAccept;
    }
    sign += "\n";

    let headerContentMd5 = headers[constants.httpHeaders.contentMd5];
    if(headerContentMd5) {
        sign += headerContentMd5;
    }
    sign += "\n";

    let headerContentType = headers[constants.httpHeaders.contentType];
    if(headerContentType) {
        sign += headerContentType;
    }
    sign += "\n";

    let headerDate = headers[constants.httpHeaders.date];
    if(headerDate) {
        sign += headerDate;
    }
    sign += "\n";

    sign += buildHeaders(headers, signHeaderPrefixArray);
    sign += buildResources(url, body);

    return sign;
}

function sign(url, method, headers, body, signHeaderPrefixArray, appSecret, now) {
    const stringToSign = buildStringToSign(url, method, headers, body, signHeaderPrefixArray);
    const hmac = crypto.createHmac("sha256", appSecret);
    hmac.update(stringToSign);
    return hmac.digest("base64");
}

module.exports = {
    sign,
    setGlobals
};
