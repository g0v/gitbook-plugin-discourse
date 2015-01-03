var fs = require("fs");
var path = require("path");
var cheerio = require("cheerio");
var Discourse = require("discourse-api");
var api;

function extractContent (content, parent_category_id) {
    var $ = cheerio.load(content, {decodeEntities: false});
    var category = $('h1').text().trim();
    var titles = $.html().trim().match(/<h2.+>(.+)<\/h2>/g);
    var raws = [];

    //產生子分類
    api.post('categories', {name: category, color: 'BF1E2E', text_color: 'FFFFFF', parent_category_id: parent_category_id}, function (err, body, httpCode){
        console.log(httpCode);
    });

    // 處理 title
    titles = titles.map(function (h2) {
        return h2.replace(/<h2.+>(.+)<\/h2>/, function (ma, title) {
            return title;
        });
    });

    // 處理內文
    raws = $.html().trim().split(/<h2.+>.+<\/h2>\n/);
    raws.shift();
    raws.forEach(function (raw, index) {
        api.createTopic(titles[index], raw, category, function (err, body, httpCode) {
            console.log(httpCode);
        });
    });
}

module.exports = {
    book: {
        html: {
            "html:start": function() {
                return "<!-- Start book "+this.options.title+" -->"
            },
            "html:end": function() {
                return "<!-- End of book "+this.options.title+" -->"
            },

            "head:start": "<!-- head:start -->",
            "head:end": "<!-- head:end -->",

            "body:start": "<!-- body:start -->",
            "body:end": "<!-- body:end -->"
        }
    },
    hooks: {
        // After html generation
        "page:after": function(page) {
            var config = this.options.pluginsConfig.discourse;
            if (!config) {
                throw "Need to configure discourse option";
            }
            api = new Discourse(config.url, config.api_key, config.api_username);

            if(page.progress.current.level !== '0') {
                extractContent(page.sections[0].content, config.parent_category_id);
            }
            return page;
        }
    }
};