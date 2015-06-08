
var fs = require("fs-extra")
,   pth = require("path")
,   jn = pth.join
,   jqLocation = jn(__dirname, "node_modules/jquery/dist/jquery.min.js")
,   jsdom = require("node-jsdom")
,   async = require("async")
,   nopt = require("nopt")
,   knownOpts = {
        config:     pth
    ,   out:        pth
    }
,   shortHands = {
        c:      ["--config"]
    ,   o:      ["--out"]
    }
,   options = nopt(knownOpts, shortHands, process.argv, 2)
,   baseURL = "/breakup/specs/"
;

// helpers
function tmpl (name, data) {
    var src = fs.readFileSync(jn(__dirname, "tmpl", name + ".html"), "utf8");
    return src.replace(/\{\{(\w+)}}/g, function (m, p1) {
        return data[p1];
    });
}

function makeDoc (data, cb) {
    jsdom.env(tmpl("spec", data), [jqLocation], function (err, win) {
        cb(err, win);
    });
}

function moveOver ($el, doc) {
    var $newEl = $el.clone()
    ,   el = doc.importNode($newEl.get(0), true);
    doc.body.appendChild(el);
    $el.remove();
}

function allTextNodes (startNode) {
    var textNodes = [];
    function getTextNodes (node) {
        if (node.nodeType === 3) textNodes.push(node);
        else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) getTextNodes(node.childNodes[i]);
        }
    }
    getTextNodes(startNode);
    return textNodes;
}

// load split definition
if (!options.config) options.config = jn(__dirname, "split.json");
var config = fs.readJsonSync(options.config);
if (!options.out) options.out = jn(process.cwd(), "specs");
if (!fs.existsSync(options.out)) fs.mkdirpSync(options.out);

// load document
console.log("Loading source...");
jsdom.env(
    jn(__dirname, "source/single-page.html")
,   [jqLocation]
,   function (err, win) {
        if (err) return console.error(err);
        console.log("Source loaded!");
        
        // create a mapping of all IDs and links based on which document they end up in
        var splits = []
        ,   $ = win.$
        ,   section = function (id) { return $(id).parent(); }
        ,   idMap = {}
        ;
        for (var spec in config) {
            splits.push({ title: spec, abstract: config[spec].abstract });
            config[spec].content.forEach(function (id) {
                // this assumes that all non-strings are instructions to unwrap, may be true, might not
                var $secs = (typeof id === "string") ? section(id) : section(id.id).find("> section");
                $secs.each(function () {
                    var $s = $(this);
                    $s.find("[id]")
                        .each(function () {
                            var id = $(this).attr("id");
                            idMap["#" + id] = baseURL + spec + "/#" + id;
                        });
                });
            });
        }
        console.log("IDs found");
        
        // rewrite all links using a given base URL and split
        $("a[href^='#']").each(function () {
            var $a = $(this);
            if (idMap[$a.attr("href")]) $a.attr("href", idMap[$a.attr("href")]);
        });
        console.log("Links remapped");

        // actually extract each bit
        async.forEachOfSeries(
                config
            ,   function (data, spec, cb) {
                    data.shortName = spec;
                    console.log("Processing " + spec);
                    // convert it to ReSpec
                    makeDoc(data, function (err, win) {
                        var doc = win.document;
                        if (err) return console.error(err);
                        config[spec].content.forEach(function (id) {
                            
                            if (typeof id === "string") moveOver(section(id), doc);
                            else if (id.unwrap) {
                                section(id.id).find("> section")
                                            .each(function () {
                                                moveOver($(this), doc);
                                            });
                            }
                            else {
                                console.error("Unknown processing for id", id);
                            }
                        });
                        var $doc = win.$;

                        // XXX
                        //      escape things that look like references (typically in WebIDL)
                        allTextNodes($doc("body").get(0))
                            .forEach(function (txt) {
                                if (/\[\[(?!\\)/.test(txt.data)) txt.data = txt.data.replace(/\[\[(?!\\)/g, "[[\\");
                            })
                        ;
                        
                        //      premap references to know which are normative
                        //      replace them

                        // remove hN numbers
                        // make all hN h2
                        console.log("\t- Fixing hN numbers and making all h2");
                        $doc.find("h2, h3, h4, h5, h6")
                            .each(function () {
                                var $h = $doc(this)
                                ,   html = $h.html().replace(/^[\d\.]+\s+/, "")
                                ;
                                $h.replaceWith($doc("<h2></h2>").html(html));
                            })
                        ;

                        // XXX
                        //      make WebIDL work

                        //      move ID to <section>
                        console.log("\t- Moving ID to section");
                        $doc("h2[id]").each(function () {
                            var $h = $doc(this)
                            ,   id = $h.attr("id")
                            ;
                            $h.removeAttr("id")
                                .parent("section")
                                    .attr("id", id)
                            ;
                        });


                        // copy over the dependencies

                        // save it
                        var dir = jn(options.out, spec);
                        fs.mkdirpSync(dir);
                        fs.writeFileSync(jn(dir, "index.html"), jsdom.serializeDocument(doc), { encoding: "utf8" });
                        cb();
                    });
                }
            ,   function (err) {
                    if (err) return console.error(err);
                    // save the remaining document as leftovers.html with the stuff that hasn't been processed
                    fs.mkdirpSync(jn(options.out, "leftovers"));
                    fs.writeFileSync(jn(options.out, "leftovers/index.html"), jsdom.serializeDocument(win.document), { encoding: "utf8" });
                    // this is the end!
                    console.log("Ok!");
                }
            )
        ;
        
        // save an index pointing to all of the above
        var specList = splits.map(function (s) {
            return "<dt><a href='./" + s.title + "/'>" + s.title + "</a></dt>\n<dd>" + s.abstract + "</dd>";
        }).join("\n");
        fs.writeFileSync(jn(options.out, "index.html"), tmpl("index", { specs: specList }), { encoding: "utf8" });
    }
);


