const { description } = require('../../package')

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'mjp.one',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  /**
   * Theme
   *
   * ref: https://v1.vuepress.vuejs.org/theme/using-a-theme.html
   */
  theme: '@vuepress/theme-blog',

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://vuepress-theme-blog.ulivz.com/config/
   */
  themeConfig: {
    dateFormat: 'DD-MM-YYYY',

    nav: [
      {
        text: 'Blog',
        link: '/'
      },
      {
        text: 'Twitter',
        link: 'https://twitter.com/mariomka'
      },
      {
        text: 'Github',
        link: 'https://github.com/mariomka'
      }
    ],

    footer: {
      copyright: [
        {
          text: 'Copyright © 2020-presente Mario Juárez',
          link: '/'
        }
      ]
    },

    globalPagination: {
      prevText: 'Página anterior',
      nextText: 'Página siguiente',
      lengthPerPage: '5'
    },

    sitemap: {
      hostname: 'https://mjp.one',
      dateFormatter (time) {
        return new Date(time).toLocaleDateString();
      }
    },

    feed: {
      canonical_base: 'https://mjp.one',
      rss: true,
      atom: true,
      json: false
    },

    comment: {
      service: "disqus",
      shortname: "mjp-one",
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        'ga': 'UA-181810260-1'
      }
    ],
    [
      'autometa',
      {
        canonical_base: 'https://mjp.one',
        site: {
          name   : 'mjp.one',
        },
        author: {
          name   : 'Mario Juárez',
          twitter: 'mariomka',
        },
      }
    ]
  ],

  locales: {
    '/': {
      lang: 'es-ES'
    }
  }
}
