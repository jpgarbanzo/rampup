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

/**
 *  // Router
 */

define([
            'jquery',
            'ju-shared/observable-class',
            'ju-shared/util'
        ],
        function(
                    $,
                    ObservableClass,
                    Util
                ) {
    'use strict';

    // .History
    // ----------------

    // Handles cross-browser history management, based on either
    // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
    // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
    // and URL fragments. If the browser supports neither (old IE, natch),
    // falls back to polling.

    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for stripping urls of hash.
    var pathStripper = /#.*$/;

    // Set up all inheritable **.History** properties and methods.

    var History = ObservableClass.extend({
        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        interval : 50,

        init : function() {
            this.handlers = [];
            this.checkUrl = Util.bind(this.checkUrl, this);

            // Ensure that `History` can be used outside of the browser.
            if (typeof window !== 'undefined') {
                this.location = window.location;
                this.history = window.history;
            }
        },

        // Are we at the app root?
        atRoot : function() {
            var path = this.location.pathname.replace(/[^\/]$/, '$&/');
            return path === this.root && !this.getSearch();
        },

        // Does the pathname match the root?
        matchRoot : function() {
            var path = this.decodeFragment(this.location.pathname);
            var root = path.slice(0, this.root.length - 1) + '/';
            return root === this.root;
        },

        // Unicode characters in `location.pathname` are percent encoded so they're
        // decoded for comparison. `%25` should not be decoded since it may be part
        // of an encoded parameter.
        decodeFragment : function(fragment) {
            return decodeURI(fragment.replace(/%25/g, '%2525'));
        },

        // In IE6, the hash fragment and search params are incorrect if the
        // fragment contains `?`.
        getSearch : function() {
            var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
            return match ? match[0] : '';
        },

        // Gets the true hash value. Cannot use location.hash directly due to bug
        // in Firefox where location.hash will always be decoded.
        getHash : function(window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },

        // Get the pathname and search params, without the root.
        getPath : function() {
            var path = this.decodeFragment(
                this.location.pathname + this.getSearch()
            ).slice(this.root.length - 1);
            return path.charAt(0) === '/' ? path.slice(1) : path;
        },

        // Get the cross-browser normalized URL fragment from the path or hash.
        getFragment : function(fragment) {
            if (fragment == null) {
                if (this._usePushState || !this._wantsHashChange) {
                    fragment = this.getPath();
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(routeStripper, '');
        },

        // Build fragment from handler name and arguments
        getHandlerByName : function(name) {
            var handler = null;

            for (var i in this.handlers) {
                if (this.handlers.hasOwnProperty(i)) {
                    var h = this.handlers[i];
                    if (h.name === name) {
                            handler = h;
                            break;
                    }
                }
            }
            return handler;
        },

        // Start the hash change handling, returning `true` if the current URL matches
        // an existing route, and `false` otherwise.
        start : function(options) {
            if (History.started) {
                throw new Error('.history has already been started');
            }
            History.started = true;

            // Figure out the initial configuration. Do we need an iframe?
            // Is pushState desired ... is it available?
            this.options = $.extend({}, {root : '/'}, this.options, options);
            this.root = this.options.root;
            this._wantsHashChange = this.options.hashChange !== false;
            this._hasHashChange = 'onhashchange' in window;
            this._useHashChange = this._wantsHashChange && this._hasHashChange;
            this._wantsPushState = !!this.options.pushState;
            this._hasPushState = !!(this.history && this.history.pushState);
            this._usePushState = this._wantsPushState && this._hasPushState;
            this.fragment = this.getFragment();

            // Normalize root to always include a leading and trailing slash.
            this.root = ('/' + this.root + '/').replace(rootStripper, '/');

            // Transition from hashChange to pushState or vice versa if both are
            // requested.
            if (this._wantsHashChange && this._wantsPushState) {

                // If we've started off with a route from a `pushState`-enabled
                // browser, but we're currently in a browser that doesn't support it...
                if (!this._hasPushState && !this.atRoot()) {
                    var root = this.root.slice(0, -1) || '/';
                    this.location.replace(root + '#' + this.getPath());
                    // Return immediately as browser will do redirect to new url
                    return true;

                    // Or if we've started out with a hash-based route, but we're currently
                    // in a browser where it could be `pushState`-based instead...
                } else if (this._hasPushState && this.atRoot()) {
                    this.navigate(this.getHash(), {
                        replace : true
                    });
                }

            }

            // Proxy an iframe to handle location events if the browser doesn't
            // support the `hashchange` event, HTML5 history, or the user wants
            // `hashChange` but not `pushState`.
            if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
                this.iframe = document.createElement('iframe');
                this.iframe.src = 'javascript:0';
                this.iframe.style.display = 'none';
                this.iframe.tabIndex = -1;
                var body = document.body;
                // Using `appendChild` will throw on IE < 9 if the document is not ready.
                var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
                iWindow.document.open();
                iWindow.document.close();
                iWindow.location.hash = '#' + this.fragment;
            }

            // Add a cross-platform `addEventListener` shim for older browsers.
            var addEventListener = window.addEventListener || function(eventName, listener) {
                return attachEvent('on' + eventName, listener); // jshint ignore:line
            };

            // Depending on whether we're using pushState or hashes, and whether
            // 'onhashchange' is supported, determine how we check the URL state.
            if (this._usePushState) {
                addEventListener('popstate', this.checkUrl, false);
            } else if (this._useHashChange && !this.iframe) {
                addEventListener('hashchange', this.checkUrl, false);
            } else if (this._wantsHashChange) {
                this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
            }

            if (!this.options.silent) {
                return this.loadUrl();
            }
        },

        // Disable .history, perhaps temporarily. Not useful in a real app,
        // but possibly useful for unit testing Routers.
        stop : function() {
            // Add a cross-platform `removeEventListener` shim for older browsers.
            var removeEventListener = window.removeEventListener || function(eventName, listener) {
                // This function will be available in older browsers
                return detachEvent('on' + eventName, listener); // jshint ignore:line
            };

            // Remove window listeners.
            if (this._usePushState) {
                removeEventListener('popstate', this.checkUrl, false);
            } else if (this._useHashChange && !this.iframe) {
                removeEventListener('hashchange', this.checkUrl, false);
            }

            // Clean up the iframe if necessary.
            if (this.iframe) {
                document.body.removeChild(this.iframe);
                this.iframe = null;
            }

            // Some environments will throw when clearing an undefined interval.
            if (this._checkUrlInterval) {
                clearInterval(this._checkUrlInterval);
            }
            History.started = false;
        },

        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        route : function(name, path, route, callback) {
            this.handlers.unshift({
                name : name,
                path : path,
                route : route,
                callback : callback
            });
        },

        // Checks the current URL to see if it has changed, and if it has,
        // calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl : function() {
            var current = this.getFragment();

            // If the user pressed the back button, the iframe's hash will have
            // changed and we should use that for comparison.
            if (current === this.fragment && this.iframe) {
                current = this.getHash(this.iframe.contentWindow);
            }

            if (current === this.fragment) {
                return false;
            }
            if (this.iframe) {
                this.navigate(current);
            }
            this.loadUrl();
        },

        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl : function(fragment, options) {
            // If the root doesn't match, no routes can match either.
            if (!this.matchRoot()) {
                return false;
            }
            fragment = this.fragment = this.getFragment(fragment);
            var matched = Util.some(this.handlers, function(handler) {
                if (handler.route.test(fragment)) {
                    log('History: loadUrl found handler for fragment', fragment);
                    handler.callback(fragment, options);
                    return true;
                }
            });
            if (!matched) {
                log('History: loadUrl couldnt find handler for fragment', fragment);
            }
            return matched;
        },

        // Save a fragment into the hash history, or replace the URL state if the
        // 'replace' option is passed. You are responsible for properly URL-encoding
        // the fragment in advance.
        //
        // The options object can contain `trigger: true` if you wish to have the
        // route callback be fired (not usually desirable), or `replace: true`, if
        // you wish to modify the current URL without adding an entry to the history.
        // Or force if you want to navigate to that page even if the current fragment is selected
        navigate : function(fragment, options) {
            if (!History.started) {
                Logger.warn('History: not started...');
                return false;
            }
            if (!options || options === true) {
                options = {trigger : options};
            }

            // Normalize the fragment.
            fragment = this.getFragment(fragment || '');

            // Don't include a trailing slash on the root.
            var root = this.root;
            if (fragment === '' || fragment.charAt(0) === '?') {
                root = root.slice(0, -1) || '/';
            }
            var url = root + fragment;

            // OLD
            // // Strip the hash and decode for matching.
            // fragment = this.decodeFragment(fragment.replace(pathStripper, ''));
            // NEW
            // // We do not decode the fragment as there are most likely encoded paramters in the query string
            // // Just do path stripper
            fragment = fragment.replace(pathStripper, '');

            if (!options.force && (this.fragment === fragment)) {
                Logger.warn('History: already in the same fragment', fragment);
                return;
            }

            this.fragment = fragment;

            // If pushState is available, we use it to set the fragment as a real URL.
            if (this._usePushState) {
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

                // If hash changes haven't been explicitly disabled, update the hash
                // fragment to store history.
            } else if (this._wantsHashChange) {
                this._updateHash(this.location, fragment, options.replace);
                if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
                    var iWindow = this.iframe.contentWindow;

                    // Opening and closing the iframe tricks IE7 and earlier to push a
                    // history entry on hash-tag change.  When replace is true, we don't
                    // want this.
                    if (!options.replace) {
                        iWindow.document.open();
                        iWindow.document.close();
                    }

                    this._updateHash(iWindow.location, fragment, options.replace);
                }

                // If you've told us that you explicitly don't want fallback hashchange-
                // based history, then `navigate` becomes a page refresh.
            } else {
                return this.location.assign(url);
            }

            log('History: needs trigger to fragment?', options.trigger, fragment);

            if (options.trigger) {
                return this.loadUrl(fragment, options);
            }
        },
        // Update the hash location, either replacing the current entry, or adding
        // a new one to the browser history.
        _updateHash : function(location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + '#' + fragment);
            } else {
                // Some browsers require that `hash` contains a leading #.
                location.hash = '#' + fragment;
            }
        }
    });

    // Has the history handling already been started?
    History.started = false;

    // Exports
    var historyInst = new History();
    // window.historyInst = historyInst;
    return historyInst;

});
