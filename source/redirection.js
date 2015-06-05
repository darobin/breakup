
var is404 = document.documentElement.hasAttribute("data-404");

function canon () {
    var path = location.pathname;
    if (/html\/wg\/drafts\/html\/master/.test(path))
        return "http://www.w3.org/html/wg/drafts/html/master/";
    if (/html\/wg\/drafts\/html\/wd/.test(path))
        return "http://www.w3.org/html/wg/drafts/html/wd/";
    else if (/\/TR\/html[\d\.-]*\//.test(path))
        return location.href.replace(/(^.*?\/TR\/html[\d\.-]*\/).*/, "$1");
    else if (/\/TR\/\d{4}\/\w{2,4}-html[\d\.-]*?-\d{8}\//.test(path))
        return location.href.replace(/(^.*?\/TR\/\d{4}\/\w{2,4}-html[\d\.-]*?-\d{8}\/).*/, "$1");
    else
        return; // give up
}

function giveUp () {
    var base = canon();
    if (!base) return;
    location.assign(base);
}

function fnord () {
    var base = canon();
    if (!base) return;
    var path = location.pathname
    ,   file = path.replace(/^.*\//, "")
    ,   frag = location.hash
    ,   id = frag.replace("#", "")
    ,   key = function (str) { return str.substr(0, 5).replace(/\W/g, "_"); }
    ,   xhr = new XMLHttpRequest();
    if (!frag) {
        if (is404) return giveUp();
        return;
    }
    if (file === "404.html") return;
    if (document.getElementById(id)) return;
    xhr.open("GET", base + "id-maps/" + key(id) + ".json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var idMap = JSON.parse(xhr.responseText)
                ,   page = idMap[frag]
                ;
                if (!page) return giveUp();
                if (page + ".html" === file) return;
                location.assign(base + page + ".html" + frag);
            }
            else { // 404 and friends
                if (is404) return giveUp();
                return;
            }
        }
    };
    xhr.send();
}
if (is404) setTimeout(fnord, 1000);
else fnord();
