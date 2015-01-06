var Discourse = require("discourse-api");
var api;

function extractContent (content, parent_category_id) {
    var category = content.match(/^#\ (.+)\n/)[1];
    var titles = content.match(/##\ .+\n/g).map(function (title) {
        return title.replace('## ', '').replace('\n','');
    });
    var raws = content.split(/##\ .+\n\n/);

    // Create subcategory
    var res = api.postSync('categories', {name: category, color: (~~(Math.random()*(1<<24))).toString(16), text_color: 'FFFFFF', parent_category_id: parent_category_id});
    if(res.statusCode !== 200) {
        console.log(category + ":", JSON.parse(res.body.toString()).errors[0]);
    }

    // Create Topics
    raws.shift();
    raws.forEach(function (raw, index) {
        res = api.postSync('posts', { 'title': titles[index], 'raw': raw, 'category': category, 'archetype': 'regular' });
        if(res.statusCode !== 200) {
            console.log(titles[index] + ":", JSON.parse(res.body.toString()).errors[0]);
        }
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
        // Post to discourse using markdown
        "page:before": function(page) {
            var config = this.options.pluginsConfig.discourse;
            if (!config) {
                throw "Need to configure discourse option";
            }
            api = new Discourse(config.url, config.api_key, config.api_username);
            if(page.progress.current.level !== '0') {
                extractContent(page.content, config.parent_category_id);
            }
            return page;
        }
    }
};