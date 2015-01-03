# Heading post to discourse for GitBook

This plugin allows you to post content to discourse.

## Installation

Install as a global NodeJs package.

```
$ npm install -g gitbook-plugin-discourse
```

## Use in a gitbook

To use in your book, add to plugins list in `book.json` in your gitbook directory:

```
{
    "plugins": ["discourse"]
}
```

## Configuration

You can configure the plugin is `book.json`:

```
{
    "pluginsConfig": {
        "discourse": {
            "url": "DISCOURSE_URL",
            "api_key": "API_KEY",
            "api_username": "API_USERNAME"
        }
    }
}
```

## Licence

MIT

## Requests

Contributions welcome, of course!