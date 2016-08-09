
(function(){
  var GitHub = window.GitHub
  delete window.GitHub

  define('git-data', [], function() {
    return { 'default': GitHub }
  })
})()

