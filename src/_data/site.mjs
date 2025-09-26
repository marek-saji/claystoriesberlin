const isPreview = process.env.CF_PAGES_BRANCH !== 'main'

const site = {
  url: (isPreview && process.env.CF_PAGES_URL) || 'https://claystoriesberlin.com',
  name: 'Clay Stories Berlin',
  author: {
    name: 'Clay Stories (Selter & Margoszczyn GbR)',
    email: 'claystories.berlin@gmail.com',
  },
  robots: isPreview ? 'noindex, nofollow' : 'index, follow',
}

export default site
