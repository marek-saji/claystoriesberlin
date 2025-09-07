import { eleventyImageTransformPlugin } from '@11ty/eleventy-img'
import { HtmlBasePlugin } from '@11ty/eleventy'

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export default function createConfig (eleventyConfig) {
    eleventyConfig.setInputDirectory('src');
    eleventyConfig.setIncludesDirectory('_includes');
    eleventyConfig.setDataDirectory('_data');

    eleventyConfig.addPassthroughCopy('**/*.woff2');
    // TODO Minimise CSS
    eleventyConfig.addPassthroughCopy('**/*.css');
    eleventyConfig.addPassthroughCopy('**/*.mjs');

    eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ['avif', 'jpeg', 'png'],
        widths: ['auto'],
        htmlOptions: {
            imgAttributes: {
                loading: 'lazy',
                decoding: 'async',
            },
        },
    });
    eleventyConfig.addPlugin(HtmlBasePlugin);
}
