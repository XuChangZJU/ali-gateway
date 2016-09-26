/**
 * Created by Administrator on 2016/9/24.
 */
const expect = require("expect.js");
const aliGateway = require("../src/index");
const queryString = require("querystring");

const AppKey = "APPKEY";
const AppSecret = "APPTEST";

describe("测试访问阿里云网关接口", function() {
    this.timeout(5000);
    before((done) => {
        aliGateway.setGlobals(AppKey, AppSecret, null, null, null, "Debug", "Test");
        done();
    });

    it("[1.0.1]测试访问sms接口", () => {
        /**
         * https://market.aliyun.com/products/57002003/cmapi011900.html
         */
        let dest = "http://sms.market.alicloudapi.com/singleSendSms";
        const query = {
            ParamString: JSON.stringify({house: "阿里皆弱智"}),
            RecNum: "13968087416",
            SignName: "码天租房",
            TemplateCode: "SMS_14735627"
        };

        dest += "?" + queryString.stringify(query);
        return aliGateway.request(dest, "GET", {
                [aliGateway.constants.httpHeaders.accept]: "application/json",
                [aliGateway.constants.httpHeaders.contentType]: "application/json; charset=UTF-8"
            })
            .then(
                (result) => {
                    console.log(result.body);
                    expect(result.body).not.to.empty();
                    return Promise.resolve();
                }
            );
    });

    it("[1.0.2]测试加密算法", (done) => {
        const crypto = require('crypto');
        const base64 = require("base-64");
        let stringToSign = "GET\napplication/json\n\n\n\nX-Ca-Key:23450197\nX-Ca-Nonce:07843fc7-d28d-4349-a5bf-b722e227320e\nX-Ca-Request-Mode:Debug\nX-Ca-Stage:Test\nX-Ca-Timestamp:1474709001227\n/singleSendSms?ParamString=%7B%22house%22%3A%22%E9%98%BF%E9%87%8C%E7%9A%86%E5%BC%B1%E6%99%BA%22%7D&RecNum=13968087416&SignName=%E7%A0%81%E5%A4%A9%E7%A7%9F%E6%88%BF&TemplateCode=SMS_14735627";
        let secret = AppSecret;

        let hmac = crypto.createHmac("sha256", secret);
        hmac.update(stringToSign);
        let signature1 = hmac.digest("base64");
        expect(signature1).to.eql("8SNrwtA1KVl/twaIDBSXVQQ6DBVVpfwQli0S6r8Xodo=");
        done();
    })
});