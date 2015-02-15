var Discourse = require("discourse-api");
var api;
var topics = {};

function extractContent (content, parent_category_id) {
    var matchedId = {};
    var category = content.match(/^#\ (.+)\n/)[1];
    var titles = content.match(/##\ .+\n/g).map(function (title) {
        return title.replace('## ', '').replace('\n','').replace(/\./g,'');
    });
    var raws = content.split(/##\ .+\n\n/);

    // Find post's id
    titles.forEach(function (title) {
        var ids = topics.filter(function (topic) {
            return topic.fancy_title === title;
        });
        if(ids.length > 0) {
            matchedId[title] = ids[0].id;
        }
    });

    // Create subcategory
    var res = api.postSync('categories', {name: category, color: (~~(Math.random()*(1<<24))).toString(16), text_color: 'FFFFFF', parent_category_id: parent_category_id});
    if(res.statusCode === 200) {
        console.log(category, "created!");
    }

    // Create Topics
    raws.shift();
    raws.forEach(function (raw, index) {
        var post_id = matchedId[titles[index]];
        res = api.createTopicSync(titles[index], raw, category);
        if(res.statusCode === 422) {
            res = api.updatePostSync(post_id, raw, 'Rebuild');
            if(res.statusCode === 200) console.log(titles[index], "updated!");
        }
    });
}

function updateReadme(content, parent_category_name) {
    var ids = topics.filter( function (topic) {
        return topic.title === parent_category_name;
    });
    var res = api.getSync('t/topic/' + ids[0].id + '.json');

    post_id = JSON.parse(res.body.toString()).post_stream.posts[0].id;
    res = api.updatePostSync(post_id, content, 'Rebuild');
    if(res.statusCode === 200) console.log(parent_category_name, "updated!");
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
        "init": function () {
            var config = this.options.pluginsConfig.discourse;
            if (!config) {
                throw "Need to configure discourse option";
            }
            if (!(config.api_key || process.env.API_KEY)) { console.log("API_KEY environment not defined, skipping"); return; }

            api = new Discourse(config.url, config.api_key || process.env.API_KEY, config.api_username);
            res = api.getCreatedTopicsSync();
            topics = (JSON.parse(res.body.toString())).topic_list.topics;
        },

        "page:before": function(page) {
            var config = this.options.pluginsConfig.discourse;
            if (!(config.api_key || process.env.API_KEY)) { console.log("API_KEY environment not defined, skipping"); return page; }

            if(page.progress.current.level !== '0') {
                extractContent(page.content, config.parent_category_id);
            } else {
                updateReadme(page.content, config.parent_category_name);
            }

            return page;
        }
    }
};
