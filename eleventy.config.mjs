import path from 'node:path';
import fs from 'node:fs';
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

    {
      const urlPath = '/img/static/';
      const outputDir = 'node_modules/.cache/@11ty/eleventy-img/out/';
      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        urlPath,
        outputDir,
        formats: ["auto", "svg", "avif"],
        widths: ["auto"],
        htmlOptions: {
          imgAttributes: {
            loading: "lazy",
            decoding: "async",
          },
        },
      });
      eleventyConfig.on('eleventy.after', () => {
        fs.cpSync(
          outputDir,
          path.join(eleventyConfig.directories.output, urlPath),
          { recursive: true }
        )
      })
    }
    eleventyConfig.addPlugin(eleventyNavigationPlugin);
    eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
    eleventyConfig.addPlugin(HtmlBasePlugin);
}
