
var fs = require("fs-extra")
,   pth = require("path").join
,   jn = pth.join
,   jsdom = require("jsdom")
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
;

// helpers
function tmpl (name, data) {
    var src = fs.readFileSync(jn(__dirname, "tmpl", name + ".html"), "utf8");
    return src.replace(/\{\{(\w+)}}/g, function (m, p1) {
        return data[p1];
    });
}

// load split definition
var config = fs.readJsonSync(options.config);
if (!options.out) options.out = jn(process.cwd(), "split");
if (!fs.existsSync(options.out)) fs.mkdirpSync(options.out);

// load document
console.log("Loading source...");
jsdom.env(
    jn(__dirname, "source/single-page.html")
,   [jn(__dirname, "node_modules/jquery/dist/jquery.min.js")]
,   function (err, win) {
        if (err) return console.error(err);
        console.log("Source loaded!");
        
        // process each split in turn
        var splits = [];
        for (var spec in config) {
            splits.push({ title: spec, abstract: config[spec].abstract });
        }
        
        
        // save the remaining document as leftovers.html with the stuff that hasn't been processed
        
        
        // save an index pointing to all of the above
        var specList = splits.map(function (s) {
            return "<dt>" + s.title + "</dt>\n<dd>" + s.abstract + "</dd>";
        }).join("\n");
        fs.writeFileSync(jn(config.out, "index.html"), tmpl("index", { specs: specList }));
    }
);


// create a mapping of all IDs and links based on which document they end up in
// rewrite all links using a given base URL and split
// actually extract each bit
// convert it to ReSpec
// copy over the dependencies
// save it


