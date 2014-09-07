module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Connect to localhost:9001
    connect: {
	    server: {
	      options: {
	        port: 9001,
	        keepalive: true
	      }
	    }
	  }

  });

  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', ['task1']);
};