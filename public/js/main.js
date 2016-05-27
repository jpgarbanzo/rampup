/**                   _
 *  _             _ _| |_
 * | |           | |_   _|
 * | |___  _   _ | | |_|
 * | '_  \| | | || | | |
 * | | | || |_| || | | |
 * |_| |_|\___,_||_| |_|
 *
 * (c) Huli Inc
 */

require.config({
    baseUrl: 'js',
    paths: {
            'lib' : 'lib',
            'app' : 'app',
    		'jquery' : 'lib/vendor/jquery/dist/jquery',
    		'ju-shared' : 'lib/vendor/ju-shared/src',
			'ju-mvc' : 'lib/vendor/ju-mvc/src',
			'ju-components' : 'lib/vendor/ju-components/src',
			'blueimp-md5' : 'lib/vendor/blueimp-md5/js/md5',
            'text' : 'lib/vendor/text/text'
    }
});

require([
			'app/bootstrap'
        ],

    	function () {

		}
);