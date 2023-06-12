import postcssLib from 'postcss'
import path from 'path'

const defaultOptions = {
  pattern: '**/*.css',
  map: false,
  plugins: []
}

/**
 * @param {import('postcss').ProcessOptions['map']} map
 * @param {boolean} development
 * @returns {import('postcss').SourceMapOptions}
 */
function normalizeMapOptions(map, development) {
  // no source maps in prod by default unless overridden with options
  if (!map && !development) return false

  // legacy compat sets inline: true when map: true. false would be better
  return {
    inline: map === true ? true : typeof map.inline === 'boolean' ? map.inline : development,
    sourcesContent: true
  }
}

function postcssProcessor(plugins) {
  const pluginsReady = []

  plugins.forEach((plugin) => {
    if (typeof plugin === 'string') {
      pluginsReady.push(import(plugins).then((plugin) => plugin.default({})))
    } else {
      Object.keys(plugin).forEach(function (pluginName) {
        const value = plugin[pluginName]
        if (value === false) return
        const pluginOptions = value === true ? {} : value
        pluginsReady.push(import(pluginName).then((plugin) => plugin.default(pluginOptions)))
      })
    }
  })
  return Promise.all(pluginsReady).then((plugins) => postcssLib(plugins))
}

/**
 * @typedef {Object} SourceMapOptions
 * @property {boolean} [inline]
 */

/**
 * A metalsmith plugin that sends your CSS through any [PostCSS](https://github.com/postcss/postcss) plugins
 * @param {Object} options
 * @param {string|string[]} [options.pattern] Pattern(s) of CSS files to match relative to `Metalsmith.source()`. Default is `**\/*.css`
 * @param {boolean|SourceMapOptions} [options.map] Pass `true` for inline sourcemaps, or `{ inline: false }` for external source maps
 * @param {string|import('postcss').Syntax} [options.syntax] Module name of a PostCSS {@link Syntax} or a {@link Syntax} module itself. Can also be a custom syntax or a relative module path
 * @param {string|{'postcss-plugin': Object}|Array<{'postcss-plugin': Object}|string>} options.plugins
 * An object with PostCSS plugin names as keys and their options as values, or an array of PostCSS plugins as names, eg `'postcss-plugin'`
 * or objects in the format `{ 'postcss-plugin': {...options}}`
 * @returns {import('metalsmith').Plugin}
 */
function postcss(options) {
  options = Object.assign({}, defaultOptions, options || {})
  const pluginsConfig = Array.isArray(options.plugins) ? options.plugins : [options.plugins]
  const processorReady = postcssProcessor(pluginsConfig)
  let syntaxReady
  if (options.syntax) {
    syntaxReady =
      typeof options.syntax === 'string'
        ? import(options.syntax).then((syntax) => syntax.default)
        : Promise.resolve(options.syntax)
  }

  return function postcss(files, metalsmith, done) {
    const map = normalizeMapOptions(options.map, metalsmith.env('NODE_ENV') === 'development')
    const styles = metalsmith.match(options.pattern, Object.keys(files))
    const debug = metalsmith.debug('@metalsmith/postcss')
    debug('Running with options %O', { ...options, map })
    Promise.all([processorReady, syntaxReady])
      .then(([processor, syntax]) => {
        const promises = []

        styles.forEach(function (file) {
          const contents = files[file].contents.toString()
          const absolutePath = path.resolve(metalsmith.source(), file)

          // if a previous source map has been generated for this file (eg through sass),
          // pass its contents onto postcss
          const prevMap = files[`${file}.map`]
          const mapOpts = map && prevMap ? { prev: prevMap.contents.toString(), ...map } : map

          debug.info('Processing file "%s"', file)
          const processOptions = {
            from: absolutePath,
            to: absolutePath,
            map: mapOpts
          }

          if (syntax) processOptions.syntax = syntax

          const promise = processor.process(contents, processOptions).then(function (result) {
            files[file].contents = Buffer.from(result.css)
            debug.info('Updated CSS at "%s"', file)
            if (map.inline) {
              if (prevMap) {
                debug.info('Moving contents of previous source map file "%s" inline', file)
                delete files[`${file}.map`]
              }
            } else if (result.map) {
              debug.info('%s source map at "%s"', prevMap ? 'Updating' : 'Adding', file)
              files[`${file}.map`] = {
                contents: Buffer.from(result.map.toString()),
                mode: files[file].mode,
                stats: files[file].stats
              }
            }
          })

          promises.push(promise)
        })

        Promise.all(promises)
          .then(() => {
            debug('Finished processing %s CSS file(s)', styles.length)
            done()
          })
          .catch((error) => {
            // JSON.stringify on an actual error object yields 0 key/values
            if (error instanceof Error) {
              return done(error)
            }
            /* c8 ignore next */
            done(new Error('Error during postcss processing: ' + JSON.stringify(error)))
          })
      })
      .catch(done)
  }
}

export default postcss
