metalsmith-postcss
===============

> A Metalsmith plugin that sends your CSS
> through any [PostCSS](https://github.com/postcss/postcss) plugins.

## Installation

```sh
npm install --save metalsmith-postcss
```

## Getting Started

If you haven't checked out [Metalsmith](http://metalsmith.io/) before, head over to their website and check out the
documentation.

## CLI Usage

TBD

## JavaScript API

If you are using the JS Api for Metalsmith, then you can require the module and add it to your
`.use()` directives:

```js
var postcss = require('metalsmith-postcss');

metalsmith.use(postcss(plugins));
```

## Plugins

Pass your PostCSS plugins to `metalsmith-postcss` as follows:

```js
var postcss = require('metalsmith-postcss');

var pseudoelements = require('postcss-pseudoelements');
var nested = require('postcss-nested');

metalsmith.use(postcss([pseudoelements(), nested()]));
```
