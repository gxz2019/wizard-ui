module.exports = {
  pathPrefix: `/wizard-ui`,
  siteMetadata: {
    title: `Wizard UI Documentation`,
    description: `Wizard UI Documentation.`,
    author: `wizard ui contributors`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `components`,
        path: `${__dirname}/src/pages/components`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `wizard-ui`,
        short_name: `wui`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/logo.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
    {
      resolve: `gatsby-plugin-sass`,
      cssLoaderOptions: {
        camelCase: false,
      },
    },
    {
      resolve: 'gatsby-mdx',
      options: {
        defaultLayouts: require.resolve('./src/components/Layout'),
      },
    },
  ],
}