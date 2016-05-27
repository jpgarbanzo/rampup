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
 * @file carousel
 * @requires ju-components/base
 * @requires ju-components/resource/lazy-load-helper
 *
 * @extends ju-components/base
 */

define([
        'lib/vendor/mustache.js/mustache',
        'ju-shared/logger',
        'ju-components/base',
        'ju-components/resource/lazy-load-helper'
    ],
    function(
        Mustache,
        Logger,
        BaseComponent,
        LazyLoadHelper
    ) {

    'use strict';

    var MAIN_VIEW = 'landing/carousel';
    var FILES = ['landing/text/1', 'landing/text/2', 'landing/text/3', 'landing/text/4',
                'landing/text/1', 'landing/text/2', 'landing/text/3', 'landing/text/4'];

    var RESOURCE_MAP = {
        template : FILES.concat([
            MAIN_VIEW
        ]),
        cssFile : [
            'css/landing/carousel'
        ]
    };
    

    var CHILDREN_DEFINITION = {
        /**
         * example definition
        child_component : {
            component : 'path/to/child/definition',
            insertionPoint : '.selector',
            opts : {
                // component-dependent options
            }
        */
    };

    var carousel = BaseComponent.extend({
        /**
         * Constructor
         *
         * Common place for setting default options, resources, children definition,
         * selectors, variables...
         */
        init : function() {
            this.setOptions({
                // set any default options values here
            });

            this._super.apply(this, arguments);

            this.addResources(RESOURCE_MAP);

            this.childrenDef = CHILDREN_DEFINITION;

            this.setSelectors({
                viewport : '.viewport',
                progress : '.progress-indicator'
            });

        },

        /**
         * Commonly used to setup the component's markup
         */
        configureComponent : function() {

            this.content = [];

            for (var i = FILES.length - 1; i >= 0; i--) {
                var text = LazyLoadHelper.getTemplate(FILES[i]);
                this.content.push(text)
            }

            // obtains loaded view
            var mainView = LazyLoadHelper.getTemplate(MAIN_VIEW),
                viewMarkup = Mustache.render(mainView, {
                    cards : this.content
                });
        
            // appends markup to view
            this.appendToView(viewMarkup);
                
        },

        setupCompleted : function () {
            this.carouselXTransform = 0;
            this.carouselWidth = 470*FILES.length;
            this._renderCarouselItems();
        },

        bindEvents: function(){
            document.addEventListener('keydown', this._listenKeyToMoveCards.bind(this), false);
            document.addEventListener('keyup', this._listenKeyUpToStopAnimation.bind(this), false);
        },

        _listenKeyUpToStopAnimation : function (e) {
            log('keyup')
            this.animationStartTime = null;
        },

        _listenKeyToMoveCards : function (e) {
            this.animationStartTime = new Date();
            this.animationDirection = 1;
            e = e || window.event;
            if (e.keyCode === 39) {
                this.animationDirection = -1;
            }
            if (e.keyCode === 37) {
                this.animationDirection = 1;
            }
            window.requestAnimationFrame(this._animateCardsSidewise.bind(this));
            window.requestAnimationFrame(this._animateProgressIndicator.bind(this));
        },

        _animateCardsSidewise : function () {
            var acceleration = (new Date() - this.animationStartTime);
            acceleration = acceleration < 15 ? acceleration : 15;
            var translation = this.animationDirection * 10 * acceleration;
            this.carouselXTransform += translation;
            this.carouselXTransform = this.carouselXTransform >= 0 ? 0 : this.carouselXTransform;
            var rightLimit = -1*this.carouselWidth + this.$view.width();
            this.carouselXTransform = this.carouselXTransform >= rightLimit  ? this.carouselXTransform : rightLimit;
            this.t.$viewport.css('transform', 'translateX('+this.carouselXTransform+'px)');
        },

        _animateProgressIndicator : function () {
            var rightLimit = this.carouselWidth - this.$view.width();
            var translationProp = -1*this.carouselXTransform / rightLimit;
            var indicatorLimit = this.$view.width() - 100;
            var progressTransform = translationProp * indicatorLimit;
            log(progressTransform)
            this.t.$progress.css('transform', 'translateX('+progressTransform+'px)');
        },

        _renderCarouselItems : function() {
            this.t.$viewport.width(this.carouselWidth);
        }


    });

    carousel.classMembers({
        // add 'static' class members here
        // i.e. can be accessed from the class definition without an instance
    });

    return carousel;
});
