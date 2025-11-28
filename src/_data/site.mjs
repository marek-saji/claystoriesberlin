const isPreview = process.env.CF_PAGES_BRANCH !== "main";

const name = "Clay Stories";
const siteName = `${name} Berlin`;
const companyName = "Selter & Margoszczyn GbR";

const site = {
  url:
    (isPreview && process.env.CF_PAGES_URL) || "https://claystoriesberlin.com",
  robots: isPreview ? "noindex, nofollow" : "index, follow",
  name: siteName,
  author: {
    name,
    email: "hello@claystoriesberlin.com",
  },
  business: {
    name: companyName,
    address: {
      name: `${companyName} ℅ ${name}`,
      streetAddress: "Kollwitzstraße 82",
      postalCode: "10435",
      locality: "Berlin",
      countryName: "Germany",
      coordinates: {
        latitude: 52.5376384,
        longitude: 13.4173513,
      },
      mapUrl: 'https://maps.app.goo.gl/j8b8MTzyYrNSuMeP9',
    },
  },
};

export default site;
