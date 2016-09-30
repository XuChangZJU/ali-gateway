/**
 * Created by Administrator on 2016/9/23.
 */
'use strict';
require("isomorphic-fetch");
const CryptoJS = require("crypto-js");
const https = require("https");
const assign = require("lodash/assign");
const uuid = require("node-uuid");
const constants = require("./constants");
const signUtils = require("./signUtils");
const FormData2 = require('form-data');

let SignHeaderPrefixArray, AppKey, AppSecret, FormDataClass, Mode, Stage;


function initHeaders(url, method, headers, body, signHeaderPrefixArray, appKey, appSecret) {
    const now = Date.now();
    const headers2 = assign({}, headers, {
        [constants.httpHeaders.userAgent]: constants.userAgent,
        [constants.xHeaders.xCaTimestamp]: now,
        [constants.xHeaders.xCaNonce]: uuid.v1(),
        [constants.xHeaders.xCaKey]: appKey
    });
    if(Mode) {
        headers2[constants.xHeaders.xCaRequestMode] = Mode;
    }
    if(Stage) {
        headers2[constants.xHeaders.xCaStage] = Stage;
    }
    if(body && ! body instanceof FormDataClass) {
        headers2[constants.httpHeaders.contentMd5] = CryptoJS.MD5(body).toString(CryptoJS.enc.Base64);
    }

    headers2[constants.xHeaders.xCaSignature] = signUtils.sign(url, method, headers2, body, signHeaderPrefixArray, appSecret, now);

    return headers2;
}


function setGlobals(appKey, appSecret, signHeaderPrefixArray, formDataClass, destructFormDataFunction, mode, stage) {
    SignHeaderPrefixArray = signHeaderPrefixArray;
    AppKey = appKey;
    AppSecret = appSecret;
    Mode = mode;
    Stage = stage;

    if(formDataClass) {
        FormDataClass = formDataClass;
        signUtils.setGlobals(formDataClass, destructFormDataFunction);
    }
    else if(global.FormData) {
        FormDataClass = FormData;
        signUtils.setGlobals(FormData, (body) => {
            return body.getAll();
        });
    }
    else {
        FormDataClass = FormData2;
        signUtils.setGlobals(FormData2, (body) => {
            return body._valuesToMeasure;
        });
    }
}


function request(url, method, headers, body, signHeaderPrefixArray, appKey, appSecret) {
    const header2 = initHeaders(url, method, headers, body, signHeaderPrefixArray || SignHeaderPrefixArray, appKey || AppKey, appSecret || AppSecret);
    const body2 = typeof body === "string" ? body : JSON.stringify(body);
    let agent;
    if(url.toLowerCase().startsWith("https")) {
        // 用Agent过掉https证书的问题（ali https的证书好像不被通过）
        agent = new https.Agent({
            rejectUnauthorized: false
        });
    }

    return fetch(url, {
            headers: header2,
            body: body2,
            method,
            agent,
        }
    )
        .then(
            (response) => {
                let parsers = [
                    {
                        keyWord: "application/json",
                        fn: response.json
                    },
                    {
                        keyWord: "text/plain",
                        fn: response.text
                    }
                ];
                let contentType = response.headers.get("content-type");

                const parser = parsers.find(
                    (ele) => {
                        if(contentType.toLowerCase().includes(ele.keyWord)) {
                            return true;
                        }
                        return false;
                    }
                );
                if(!parser) {
                    throw new Error("返回的响应头上的content-type不可识别，值是【" + contentType + "】");
                }

                return parser.fn.call(response)
                    .then(
                        (data) => {
                            if(!response.ok) {
                                return Promise.reject({
                                    headers: response.headers,
                                    body: data,
                                    status: response.status
                                });
                            }

                            return Promise.resolve({
                                headers: response.headers,
                                body: data
                            });
                        }
                    )
            }
        )
}

module.exports = {
    setGlobals,
    request,
    constants
};
