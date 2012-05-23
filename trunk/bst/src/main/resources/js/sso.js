function SSOController() {
    var me = this;
    var updateCookieTimer = null;
    var updateCookieTimeHardLimit = 1800;
    var cookieExpireTimeLength = 3600 * 24;
    var crossDomainForward = null;
    var crossDomainTimer = null;
    var crossDomainTime = 3;
    var autoLoginCallBack2 = null;
    var ssoCrosssDomainUrl = "http://login.sina.com.cn/sso/crossdomain.php";
    var ssoLoginUrl = "http://login.sina.com.cn/sso/login.php";
    var ssoLogoutUrl = "http://login.sina.com.cn/sso/logout.php";
    var ssoUpdateCookieUrl = "http://login.sina.com.cn/sso/updatetgt.php";
    var ssoPreLoginUrl = "http://login.sina.com.cn/sso/prelogin.php";
    var ssoCheckAltLoginNameUrl = "http://login.sina.com.cn/bindmail/checkmailuser.php";
    var pincodeUrl = "http://login.sina.com.cn/cgi/pin.php";
    var vfValidUrl = "http://weibo.com/sguide/vdun.php";
    var crossDomainUrlList = null;
    var loginMethod = "";
    var checkAltLoginNameCallbackData = {};
    var ssoCheckAltLoginNameScriptId = "check_alt_login";
    var ssoServerTimeTimer = null;
    var ssoLoginTimer = null;
    var loginByConfig = null;
    var loginMethodCheck = null;
    var https = 1;
    var wsse = 2;
    var pcid = "";
    var tmpData = {};
    var preloginTimeStart = 0;
    var preloginTime = 0;
    this.https = 1;
    this.wsse = 2;
    this.name = "sinaSSOController";
    this.loginFormId = "ssoLoginForm";
    this.scriptId = "ssoLoginScript";
    this.ssoCrossDomainScriptId = "ssoCrossDomainScriptId";
    this.loginFrameName = "ssoLoginFrame";
    this.appLoginURL = {"51uc.com": "http://passport.51uc.com/sso/login.php","weibo.com": "http://weibo.com/sso/login.php"};
    this.appDomainService = {"51uc.com": "51uc","weibo.com": "miniblog"};
    this.loginExtraQuery = {};
    this.setDomain = false;
    this.feedBackUrl = "";
    this.service = "sso";
    this.domain = "sina.com.cn";
    this.from = "";
    this.pageCharset = "GB2312";
    this.useTicket = false;
    this.isCheckLoginState = false;
    this.isUpdateCookieOnLoad = true;
    this.useIframe = true;
    this.noActiveTime = 7200;
    this.autoUpdateCookieTime = 1800;
    this.loginType = wsse;
    this.timeoutEnable = false;
    this.crossDomain = true;
    this.scriptLoginHttps = false;
    this.allowAutoFoundServerTime = false;
    this.allowAutoFoundServerTimeError = true;
    this.calcServerTimeInterval = 2000;
    this.servertime = null;
    this.nonce = null;
    this.loginExtraFlag = {};
    this.cdult = false;
    this.crossDomainTime = 5;
    this.failRedirect = false;
    this.getVersion = function() {
        return "ssologin.js(v1.3.22) 2012-4-12"
    };
    this.getEntry = function() {
        return me.entry
    };
    this.getClientType = function() {
        return me.getVersion().split(" ")[0]
    };
    this.init = function() {
        me.setLoginType(me.loginType);
        var ssoConfig = window.sinaSSOConfig;
        if (typeof ssoConfig != "object") {
            ssoConfig = {}
        }
        var name;
        for (name in ssoConfig) {
            me[name] = ssoConfig[name]
        }
        if (!me.entry) {
            me.entry = me.service
        }
        if (me.isUpdateCookieOnLoad) {
            setTimeout(me.name + ".updateCookie()", 10000)
        }
        if (me.isCheckLoginState) {
            addEventListener(window, "load", function() {
                me.checkLoginState()
            })
        }
        if (me.allowAutoFoundServerTime && ssoLoginServerTime) {
            me.setServerTime(ssoLoginServerTime)
        }
        me.customInit()
    };
    this.customInit = function() {
    };
    this.customUpdateCookieCallBack = function(result) {
    };
    this.customLogoutCallBack = function(result) {
        me.customLoginCallBack({result: false})
    };
    this.customLoginCallBack = function(loginStatus) {
    };
    this.login = function(username, password, savestate) {
        if (!ssoLoginTimer) {
            ssoLoginTimer = new prototypeTimer(me.timeoutEnable)
        } else {
            ssoLoginTimer.clear()
        }
        ssoLoginTimer.start(5000, function() {
            ssoLoginTimer.clear();
            me.customLoginCallBack({result: false,reason: unescape("%u767B%u5F55%u8D85%u65F6%uFF0C%u8BF7%u91CD%u8BD5")})
        });
        savestate = savestate == undefined ? 0 : savestate;
        tmpData.savestate = savestate;
        loginByConfig = function() {
            if (me.useIframe && (me.setDomain || me.feedBackUrl)) {
                if (me.setDomain) {
                    document.domain = me.domain;
                    if (!me.feedBackUrl && me.domain != "sina.com.cn") {
                        me.feedBackUrl = makeURL(me.appLoginURL[me.domain], {domain: 1})
                    }
                }
                loginMethod = "post";
                var result = loginByIframe(username, password, savestate);
                if (!result) {
                    loginMethod = "get";
                    if (me.scriptLoginHttps) {
                        me.setLoginType(me.loginType | https)
                    } else {
                        me.setLoginType(me.loginType | wsse)
                    }
                    loginByScript(username, password, savestate)
                }
            } else {
                loginMethod = "get";
                loginByScript(username, password, savestate)
            }
            me.nonce = null
        };
        loginMethodCheck = function() {
            if (me.loginType & wsse) {
                if (me.servertime) {
                    if (!me.nonce) {
                        me.nonce = makeNonce(6)
                    }
                    loginByConfig();
                    return true
                }
                me.getServerTime(username, loginByConfig)
            } else {
                loginByConfig()
            }
        };
        loginMethodCheck();
        return true
    };
    this.getServerTime = function(username, callback) {
        if (me.servertime) {
            if (typeof callback == "function") {
                callback({retcode: 0,servertime: me.servertime})
            }
            return true
        }
        var url = location.protocol == "https:" ? ssoPreLoginUrl.replace(/^http:/, "https:") : ssoPreLoginUrl;
        username = sinaSSOEncoder.base64.encode(urlencode(username));
        url = makeURL(url, {entry: me.entry,callback: me.name + ".preloginCallBack",su: username});
        me.preloginCallBack = function(result) {
            if (result && result.retcode == 0) {
                me.setServerTime(result.servertime);
                me.nonce = result.nonce;
                pcid = result.pcid;
                preloginTime = (new Date()).getTime() - preloginTimeStart
            }
            if (typeof callback == "function") {
                callback(result)
            }
        };
        preloginTimeStart = (new Date()).getTime();
        excuteScript(me.scriptId, url)
    };
    this.logout = function() {
        try {
            var request = {entry: me.getEntry(),callback: me.name + ".ssoLogoutCallBack"};
            var url = makeURL(ssoLogoutUrl, request);
            excuteScript(me.scriptId, url)
        } catch (e) {
        }
        return true
    };
    this.ssoLogoutCallBack = function(result) {
        if (result.arrURL) {
            me.setCrossDomainUrlList(result)
        }
        me.crossDomainAction("logout", function() {
            me.customLogoutCallBack({result: true})
        })
    };
    this.updateCookie = function() {
        try {
            if (me.autoUpdateCookieTime > 5) {
                if (updateCookieTimer != null) {
                    clearTimeout(updateCookieTimer)
                }
                updateCookieTimer = setTimeout(me.name + ".updateCookie()", me.autoUpdateCookieTime * 1000)
            }
            var cookieExpireTime = me.getCookieExpireTime();
            var now = (new Date()).getTime() / 1000;
            var result = {};
            if (cookieExpireTime == null) {
                result = {retcode: 6102}
            } else {
                if (cookieExpireTime < now) {
                    result = {retcode: 6203}
                } else {
                    if (cookieExpireTime - cookieExpireTimeLength + updateCookieTimeHardLimit > now) {
                        result = {retcode: 6110}
                    } else {
                        if (cookieExpireTime - now > me.noActiveTime) {
                            result = {retcode: 6111}
                        }
                    }
                }
            }
            if (result.retcode !== undefined) {
                me.customUpdateCookieCallBack(result);
                return false
            }
            var url = location.protocol == "https:" ? ssoUpdateCookieUrl.replace(/^http:/, "https:") : ssoUpdateCookieUrl;
            url = makeURL(url, {entry: me.getEntry(),callback: me.name + ".updateCookieCallBack"});
            excuteScript(me.scriptId, url)
        } catch (e) {
        }
        return true
    };
    this.setCrossDomainUrlList = function(urlList) {
        crossDomainUrlList = urlList
    };
    this.checkAltLoginNameCallback = function(data) {
        var ret = {retcode: 0,detail: "",data: ""};
        if (data.ret == "y") {
            ret.retcode = 1;
            ret.detail = '\u4e3a\u4e86\u60a8\u7684\u8d26\u53f7\u5b89\u5168\uff0c\u8bf7<a href="http://login.sina.com.cn/bindmail/signin.php?username=' + checkAltLoginNameCallbackData.username + '">\u7ed1\u5b9a\u90ae\u7bb1</a>';
            ret.data = checkAltLoginNameCallbackData.username
        } else {
            if (data.ret == "n" && data.mail) {
                if (data.errcode == "not_verify") {
                    ret.retcode = 2;
                    ret.detail = "\u60a8\u7684\u90ae\u7bb1: " + data.mail + ' \u672a\u9a8c\u8bc1\uff0c\u70b9\u6b64<a href="http://login.sina.com.cn/bindmail/bindmail1.php?entry=sso&user=' + data.mail + '">\u91cd\u53d1\u9a8c\u8bc1\u90ae\u4ef6</a>';
                    ret.data = data.mail
                } else {
                    ret.retcode = 3;
                    ret.detail = "\u7528\u60a8\u7684\u90ae\u7bb1" + data.mail + "\u4e5f\u53ef\u4ee5\u767b\u5f55";
                    ret.data = data.mail
                }
            } else {
            }
        }
        checkAltLoginNameCallbackData.callback(ret)
    };
    this.checkAltLoginName = function(username, callback) {
        if (username == "") {
            return true
        }
        var r = /^[0-9]{1,9}$/;
        if (r.exec(username)) {
            return true
        }
        checkAltLoginNameCallbackData = {username: username,callback: callback};
        var url = (me.loginType & https) ? ssoCheckAltLoginNameUrl.replace(/^http:/, "https:") : ssoCheckAltLoginNameUrl;
        url = makeURL(url, {name: username,type: "json",callback: "sinaSSOController.checkAltLoginNameCallback"});
        excuteScript(ssoCheckAltLoginNameScriptId, url)
    };
    this.callFeedBackUrl = function(loginStatus) {
        try {
            var request = {callback: me.name + ".feedBackUrlCallBack"};
            if (loginStatus.ticket) {
                request.ticket = loginStatus.ticket
            }
            if (loginStatus.retcode !== undefined) {
                request.retcode = loginStatus.retcode
            }
            var url = makeURL(me.feedBackUrl, request);
            excuteScript(me.scriptId, url)
        } catch (e) {
        }
        return true
    };
    this.loginCallBack = function(result) {
        try {
            if (me.timeoutEnable && !ssoLoginTimer.isset()) {
                return
            }
            ssoLoginTimer.clear();
            me.loginExtraFlag = {};
            var loginStatus = {};
            var st = result.ticket;
            var uid = result.uid;
            if (uid) {
                loginStatus.result = true;
                loginStatus.retcode = 0;
                loginStatus.userinfo = {uniqueid: result.uid};
                if (st) {
                    loginStatus.ticket = st
                }
                if (me.feedBackUrl) {
                    if (me.crossDomain) {
                        me.crossDomainAction("login", function() {
                            me.callFeedBackUrl(loginStatus)
                        })
                    } else {
                        me.callFeedBackUrl(loginStatus)
                    }
                } else {
                    if (me.crossDomain) {
                        if (result.crossDomainUrlList) {
                            me.setCrossDomainUrlList({retcode: 0,arrURL: result.crossDomainUrlList})
                        }
                        me.crossDomainAction("login", function() {
                            if (st && me.appLoginURL[me.domain]) {
                                me.appLogin(st, me.domain, me.name + ".customLoginCallBack")
                            } else {
                                loginStatus.userinfo = objMerge(loginStatus.userinfo, me.getSinaCookie());
                                me.customLoginCallBack(loginStatus)
                            }
                        })
                    } else {
                        me.customLoginCallBack(loginStatus)
                    }
                }
            } else {
                if (loginMethodCheck && result.retcode == "2092" && me.allowAutoFoundServerTimeError) {
                    me.setServerTime(0);
                    me.loginExtraFlag = objMerge(me.loginExtraFlag, {wsseretry: "servertime_error"});
                    loginMethodCheck();
                    loginMethodCheck = null;
                    return false
                }
                loginStatus.result = false;
                loginStatus.errno = result.retcode;
                if (loginStatus.errno == "4069") {
                    var reason = result.reason.split("|");
                    loginStatus.reason = reason[0];
                    if (reason.length == 2) {
                        loginStatus.rurl = reason[1]
                    }
                    if (loginStatus.rurl) {
                        try {
                            top.location.href = loginStatus.rurl;
                            return
                        } catch (e) {
                        }
                    }
                } else {
                    loginStatus.reason = result.reason
                }
                me.customLoginCallBack(loginStatus)
            }
        } catch (e) {
        }
        return true
    };
    this.updateCookieCallBack = function(result) {
        if (result.retcode == 0) {
            me.crossDomainAction("update", function() {
                me.customUpdateCookieCallBack(result)
            })
        } else {
            me.customUpdateCookieCallBack(result)
        }
    };
    this.feedBackUrlCallBack = function(result) {
        if (loginMethod == "post" && me.timeoutEnable && !ssoLoginTimer.isset()) {
            return
        }
        ssoLoginTimer.clear();
        if (result.errno == "2092") {
            me.setServerTime(0)
        }
        if (result.errno == "4069") {
            var reason = result.reason.split("|");
            result.reason = reason[0];
            if (reason.length == 2) {
                result.rurl = reason[1];
                try {
                    top.location.href = result.rurl;
                    return
                } catch (e) {
                }
            }
        }
        me.customLoginCallBack(result);
        removeNode(me.loginFrameName)
    };
    this.doCrossDomainCallBack = function(result) {
        me.crossDomainCounter++;
        if (result) {
            removeNode(result.scriptId)
        }
        if (me.crossDomainCounter == me.crossDomainCount) {
            clearTimeout(crossDomainTimer);
            me.crossDomainResult()
        }
    };
    this.crossDomainCallBack = function(result) {
        removeNode(me.ssoCrossDomainScriptId);
        if (!result || result.retcode != 0) {
            return false
        }
        var arrURL = result.arrURL;
        var url, scriptId;
        var request = {callback: me.name + ".doCrossDomainCallBack"};
        me.crossDomainCount = arrURL.length;
        me.crossDomainCounter = 0;
        if (arrURL.length == 0) {
            clearTimeout(crossDomainTimer);
            me.crossDomainResult();
            return true
        }
        for (var i = 0; i < arrURL.length; i++) {
            url = arrURL[i];
            scriptId = "ssoscript" + i;
            request.scriptId = scriptId;
            url = makeURL(url, request);
            if (isSafari()) {
                excuteIframe(scriptId, url)
            } else {
                excuteScript(scriptId, url)
            }
        }
    };
    this.crossDomainResult = function() {
        crossDomainUrlList = null;
        if (typeof crossDomainForward == "function") {
            crossDomainForward()
        }
    };
    this.crossDomainAction = function(action, callback) {
        crossDomainTimer = setTimeout(me.name + ".crossDomainResult()", crossDomainTime * 1000);
        if (typeof callback == "function") {
            crossDomainForward = callback
        } else {
            crossDomainForward = null
        }
        if (crossDomainUrlList) {
            me.crossDomainCallBack(crossDomainUrlList);
            return false
        }
        var domain = me.domain;
        if (action == "update") {
            action = "login";
            domain = "sina.com.cn"
        }
        var request = {scriptId: me.ssoCrossDomainScriptId,callback: me.name + ".crossDomainCallBack",action: action,domain: domain};
        var url = makeURL(ssoCrosssDomainUrl, request);
        excuteScript(me.ssoCrossDomainScriptId, url)
    };
    this.checkLoginState = function(callback) {
        if (callback) {
            me.autoLogin(callback)
        } else {
            me.autoLogin(function(cookieinfo) {
                var loginStatus = {};
                if (cookieinfo !== null) {
                    var userinfo = {displayname: cookieinfo.nick,uniqueid: cookieinfo.uid,userid: cookieinfo.user};
                    loginStatus.result = true;
                    loginStatus.userinfo = userinfo
                } else {
                    loginStatus.result = false;
                    loginStatus.reason = ""
                }
                me.customLoginCallBack(loginStatus)
            })
        }
    };
    this.getCookieExpireTime = function() {
        return getCookieExpireTimeByDomain(me.domain)
    };
    this.getSinaCookie = function(strict) {
        var sup = urldecode(getCookie("SUP"));
        if (!sup && !urldecode(getCookie("ALF"))) {
            return null
        }
        if (!sup) {
            sup = urldecode(getCookie("SUR"))
        }
        if (!sup) {
            return null
        }
        var arrSup = parse_str(sup);
        if (strict && arrSup.et && (arrSup.et * 1000 < (new Date()).getTime())) {
            return null
        }
        return arrSup
    };
    this.get51UCCookie = function() {
        return me.getSinaCookie()
    };
    this.autoLogin = function(callback) {
        if (me.domain == "sina.com.cn") {
            if (getCookie("SUP") === null && getCookie("ALF") !== null) {
                sinaAutoLogin(callback);
                return true
            }
        } else {
            if (getCookie("SUP") === null && (getCookie("SSOLoginState") !== null || getCookie("ALF") !== null)) {
                sinaAutoLogin(callback);
                return true
            }
        }
        callback(me.getSinaCookie());
        return true
    };
    this.autoLoginCallBack2 = function(result) {
        try {
            autoLoginCallBack2(me.getSinaCookie())
        } catch (e) {
        }
        return true
    };
    this.appLogin = function(ticket, domain, callback) {
        var savestate = tmpData.savestate ? parseInt((new Date()).getTime() / 1000 + tmpData.savestate * 86400) : 0;
        var alf = getCookie("ALF") ? getCookie("ALF") : 0;
        var request = {callback: callback,ticket: ticket,ssosavestate: savestate || alf};
        var appLoginURL = me.appLoginURL[domain];
        var url = makeURL(appLoginURL, request);
        excuteScript(me.scriptId, url, "gb2312");
        return true
    };
    this.autoLoginCallBack3 = function(result) {
        if (result.retcode != 0) {
            me.autoLoginCallBack2(result);
            return false
        }
        me.appLogin(result.ticket, me.domain, me.name + ".autoLoginCallBack2");
        return true
    };
    this.setLoginType = function(loginType) {
        var https = location.protocol == "https:" ? me.https : 0;
        if (https) {
            me.crossDomain = false
        }
        me.loginType = loginType | https;
        return true
    };
    this.setServerTime = function(servertime) {
        if (!ssoServerTimeTimer) {
            ssoServerTimeTimer = new prototypeTimer(true)
        }
        if (servertime == 0) {
            ssoServerTimeTimer.clear();
            me.servertime = servertime;
            return true
        }
        if (servertime < 1294935546) {
            return false
        }
        var calcServerTime = function() {
            if (me.servertime) {
                me.servertime += me.calcServerTimeInterval / 1000;
                ssoServerTimeTimer.start(me.calcServerTimeInterval, calcServerTime)
            }
        };
        me.servertime = servertime;
        ssoServerTimeTimer.start(me.calcServerTimeInterval, calcServerTime)
    };
    this.getPinCodeUrl = function(size) {
        if (size == undefined) {
            size = 0
        }
        if (pcid) {
            me.loginExtraQuery.pcid = pcid
        }
        var url = location.protocol == "https:" ? pincodeUrl.replace(/^http:/, "https:") : pincodeUrl;
        return url + "?r=" + Math.floor(Math.random() * 100000000) + "&s=" + size + (pcid.length > 0 ? "&p=" + pcid : "")
    };
    this.showPinCode = function(id) {
        me.$(id).src = me.getPinCodeUrl()
    };
    this.isVfValid = function() {
        return me.getSinaCookie(true)["vf"] != 1
    };
    this.getVfValidUrl = function() {
        return vfValidUrl
    };
    this.enableFailRedirect = function() {
        me.failRedirect = true
    };
    var makeNonce = function(len) {
        var x = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var str = "";
        for (var i = 0; i < len; i++) {
            str += x.charAt(Math.ceil(Math.random() * 1000000) % x.length)
        }
        return str
    };
    var sinaAutoLogin = function(callback) {
        autoLoginCallBack2 = callback;
        var request = {entry: me.getEntry(),service: me.service,encoding: "UTF-8",gateway: 1,returntype: "TEXT",from: me.from};
        if (me.domain == "sina.com.cn") {
            request.callback = me.name + ".autoLoginCallBack2";
            request.useticket = 0
        } else {
            request.callback = me.name + ".autoLoginCallBack3";
            request.useticket = 1
        }
        var url = location.protocol == "https:" ? ssoLoginUrl.replace(/^http:/, "https:") : ssoLoginUrl;
        url = makeURL(url, request);
        excuteScript(me.scriptId, url, "gb2312");
        return true
    };
    var getCookieExpireTimeByDomain = function(domain) {
        var expireTime = null;
        var cookie = null;
        cookie = me.getSinaCookie();
        if (cookie) {
            expireTime = cookie.et
        }
        return expireTime
    };
    var addEventListener = function(dom, eventName, fn) {
        if (dom.addEventListener) {
            dom.addEventListener(eventName, fn, false)
        } else {
            if (dom.attachEvent) {
                dom.attachEvent("on" + eventName, fn)
            } else {
                dom["on" + eventName] = fn
            }
        }
    };
    var prototypeTimer = function(enable) {
        var mytimer = false;
        this.start = function(timeout, callback) {
            if (enable) {
                mytimer = setTimeout(callback, timeout)
            }
        };
        this.clear = function(name) {
            if (enable) {
                clearTimeout(mytimer);
                mytimer = false
            }
        };
        this.isset = function() {
            return mytimer !== false
        }
    };
    var excuteScript = function(id, scriptSource, charset) {
        removeNode(id);
        var head = document.getElementsByTagName("head")[0];
        var newScript = document.createElement("script");
        newScript.charset = charset || "gb2312";
        newScript.id = id;
        newScript.type = "text/javascript";
        newScript.src = makeURL(scriptSource, {client: me.getClientType(),_: (new Date()).getTime()});
        head.appendChild(newScript)
    };
    var excuteIframe = function(id, url) {
        removeNode(id);
        var bodyel = document.getElementsByTagName("body")[0];
        var new_iframe = document.createElement("iframe");
        new_iframe.style.display = "none";
        new_iframe.src = makeURL(url, {client: me.getClientType(),_: (new Date()).getTime()});
        new_iframe.isReady = false;
        addEventListener(new_iframe, "load", function() {
            if (new_iframe.isReady) {
                return
            }
            new_iframe.isReady = true;
            me.doCrossDomainCallBack({scriptId: id})
        });
        bodyel.appendChild(new_iframe)
    };
    var makeRequest = function(username, password, savestate) {
        var request = {entry: me.getEntry(),gateway: 1,from: me.from,savestate: savestate,useticket: me.useTicket ? 1 : 0};
        if (me.failRedirect) {
            me.loginExtraQuery.frd = 1
        }
        request = objMerge(request, me.loginExtraFlag);
        request = objMerge(request, me.loginExtraQuery);
        request.su = sinaSSOEncoder.base64.encode(urlencode(username));
        if (me.service) {
            request.service = me.service
        }
        if ((me.loginType & wsse) && me.servertime && sinaSSOEncoder && sinaSSOEncoder.hex_sha1) {
            request.servertime = me.servertime;
            request.nonce = me.nonce;
            request.pwencode = "wsse";
            password = sinaSSOEncoder.hex_sha1("" + sinaSSOEncoder.hex_sha1(sinaSSOEncoder.hex_sha1(password)) + me.servertime + me.nonce)
        }
        request.sp = password;
        return request
    };
    var loginByScript = function(username, password, savestate) {
        if (me.appLoginURL[me.domain]) {
            me.useTicket = 1;
            me.service = me.appDomainService[me.domain] || me.service
        }
        var cdult = 0;
        if (me.domain) {
            cdult = 2
        }
        if (!me.appLoginURL[me.domain]) {
            cdult = 3
        }
        if (me.cdult !== false) {
            cdult = me.cdult
        }
        if (cdult == 3) {
            crossDomainTime = me.crossDomainTime;
            delete me.appLoginURL[me.domain]
        }
        var request = makeRequest(username, password, savestate);
        request = objMerge(request, {encoding: "UTF-8",callback: me.name + ".loginCallBack",cdult: cdult,domain: me.domain,useticket: me.appLoginURL[me.domain] ? 1 : 0,prelt: preloginTime,returntype: "TEXT"});
        var url = (me.loginType & https) ? ssoLoginUrl.replace(/^http:/, "https:") : ssoLoginUrl;
        url = makeURL(url, request);
        excuteScript(me.scriptId, url, "gb2312")
    };
    var loginByIframe = function(username, password, savestate) {
        createIFrame(me.loginFrameName);
        var loginForm = createForm(me.loginFormId);
        var request = makeRequest(username, password, savestate);
        request.encoding = "UTF-8";
        if (me.crossDomain == false) {
            request.crossdomain = 0
        }
        request.prelt = preloginTime;
        if (me.feedBackUrl) {
            request.url = makeURL(me.feedBackUrl, {framelogin: 1,callback: "parent." + me.name + ".feedBackUrlCallBack"});
            request.returntype = "META"
        } else {
            request.callback = "parent." + me.name + ".loginCallBack";
            request.returntype = "IFRAME";
            request.setdomain = me.setDomain ? 1 : 0
        }
        for (var key in me.loginExtraQuery) {
            if (typeof me.loginExtraQuery[key] == "function") {
                continue
            }
            request[key] = me.loginExtraQuery[key]
        }
        for (var name in request) {
            loginForm.addInput(name, request[name])
        }
        var action = (me.loginType & https) ? ssoLoginUrl.replace(/^http:/, "https:") : ssoLoginUrl;
        action = makeURL(action, objMerge({client: me.getClientType()}, me.loginExtraFlag));
        loginForm.method = "post";
        loginForm.action = action;
        loginForm.target = me.loginFrameName;
        var result = true;
        try {
            loginForm.submit()
        } catch (e) {
            removeNode(me.loginFrameName);
            result = false
        }
        setTimeout(function() {
            removeNode(loginForm)
        }, 10);
        return result
    };
    var createIFrame = function(frameName, src) {
        if (src == null) {
            src = "javascript:false;"
        }
        removeNode(frameName);
        var frame = document.createElement("iframe");
        frame.height = 0;
        frame.width = 0;
        frame.style.display = "none";
        frame.name = frameName;
        frame.id = frameName;
        frame.src = src;
        appendChild(document.body, frame);
        window.frames[frameName].name = frameName;
        return frame
    };
    var createForm = function(formName, display) {
        if (display == null) {
            display = "none"
        }
        removeNode(formName);
        var form = document.createElement("form");
        form.height = 0;
        form.width = 0;
        form.style.display = display;
        form.name = formName;
        form.id = formName;
        appendChild(document.body, form);
        document.forms[formName].name = formName;
        form.addInput = function(name, value, type) {
            if (type == null) {
                type = "text"
            }
            var _name = this.getElementsByTagName("input")[name];
            if (_name) {
                this.removeChild(_name)
            }
            _name = document.createElement("input");
            this.appendChild(_name);
            _name.id = name;
            _name.name = name;
            _name.type = type;
            _name.value = value
        };
        return form
    };
    var removeNode = function(el) {
        try {
            if (typeof (el) === "string") {
                el = me.$(el)
            }
            el.parentNode.removeChild(el)
        } catch (e) {
        }
    };
    var isSafari = function() {
        var browserName = navigator.userAgent.toLowerCase();
        return ((/webkit/i).test(browserName) && !(/chrome/i).test(browserName))
    };
    var appendChild = function(parentObj, element) {
        parentObj.appendChild(element)
    };
    var getCookie = function(name) {
        var Res = eval("/" + name + "=([^;]+)/").exec(document.cookie);
        return Res == null ? null : Res[1]
    };
    var makeURL = function(url, request) {
        return url + urlAndChar(url) + httpBuildQuery(request)
    };
    var urlAndChar = function(url) {
        return (/\?/.test(url) ? "&" : "?")
    };
    var urlencode = function(str) {
        return encodeURIComponent(str)
    };
    var urldecode = function(str) {
        if (str == undefined) {
            return ""
        }
        var decoded = decodeURIComponent(str);
        return decoded == "null" ? "" : decoded
    };
    var httpBuildQuery = function(obj) {
        if (typeof obj != "object") {
            return ""
        }
        var arr = new Array();
        for (var key in obj) {
            if (typeof obj[key] == "function") {
                continue
            }
            arr.push(key + "=" + urlencode(obj[key]))
        }
        return arr.join("&")
    };
    var parse_str = function(str) {
        var arr = str.split("&");
        var arrtmp;
        var arrResult = {};
        for (var i = 0; i < arr.length; i++) {
            arrtmp = arr[i].split("=");
            arrResult[arrtmp[0]] = urldecode(arrtmp[1])
        }
        return arrResult
    };
    var objMerge = function(obj1, obj2) {
        for (var item in obj2) {
            obj1[item] = obj2[item]
        }
        return obj1
    };
    this.$ = function(id) {
        return document.getElementById(id)
    }
}
var sinaSSOEncoder = sinaSSOEncoder || {};
(function() {
    var i = 0;
    var g = 8;
    this.hex_sha1 = function(j) {
        return h(b(f(j), j.length * g))
    };
    var b = function(A, r) {
        A[r >> 5] |= 128 << (24 - r % 32);
        A[((r + 64 >> 9) << 4) + 15] = r;
        var B = Array(80);
        var z = 1732584193;
        var y = -271733879;
        var v = -1732584194;
        var u = 271733878;
        var s = -1009589776;
        for (var o = 0; o < A.length; o += 16) {
            var q = z;
            var p = y;
            var n = v;
            var m = u;
            var k = s;
            for (var l = 0; l < 80; l++) {
                if (l < 16) {
                    B[l] = A[o + l]
                } else {
                    B[l] = d(B[l - 3] ^ B[l - 8] ^ B[l - 14] ^ B[l - 16], 1)
                }
                var C = e(e(d(z, 5), a(l, y, v, u)), e(e(s, B[l]), c(l)));
                s = u;
                u = v;
                v = d(y, 30);
                y = z;
                z = C
            }
            z = e(z, q);
            y = e(y, p);
            v = e(v, n);
            u = e(u, m);
            s = e(s, k)
        }
        return Array(z, y, v, u, s)
    };
    var a = function(k, j, m, l) {
        if (k < 20) {
            return (j & m) | ((~j) & l)
        }
        if (k < 40) {
            return j ^ m ^ l
        }
        if (k < 60) {
            return (j & m) | (j & l) | (m & l)
        }
        return j ^ m ^ l
    };
    var c = function(j) {
        return (j < 20) ? 1518500249 : (j < 40) ? 1859775393 : (j < 60) ? -1894007588 : -899497514
    };
    var e = function(j, m) {
        var l = (j & 65535) + (m & 65535);
        var k = (j >> 16) + (m >> 16) + (l >> 16);
        return (k << 16) | (l & 65535)
    };
    var d = function(j, k) {
        return (j << k) | (j >>> (32 - k))
    };
    var f = function(m) {
        var l = Array();
        var j = (1 << g) - 1;
        for (var k = 0; k < m.length * g; k += g) {
            l[k >> 5] |= (m.charCodeAt(k / g) & j) << (24 - k % 32)
        }
        return l
    };
    var h = function(l) {
        var k = i ? "0123456789ABCDEF" : "0123456789abcdef";
        var m = "";
        for (var j = 0; j < l.length * 4; j++) {
            m += k.charAt((l[j >> 2] >> ((3 - j % 4) * 8 + 4)) & 15) + k.charAt((l[j >> 2] >> ((3 - j % 4) * 8)) & 15)
        }
        return m
    };
    this.base64 = {encode: function(l) {
            l = "" + l;
            if (l == "") {
                return ""
            }
            var j = "";
            var s, q, o = "";
            var r, p, n, m = "";
            var k = 0;
            do {
                s = l.charCodeAt(k++);
                q = l.charCodeAt(k++);
                o = l.charCodeAt(k++);
                r = s >> 2;
                p = ((s & 3) << 4) | (q >> 4);
                n = ((q & 15) << 2) | (o >> 6);
                m = o & 63;
                if (isNaN(q)) {
                    n = m = 64
                } else {
                    if (isNaN(o)) {
                        m = 64
                    }
                }
                j = j + this._keys.charAt(r) + this._keys.charAt(p) + this._keys.charAt(n) + this._keys.charAt(m);
                s = q = o = "";
                r = p = n = m = ""
            } while (k < l.length);
            return j
        },_keys: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}
}).call(sinaSSOEncoder);
sinaSSOController = new SSOController();
sinaSSOController.init();
