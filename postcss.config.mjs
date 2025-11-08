const config = {
  // Ensure postcss-preset-env runs before Tailwind so newer at-rules like
  // @property are handled prior to other CSS processing.
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;