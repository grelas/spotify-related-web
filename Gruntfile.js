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
	  },

    clean: {
      build: {
        src: ["build"]
      },
      sass: {
        src: ["build/sass"]
      }
    },

    copy: {
      main: {
        expand: true,
        cwd: 'src/',
        src: '**',
        dest: 'build/'
      },
    },

    uglify: {
      options: {
        compress: {
          drop_console: true
        }
      },
      my_target: {
        files: {
          'build/js/srw.js': ['src/js/srw.js']
        }
      }
    },

    sass: {
      dev: {
        options: {
          sourcemap: 'none'
        },
        files: [{
          expand: true,
          cwd: 'src/sass',
          src: ['*.scss'],
          dest: 'src/css',
          ext: '.css'
        }]
      },

      build: {
        options: {
          style: 'compressed',
          sourcemap: 'none'
        },
        files: [{
          expand: true,
          cwd: 'build/sass',
          src: ['*.scss'],
          dest: 'build/css',
          ext: '.css'
        }]
      }
    },

    watch: {
      css: {
        files: '**/*.scss',
        tasks: ['sass'],
        options: {
          livereload: true,
        },
      },
    },

  });

  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', ['sass']);

  // Build task(s).
  grunt.registerTask('build', ['clean:build', 'copy', 'sass:build', 'uglify', 'clean:sass']);

};