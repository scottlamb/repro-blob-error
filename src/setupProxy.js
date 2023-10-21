// https://stackoverflow.com/a/68172973/23584

module.exports = function(app) {
  app.use((req, res, next) => {
    res.set({
        'Content-Security-Policy': "default-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;"
    });
      next();
  }); 
};
