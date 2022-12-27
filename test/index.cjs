/* eslint-env node, mocha */

const sass = require("@metalsmith/sass");
const path = require("path");
const assert = require("assert");
const fixture = path.resolve.bind(path, __dirname, "fixtures");
const equal = require("assert-dir-equal");
const Metalsmith = require("metalsmith");
const { name } = require("../package.json");

/* eslint-disable-next-line node/no-missing-require */
const postcss = require("..");

function debugMock() {
  function debuggr(...args) {
    debugInit.logs.push(['log', ...args])
  }
  debuggr.info = (...args) => debugInit.logs.push(['info', ...args])
  debuggr.warn = (...args) => debugInit.logs.push(['warn', ...args])
  debuggr.error = (...args) => debugInit.logs.push(['error', ...args])

  function debugInit() {
    return debuggr
  }
  debugInit.enable = () => { }
  debugInit.logs = []
  return debugInit
}

describe("@metalsmith/postcss", function () {
  it("should export a named plugin function matching package.json name", function () {
    const namechars = name.split("/")[1];
    const camelCased = namechars.split("").reduce((str, char, i) => {
      str +=
        namechars[i - 1] === "-"
          ? char.toUpperCase()
          : char === "-"
            ? ""
            : char;
      return str;
    }, "");
    assert.strictEqual(postcss().name, camelCased);
  });

  it("should not crash the metalsmith build when using default options", function (done) {
    Metalsmith(fixture("no-sourcemaps"))
      .use(postcss())
      .build((err) => {
        assert.strictEqual(err, null);
        equal(
          fixture("no-sourcemaps/build"),
          fixture("no-sourcemaps/expected")
        );
        done();
      });
  });

  it("should handle errors appropriately", function (done) {
    const ms = Metalsmith(fixture("no-sourcemaps"))
    const files = {
      'first.css': {
        contents: Buffer.from('invalid-css')
      }
    }
    postcss({
      plugins: ['autoprefixer']
    })(files, ms, (err) => {
      if (err) {
       assert.strictEqual(err.name, 'CssSyntaxError')
       done()
      } else {
        done(new Error('should throw'))
      }
    })
  });

  describe("sourcemaps", function () {
    it("should not add sourcemaps at all", function (done) {
      const metalsmith = Metalsmith(fixture("no-sourcemaps"));
      metalsmith
        .use(
          postcss({
            plugins: {},
          })
        )
        .build(function (err) {
          if (err) return done(err);
          equal(
            fixture("no-sourcemaps/build"),
            fixture("no-sourcemaps/expected")
          );
          done();
        });
    });

    it("should add inline sourcemaps", function (done) {
      const metalsmith = Metalsmith(fixture("inline-sourcemaps"));
      metalsmith
        .use(
          postcss({
            plugins: {},
            map: true,
          })
        )
        .build(function (err) {
          if (err) return done(err);
          equal(
            fixture("inline-sourcemaps/build"),
            fixture("inline-sourcemaps/expected")
          );
          done();
        });
    });

    it("should add external sourcemap files", function (done) {
      const metalsmith = Metalsmith(fixture("external-sourcemaps"));
      metalsmith
        .use(
          postcss({
            plugins: {},
            map: {
              inline: false,
            },
          })
        )
        .build(function (err) {
          if (err) return done(err);
          equal(
            fixture("external-sourcemaps/build"),
            fixture("external-sourcemaps/expected")
          );
          done();
        });
    });

    it("should use defaults according to metalsmith.env('NODE_ENV') [dev]", function (done) {
      const ms = Metalsmith(fixture("inline-sourcemaps"))
      ms.debug = debugMock()
      ms
        .env('NODE_ENV', 'development')
        .env('DEBUG', '@metalsmith/postcss*')
        .use(postcss())
        .process((err) => {
          if (err) done(err)
          try {
            assert.deepStrictEqual(ms.debug.logs[0][2], {
              map: {
                inline: true,
                sourcesContent: true,
              },
              pattern: '**/*.css',
              plugins: []
            });
            done();
          } catch (err) {
            done(err)
          }
        });
    })

    it("should use defaults according to metalsmith.env('NODE_ENV') [prod]", function (done) {
      const ms = Metalsmith(fixture("inline-sourcemaps"))
      ms.debug = debugMock()
      ms
        .env('DEBUG', '@metalsmith/postcss*')
        .use(postcss())
        .process((err) => {
          if (err) done(err)
          try {
            assert.deepStrictEqual(ms.debug.logs[0][2], {
              map: false,
              pattern: '**/*.css',
              plugins: []
            });
            done();
          } catch (err) {
            done(err)
          }
        });
    })

    it('should take into account previous source maps', function(done) {
      const ms = Metalsmith(fixture("prev-sourcemaps"))

      ms
        .use(sass({ sourceMap: true }))
        .use(postcss({ map: { inline: true }, plugins: ['autoprefixer']}))
        .build((err) => {
          if (err) done(err)
          try {
            equal(
              fixture("prev-sourcemaps/build"),
              fixture("prev-sourcemaps/expected")
            );
            done()
          } catch (err) {
            done(err)
          }
        });
    })

    it("should pass absolute paths to postcss", function (done) {
      const metalsmith = Metalsmith(fixture("use-absolute-paths"));
      metalsmith
        .use(
          postcss({
            plugins: {
              "postcss-import": {},
            },
            map: {
              inline: false,
            },
          })
        )
        .build(function (err) {
          if (err) return done(err);
          equal(
            fixture("use-absolute-paths/build"),
            fixture("use-absolute-paths/expected")
          );
          done();
        });
    });

    it("should be able to use arrays as a way to define plugins", function (done) {
      const metalsmith = Metalsmith(fixture("use-absolute-paths"));
      metalsmith
        .use(
          postcss({
            plugins: [
              {
                "postcss-import": {},
              },
            ],
            map: {
              inline: false,
            },
          })
        )
        .build(function (err) {
          if (err) return done(err);
          equal(
            fixture("use-absolute-paths/build"),
            fixture("use-absolute-paths/expected")
          );
          done();
        });
    });
  });
});
