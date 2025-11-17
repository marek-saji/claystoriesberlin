import path from 'node:path';
import fs from 'node:fs';
import Image, { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import { InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export default function createConfig(eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setLayoutsDirectory("_layouts");

  eleventyConfig.addBundle("css", {
    bundleHtmlContentFromSelector: "style[data-bundle]",
  });
  eleventyConfig.addBundle("mjs", {
    bundleHtmlContentFromSelector: "script[type='module'][data-bundle]",
  });

  eleventyConfig.addPassthroughCopy("**/*.woff2");
  eleventyConfig.addPassthroughCopy("**/*.mjs");

  {
    const outputDir = "node_modules/.cache/@11ty/eleventy-img/out/";
    const urlPath = "/img/static/";

    // source: https://www.zachleat.com/web/faster-builds-with-eleventy-img/
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

    // source: https://danburzo.ro/notes/eleventy-og-images/
    eleventyConfig.addShortcode("og_image", async function (src) {
      const dir = path.dirname(this.page.inputPath);
      const inputPath = path.resolve(dir, src);
      const format = "png";
      const OG_IMAGE_WIDTH = 1200;
      const OG_IMAGE_HEIGHT = 800;
      const background = "white";
      console.log({
        src,
        "this.page.inputPath": this.page.inputPath,
        dir,
        inputPath,
      });
      const img = await Image(inputPath, {
        formats: [format],
        urlPath,
        outputDir,
        transform: async (sharp) => {
          const metadata = await sharp.metadata();
          let { width, height } = metadata;

          sharp.flatten({ background });

          const scale = Math.min(
            1,
            OG_IMAGE_WIDTH / width,
            OG_IMAGE_HEIGHT / height
          );
          if (scale < 1) {
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
            sharp.resize(width, height);
          }

          const padWidth = (OG_IMAGE_WIDTH - width) / 2;
          const padHeight = (OG_IMAGE_HEIGHT - height) / 2;
          sharp.extend({
            top: Math.max(0, Math.floor(padHeight)),
            bottom: Math.max(0, Math.ceil(padHeight)),
            left: Math.max(0, Math.floor(padWidth)),
            right: Math.max(0, Math.ceil(padWidth)),
            background,
          });
        },
      });
      return img[format][0].url;
    });

    eleventyConfig.on("eleventy.after", () => {
      fs.cpSync(
        outputDir,
        path.join(eleventyConfig.directories.output, urlPath),
        { recursive: true }
      );
    });
  }
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
  eleventyConfig.addPlugin(HtmlBasePlugin);
}
