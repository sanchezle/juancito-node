// Since we're handling CORS at the Nginx level,
// we're just defining an empty configuration here
// that effectively disables CORS handling in Express
const corsOptions = {
  // This will make the CORS middleware do nothing
  origin: false,
  // Don't add any headers
  credentials: false,
  methods: [],
  optionsSuccessStatus: 204
};

module.exports = corsOptions;