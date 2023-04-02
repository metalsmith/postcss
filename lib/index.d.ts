import Metalsmith from 'metalsmith';
import { Syntax } from 'postcss';

export default postcss;
export type SourceMapOptions = {
    inline?: boolean;
};
/**
 * A metalsmith plugin that sends your CSS through any [PostCSS](https://github.com/postcss/postcss) plugins
 */
declare function postcss(options: {
    /** Pattern(s) of CSS files to match relative to `Metalsmith.source()`. Default is `**\/*.css` */
    pattern?: string | string[];
    /** Pass `true` for inline sourcemaps, or `{ inline: false }` for external source maps */
    map?: boolean | SourceMapOptions;
    /** Module name of a PostCSS {@link Syntax} or a {@link Syntax} module itself. Can also be a custom syntax or a relative module path */
    syntax?: string|Syntax;
    /** An object with PostCSS plugin names as keys and their options as values, or an array of PostCSS plugins as names, eg `'postcss-plugin'`
      * or objects in the format `{ 'postcss-plugin': {...options}}` */
    plugins: string | {
      [key:string]: any;
    } | Array<{
        [key:string]: any;
    } | string>;
}): Metalsmith.Plugin;
