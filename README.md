# Clay Stories Berlin

A Shopify theme for Clay Stories Berlin pottery studio.

## Development

### Prerequisites

- Node.js 18+
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)

### Setup

```sh
npm install
```

### Commands

```sh
# Start development server (connects to your Shopify store)
npm run dev

# Push theme to Shopify
npm run push

# Pull theme from Shopify
npm run pull

# Run theme check (linting)
npm run check
```

## Theme Structure

```
theme/
├── assets/          # CSS, fonts, images
├── config/          # Theme settings
├── layout/          # Base layout (theme.liquid)
├── locales/         # Translations
├── sections/        # Header, footer, navigation
├── snippets/        # Reusable partials
└── templates/       # Page templates
```

## Pages

Create these pages in your Shopify admin with matching template assignments:

| Page Handle                   | Template                              |
|-------------------------------|---------------------------------------|
| about                         | page.about                            |
| studio-memberships            | page.studio-memberships               |
| pottery-courses-and-workshops | page.pottery-courses-and-workshops    |
| wheelthrowing                 | page.wheelthrowing                    |
| handbuilding                  | page.handbuilding                     |
| gift-voucher                  | page.gift-voucher                     |
| clay-date                     | page.clay-date                        |
| wild-clay                     | page.wild-clay                        |
| shopceramics                  | page.shopceramics                     |
| team-events                   | page.team-events                      |
| imprint                       | page.imprint                          |
| data-privacy                  | page.data-privacy                     |

## Navigation

Create a menu called "main-menu" in Shopify admin under Online Store > Navigation.
