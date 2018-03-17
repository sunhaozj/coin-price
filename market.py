from flask import Flask,jsonify
from flask import render_template
import time,sched,os
import urllib.request
from requests import HTTPError
import ast
import json

from gevent import monkey
from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler

#monkey.patch_all()

app = Flask(__name__)
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/bithumb/ticker/all',methods=['GET'])
def ticker():
    responseData = {}
    jsonObj = getHtml("https://api.bithumb.com/public/ticker/All","")
    if jsonObj["status"] == "0000":
        price = {}
        priceData = jsonObj["data"]
        btcPrice = priceData["BTC"]["closing_price"]
        ethPrice = priceData["ETH"]["closing_price"]

        price["BTC"] = btcPrice
        price["ETH"] = ethPrice

        responseData["msg"]="sucess"
        responseData["price"] = price

    else:
        responseData["msg"]="error"

    return jsonify({"bithumb":responseData})


@app.route('/bithumb/total_ticker',methods=['GET'])
def total_ticker():
    responseData = {}
    jsonObj = getHtml("https://www.bithumb.com/resources/csv/total_ticker.json","")
    btcArray = jsonObj["BTC"]
    ethArray = jsonObj["ETH"]

    for btc in btcArray:
        if btc["name"] == "Bitfinex":
            btcPrice = btc["data"]["last"]
            responseData["btc"] = btcPrice

    for eth in ethArray:
        if eth["name"] == "Bitfinex":
            ethPrice = eth["data"]["last"]
            responseData["eth"] = ethPrice
    return jsonify({"Bitfinex":responseData})

@app.route('/bithumb/CurrencyRate',methods=['GET'])
def currencyRate():
    responseData = {}
    usdToKrw = 1
    cnyToKrw = 1
    jsonObj = getHtml("https://www.bithumb.com/resources/csv/CurrencyRate.json","")
    for rate in jsonObj:
        if rate["Currency"] == "USD":
            usdToKrw = float(rate["Rate"])
        if rate["Currency"] == "CNY":
            cnyToKrw = float(rate["Rate"])
    usdToCny = usdToKrw/cnyToKrw

    responseData["usdToCny"] = round(usdToCny,3)
    responseData["usdTokrw"] = round(usdToKrw,3)
    responseData["cnyToKrw"] = round(cnyToKrw,3)

    return jsonify({"rate":responseData})


def getHtml(restUri,PostParam):
    if PostParam !="":
        restUri=restUri+"?"+PostParam
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'}
    req = urllib.request.Request(url=restUri, headers=headers)
    req.add_header('Content-type', 'application/x-www-form-urlencoded')
    try:
        r = urllib.request.urlopen(req).read()
        jsonStr = r.decode('utf8')
        jsonObj = json.loads(jsonStr)
        return jsonObj
    except HTTPError:
        print("error")
        time.sleep(5);
        return getHtml(restUri,PostParam)

if __name__ == '__main__':
    #WSGIServer(('0.0.0.0',5000), app).serve_forever()
    app.run(host='0.0.0.0')
