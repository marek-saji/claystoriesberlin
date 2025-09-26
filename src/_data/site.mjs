const isPreview = process.env.CF_PAGES_BRANCH !== 'main'

const name = 'Clay Stories Berlin'
const companyName = 'Selter & Margoszczyn GbR'

const site = {
  url: (isPreview && process.env.CF_PAGES_URL) || 'https://claystoriesberlin.com',
  name,
  author: {
    name: `${name} (${companyName})`,
    email: 'claystories.berlin@gmail.com',
  },
  robots: isPreview ? 'noindex, nofollow' : 'index, follow',
}

export default site
