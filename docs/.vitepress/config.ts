import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Poltergeist',
  description: 'Code reviews from contributors who aren\'t in the room.',
  base: '/poltergeist/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/poltergeist/logo.svg' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Integrations', link: '/claude' },
      { text: 'Reference', link: '/ghost-schema' },
      { text: 'GitHub', link: 'https://github.com/gkweb/poltergeist' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Building Ghosts', link: '/building-ghosts' },
          { text: 'Invoking Reviews', link: '/invoking-reviews' },
          { text: 'Data Sources', link: '/data-sources' },
          { text: 'GitLab Export', link: '/gitlab-export' }
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Claude Code', link: '/claude' },
          { text: 'Codex / OpenCode', link: '/codex' },
          { text: 'Cursor', link: '/cursor' },
          { text: 'Windsurf', link: '/windsurf' },
          { text: 'Cline', link: '/cline' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Ghost Schema', link: '/ghost-schema' },
          { text: 'Review Format', link: '/review-format' }
        ]
      },
      {
        text: 'Community',
        items: [
          { text: 'Ethics', link: '/ethics' },
          { text: 'Contributing', link: '/contributing' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gkweb/poltergeist' }
    ],

    footer: {
      message: 'Released under the MIT License.'
    },

    search: {
      provider: 'local'
    }
  }
})
