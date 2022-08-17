import Metalsmith from 'metalsmith';

export default initPostcss;
export type SourceMapOptions = {
    inline?: boolean;
};
/**
 * A metalsmith plugin that sends your CSS through any [PostCSS](https://github.com/postcss/postcss) plugins
 */
declare function initPostcss(options: {
    /** Pattern(s) of CSS files to match relative to `Metalsmith.source()`. Default is `**\/*.css` */
    pattern?: string | string[];
    /** Pass `true` for inline sourcemaps, or `{ inline: false }` for external source maps */
    map?: boolean | SourceMapOptions;
    /** An object with PostCSS plugin names as keys and their options as values, or an array of PostCSS plugins as names, eg `'postcss-plugin'`
      * or objects in the format `{ 'postcss-plugin': {...options}}` */
    plugins: string | {
      [key:string]: any;
    } | Array<{
        [key:string]: any;
    } | string>;
}): Metalsmith.Plugin;
