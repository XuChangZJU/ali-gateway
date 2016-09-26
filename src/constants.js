/**
 * Created by Administrator on 2016/9/23.
 */
"use strict";

module.exports = {
    xHeaders: {
        xCaSignature: "X-Ca-Signature",
        xCaSignatureHeaders: "X-Ca-Signature-Headers",
        xCaTimestamp: "X-Ca-Timestamp",
        xCaNonce: "X-Ca-Nonce",
        xCaKey: "X-Ca-Key",
        xCaStage: "X-Ca-Stage",
        xCaRequestMode: "X-Ca-Request-Mode",

        xCaRequestId: "X-Ca-Request-Id",
        xCaErrorMessage: "X-Ca-Error-Message",
        xCaDebugInfo: "X-Ca-Debug-Info"
    },
    hmacSha256: "HmacSHA256",
    utf8: "utf-8",
    userAgent: "ali-gateway-node",
    timeout: 2000,
    caHeaderToSignPrefix: "X-Ca-",
    httpHeaders: {
        accept: "Accept",
        contentMd5: "Content-MD5",
        contentType: "Content-Type",
        userAgent: "User-Agent",
        date: "Date"
    }
}
