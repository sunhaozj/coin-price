/**
 * Created by sunhao on 2018/3/3.
 */
var bitfinexWsUri = "wss://api.bitfinex.com/ws/2"
var huobiWsUrl = "wss://api.huobipro.com/ws"
var symbolChanneId = {}

$(function () {
    vm.huobiUsdtPrice("coinId=2&tradeType=1&currentPage=1&payWay=&country=&merchant=1&online=1&range=0","buy")
    vm.huobiUsdtPrice("coinId=2&tradeType=0&currentPage=1&payWay=&country=&merchant=0&online=1&range=0","sell")
    vm.bithumbRate()
    vm.bithumbPrice()

    setInterval(function(){
        //console.log("test")
        vm.huobiUsdtPrice("coinId=2&tradeType=1&currentPage=1&payWay=&country=&merchant=1&online=1&range=0","buy")
    },60000);

    setInterval(function(){
        //console.log("test")
        vm.huobiUsdtPrice("coinId=2&tradeType=0&currentPage=1&payWay=&country=&merchant=0&online=1&range=0","sell")
    },60000);

    setInterval(function(){
        vm.bithumbRate()
    },600000);

    setInterval(function(){
        vm.bithumbPrice()
    },10000);

    bitfinexWebSocket()
    huobiWebSocket()
})
var vm = new Vue({
    el:'#coinapp',
    data:{
        username:"sunhao",
        title:"实时价格",
        bitfinex:{
            btc:"pending...",
            eth:"pending..."
        },
        huobi:{
            sell:{
                btc:"pending...",
                eth:"pending...",
                usdt:0
            },
            buy:{
                btc:"pending...",
                eth:"pending...",
                usdt:0
            }
        },
        bithumb:{
            rate:{
                "cnyToKrw":1,
                "usdToCny":1,
                "usdTokrw":1
            },
            btc:{
                krw:"pending",
                cny:"pending"
            },
            eth:{
                krw:"pending",
                cny:"pending"
            }
        }
    },
    methods: {
        huobiUsdtPrice: function (param, type) {
            $.ajax({
                type: "GET",
                url: "https://api-otc.huobipro.com/v1/otc/trade/list/public?" + param,
                contentType: "application/json",
                success: function (res) {
                    data = res.data
                    //console.log(data[4]["fixedPrice"])
                    if (type == "sell")
                        vm.huobi.sell.usdt = data[4]["fixedPrice"]
                    if (type == "buy")
                        vm.huobi.buy.usdt = data[4]["fixedPrice"]
                }
            });
        },
        bithumbRate: function () {
           // /bithumb/CurrencyRate
            $.ajax({
                type: "GET",
                url: "/bithumb/CurrencyRate",
                contentType: "application/json",
                success: function (res) {
                    data = res.rate
                    vm.bithumb.rate.usdToCny = data.usdToCny
                    vm.bithumb.rate.cnyToKrw = data.cnyToKrw
                    vm.bithumb.rate.usdTokrw = data.usdTokrw
                }
            });
        },
        bithumbPrice:function () {
            // /bithumb/ticker/all
            $.ajax({
                type: "GET",
                url: "/bithumb/ticker/all",
                contentType: "application/json",
                success: function (res) {
                    data = res.bithumb
                    vm.bithumb.btc.krw = data.price.BTC
                    vm.bithumb.eth.krw = data.price.ETH
                    if(vm.bithumb.rate != 1){
                         vm.bithumb.btc.cny = (vm.bithumb.btc.krw/vm.bithumb.rate.cnyToKrw).toFixed(3)
                         vm.bithumb.eth.cny = (vm.bithumb.eth.krw/vm.bithumb.rate.cnyToKrw).toFixed(3)
                    }

                }
            });

        }
    }

});



function bitfinexWebSocket() {
    bifinex_websocket = new WebSocket(bitfinexWsUri);
    bifinex_websocket.onopen = function(evt) {
        bitfinexOnOpen(evt)
    };
    bifinex_websocket.onclose = function(evt) {
        onClose(evt)
    };
    bifinex_websocket.onmessage = function(evt) {
        bitfinexOnMessage(evt)
    };
    bifinex_websocket.onerror = function(evt) {
        bitfinexOnError(evt)
    };
}

