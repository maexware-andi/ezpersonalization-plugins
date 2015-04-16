/*global module:false*/
module.exports = function (grunt) {

    // Helper methods
    function sub(str) {
        return str.replace(/%s/g, LIBRARY_NAME);
    }

    function wrapModules(head, tail) {
        return head.concat(MODULE_LIST).concat(tail);
    }

    var LIBRARY_NAME = 'yc-tracking';

    var MODULE_LIST = [
        sub('src/%s.magento.js'),
        sub('src/%s.shopware.js')
    ];

    var DIST_HEAD_LIST = [
        sub('src/%s.intro.js'),
        sub('src/%s.const.js'),
        sub('src/%s.core.js')
    ];

    var DEV_HEAD_LIST = [
        sub('src/%s.intro.js'),
        sub('src/%s.const.js'),
        sub('src/%s.core.js')
    ];

    var TAIL_LIST = [
        sub('src/%s.init.js'),
        sub('src/%s.outro.js')
    ];

    // Gets inserted at the top of the generated files in dist/.
    var BANNER = [
        '/*! <%= pkg.name %> - v<%= pkg.version %> - ',
        '<%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.author %> */\n'
    ].join('');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-replace');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                options: {
                    banner: BANNER
                },
                src: wrapModules(DIST_HEAD_LIST, TAIL_LIST),
                dest: sub('dist/%s.js')
            },
            dev_mg: {
                options: {
                    banner: BANNER
                },
                src: DEV_HEAD_LIST.concat(sub('src/%s.magento.js')).concat(TAIL_LIST),
                dest: sub('dist/%s.js')
            },
            dev_sw: {
                options: {
                    banner: BANNER
                },
                src: DEV_HEAD_LIST.concat(sub('src/%s.shopware.js')).concat(TAIL_LIST),
                dest: sub('dist/%s.js')
            },
            dev_mg_vojin: {
                src: DEV_HEAD_LIST.concat(sub('src/%s.magento.js')).concat(TAIL_LIST),
                dest: 'c:/xampp/htdocs'
            }
        },
        uglify: {
            dist: {
                files: (function () {
                    // Using an IIFE so that the destination property name can be
                    // created dynamically with sub().
                    var obj = {};
                    obj[sub('dist/%s.min.js')] = [sub('dist/%s.js')];
                    return obj;
                }())
            },
            options: {
                banner: BANNER
            }
        },
        qunit: {
            files: ['test/qunit*.html']
        },
        jshint: {
            all_files: [
                'grunt.js',
                sub('src/%s.!(intro|outro|const)*.js')
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        }
    });

    grunt.registerTask('default', [
        'jshint',
        'build',
        'qunit'
    ]);
    grunt.registerTask('build-shopware', [
        'concat:dev_sw',
        'uglify:dist'
    ]);
    grunt.registerTask('build-magento', [
        'concat:dev_mg',
        'uglify:dist'
    ]);
    grunt.registerTask('build-magento-vojin', [
        'concat:dev_mg_vojin'
    ]);
};
