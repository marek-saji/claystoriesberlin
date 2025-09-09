import { eleventyImageTransformPlugin } from '@11ty/eleventy-img'
import eleventyNavigationPlugin from '@11ty/eleventy-navigation'
import {
    InputPathToUrlTransformPlugin,
    HtmlBasePlugin,
} from '@11ty/eleventy'

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export default function createConfig (eleventyConfig) {
    eleventyConfig.setInputDirectory('src');
    eleventyConfig.setLayoutsDirectory('_layouts');

    eleventyConfig.addBundle('css', {
        bundleHtmlContentFromSelector: 'style',
    });
    eleventyConfig.addBundle('mjs', {
        bundleHtmlContentFromSelector: 'style',
    });

    eleventyConfig.addPassthroughCopy('**/*.woff2');
    eleventyConfig.addPassthroughCopy('**/*.mjs');

    eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
      formats: ["auto", "svg", "avif"],
      widths: ["auto"],
      htmlOptions: {
        imgAttributes: {
          loading: "lazy",
          decoding: "async",
        },
      },
    });
    eleventyConfig.addPlugin(eleventyNavigationPlugin);
    eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
    eleventyConfig.addPlugin(HtmlBasePlugin);
}