function huobiWebSocket() {
    huobi_websocket = new WebSocket(huobiWsUrl);
    huobi_websocket.binaryType = "arraybuffer";

    huobi_websocket.onopen = function(evt) {
        huobiOnOpen(evt)

    };
    huobi_websocket.onclose = function(evt) {
        onClose(evt)
    };
    huobi_websocket.onmessage = function(evt) {
        huobiOnMessage(evt)
    };
    huobi_websocket.onerror = function(evt) {
        huobiOnError(evt)
    };
}

function bitfinexOnOpen(evt) {
    console.log("CONNECTED_Bitfinex")
    bitfinexDoSend('{"event": "subscribe","channel": "ticker","symbol": "tETHUSD"}');
    bitfinexDoSend('{"event": "subscribe","channel": "ticker","pair": "tBTCUSD"}');
}

function huobiOnOpen(evt) {
    console.log("CONNECTED_Huobi")
    huobiDoSend('{"sub": "market.ethusdt.kline.1min","id": "id10"}');
    huobiDoSend('{"sub": "market.btcusdt.kline.1min","id": "id10"}');
}

function onClose(evt) {
    console.log("DISCONNECTED")
}

function huobiOnMessage(evt) {
    var raw_data = evt.data;
    //window.raw_data = raw_data;
    var ua = new Uint8Array(raw_data);
    var json = pako.inflate(ua,{to:"string"})
    var data = JSON.parse(json);
    if(data["ping"]){
        huobi_websocket.send(JSON.stringify({"pong":data["ping"]}));
    }else{
        if(data["ch"] != undefined){
            if (data["ch"].indexOf("ethusdt")>0){
                var eth_tick = data["tick"]
                var eth_price = eth_tick["close"]
                if(vm.huobi.buy.usdt == 0)
                    vm.huobi.buy.eth = "inting usdt price..."
                else
                    vm.huobi.buy.eth = (eth_price*vm.huobi.buy.usdt).toFixed(3)

                if(vm.huobi.sell.usdt == 0)
                    vm.huobi.sell.eth = "inting usdt price..."
                else
                    vm.huobi.sell.eth = (eth_price*vm.huobi.sell.usdt).toFixed(3)
            }

            if (data["ch"].indexOf("btcusdt")>0){
                var btc_tick = data["tick"]
                var btc_price = btc_tick["close"]
                if(vm.huobi.buy.usdt == 0)
                    vm.huobi.buy.btc = "inting usdt price..."
                else
                    vm.huobi.buy.btc = (btc_price*vm.huobi.buy.usdt).toFixed(3)

                if(vm.huobi.sell.usdt == 0)
                    vm.huobi.sell.btc = "inting usdt price..."
                else
                    vm.huobi.sell.btc = (btc_price*vm.huobi.sell.usdt).toFixed(3)
            }
        }

        //console.error(json)
    }

}

function bitfinexOnMessage(evt) {
    jsondata = JSON.parse(evt.data)
    if(jsondata.hasOwnProperty("chanId")){
        symbolChanneId[jsondata["symbol"]] = jsondata["chanId"]
    }

    if(symbolChanneId["tETHUSD"] !=undefined && symbolChanneId["tBTCUSD"] !=undefined){
        //console.error(JSON.stringify(symbolChanneId))
        if(jsondata.length == 2 && jsondata[1].length > 7){
            if(jsondata[0] == symbolChanneId["tETHUSD"]){
                vm.bitfinex.eth = (jsondata[1][6]*vm.bithumb.rate.usdToCny).toFixed(3)
            }
            if(jsondata[0] == symbolChanneId["tBTCUSD"]){
                vm.bitfinex.btc = (jsondata[1][6]*vm.bithumb.rate.usdToCny).toFixed(3)
            }
        }
    }

    //console.log(evt.data)
    //websocket.close();
}

function huobiOnError(evt) {
    console.error(evt.data);
}

function bitfinexOnError(evt) {
    console.warn("bitfinex websocket connect failed,the price will get by bithumb platform");

    //get bitfinex price bithumb
    setInterval(function(){
        //console.log("test")
        $.ajax({
                type: "GET",
                url: "/bithumb/total_ticker",
                contentType: "application/json",
                success: function (res) {
                    if(res.Bitfinex.btc != undefined){
                        vm.bitfinex.btc = (res.Bitfinex.btc*vm.bithumb.rate.usdToCny).toFixed(3)
                        vm.bitfinex.eth = (res.Bitfinex.eth*vm.bithumb.rate.usdToCny).toFixed(3)
                    }
                }
            });
    },5000);

}


function bitfinexDoSend(message) {
    bifinex_websocket.send(message);
}

function huobiDoSend(message) {
    huobi_websocket.send(message);
}
