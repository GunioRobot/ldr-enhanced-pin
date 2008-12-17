// ==UserScript==
// @name      Hacked Hack LDR API
// @namespace http://d.hatena.ne.jp/youpy/
// @include   http://reader.livedoor.com/reader/
// @include   http://fastladder.com/reader/
// @version   1.0.1
// ==/UserScript==

/*
 special thanks to youpy
*/
(function (w) {
     var plagger_server = GM_getValue("server");
     if (!plagger_server) {
         plagger_server = window.prompt('set pin server');
         GM_setValue("server", plagger_server);
     }
     
     /*
      API
     */
     var API = w.Class.create();
     API.extend({
     	initialize: function(ap){ this.ap = ap; this.raw_mode = false; },
     	onCreate:   function(){},
     	onComplete: function(){},
     	post: CrossDomainAPI(),
     	get: function(param,onload){
     		this.req = new _XMLHttpRequest;
     		var onload = onload || this.onload;
     		var oncomplete = this.onComplete;
     		if(typeof onload != "function"){
     			onload = Function.empty;
     		}
     		var req = this.req;
     		Object.extend(param, API.StickyQuery);
     		var postdata = Object.toQuery(param);
     		this.req.open("GET",this.ap + "?" + postdata,true);
     		this.req.onload = function(){
     			oncomplete();
     			API.last_response = req.responseText;
     			var json = JSON.parse(this.req.responseText);
     			if(json){
     				onload(json);
     			} else {
     				message("Unable to load data");
     			}
     			this.req = null;
     		}.bind(this);
     		this.onCreate();
     		this.req.send(null);
     		return this;
     	},
     	requester: function(method,param){
     		return function(onload){
     			return this[method.toLowerCase()](param,onload)
     		}.bind(this)
     	},
     	onload:  function(){},
     	onerror: function(error_code){
     		alert("エラーコード:"+ error_code)
     	}
     });
     API.last_response = "";
     API.registerCallback = function(options){
     	each(options,function(value,key){
     		API.prototype["on"+key] = value;
     	})
     };
     API.StickyQuery = { ApiKey: w.ApiKey };

     /*
       CrossDomain API
     */
     Function.prototype.bind = function(thisObj){
         var self = this;
         return function(){
             return self.apply(thisObj,arguments);
         }
     };
     function CrossDomainAPI(conf){
         return function(param, onload){
             var onload = onload || this.onload;
             var oncomplete = this.onComplete;
             if(typeof onload != "function"){
                 onload = function() {};
             }
             
             var server = /pin/.test(this.ap)
                 ? plagger_server
                 : "http://"+location.host;
             w.Object.extend(param, API.StickyQuery);
             
             var self = this;
             
             var api_post = function () {
                 window.setTimeout(GM_xmlhttpRequest, 0, {
                     method: 'POST',
                     url: server + self.ap,
                     data: w.Object.toQuery(param),
                     headers: {
                         "Content-Type": "application/x-www-form-urlencoded",
                         "User-Agent":   navigator.userAgent + " Greasemonkey (Hack LDR API 1.0.1)"
                     },
                     onload: function(response) {
                         oncomplete();
                         var responseText = response.responseText;
                         API.last_response = responseText;
                         var json = eval("("+responseText+")");
                         if(json){
                             onload(json);
                         } else {
                             w.message("can't load data");
                             w.show_error();
                         }
                     }.bind(self)
                 });
             };
             
             window.setTimeout(GM_xmlhttpRequest, 0, {
                 method: 'GET',
                 url: server + self.ap,
                 headers: {
                     "Content-Type": "application/x-www-form-urlencoded",
                     "User-Agent":   navigator.userAgent + " Greasemonkey (Hack LDR API 1.0.1)"
                 },
                 onload: api_post,
                 onerror: api_post,
             });

             return this;
        };
    }

    Array.prototype.sum_of = function(name){ }

    if (w["initialized"]) {
        w.API = API;                                                // Fastladder
    }
    else {
        w.register_hook("after_init", function () { w.API = API }); // LDR
    }
    /*
   
    */
})(unsafeWindow);


// enhance pin methods
location.href = 'javascript:(' + function(){
(function(w){
    w.pin.add = function(url, title, info, item_id){
        if(this.has(url)) return;
        this.hash[url] = true;
        var data = {
            title : title,
            url : url
        };
        if(info){
            data.icon = info.icon
        }
        this.pins.unshift(data);
        this.update_view();
        
        var content = $("item_body_" + item_id).innerHTML;
        
        if(!Config.use_pinsaver) return;
        var api = new API("/api/pin/add");
        api.post({
            link : url.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
            title: title.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
            content: content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
        })
    };
    w.toggle_pin = function (item_id){
        var pin_button = $("pin_" + item_id);
        var item = $("item_" + item_id);
        var a = item.getElementsByTagName("a");
        if(!a.length) return;
        var title = a[0].innerHTML;
        var url = a[0].href;
        if(pin.has(url)){
            pin.remove(url);
            pin_button && removeClass(pin_button, "pin_active");
            removeClass(item, "pinned");
        } else {
            // feed info
            var info = subs_item(State.now_reading);
            pin.add(url,title,info,item_id);
            pin_button && addClass(pin_button, "pin_active");
            addClass(item, "pinned");
        }
    };
})(this.unsafeWindow||window);
}.toString() + ')()';

